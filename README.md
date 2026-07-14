# RollerGuns

RollerGuns is a dependency-free, portrait-first crowd-control arcade game for static hosting at [rollerguns.it](https://rollerguns.it/).

Aim a mechanical cannon with drag, mouse, A/D, or Left/Right. The cannon continuously deploys armed spherical Rollers. Guide the stream through mathematical energy gates, grow the army, break enemy formations, choose an upgrade after each wave, and defeat a two-phase boss every fifth wave. Levels continue indefinitely.

## Run and test

```sh
python -m http.server 8080
npm test
```

Open `http://localhost:8080`. There is no build step and no runtime dependency.

## Architecture

- `src/game/Game.js` coordinates the fixed-step game loop and state transitions.
- `Cannon`, `RollerManager`, `GateManager`, `EnemyManager`, `CombatSystem`, and `ProjectileManager` implement the core vertical slice.
- `WaveDirector`, `DifficultyDirector`, and `UpgradeSystem` provide five-wave levels, boss progression, multidimensional scaling, and 14 functional upgrades.
- `ObjectPool` and the virtual crowd count cap rendered Rollers at 180 while preserving armies up to 9,999.
- `Renderer` projects normalized horizontal/depth coordinates onto a converging Canvas road and draws all art procedurally.
- `LeaderboardService` provides local/global top ten, timeout, cache, offline fallback, a retry queue, and duplicate protection.

The game uses a capped delta and a fixed 60 Hz simulation, pauses when the tab is hidden, scales Canvas for device pixel ratio, and supports reduced motion.

## Global leaderboard

With an empty `LEADERBOARD_API_URL` in `src/config.js`, scores remain local without visible errors. For Google Sheets setup follow [apps-script/README.md](apps-script/README.md).

Results contain username, score, level and wave reached, bosses and enemies defeated, maximum Rollers, duration, and game version. The Apps Script automatically extends older leaderboard sheets with the new columns and can still read older score rows. Google Sheets provides basic anti-tamper protection, not an authenticated backend. Do not add secrets or private API credentials.

## Static deployment

Publish the repository root through GitHub Pages or any equivalent static host. Keep the custom domain configured as `rollerguns.it`; canonical, sitemap, robots, favicon paths, structured data, and social metadata remain intact.

## DNS verification

Keep this TXT record for `rollerguns.it`:

```text
google-site-verification=-jAIAYiY34QqQp4x0yhr2FepmEqZB3J3_CreuKgtxkc
```
