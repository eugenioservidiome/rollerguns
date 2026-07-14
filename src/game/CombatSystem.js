export class CombatSystem {
  constructor(projectiles, audio, effects) {
    this.projectiles = projectiles;
    this.audio = audio;
    this.effects = effects;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboBonus = 0;
  }

  reset() {
    this.combo = 0;
    this.comboTimer = 0;
    this.comboBonus = 0;
  }

  update(delta, rollers, enemies, cannon) {
    this.comboTimer -= delta;
    if (this.comboTimer <= 0) this.combo = 0;

    for (const roller of rollers.active) {
      const target = roller.target;
      if (!target || Math.abs(target.depth - roller.depth) > 0.13 || roller.attackTimer > 0) continue;
      const critical = Math.random() < cannon.criticalChance;
      const damage = roller.damage * (critical ? 2 : 1);
      target.health -= damage;
      roller.attackTimer = roller.elite ? 0.28 : 0.48;
      this.projectiles.trace(roller.x, roller.depth, target.x, target.depth, critical ? "#fff36b" : "#47e7ff");
      this.effects.impact(target.x, target.depth, critical ? `-${Math.ceil(damage)}!` : null, "#47e7ff");
      if (target.health <= 0) {
        this.combo += 1;
        this.comboTimer = 2.2;
        this.comboBonus += this.combo * 5;
        this.effects.destroy(target.x, target.depth, target.boss ? 34 : 8, "#ff6245");
        this.audio.play("elimination");
      } else {
        this.audio.play("hit");
      }
    }

    for (const enemy of enemies.active) {
      if (enemy.attackTimer > 0 || enemy.range <= 0) continue;
      let target = null;
      let distance = Infinity;
      for (const roller of rollers.active) {
        const candidate = Math.abs(enemy.depth - roller.depth) + Math.abs(enemy.x - roller.x) * 0.2;
        if (candidate < enemy.range && candidate < distance) {
          target = roller;
          distance = candidate;
        }
      }
      if (target) {
        target.health -= enemy.damage;
        enemy.attackTimer = enemy.type === "RANGED" || enemy.structure ? 1.1 : 0.65;
        this.projectiles.trace(enemy.x, enemy.depth, target.x, target.depth, "#ff6748");
        this.effects.impact(target.x, target.depth, null, "#ff6748");
      }
    }
  }
}
