# Google Sheets leaderboard

1. Create a Google Sheet and open **Extensions → Apps Script**.
2. Replace the editor contents with `Code.gs` and save.
3. Choose **Deploy → New deployment → Web app**. Execute as yourself and allow access to anyone who should play.
4. Copy the `/exec` URL into `LEADERBOARD_API_URL` in `src/config.js`.
5. Open `?action=health`, then `?action=top&limit=10`.

The script creates the `Leaderboard` sheet and headers. Google Sheets plus server validation provides only basic tamper resistance; it is not an authenticated backend.
