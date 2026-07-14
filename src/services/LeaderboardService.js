import { LEADERBOARD_API_URL, STORAGE_PREFIX, GAME_VERSION } from "../config.js";
import { validUsername } from "../game/utils.js";

export function dedupeTop(scores, limit = 10) {
  const best = new Map();
  for (const entry of scores || []) {
    const username = String(entry.username || "").trim();
    const score = Number(entry.score);
    if (!validUsername(username) || !Number.isFinite(score) || score < 0) continue;
    const normalized = {
      username,
      score: Math.floor(score),
      levelReached: Math.max(1, Math.floor(Number(entry.levelReached) || 1)),
    };
    const current = best.get(username);
    if (!current || normalized.score > current.score) best.set(username, normalized);
  }
  return [...best.values()]
    .sort((first, second) => second.score - first.score || second.levelReached - first.levelReached || first.username.localeCompare(second.username))
    .slice(0, limit);
}

export function validSubmission(entry) {
  if (!validUsername(entry.username)) return false;
  const fields = ["score", "levelReached", "waveReached", "bossesDefeated", "enemiesDefeated", "maxRollers", "durationMs"];
  if (!fields.every((field) => Number.isInteger(entry[field]) && entry[field] >= 0)) return false;
  if (entry.levelReached < 1 || entry.levelReached > 10000 || entry.waveReached < 1 || entry.waveReached > 5) return false;
  if (entry.maxRollers > 9999 || entry.durationMs > 86400000) return false;
  return entry.score <= Math.max(100000, entry.durationMs * 10);
}

export class LeaderboardService {
  constructor() {
    this.api = LEADERBOARD_API_URL;
    this.localKey = `${STORAGE_PREFIX}scores`;
    this.cacheKey = `${STORAGE_PREFIX}cache`;
    this.queueKey = `${STORAGE_PREFIX}queue`;
    this.sent = new Set();
  }

  read(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }

  local() {
    return dedupeTop(this.read(this.localKey));
  }

  async top() {
    if (!this.api) return { scores: this.local(), mode: "LOCAL" };
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`${this.api}?action=top&limit=10`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error("Leaderboard unavailable");
      const scores = dedupeTop(data.scores);
      localStorage.setItem(this.cacheKey, JSON.stringify(scores));
      return { scores, mode: "GLOBAL" };
    } catch {
      return { scores: dedupeTop(this.read(this.cacheKey, this.local())), mode: "OFFLINE" };
    }
  }

  async submit(run) {
    const entry = { ...run, gameVersion: GAME_VERSION };
    const id = `${entry.username}:${entry.score}:${entry.levelReached}:${entry.durationMs}`;
    if (this.sent.has(id)) return;
    this.sent.add(id);
    localStorage.setItem(this.localKey, JSON.stringify(dedupeTop([...this.read(this.localKey), entry], 100)));
    if (!this.api) return;
    try {
      const body = new URLSearchParams(Object.entries(entry));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const response = await fetch(this.api, { method: "POST", body, signal: controller.signal });
      clearTimeout(timeout);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error("Submission failed");
    } catch {
      const queue = this.read(this.queueKey);
      if (!queue.some((queued) => queued.id === id)) queue.push({ id, entry });
      localStorage.setItem(this.queueKey, JSON.stringify(queue.slice(-20)));
    }
  }

  async retry() {
    const queue = this.read(this.queueKey);
    localStorage.removeItem(this.queueKey);
    for (const queued of queue) {
      this.sent.delete(queued.id);
      await this.submit(queued.entry);
    }
  }
}
