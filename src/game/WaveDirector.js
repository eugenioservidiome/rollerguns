import { EnemyType } from "./Enemy.js";
import { GateType } from "./Gate.js";

export class WaveDirector {
  constructor(rng, difficulty) {
    this.rng = rng;
    this.difficulty = difficulty;
    this.level = 1;
    this.wave = 1;
    this.waveActive = false;
    this.spawned = false;
  }

  reset() {
    this.level = 1;
    this.wave = 1;
    this.waveActive = false;
    this.spawned = false;
  }

  get isBossWave() {
    return this.wave === 5;
  }

  start(enemyManager, gateManager) {
    const scaling = this.difficulty.at(this.level, this.wave);
    this.waveActive = true;
    this.spawned = true;
    gateManager.spawnPair(this.gateOptions(scaling), this.wave === 5 ? 0.3 : 0.38);
    this.spawnFormation(enemyManager, scaling);
    return { boss: this.isBossWave, level: this.level, wave: this.wave };
  }

  gateOptions(scaling) {
    const add = [5, 10, 20, 30][scaling.gateTier - 1];
    const choices = [
      { type: GateType.ADD, value: add },
      { type: GateType.MULTIPLY, value: scaling.gateTier >= 3 ? 3 : 2 },
      { type: GateType.HEALTH, value: 10 },
      { type: GateType.DAMAGE, value: 1 + scaling.gateTier },
      { type: GateType.FIRE_RATE, value: 1 },
      { type: GateType.SHIELD, value: 15 },
      { type: GateType.DOUBLE_STREAM, value: 2 },
    ];
    const first = choices[Math.floor(this.rng() * choices.length)];
    let second = choices[Math.floor(this.rng() * choices.length)];
    if (second.type === first.type) second = choices[(choices.indexOf(first) + 1) % choices.length];
    if (this.rng() < 0.2) first.risk = true;
    return [first, second];
  }

  spawnFormation(enemies, scaling) {
    if (this.isBossWave) {
      enemies.spawn(EnemyType.BOSS, 0, 0.91, scaling);
      for (let index = 0; index < 4 + scaling.density; index += 1) {
        enemies.spawn(EnemyType.BASIC, -0.75 + (index % 5) * 0.36, 0.78 + Math.floor(index / 5) * 0.04, scaling);
      }
      return;
    }

    const count = 5 + this.wave * 3 + scaling.density * 2;
    for (let index = 0; index < count; index += 1) {
      let type = EnemyType.BASIC;
      if (this.wave >= 2 && index % 6 === 0) type = EnemyType.HEAVY;
      if (this.wave >= 3 && index % 7 === 0) type = EnemyType.RANGED;
      if (this.wave >= 4 && index < scaling.elites) type = EnemyType.ELITE;
      enemies.spawn(type, -0.78 + (index % 6) * 0.31, 0.72 + Math.floor(index / 6) * 0.055, scaling);
    }
    if (this.wave >= 3) {
      enemies.spawn(EnemyType.BARRIER, 0, 0.63, scaling);
      for (let index = 0; index < scaling.towers; index += 1) {
        enemies.spawn(EnemyType.TOWER, index % 2 ? 0.7 : -0.7, 0.68 + index * 0.04, scaling);
      }
    }
  }

  complete() {
    this.waveActive = false;
  }

  advance() {
    const levelCompleted = this.wave === 5;
    if (levelCompleted) {
      this.level += 1;
      this.wave = 1;
    } else {
      this.wave += 1;
    }
    this.spawned = false;
    return { levelCompleted, level: this.level, wave: this.wave };
  }
}
