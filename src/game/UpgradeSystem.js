export const UPGRADES = [
  { id: "fire-rate", category: "CANNON", name: "Fire Rate", description: "+18% Roller output", apply: (game) => { game.cannon.fireRate = Math.min(20, game.cannon.fireRate * 1.18); } },
  { id: "double-barrel", category: "CANNON", name: "Double Barrel", description: "Fire two streams", apply: (game) => { game.cannon.barrels = Math.max(2, game.cannon.barrels); } },
  { id: "triple-barrel", category: "CANNON", name: "Triple Barrel", description: "Fire three streams", apply: (game) => { game.cannon.barrels = 3; } },
  { id: "spread", category: "CANNON", name: "Wider Spread", description: "Separate each stream", apply: (game) => { game.cannon.spread = Math.min(0.3, game.cannon.spread + 0.04); } },
  { id: "speed", category: "ARMY", name: "Turbo Rollers", description: "+12% movement speed", apply: (game) => { game.cannon.rollerSpeed *= 1.12; } },
  { id: "health", category: "ARMY", name: "Alloy Shells", description: "+25% Roller health", apply: (game) => { game.cannon.rollerHealth *= 1.25; } },
  { id: "damage", category: "ARMY", name: "High Caliber", description: "+22% Roller damage", apply: (game) => { game.cannon.rollerDamage *= 1.22; } },
  { id: "shield", category: "ARMY", name: "Base Shield", description: "+25 temporary shield", apply: (game) => { game.cannon.initialShield = Math.min(80, game.cannon.initialShield + 25); } },
  { id: "regen", category: "ARMY", name: "Repair Swarm", description: "Rollers regenerate slowly", apply: (game) => { game.rollers.regeneration += 0.35; } },
  { id: "critical", category: "ARMY", name: "Critical Core", description: "+8% critical chance", apply: (game) => { game.cannon.criticalChance = Math.min(0.4, game.cannon.criticalChance + 0.08); } },
  { id: "starting", category: "CROWD", name: "Reserve Squad", description: "+12 Rollers now", apply: (game) => { game.rollers.addUnits(12, game.rollers.active[0]); } },
  { id: "gate-add", category: "CROWD", name: "Gate Amplifier", description: "+5 on additive gates", apply: (game) => { game.cannon.gateAddBonus += 5; } },
  { id: "gate-multiply", category: "CROWD", name: "Multiplier Hack", description: "+1 to multiplier gates", apply: (game) => { game.cannon.gateMultiplierBonus = Math.min(2, game.cannon.gateMultiplierBonus + 1); } },
  { id: "elite", category: "CROWD", name: "Elite Protocol", description: "Every 12th Roller is elite", apply: (game) => { game.cannon.eliteEvery = game.cannon.eliteEvery ? Math.max(5, game.cannon.eliteEvery - 2) : 12; } },
];

export class UpgradeSystem {
  constructor(rng) {
    this.rng = rng;
    this.picks = [];
  }

  choices(count = 3) {
    const available = [...UPGRADES];
    const result = [];
    while (result.length < count && available.length) {
      const index = Math.floor(this.rng() * available.length);
      result.push(available.splice(index, 1)[0]);
    }
    return result;
  }

  apply(game, upgrade) {
    upgrade.apply(game);
    this.picks.push(upgrade.id);
    return upgrade;
  }
}
