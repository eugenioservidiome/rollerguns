export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (from, to, amount) => from + (to - from) * amount;

export function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalizeUsername(value) {
  return String(value).trim();
}

export function validUsername(value) {
  return /^[A-Za-z0-9_-]{3,16}$/.test(normalizeUsername(value));
}

export function calculateScore(run) {
  return Math.max(0, Math.floor(
    (run.enemiesDefeated || 0) * 40 +
    (run.structuresDestroyed || 0) * 160 +
    (run.wavesCompleted || 0) * 500 +
    (run.levelsCompleted || 0) * 2500 +
    (run.bossesDefeated || 0) * 1800 +
    (run.maxRollers || 0) * 8 +
    (run.comboBonus || 0) +
    (run.durationMs || 0) / 200 +
    (run.waveHealthBonus || 0)
  ));
}

export function serializeResult(run) {
  return {
    username: normalizeUsername(run.username),
    score: Math.max(0, Math.floor(run.score || 0)),
    levelReached: Math.max(1, Math.floor(run.levelReached || 1)),
    waveReached: clamp(Math.floor(run.waveReached || 1), 1, 5),
    bossesDefeated: Math.max(0, Math.floor(run.bossesDefeated || 0)),
    enemiesDefeated: Math.max(0, Math.floor(run.enemiesDefeated || 0)),
    maxRollers: Math.max(0, Math.floor(run.maxRollers || 0)),
    durationMs: Math.max(0, Math.floor(run.durationMs || 0)),
  };
}
