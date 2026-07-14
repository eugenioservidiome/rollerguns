import { validUsername, normalizeUsername } from "../game/utils.js";
import { STORAGE_PREFIX } from "../config.js";

export class UIController {
  constructor(service, audio, events) {
    this.service = service;
    this.audio = audio;
    this.events = events;
    this.get = (id) => document.getElementById(id);
    this.form = this.get("startForm");
    this.input = this.get("username");
    this.input.value = localStorage.getItem(`${STORAGE_PREFIX}username`) || "";
    this.form.addEventListener("submit", (event) => { event.preventDefault(); this.start(); });
    this.get("audioToggle").addEventListener("click", () => this.sound());
    this.get("reloadBoard").addEventListener("click", () => this.loadLeaderboard());
    this.get("playAgain").addEventListener("click", () => this.start());
    this.get("backMenu").addEventListener("click", () => this.menu());
    this.sound(false);
    this.loadLeaderboard();
  }

  start() {
    const username = normalizeUsername(this.input.value);
    if (!validUsername(username)) {
      this.input.setAttribute("aria-invalid", "true");
      this.get("usernameError").textContent = "Use 3–16 letters, numbers, - or _.";
      this.input.focus();
      return;
    }
    this.input.removeAttribute("aria-invalid");
    this.get("usernameError").textContent = "";
    this.input.value = username;
    localStorage.setItem(`${STORAGE_PREFIX}username`, username);
    this.get("menu").classList.add("hidden");
    this.get("gameOver").classList.add("hidden");
    this.get("upgradeScreen").classList.add("hidden");
    this.get("hud").classList.remove("hidden");
    this.audio.unlock();
    this.events.start(username);
  }

  sound(toggle = true) {
    const enabled = toggle ? this.audio.toggle() : this.audio.enabled;
    const button = this.get("audioToggle");
    button.textContent = `SOUND ${enabled ? "ON" : "OFF"}`;
    button.setAttribute("aria-pressed", String(enabled));
  }

  hud(game) {
    this.get("score").textContent = String(game.score()).padStart(6, "0");
    this.get("level").textContent = game.waveDirector.level;
    this.get("wave").textContent = `${game.waveDirector.wave}/5`;
    this.get("rollerCount").textContent = game.rollers.totalCount > 999 ? "999+" : game.rollers.totalCount;
    this.get("baseHealth").style.width = `${Math.max(0, (game.cannon.health / game.cannon.maxHealth) * 100)}%`;
    this.get("comboBox").classList.toggle("hidden", game.combat.combo < 2);
    this.get("combo").textContent = `x${game.combat.combo}`;
    const boss = game.enemies.boss();
    this.get("bossHud").classList.toggle("hidden", !boss);
    if (boss) {
      this.get("bossName").textContent = boss.phase === 2 ? "CORE BREAKER · PHASE 2" : "CORE BREAKER";
      this.get("bossHealth").style.width = `${Math.max(0, (boss.health / boss.maxHealth) * 100)}%`;
    }
  }

  banner(text) {
    const banner = this.get("banner");
    banner.textContent = text;
    banner.classList.remove("hidden");
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => banner.classList.add("hidden"), 1200);
  }

  showUpgrades(choices) {
    const container = this.get("upgradeCards");
    container.replaceChildren(...choices.map((upgrade) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "upgrade-card";
      const category = document.createElement("small");
      category.textContent = upgrade.category;
      const name = document.createElement("strong");
      name.textContent = upgrade.name;
      const description = document.createElement("span");
      description.textContent = upgrade.description;
      button.append(category, name, description);
      button.addEventListener("click", () => {
        this.get("upgradeScreen").classList.add("hidden");
        this.events.upgrade(upgrade);
      }, { once: true });
      return button;
    }));
    this.get("upgradeScreen").classList.remove("hidden");
    container.querySelector("button")?.focus();
  }

  async gameOver(run, oldBest) {
    await this.service.submit(run);
    const newBest = run.score > oldBest;
    localStorage.setItem(`${STORAGE_PREFIX}best:${run.username}`, String(Math.max(oldBest, run.score)));
    const leaderboard = await this.service.top();
    const rank = leaderboard.scores.findIndex((entry) => entry.username === run.username) + 1;
    this.renderLeaderboard(this.get("gameOverBoard"), leaderboard.scores);
    this.get("hud").classList.add("hidden");
    this.get("gameOver").classList.remove("hidden");
    this.get("resultBadge").textContent = newBest ? "NEW HIGH SCORE" : rank > 0 && rank <= 10 ? "TOP 10" : "THE LINE BROKE";
    this.get("finalUser").textContent = run.username;
    this.get("finalScore").textContent = run.score;
    const stats = [
      ["PERSONAL BEST", Math.max(oldBest, run.score)], ["LEVEL", run.levelReached], ["WAVE", `${run.waveReached}/5`],
      ["BOSSES", run.bossesDefeated], ["ENEMIES", run.enemiesDefeated], ["MAX ROLLERS", run.maxRollers],
      ["SURVIVAL", `${(run.durationMs / 1000).toFixed(1)} s`], ["RANK", rank || "—"],
    ];
    const list = this.get("stats");
    list.replaceChildren();
    for (const [label, value] of stats) {
      const term = document.createElement("dt"); term.textContent = label;
      const description = document.createElement("dd"); description.textContent = value;
      list.append(term, description);
    }
    this.get("announcement").textContent = `Game over. Score ${run.score}. Level ${run.levelReached}.${newBest ? " New high score." : ""}`;
    if (newBest) this.audio.play("record");
  }

  async loadLeaderboard() {
    this.get("boardStatus").textContent = "Loading…";
    const result = await this.service.top();
    this.get("boardTitle").textContent = `${result.mode} LEADERBOARD`;
    this.get("boardStatus").textContent = result.mode === "GLOBAL" ? "Live top ten" : result.mode === "OFFLINE" ? "Offline · cached scores" : "Stored on this device";
    this.renderLeaderboard(this.get("menuBoard"), result.scores);
    this.renderLeaderboard(this.get("gameOverBoard"), result.scores);
    const username = normalizeUsername(this.input.value);
    if (validUsername(username)) {
      const best = Number(localStorage.getItem(`${STORAGE_PREFIX}best:${username}`) || 0);
      this.get("personalBest").textContent = best ? `PERSONAL BEST ${best}` : "";
    }
  }

  renderLeaderboard(element, scores) {
    element.replaceChildren(...scores.map((score, index) => {
      const item = document.createElement("li");
      if (score.username === this.input.value) item.className = "me";
      const rank = document.createElement("span"); rank.textContent = String(index + 1).padStart(2, "0");
      const name = document.createElement("span"); name.textContent = score.username;
      const level = document.createElement("span"); level.className = "level-tag"; level.textContent = `L${score.levelReached || 1}`;
      const value = document.createElement("span"); value.textContent = String(score.score).padStart(6, "0");
      item.append(rank, name, level, value);
      return item;
    }));
    if (!scores.length) {
      const item = document.createElement("li"); item.textContent = "NO RUNS YET"; element.append(item);
    }
  }

  menu() {
    this.get("gameOver").classList.add("hidden");
    this.get("menu").classList.remove("hidden");
    this.loadLeaderboard();
  }
}
