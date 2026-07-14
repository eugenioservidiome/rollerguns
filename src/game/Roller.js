export const RollerState = Object.freeze({ MOVING: "MOVING", FIGHTING: "FIGHTING", DEAD: "DEAD" });

export function createRoller() {
  return {
    active: false,
    id: 0,
    x: 0,
    depth: 0,
    speed: 0.16,
    health: 12,
    maxHealth: 12,
    damage: 3,
    faction: "ALLY",
    target: null,
    state: RollerState.MOVING,
    attackTimer: 0,
    gateId: null,
    phase: 0,
    elite: false,
  };
}

export function resetRoller(roller, data) {
  Object.assign(roller, {
    active: true,
    id: data.id,
    x: data.x,
    depth: data.depth ?? 0.05,
    speed: data.speed,
    health: data.health,
    maxHealth: data.health,
    damage: data.damage,
    faction: "ALLY",
    target: null,
    state: RollerState.MOVING,
    attackTimer: 0,
    gateId: null,
    phase: data.phase || 0,
    elite: Boolean(data.elite),
  });
}
