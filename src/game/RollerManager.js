import { ObjectPool } from "./ObjectPool.js";
import { createRoller, resetRoller, RollerState } from "./Roller.js";
import { clamp, lerp } from "./utils.js";

export class RollerManager {
  static RENDER_LIMIT = 180;
  static UNIT_LIMIT = 9999;

  constructor() {
    this.pool = new ObjectPool(createRoller, resetRoller, 80);
    this.active = [];
    this.virtualCount = 0;
    this.nextId = 1;
    this.maxCount = 0;
    this.regeneration = 0;
  }

  reset() {
    for (const roller of this.active) this.pool.release(roller);
    this.active.length = 0;
    this.virtualCount = 0;
    this.nextId = 1;
    this.maxCount = 0;
  }

  get totalCount() {
    return this.active.length + this.virtualCount;
  }

  spawn(cannon, offset = 0) {
    if (this.totalCount >= RollerManager.UNIT_LIMIT) return null;
    if (this.active.length >= RollerManager.RENDER_LIMIT) {
      this.virtualCount += 1;
      this.trackMaximum();
      return null;
    }
    const elite = cannon.eliteEvery > 0 && this.nextId % cannon.eliteEvery === 0;
    const roller = this.pool.acquire({
      id: this.nextId++,
      x: clamp(cannon.x + offset, -0.9, 0.9),
      speed: cannon.rollerSpeed * (elite ? 1.12 : 1),
      health: cannon.rollerHealth * (elite ? 2 : 1),
      damage: cannon.rollerDamage * (elite ? 1.8 : 1),
      elite,
      phase: this.nextId * 0.71,
    });
    this.active.push(roller);
    this.trackMaximum();
    return roller;
  }

  addUnits(amount, template) {
    const count = Math.min(Math.max(0, Math.floor(amount)), RollerManager.UNIT_LIMIT - this.totalCount);
    for (let index = 0; index < count; index += 1) {
      if (this.active.length < RollerManager.RENDER_LIMIT && template) {
        const clone = this.pool.acquire({
          id: this.nextId++,
          x: clamp(template.x + ((index % 7) - 3) * 0.018, -0.9, 0.9),
          depth: Math.max(0.04, template.depth - (index % 5) * 0.006),
          speed: template.speed,
          health: template.maxHealth,
          damage: template.damage,
          phase: this.nextId * 0.71,
        });
        clone.gateId = template.gateId;
        this.active.push(clone);
      } else {
        this.virtualCount += 1;
      }
    }
    this.trackMaximum();
    return count;
  }

  multiply(factor, template) {
    const desired = Math.max(1, factor - 1);
    return this.addUnits(desired, template);
  }

  trackMaximum() {
    this.maxCount = Math.max(this.maxCount, this.totalCount);
  }

  remove(roller) {
    const index = this.active.indexOf(roller);
    if (index >= 0) {
      this.active[index] = this.active[this.active.length - 1];
      this.active.pop();
      this.pool.release(roller);
    }
  }

  update(delta, cannon, enemyManager) {
    while (this.virtualCount > 0 && this.active.length < RollerManager.RENDER_LIMIT) {
      this.virtualCount -= 1;
      this.spawn(cannon, ((this.nextId % 9) - 4) * 0.025);
    }
    const separationRadius = 0.035;
    for (let index = this.active.length - 1; index >= 0; index -= 1) {
      const roller = this.active[index];
      if (roller.health <= 0) {
        roller.state = RollerState.DEAD;
        this.remove(roller);
        continue;
      }

      const target = enemyManager.findTarget(roller);
      roller.target = target;
      const range = roller.elite ? 0.12 : 0.095;
      if (target && Math.abs(target.depth - roller.depth) <= range) {
        roller.state = RollerState.FIGHTING;
      } else {
        roller.state = RollerState.MOVING;
        roller.depth = Math.min(0.94, roller.depth + roller.speed * delta);
        const aimInfluence = roller.depth < 0.48 ? 2.4 : 0.35;
        roller.x = lerp(roller.x, cannon.x, 1 - Math.exp(-delta * aimInfluence));
      }

      const neighbor = this.active[(index + 7) % Math.max(1, this.active.length)];
      if (neighbor && neighbor !== roller && Math.abs(neighbor.depth - roller.depth) < separationRadius) {
        const direction = roller.x >= neighbor.x ? 1 : -1;
        roller.x = clamp(roller.x + direction * delta * 0.018, -0.92, 0.92);
      }
      roller.attackTimer -= delta;
      if (this.regeneration > 0) roller.health = Math.min(roller.maxHealth, roller.health + this.regeneration * delta);
    }
  }
}
