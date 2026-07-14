import { clamp, lerp } from "./utils.js";

export class Cannon {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.targetX = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.fireRate = 7;
    this.fireTimer = 0;
    this.barrels = 1;
    this.spread = 0.14;
    this.rollerSpeed = 0.16;
    this.rollerHealth = 12;
    this.rollerDamage = 3;
    this.initialShield = 0;
    this.gateAddBonus = 0;
    this.gateMultiplierBonus = 0;
    this.criticalChance = 0;
    this.eliteEvery = 0;
  }

  aim(value) {
    this.targetX = clamp(value, -0.86, 0.86);
  }

  update(delta) {
    this.x = lerp(this.x, this.targetX, 1 - Math.exp(-delta * 16));
    this.fireTimer -= delta;
  }

  canFire() {
    return this.fireTimer <= 0;
  }

  consumeShot() {
    this.fireTimer += 1 / this.fireRate;
  }

  damage(amount) {
    const absorbed = Math.min(this.initialShield, amount);
    this.initialShield -= absorbed;
    this.health = Math.max(0, this.health - (amount - absorbed));
  }
}
