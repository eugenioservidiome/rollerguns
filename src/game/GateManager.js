import { Gate, GateType } from "./Gate.js";

export class GateManager {
  constructor() {
    this.gates = [];
    this.nextId = 1;
  }

  reset() {
    this.gates.length = 0;
    this.nextId = 1;
  }

  spawnPair(options, depth = 0.38) {
    this.gates = [
      new Gate(this.nextId++, -0.48, depth, options[0].type, options[0].value, options[0].risk),
      new Gate(this.nextId++, 0.48, depth, options[1].type, options[1].value, options[1].risk),
    ];
  }

  update(rollerManager, cannon, onApplied) {
    for (const roller of rollerManager.active) {
      for (const gate of this.gates) {
        if (roller.gateId === gate.id || Math.abs(roller.depth - gate.depth) > 0.012) continue;
        if (Math.abs(roller.x - gate.x) > gate.width / 2) continue;
        const singleUse = [GateType.ADD, GateType.FIRE_RATE, GateType.SHIELD, GateType.DOUBLE_STREAM].includes(gate.type);
        if (singleUse && gate.triggered) continue;
        roller.gateId = gate.id;
        this.apply(gate, roller, rollerManager, cannon);
        gate.triggered = true;
        onApplied(gate, roller);
      }
    }
  }

  apply(gate, roller, rollers, cannon) {
    if (gate.type === GateType.ADD) {
      rollers.addUnits(gate.value + cannon.gateAddBonus, roller);
    } else if (gate.type === GateType.MULTIPLY) {
      rollers.multiply(gate.value + cannon.gateMultiplierBonus, roller);
    } else if (gate.type === GateType.FIRE_RATE) {
      cannon.fireRate = Math.min(18, cannon.fireRate + gate.value);
    } else if (gate.type === GateType.DAMAGE) {
      roller.damage += gate.value;
    } else if (gate.type === GateType.HEALTH) {
      roller.maxHealth += gate.value;
      roller.health += gate.value;
    } else if (gate.type === GateType.SHIELD) {
      cannon.initialShield = Math.min(60, cannon.initialShield + gate.value);
    } else if (gate.type === GateType.DOUBLE_STREAM) {
      cannon.barrels = Math.max(cannon.barrels, 2);
    }
  }
}
