import { GameState } from "./GameState.js";
import { createRng, calculateScore, serializeResult } from "./utils.js";
import { Cannon } from "./Cannon.js";
import { RollerManager } from "./RollerManager.js";
import { GateManager } from "./GateManager.js";
import { EnemyManager } from "./EnemyManager.js";
import { ProjectileManager } from "./ProjectileManager.js";
import { CombatSystem } from "./CombatSystem.js";
import { DifficultyDirector } from "./DifficultyDirector.js";
import { WaveDirector } from "./WaveDirector.js";
import { UpgradeSystem } from "./UpgradeSystem.js";
import { EffectsSystem } from "./EffectsSystem.js";
import { EnemyType } from "./Enemy.js";

export class Game {
  constructor(renderer, audio, events) {
    this.renderer = renderer;
    this.audio = audio;
    this.events = events;
    this.cannon = new Cannon();
    this.rollers = new RollerManager();
    this.gates = new GateManager();
    this.enemies = new EnemyManager();
    this.projectiles = new ProjectileManager();
    this.effects = new EffectsSystem();
    this.difficulty = new DifficultyDirector();
    this.combat = new CombatSystem(this.projectiles, audio, this.effects);
    this.state = GameState.MENU;
    this.lastFrame = performance.now();
    this.accumulator = 0;
    this.slowMotion = 1;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  start(username) {
    this.username = username;
    this.seed = Date.now() >>> 0;
    this.rng = createRng(this.seed);
    this.waveDirector = new WaveDirector(this.rng, this.difficulty);
    this.upgrades = new UpgradeSystem(this.rng);
    this.cannon.reset();
    this.rollers.reset();
    this.gates.reset();
    this.enemies.reset();
    this.projectiles.reset();
    this.effects.reset();
    this.combat.reset();
    this.elapsed = 0;
    this.wavesCompleted = 0;
    this.levelsCompleted = 0;
    this.waveHealthBonus = 0;
    this.reinforcementsSummoned = false;
    this.slowMotion = 1;
    this.state = GameState.PLAYING;
    for (let index = 0; index < 8; index += 1) this.rollers.spawn(this.cannon, (index - 3.5) * 0.035);
    this.beginWave();
  }

  beginWave() {
    this.gates.reset();
    this.reinforcementsSummoned = false;
    const wave = this.waveDirector.start(this.enemies, this.gates);
    this.events.banner(wave.boss ? "BOSS WAVE" : `WAVE ${wave.wave}`);
    this.audio.play(wave.boss ? "boss" : "wave");
  }

  aim(value) {
    if (this.state === GameState.PLAYING) this.cannon.aim(value);
  }

  pause() {
    if (this.state === GameState.PLAYING) this.state = GameState.PAUSED;
  }

  resume() {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.lastFrame = performance.now();
    }
  }

  fire() {
    if (!this.cannon.canFire()) return;
    this.cannon.consumeShot();
    const barrels = Math.min(3, this.cannon.barrels);
    for (let barrel = 0; barrel < barrels; barrel += 1) {
      const offset = (barrel - (barrels - 1) / 2) * this.cannon.spread;
      this.rollers.spawn(this.cannon, offset);
    }
    this.audio.play("fire");
  }

  update(delta) {
    this.elapsed += delta;
    this.cannon.update(delta);
    this.fire();
    this.rollers.update(delta, this.cannon, this.enemies);
    this.gates.update(this.rollers, this.cannon, (gate, roller) => {
      this.effects.gate(roller.x, roller.depth, gate.label);
      this.audio.play(gate.type === "MULTIPLY" ? "multiply" : "gate");
    });
    this.combat.update(delta, this.rollers, this.enemies, this.cannon);
    this.enemies.update(delta, this.cannon, (damage, enemy) => {
      this.cannon.damage(damage);
      this.effects.impact(enemy.x, 0.1, `-${Math.ceil(damage)}`, "#ff6748");
      if (enemy.type !== EnemyType.BOSS) enemy.health = 0;
    });
    this.projectiles.update(delta);
    this.effects.update(delta);

    const boss = this.enemies.boss();
    if (boss?.phase === 2 && !this.reinforcementsSummoned) {
      this.reinforcementsSummoned = true;
      const scaling = this.difficulty.at(this.waveDirector.level, this.waveDirector.wave);
      for (let index = 0; index < 6; index += 1) {
        this.enemies.spawn(EnemyType.BASIC, -0.7 + index * 0.28, boss.depth - 0.08, scaling);
      }
      this.events.banner("REINFORCEMENTS");
      this.effects.shake = 8;
    }

    if (this.cannon.health <= 0) {
      this.end();
      return;
    }

    if (this.waveDirector.waveActive && this.enemies.active.length === 0) this.clearWave();
  }

  clearWave() {
    const bossCleared = this.waveDirector.isBossWave;
    this.waveDirector.complete();
    this.wavesCompleted += 1;
    this.waveHealthBonus += Math.round(this.cannon.health * 4);
    if (bossCleared) {
      this.levelsCompleted += 1;
      this.slowMotion = 0.28;
      this.effects.shake = 12;
      this.events.banner("LEVEL COMPLETE");
      this.audio.play("level");
    } else {
      this.events.banner("WAVE CLEARED");
      this.audio.play("wave");
    }
    this.state = GameState.UPGRADING;
    const choices = this.upgrades.choices();
    setTimeout(() => this.events.upgrades(choices), this.renderer.reducedMotion ? 50 : 700);
  }

  selectUpgrade(upgrade) {
    if (this.state !== GameState.UPGRADING) return;
    this.upgrades.apply(this, upgrade);
    this.audio.play("upgrade");
    const advanced = this.waveDirector.advance();
    if (advanced.levelCompleted) {
      this.cannon.health = Math.min(this.cannon.maxHealth, this.cannon.health + 30);
    } else {
      this.cannon.health = Math.min(this.cannon.maxHealth, this.cannon.health + 8);
    }
    this.state = GameState.PLAYING;
    this.slowMotion = 1;
    this.beginWave();
  }

  score() {
    return calculateScore({
      enemiesDefeated: this.enemies.defeated,
      structuresDestroyed: this.enemies.structuresDestroyed,
      wavesCompleted: this.wavesCompleted,
      levelsCompleted: this.levelsCompleted,
      bossesDefeated: this.enemies.bossesDefeated,
      maxRollers: this.rollers.maxCount,
      comboBonus: this.combat.comboBonus,
      durationMs: this.elapsed * 1000,
      waveHealthBonus: this.waveHealthBonus,
    });
  }

  result() {
    return serializeResult({
      username: this.username,
      score: this.score(),
      levelReached: this.waveDirector.level,
      waveReached: this.waveDirector.wave,
      bossesDefeated: this.enemies.bossesDefeated,
      enemiesDefeated: this.enemies.defeated,
      maxRollers: this.rollers.maxCount,
      durationMs: this.elapsed * 1000,
    });
  }

  end() {
    if (this.state === GameState.GAME_OVER) return;
    this.state = GameState.GAME_OVER;
    this.audio.play("over");
    this.events.gameOver(this.result());
  }

  loop(now) {
    const frameDelta = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    if (this.state === GameState.PLAYING) {
      this.accumulator += frameDelta * this.slowMotion;
      const fixedStep = 1 / 60;
      while (this.accumulator >= fixedStep) {
        this.update(fixedStep);
        this.accumulator -= fixedStep;
      }
    }
    if (![GameState.MENU, GameState.GAME_OVER].includes(this.state) && this.waveDirector) this.renderer.draw(this);
    requestAnimationFrame(this.loop);
  }
}
