import { clamp } from "./utils.js";

export class InputManager {
  constructor(target, onAim) {
    this.target = target;
    this.onAim = onAim;
    this.keys = new Set();
    this.current = 0;
    this.dragging = false;

    this.keyHandler = (event) => {
      if (!["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(event.code)) return;
      event.preventDefault();
      if (event.type === "keydown") this.keys.add(event.code);
      else this.keys.delete(event.code);
    };
    this.pointerDown = (event) => {
      if (event.target.closest?.("button,input")) return;
      this.dragging = true;
      this.pointerMove(event);
      event.preventDefault();
    };
    this.pointerMove = (event) => {
      if (!this.dragging) return;
      this.current = clamp((event.clientX / window.innerWidth) * 2 - 1, -0.9, 0.9);
      this.onAim(this.current);
      event.preventDefault();
    };
    this.pointerUp = () => { this.dragging = false; };

    target.addEventListener("keydown", this.keyHandler);
    target.addEventListener("keyup", this.keyHandler);
    target.addEventListener("pointerdown", this.pointerDown, { passive: false });
    target.addEventListener("pointermove", this.pointerMove, { passive: false });
    target.addEventListener("pointerup", this.pointerUp);
    target.addEventListener("pointercancel", this.pointerUp);
  }

  update(delta) {
    const direction = Number(this.keys.has("ArrowRight") || this.keys.has("KeyD")) - Number(this.keys.has("ArrowLeft") || this.keys.has("KeyA"));
    if (direction) {
      this.current = clamp(this.current + direction * delta * 1.45, -0.9, 0.9);
      this.onAim(this.current);
    }
  }

  destroy() {
    this.target.removeEventListener("keydown", this.keyHandler);
    this.target.removeEventListener("keyup", this.keyHandler);
    this.target.removeEventListener("pointerdown", this.pointerDown);
    this.target.removeEventListener("pointermove", this.pointerMove);
    this.target.removeEventListener("pointerup", this.pointerUp);
    this.target.removeEventListener("pointercancel", this.pointerUp);
  }
}
