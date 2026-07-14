export class EffectsSystem {
  constructor() {
    this.particles = [];
    this.floaters = [];
    this.shake = 0;
    this.flash = 0;
  }

  reset() {
    this.particles.length = 0;
    this.floaters.length = 0;
    this.shake = 0;
    this.flash = 0;
  }

  impact(x, depth, text, color) {
    this.flash = Math.max(this.flash, 0.08);
    if (text) this.floaters.push({ x, depth, text, color, life: 0.65 });
  }

  destroy(x, depth, count, color) {
    const amount = Math.min(40, count);
    for (let index = 0; index < amount; index += 1) {
      const angle = (index / amount) * Math.PI * 2;
      this.particles.push({ x, depth, vx: Math.cos(angle) * 0.16, vz: Math.sin(angle) * 0.12, color, life: 0.55 + (index % 4) * 0.1 });
    }
    this.shake = Math.max(this.shake, count > 20 ? 7 : 2);
  }

  gate(x, depth, text) {
    this.floaters.push({ x, depth, text, color: "#68f4ff", life: 1 });
    this.flash = 0.15;
  }

  update(delta) {
    this.shake *= Math.exp(-delta * 9);
    this.flash = Math.max(0, this.flash - delta * 3);
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.life -= delta;
      particle.x += particle.vx * delta;
      particle.depth += particle.vz * delta;
      if (particle.life <= 0) this.particles.splice(index, 1);
    }
    for (let index = this.floaters.length - 1; index >= 0; index -= 1) {
      const floater = this.floaters[index];
      floater.life -= delta;
      floater.depth += delta * 0.025;
      if (floater.life <= 0) this.floaters.splice(index, 1);
    }
  }
}
