import { ObjectPool } from "./ObjectPool.js";

function createProjectile() { return { active: false, x: 0, depth: 0, targetX: 0, targetDepth: 0, life: 0, color: "#fff" }; }
function resetProjectile(projectile, data) { Object.assign(projectile, data, { active: true, life: 0.16 }); }

export class ProjectileManager {
  constructor() {
    this.pool = new ObjectPool(createProjectile, resetProjectile, 30);
    this.active = [];
  }

  reset() {
    for (const projectile of this.active) this.pool.release(projectile);
    this.active.length = 0;
  }

  trace(x, depth, targetX, targetDepth, color) {
    if (this.active.length > 90) return;
    this.active.push(this.pool.acquire({ x, depth, targetX, targetDepth, color }));
  }

  update(delta) {
    for (let index = this.active.length - 1; index >= 0; index -= 1) {
      const projectile = this.active[index];
      projectile.life -= delta;
      if (projectile.life <= 0) {
        this.active[index] = this.active[this.active.length - 1];
        this.active.pop();
        this.pool.release(projectile);
      }
    }
  }
}
