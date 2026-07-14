import { Renderer } from "./game/Renderer.js";
import { AudioManager } from "./game/AudioManager.js";
import { Game } from "./game/Game.js";
import { InputManager } from "./game/InputManager.js";
import { LeaderboardService } from "./services/LeaderboardService.js";
import { UIController } from "./ui/UIController.js";
import { STORAGE_PREFIX } from "./config.js";
import { GameState } from "./game/GameState.js";

const audio = new AudioManager();
const service = new LeaderboardService();
const renderer = new Renderer(document.getElementById("game"));
let personalBest = 0;
let ui;

const game = new Game(renderer, audio, {
  banner: (text) => ui.banner(text),
  upgrades: (choices) => ui.showUpgrades(choices),
  gameOver: (run) => ui.gameOver(run, personalBest),
});

ui = new UIController(service, audio, {
  start: (username) => {
    personalBest = Number(localStorage.getItem(`${STORAGE_PREFIX}best:${username}`) || 0);
    game.start(username);
  },
  upgrade: (upgrade) => game.selectUpgrade(upgrade),
});

const input = new InputManager(window, (value) => game.aim(value));
document.addEventListener("visibilitychange", () => document.hidden ? game.pause() : game.resume());

let previousInput = performance.now();
let previousHud = 0;
function uiLoop(now) {
  input.update(Math.min(0.05, (now - previousInput) / 1000));
  previousInput = now;
  if (game.state === GameState.PLAYING && now - previousHud > 80) {
    ui.hud(game);
    previousHud = now;
  }
  requestAnimationFrame(uiLoop);
}
requestAnimationFrame(uiLoop);
service.retry();
