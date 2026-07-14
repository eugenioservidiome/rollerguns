import { clamp, lerp } from "./utils.js";

const THEMES = [
  { name: "TRAINING GROUNDS", sky: "#07151e", road: "#173342", grid: "#2b5667" },
  { name: "RED FACTORY", sky: "#1a0c0c", road: "#382224", grid: "#6b3430" },
  { name: "NEON FORTRESS", sky: "#100b24", road: "#28244a", grid: "#473d7c" },
  { name: "FROZEN ARSENAL", sky: "#071b29", road: "#24435a", grid: "#42738c" },
  { name: "CORE CITADEL", sky: "#151008", road: "#3a3020", grid: "#6e5a32" },
];

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resize = this.resize.bind(this);
    addEventListener("resize", this.resize, { passive: true });
    this.resize();
  }

  resize() {
    this.width = innerWidth;
    this.height = innerHeight;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  project(x, depth) {
    const bottom = this.height * 0.94;
    const top = this.height * 0.12;
    const eased = Math.pow(clamp(depth, 0, 1), 0.82);
    const roadWidth = lerp(Math.min(this.width * 0.94, 720), Math.min(this.width * 0.28, 230), eased);
    return {
      x: this.width / 2 + x * roadWidth * 0.5,
      y: lerp(bottom, top, eased),
      scale: lerp(1.18, 0.34, eased),
      roadWidth,
    };
  }

  draw(game) {
    const context = this.context;
    const theme = THEMES[(game.waveDirector.level - 1) % THEMES.length];
    const shake = this.reducedMotion ? 0 : game.effects.shake;
    context.save();
    if (shake > 0.2) context.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    context.fillStyle = theme.sky;
    context.fillRect(-10, -10, this.width + 20, this.height + 20);
    this.drawRoad(theme, game.elapsed);
    this.drawGates(game.gates.gates);
    this.drawProjectiles(game.projectiles.active);
    this.drawEnemies(game.enemies.active, game.elapsed);
    this.drawRollers(game.rollers.active, game.rollers.virtualCount, game.elapsed);
    this.drawCannon(game.cannon, game.elapsed);
    this.drawEffects(game.effects);
    if (game.effects.flash > 0) {
      context.fillStyle = `rgba(85,225,255,${game.effects.flash * 0.22})`;
      context.fillRect(0, 0, this.width, this.height);
    }
    context.restore();
  }

  drawRoad(theme, elapsed) {
    const context = this.context;
    const nearLeft = this.project(-1, 0);
    const nearRight = this.project(1, 0);
    const farLeft = this.project(-1, 1);
    const farRight = this.project(1, 1);
    context.beginPath();
    context.moveTo(nearLeft.x, nearLeft.y);
    context.lineTo(nearRight.x, nearRight.y);
    context.lineTo(farRight.x, farRight.y);
    context.lineTo(farLeft.x, farLeft.y);
    context.closePath();
    context.fillStyle = theme.road;
    context.fill();
    context.strokeStyle = theme.grid;
    context.lineWidth = 2;
    context.stroke();

    for (let depth = (elapsed * 0.04) % 0.1; depth < 1; depth += 0.1) {
      const left = this.project(-1, depth);
      const right = this.project(1, depth);
      context.globalAlpha = 0.2 + (1 - depth) * 0.25;
      context.beginPath();
      context.moveTo(left.x, left.y);
      context.lineTo(right.x, right.y);
      context.stroke();
    }
    context.globalAlpha = 1;
    for (const x of [-0.5, 0, 0.5]) {
      const start = this.project(x, 0);
      const end = this.project(x, 1);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
  }

  drawGates(gates) {
    const context = this.context;
    for (const gate of gates) {
      const point = this.project(gate.x, gate.depth);
      const width = point.roadWidth * 0.34;
      const height = 82 * point.scale;
      context.save();
      context.translate(point.x, point.y);
      context.shadowColor = gate.risk ? "#ff6b45" : "#42e7ff";
      context.shadowBlur = 14 * point.scale;
      context.strokeStyle = gate.risk ? "#ff6b45" : "#42e7ff";
      context.fillStyle = gate.risk ? "rgba(110,31,20,.7)" : "rgba(17,105,128,.68)";
      context.lineWidth = Math.max(2, 4 * point.scale);
      context.fillRect(-width / 2, -height, width, height);
      context.strokeRect(-width / 2, -height, width, height);
      context.shadowBlur = 0;
      context.fillStyle = "#f4fdff";
      context.font = `900 ${Math.max(13, 30 * point.scale)}px ui-monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(gate.label, 0, -height * 0.52);
      context.restore();
    }
  }

  drawRollers(rollers, virtualCount, elapsed) {
    const context = this.context;
    for (const roller of rollers) {
      const point = this.project(roller.x, roller.depth);
      const radius = (roller.elite ? 10 : 7) * point.scale;
      const bob = Math.sin(elapsed * 10 + roller.phase) * 1.5 * point.scale;
      context.save();
      context.translate(point.x, point.y + bob);
      context.fillStyle = "rgba(0,0,0,.28)";
      context.beginPath();
      context.ellipse(0, radius * 0.65, radius * 1.2, radius * 0.42, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = roller.elite ? "#e0a916" : "#079bc7";
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = roller.elite ? "#fff36b" : "#8af1ff";
      context.beginPath();
      context.arc(-radius * 0.32, -radius * 0.34, radius * 0.34, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#dffbff";
      context.lineWidth = Math.max(1, point.scale * 2);
      context.beginPath();
      context.moveTo(radius * 0.2, -radius * 0.2);
      context.lineTo(radius * 1.5, -radius * 0.6);
      context.stroke();
      context.restore();
    }
    if (virtualCount > 0) {
      const point = this.project(0, 0.54);
      context.fillStyle = "rgba(3,22,30,.8)";
      context.strokeStyle = "#37def5";
      context.fillRect(point.x - 38, point.y - 17, 76, 28);
      context.strokeRect(point.x - 38, point.y - 17, 76, 28);
      context.fillStyle = "#dcfbff";
      context.font = "800 13px ui-monospace";
      context.textAlign = "center";
      context.fillText(`+${virtualCount}`, point.x, point.y + 2);
    }
  }

  drawEnemies(enemies, elapsed) {
    const context = this.context;
    for (const enemy of [...enemies].sort((a, b) => b.depth - a.depth)) {
      const point = this.project(enemy.x, enemy.depth);
      const bossScale = enemy.boss ? 2.8 : enemy.type === "HEAVY" || enemy.type === "ELITE" ? 1.5 : 1;
      const radius = 8 * point.scale * bossScale;
      context.save();
      context.translate(point.x, point.y);
      context.fillStyle = "rgba(0,0,0,.3)";
      context.beginPath();
      context.ellipse(0, radius * 0.7, radius * 1.25, radius * 0.4, 0, 0, Math.PI * 2);
      context.fill();
      if (enemy.structure) {
        context.fillStyle = enemy.type === "BARRIER" ? "#753b35" : "#a63d31";
        context.fillRect(-radius, -radius * 1.6, radius * 2, radius * 2.2);
      } else {
        context.fillStyle = enemy.boss ? "#ff973d" : enemy.type === "ELITE" ? "#ffca4b" : "#f04e3b";
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = "#fff1e8";
        context.lineWidth = Math.max(1, point.scale * 2);
        context.stroke();
      }
      if (enemy.boss && enemy.phase === 2) {
        context.strokeStyle = `rgba(255,213,80,${0.5 + Math.sin(elapsed * 8) * 0.3})`;
        context.lineWidth = 4;
        context.beginPath();
        context.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
        context.stroke();
      }
      const barWidth = Math.max(18, radius * 2.4);
      context.fillStyle = "#291313";
      context.fillRect(-barWidth / 2, -radius * 2, barWidth, 3);
      context.fillStyle = "#ff6a48";
      context.fillRect(-barWidth / 2, -radius * 2, barWidth * clamp(enemy.health / enemy.maxHealth, 0, 1), 3);
      context.restore();
    }
  }

  drawCannon(cannon, elapsed) {
    const context = this.context;
    const point = this.project(cannon.x, 0.025);
    const pulse = 1 + Math.sin(elapsed * cannon.fireRate * Math.PI * 2) * 0.025;
    context.save();
    context.translate(point.x, point.y);
    context.scale(pulse, pulse);
    context.fillStyle = "rgba(0,0,0,.4)";
    context.beginPath();
    context.ellipse(0, 15, 35, 11, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#203b4b";
    context.fillRect(-28, -12, 56, 27);
    context.strokeStyle = "#5ee7ff";
    context.lineWidth = 3;
    context.strokeRect(-28, -12, 56, 27);
    for (let barrel = 0; barrel < cannon.barrels; barrel += 1) {
      const offset = (barrel - (cannon.barrels - 1) / 2) * 13;
      context.fillStyle = "#99ecf8";
      context.fillRect(offset - 5, -45, 10, 38);
      context.fillStyle = "#ffb84a";
      context.beginPath();
      context.arc(offset, -47, 4 + Math.sin(elapsed * 30) * 1.5, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  drawProjectiles(projectiles) {
    const context = this.context;
    for (const projectile of projectiles) {
      const start = this.project(projectile.x, projectile.depth);
      const end = this.project(projectile.targetX, projectile.targetDepth);
      context.globalAlpha = clamp(projectile.life / 0.16, 0, 1);
      context.strokeStyle = projectile.color;
      context.lineWidth = Math.max(1, start.scale * 2.5);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  drawEffects(effects) {
    const context = this.context;
    for (const particle of effects.particles) {
      const point = this.project(particle.x, particle.depth);
      context.globalAlpha = clamp(particle.life * 1.8, 0, 1);
      context.fillStyle = particle.color;
      context.fillRect(point.x - 2, point.y - 2, 4, 4);
    }
    for (const floater of effects.floaters) {
      const point = this.project(floater.x, floater.depth);
      context.globalAlpha = clamp(floater.life, 0, 1);
      context.fillStyle = floater.color;
      context.font = `900 ${Math.max(12, 19 * point.scale)}px ui-monospace`;
      context.textAlign = "center";
      context.fillText(floater.text, point.x, point.y);
    }
    context.globalAlpha = 1;
  }
}
