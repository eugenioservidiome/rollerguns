import { ObjectPool } from "./ObjectPool.js";
import { createEnemy, resetEnemy, EnemyType } from "./Enemy.js";
import { clamp } from "./utils.js";

export class EnemyManager {
  constructor() {
    this.pool = new ObjectPool(createEnemy, resetEnemy, 50);
    this.active = [];
    this.nextId = 1;
    this.defeated = 0;
    this.structuresDestroyed = 0;
    this.bossesDefeated = 0;
  }

  reset() {
    for (const enemy of this.active) this.pool.release(enemy);
    this.active.length = 0;
    this.defeated = 0;
    this.structuresDestroyed = 0;
    this.bossesDefeated = 0;
  }

  spawn(type, x, depth, difficulty) {
    const definitions = {
      [EnemyType.BASIC]: { health: 9, damage: 2, speed: 0.026, range: 0.055 },
      [EnemyType.HEAVY]: { health: 34, damage: 7, speed: 0.013, range: 0.065 },
      [EnemyType.RANGED]: { health: 16, damage: 4, speed: 0.015, range: 0.25 },
      [EnemyType.TOWER]: { health: 60, damage: 6, speed: 0, range: 0.38, structure: true },
      [EnemyType.BARRIER]: { health: 90, damage: 0, speed: 0, range: 0, structure: true },
      [EnemyType.ELITE]: { health: 80, damage: 10, speed: 0.021, range: 0.11 },
      [EnemyType.BOSS]: { health: 700, damage: 18, speed: 0.009, range: 0.3, boss: true },
    };
    const base = definitions[type];
    const enemy = this.pool.acquire({
      ...base,
      id: this.nextId++,
      type,
      x: clamp(x, -0.9, 0.9),
      depth,
      health: base.health * difficulty.enemyHealth,
      damage: base.damage * difficulty.enemyDamage,
    });
    this.active.push(enemy);
    return enemy;
  }

  findTarget(roller) {
    let best = null;
    let bestDistance = Infinity;
    for (const enemy of this.active) {
      const depthDistance = enemy.depth - roller.depth;
      if (depthDistance < -0.04 || depthDistance > 0.24) continue;
      const distance = Math.abs(depthDistance) + Math.abs(enemy.x - roller.x) * 0.35;
      if (distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    }
    return best;
  }

  boss() {
    return this.active.find((enemy) => enemy.boss) || null;
  }

  remove(enemy) {
    const index = this.active.indexOf(enemy);
    if (index < 0) return;
    this.active[index] = this.active[this.active.length - 1];
    this.active.pop();
    this.defeated += 1;
    if (enemy.structure) this.structuresDestroyed += 1;
    if (enemy.boss) this.bossesDefeated += 1;
    this.pool.release(enemy);
  }

  update(delta, cannon, onBaseHit) {
    for (let index = this.active.length - 1; index >= 0; index -= 1) {
      const enemy = this.active[index];
      if (enemy.health <= 0) {
        this.remove(enemy);
        continue;
      }
      if (enemy.boss && enemy.health < enemy.maxHealth * 0.5) enemy.phase = 2;
      enemy.depth -= enemy.speed * delta * (enemy.phase === 2 ? 1.25 : 1);
      enemy.attackTimer -= delta;
      if (enemy.depth <= 0.105 && enemy.attackTimer <= 0) {
        onBaseHit(enemy.damage || 3, enemy);
        enemy.attackTimer = enemy.boss ? 0.55 : 1.1;
      }
    }
  }
}
