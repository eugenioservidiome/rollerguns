import { clamp } from "./utils.js";

export class DifficultyDirector {
  at(level, wave) {
    const progress = Math.max(0, (level - 1) * 5 + wave - 1);
    return {
      enemyHealth: 1 + progress * 0.105,
      enemyDamage: 1 + progress * 0.065,
      density: clamp(1 + Math.floor(progress / 3), 1, 8),
      towers: clamp(Math.floor((progress + 1) / 5), 0, 5),
      elites: clamp(Math.floor(progress / 6), 0, 4),
      gateTier: clamp(1 + Math.floor(progress / 5), 1, 4),
      waveDuration: clamp(12 + progress * 0.35, 12, 28),
      bossAbilities: clamp(1 + Math.floor(level / 2), 1, 5),
    };
  }
}
