export const EnemyType = Object.freeze({
  BASIC: "BASIC",
  HEAVY: "HEAVY",
  RANGED: "RANGED",
  TOWER: "TOWER",
  BARRIER: "BARRIER",
  ELITE: "ELITE",
  BOSS: "BOSS",
});

export function createEnemy() {
  return { active: false, id: 0, type: EnemyType.BASIC, x: 0, depth: 0.9, health: 10, maxHealth: 10, damage: 2, speed: 0.02, range: 0.08, attackTimer: 0, phase: 1, boss: false, structure: false };
}

export function resetEnemy(enemy, data) {
  Object.assign(enemy, data, {
    active: true,
    health: data.health,
    maxHealth: data.health,
    attackTimer: 0,
    phase: 1,
  });
}
