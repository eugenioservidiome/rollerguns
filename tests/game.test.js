import test from "node:test";
import assert from "node:assert/strict";
import { validUsername, normalizeUsername, calculateScore, serializeResult } from "../src/game/utils.js";
import { DifficultyDirector } from "../src/game/DifficultyDirector.js";
import { WaveDirector } from "../src/game/WaveDirector.js";
import { RollerManager } from "../src/game/RollerManager.js";
import { Cannon } from "../src/game/Cannon.js";
import { GateManager } from "../src/game/GateManager.js";
import { Gate, GateType } from "../src/game/Gate.js";
import { EnemyManager } from "../src/game/EnemyManager.js";
import { EnemyType } from "../src/game/Enemy.js";
import { UpgradeSystem, UPGRADES } from "../src/game/UpgradeSystem.js";
import { dedupeTop, validSubmission } from "../src/services/LeaderboardService.js";

test("username validation and normalization", () => {
  assert.equal(normalizeUsername("  PLAYER_1  "), "PLAYER_1");
  assert.equal(validUsername("abc"), true);
  for (const value of ["ab", "a b", "<script>", "abcdefghijklmnopq"]) assert.equal(validUsername(value), false);
});

test("crowd-control score uses combat and progression", () => {
  const score = calculateScore({ enemiesDefeated: 10, structuresDestroyed: 2, wavesCompleted: 3, levelsCompleted: 1, bossesDefeated: 1, maxRollers: 50, comboBonus: 100, durationMs: 10000, waveHealthBonus: 200 });
  assert.equal(score, 7270);
});

test("wave progression loops through five waves", () => {
  const director = new WaveDirector(() => 0.2, new DifficultyDirector());
  for (let wave = 1; wave < 5; wave += 1) assert.deepEqual(director.advance(), { levelCompleted: false, level: 1, wave: wave + 1 });
  assert.equal(director.isBossWave, true);
});

test("boss completion advances the infinite level counter", () => {
  const director = new WaveDirector(() => 0.2, new DifficultyDirector());
  director.wave = 5;
  assert.deepEqual(director.advance(), { levelCompleted: true, level: 2, wave: 1 });
});

test("difficulty scales several variables without runaway values", () => {
  const director = new DifficultyDirector();
  const early = director.at(1, 1);
  const later = director.at(8, 4);
  assert.ok(later.enemyHealth > early.enemyHealth);
  assert.ok(later.enemyDamage > early.enemyDamage);
  assert.ok(later.density > early.density);
  assert.ok(later.towers <= 5);
  assert.ok(later.waveDuration <= 28);
});

test("additive gates add the configured number of units", () => {
  const cannon = new Cannon();
  const rollers = new RollerManager();
  const roller = rollers.spawn(cannon);
  const gates = new GateManager();
  gates.apply(new Gate(1, 0, 0.4, GateType.ADD, 10), roller, rollers, cannon);
  assert.equal(rollers.totalCount, 11);
});

test("multiplier gates duplicate the unit that crosses", () => {
  const cannon = new Cannon();
  const rollers = new RollerManager();
  const roller = rollers.spawn(cannon);
  const gates = new GateManager();
  gates.apply(new Gate(1, 0, 0.4, GateType.MULTIPLY, 3), roller, rollers, cannon);
  assert.equal(rollers.totalCount, 3);
});

test("Roller count respects the hard maximum", () => {
  const rollers = new RollerManager();
  const cannon = new Cannon();
  const template = rollers.spawn(cannon);
  rollers.addUnits(20000, template);
  assert.equal(rollers.totalCount, RollerManager.UNIT_LIMIT);
  assert.ok(rollers.active.length <= RollerManager.RENDER_LIMIT);
});

test("leaderboard keeps each username's best score and sorts top ten", () => {
  const scores = [{ username: "AAA", score: 2, levelReached: 1 }, { username: "AAA", score: 9, levelReached: 2 }, ...Array.from({ length: 12 }, (_, index) => ({ username: `P_${index}`, score: index, levelReached: 1 }))];
  const top = dedupeTop(scores);
  assert.equal(top.length, 10);
  assert.equal(top[0].score, 11);
  assert.equal(top.find((entry) => entry.username === "AAA").score, 9);
});

test("target selection chooses the nearest relevant enemy ahead", () => {
  const enemies = new EnemyManager();
  const scaling = new DifficultyDirector().at(1, 1);
  const near = enemies.spawn(EnemyType.BASIC, 0, 0.3, scaling);
  enemies.spawn(EnemyType.BASIC, 0.8, 0.34, scaling);
  assert.equal(enemies.findTarget({ x: 0, depth: 0.2 }), near);
});

test("damage destroys and releases an enemy", () => {
  const enemies = new EnemyManager();
  const enemy = enemies.spawn(EnemyType.BASIC, 0, 0.5, new DifficultyDirector().at(1, 1));
  enemy.health = 0;
  enemies.update(1 / 60, new Cannon(), () => {});
  assert.equal(enemies.active.length, 0);
  assert.equal(enemies.defeated, 1);
});

test("wave completion changes active state", () => {
  const director = new WaveDirector(() => 0.2, new DifficultyDirector());
  director.waveActive = true;
  director.complete();
  assert.equal(director.waveActive, false);
});

test("fifth wave spawns a two-phase boss", () => {
  const enemies = new EnemyManager();
  const gates = new GateManager();
  const director = new WaveDirector(() => 0.2, new DifficultyDirector());
  director.wave = 5;
  director.start(enemies, gates);
  const boss = enemies.boss();
  assert.ok(boss);
  boss.health = boss.maxHealth * 0.4;
  enemies.update(0, new Cannon(), () => {});
  assert.equal(boss.phase, 2);
});

test("upgrade choices are unique and an upgrade mutates gameplay", () => {
  const system = new UpgradeSystem(() => 0.25);
  const choices = system.choices();
  assert.equal(new Set(choices.map((choice) => choice.id)).size, 3);
  const cannon = new Cannon();
  const game = { cannon, rollers: new RollerManager() };
  const fireRate = UPGRADES.find((upgrade) => upgrade.id === "fire-rate");
  system.apply(game, fireRate);
  assert.ok(cannon.fireRate > 7);
});

test("result serialization contains the new leaderboard fields", () => {
  const result = serializeResult({ username: " PLAYER_1 ", score: 42.9, levelReached: 3, waveReached: 4, bossesDefeated: 2, enemiesDefeated: 70, maxRollers: 250, durationMs: 12345.6 });
  assert.deepEqual(result, { username: "PLAYER_1", score: 42, levelReached: 3, waveReached: 4, bossesDefeated: 2, enemiesDefeated: 70, maxRollers: 250, durationMs: 12345 });
  assert.equal(validSubmission(result), true);
});
