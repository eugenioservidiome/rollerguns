var SHEET_NAME = 'Leaderboard';
var HEADERS = [
  'Timestamp', 'Username', 'Score', 'LevelReached', 'WaveReached',
  'BossesDefeated', 'EnemiesDefeated', 'MaxRollers', 'DurationMs', 'GameVersion'
];

function doGet(e) {
  try {
    var action = String(e && e.parameter && e.parameter.action || 'top');
    if (action === 'health') return json_({ ok: true, status: 'healthy' });
    if (action !== 'top') return json_({ ok: false, error: 'Unsupported action' });

    var limit = Math.min(10, Math.max(1, integer_(e.parameter.limit, 10)));
    var sheet = sheet_();
    var headers = headerMap_(sheet);
    var rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var best = {};

    rows.forEach(function(row) {
      var username = username_(row[headers.Username]);
      var score = Number(row[headers.Score]);
      var level = headers.LevelReached === undefined ? 1 : Number(row[headers.LevelReached]);
      if (!username || !Number.isFinite(score) || !Number.isInteger(score) || score < 0) return;
      var entry = { username: username, score: score, levelReached: Number.isInteger(level) && level > 0 ? level : 1 };
      if (!best[username] || entry.score > best[username].score) best[username] = entry;
    });

    var scores = Object.keys(best).map(function(username) { return best[username]; });
    scores.sort(function(first, second) { return second.score - first.score || second.levelReached - first.levelReached || first.username.localeCompare(second.username); });
    return json_({ ok: true, scores: scores.slice(0, limit) });
  } catch (_) {
    return json_({ ok: false, error: 'Request failed' });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var data = e && e.parameter || {};
    var username = username_(data.username);
    var score = boundedInteger_(data.score, 100000000);
    var level = boundedInteger_(data.levelReached, 10000);
    var wave = boundedInteger_(data.waveReached, 5);
    var bosses = boundedInteger_(data.bossesDefeated, 10000);
    var enemies = boundedInteger_(data.enemiesDefeated, 10000000);
    var rollers = boundedInteger_(data.maxRollers, 9999);
    var duration = boundedInteger_(data.durationMs, 86400000);
    var version = safeText_(String(data.gameVersion || '').slice(0, 20));

    var numeric = [score, level, wave, bosses, enemies, rollers, duration];
    if (!username || numeric.some(function(value) { return value === null; }) || level < 1 || wave < 1 || !version) {
      return json_({ ok: false, error: 'Invalid submission' });
    }
    if (score > Math.max(100000, duration * 10) || bosses > level || enemies > duration / 20 + 1000) {
      return json_({ ok: false, error: 'Implausible submission' });
    }

    var sheet = sheet_();
    var headers = headerMap_(sheet);
    var row = new Array(sheet.getLastColumn()).fill('');
    var values = {
      Timestamp: new Date(), Username: safeText_(username), Score: score, LevelReached: level,
      WaveReached: wave, BossesDefeated: bosses, EnemiesDefeated: enemies,
      MaxRollers: rollers, DurationMs: duration, GameVersion: version
    };
    Object.keys(values).forEach(function(key) { row[headers[key]] = values[key]; });
    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (_) {
    return json_({ ok: false, error: 'Request failed' });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function sheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  var current = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var missing = HEADERS.filter(function(header) { return current.indexOf(header) < 0; });
  if (missing.length) sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  return sheet;
}

function headerMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var result = {};
  headers.forEach(function(header, index) { result[String(header)] = index; });
  return result;
}

function username_(value) {
  var username = String(value || '').trim();
  return /^[A-Za-z0-9_-]{3,16}$/.test(username) ? username : '';
}

function integer_(value, fallback) {
  var number = Number(value);
  return Number.isFinite(number) && Number.isInteger(number) ? number : fallback;
}

function boundedInteger_(value, maximum) {
  var number = Number(value);
  return Number.isFinite(number) && Number.isInteger(number) && number >= 0 && number <= maximum ? number : null;
}

function safeText_(value) {
  var text = String(value || '');
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
