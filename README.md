# RollerGuns

A dependency-free, one-control arcade endless runner for static hosting at [rollerguns.it](https://rollerguns.it/).

## Run and test

```sh
python -m http.server 8080
npm test
```

Open `http://localhost:8080`. Use Space, Arrow Up, W, or tap to jump. The weapon auto-fires. There is no build step.

## Architecture and leaderboard

`index.html` and `styles/main.css` own semantic UI and responsive presentation. `src/game/` separates fixed-step simulation, input, physics, difficulty, generation, collision, rendering, and audio. The leaderboard service includes timeout, cache, offline fallback, retry queue, and duplicate protection.

With an empty `LEADERBOARD_API_URL` in `src/config.js`, scores stay local without errors. For global scores follow [apps-script/README.md](apps-script/README.md). Publish the repository root through GitHub Pages or any static host. Keep the custom domain; canonical, sitemap, robots, favicon paths and social metadata remain intact.

Google Sheets provides basic anti-tamper protection, not an authenticated backend. Do not add secrets or private API credentials.

## DNS verification

Keep this TXT record for `rollerguns.it`:

```text
google-site-verification=-jAIAYiY34QqQp4x0yhr2FepmEqZB3J3_CreuKgtxkc
```
