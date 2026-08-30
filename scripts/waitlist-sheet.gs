/**
 * Google Apps Script — the waitlist backend for a static host.
 *
 * WHY THIS EXISTS
 * ---------------
 * `functions/api/waitlist.js` is a Cloudflare Pages Function. The site is served
 * by GitHub Pages, which executes no server code at all, so that endpoint 404s in
 * production and every signup on the live site has been silently lost. This is
 * the same contract reimplemented somewhere a static host can actually reach.
 *
 * It is deliberately behaviour-compatible with the Cloudflare version: same
 * request body, same response shape, same idempotency rule, same referral
 * mechanic. If the site ever moves to Cloudflare Pages, point the client back at
 * `/api/waitlist` and nothing else changes.
 *
 * SETUP (about five minutes)
 * --------------------------
 *  1. Create a Google Sheet. Name the first tab `waitlist`.
 *  2. Extensions → Apps Script. Delete the placeholder and paste this whole file.
 *  3. Deploy → New deployment → type "Web app".
 *       Execute as:      Me
 *       Who has access:  Anyone            <- must be "Anyone", not "Anyone with Google account"
 *  4. Authorise it when prompted (it is your own script writing to your own sheet).
 *  5. Copy the /exec URL it gives you into WAITLIST_ENDPOINT in main.js.
 *
 * After changing this file you must Deploy → Manage deployments → edit → New
 * version. Saving alone does not update the live URL, which is the single most
 * common way this appears broken when it is not.
 *
 * ON CORS
 * -------
 * The client sends `Content-Type: text/plain`, not `application/json`. That is
 * not sloppiness — it keeps the request inside the CORS "simple request" rules so
 * the browser never sends a preflight OPTIONS. Apps Script cannot answer a
 * preflight, so a JSON content-type fails before it ever reaches this code. The
 * body is still JSON; we parse it ourselves below.
 */

// No I/O/0/1 — these codes get read aloud and typed from memory.
var CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
var REFERRAL_GOAL = 3;
var SHEET_NAME = 'waitlist';

var COL = {
  at: 1,
  email: 2,
  code: 3,
  role: 4,
  referred_by: 5,
  referrals: 6,
  user_agent: 7,
};

// No `country` column. The Cloudflare version recorded one from the CF-IPCountry
// header, which Apps Script has no equivalent of — an always-empty column that
// looks like a field we collect is worse than not having it.
var HEADERS = ['joined_at', 'email', 'code', 'role', 'referred_by', 'referrals', 'user_agent'];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function newCode_() {
  var out = '';
  for (var i = 0; i < 6; i++) {
    out += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return out;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Row index (1-based) whose column matches `value`, or -1. */
function findRow_(sh, column, value) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var values = sh.getRange(2, column, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === String(value).trim().toLowerCase()) {
      return i + 2;
    }
  }
  return -1;
}

function doPost(e) {
  // Two people submitting at once would otherwise read the same last row and one
  // would overwrite the other. Signups are rare enough that a hard lock costs
  // nothing and a lost row costs a real person.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }

  try {
    var body;
    try {
      body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    } catch (err) {
      return json_({ ok: false, error: 'invalid_json' });
    }

    var email = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      return json_({ ok: false, error: 'invalid_email' });
    }

    // Only two roles mean anything to the launch sequence; anything else is
    // dropped rather than stored, so a hand-crafted POST cannot write junk.
    var role = body.role === 'organizer' || body.role === 'rider' ? body.role : '';

    var ref = String(body.ref || '').trim().toUpperCase().slice(0, 12);
    if (!/^[A-Z0-9]{4,12}$/.test(ref)) ref = '';

    var sh = sheet_();
    var existing = findRow_(sh, COL.email, email);

    // Idempotent: a returning visitor re-checking their progress must be told the
    // same story, not handed a second code.
    if (existing > 0) {
      var row = sh.getRange(existing, 1, 1, HEADERS.length).getValues()[0];
      if (role && !row[COL.role - 1]) {
        sh.getRange(existing, COL.role).setValue(role);
      }
      return json_({
        ok: true,
        code: row[COL.code - 1],
        referrals: Number(row[COL.referrals - 1]) || 0,
        goal: REFERRAL_GOAL,
        returning: true,
      });
    }

    // A fresh code, re-rolled on the astronomically unlikely collision.
    var code = newCode_();
    for (var tries = 0; tries < 5 && findRow_(sh, COL.code, code) > 0; tries++) {
      code = newCode_();
    }

    // Credit the referrer, but never let attribution failing block a signup.
    var creditedBy = '';
    if (ref) {
      var refRow = findRow_(sh, COL.code, ref);
      if (refRow > 0) {
        var refEmail = String(sh.getRange(refRow, COL.email).getValue()).trim().toLowerCase();
        if (refEmail !== email) {
          var current = Number(sh.getRange(refRow, COL.referrals).getValue()) || 0;
          sh.getRange(refRow, COL.referrals).setValue(current + 1);
          creditedBy = ref;
        }
      }
    }

    sh.appendRow([
      new Date().toISOString(),
      email,
      code,
      role,
      creditedBy,
      0,
      String(body.ua || '').slice(0, 200),
    ]);

    return json_({ ok: true, code: code, referrals: 0, goal: REFERRAL_GOAL, returning: false });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Deliberately does not return the list, or a count. This URL is public by
 * necessity — anything it returns, anyone can read. Open the Sheet to see who
 * has joined.
 */
function doGet() {
  return json_({ ok: true, service: 'lighthouse-waitlist' });
}
