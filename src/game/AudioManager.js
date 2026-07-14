import { STORAGE_PREFIX } from "../config.js";

export class AudioManager {
  constructor() {
    this.enabled = localStorage.getItem(`${STORAGE_PREFIX}sound`) !== "off";
    this.context = null;
    this.lastPlayed = new Map();
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem(`${STORAGE_PREFIX}sound`, this.enabled ? "on" : "off");
    return this.enabled;
  }

  unlock() {
    if (this.enabled && !this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
  }

  play(type) {
    if (!this.enabled) return;
    this.unlock();
    const now = performance.now();
    const cooldowns = { fire: 90, hit: 70, elimination: 90 };
    if (now - (this.lastPlayed.get(type) || 0) < (cooldowns[type] || 0)) return;
    this.lastPlayed.set(type, now);
    const sounds = {
      fire: [220, 0.035, "square"], gate: [620, 0.11, "sine"], multiply: [780, 0.18, "square"],
      hit: [160, 0.035, "square"], elimination: [440, 0.06, "triangle"], wave: [740, 0.25, "sine"],
      boss: [80, 0.42, "sawtooth"], level: [960, 0.35, "triangle"], over: [65, 0.48, "sawtooth"],
      upgrade: [860, 0.18, "sine"], record: [1080, 0.3, "triangle"],
    };
    const [frequency, duration, waveform] = sounds[type] || [300, 0.05, "square"];
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    gain.gain.setValueAtTime(type === "boss" ? 0.05 : 0.025, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
}
