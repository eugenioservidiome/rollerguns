export const GateType = Object.freeze({
  ADD: "ADD",
  MULTIPLY: "MULTIPLY",
  FIRE_RATE: "FIRE_RATE",
  DAMAGE: "DAMAGE",
  HEALTH: "HEALTH",
  SHIELD: "SHIELD",
  DOUBLE_STREAM: "DOUBLE_STREAM",
});

export class Gate {
  constructor(id, x, depth, type, value, risk = false) {
    this.id = id;
    this.x = x;
    this.depth = depth;
    this.type = type;
    this.value = value;
    this.risk = risk;
    this.width = 0.7;
    this.triggered = false;
  }

  get label() {
    if (this.type === GateType.ADD) return `+${this.value}`;
    if (this.type === GateType.MULTIPLY) return `×${this.value}`;
    if (this.type === GateType.FIRE_RATE) return "FIRE +";
    if (this.type === GateType.DAMAGE) return "DMG +";
    if (this.type === GateType.HEALTH) return "HP +";
    if (this.type === GateType.SHIELD) return "SHIELD";
    return "2 STREAM";
  }
}
