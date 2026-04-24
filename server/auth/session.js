const crypto = require('crypto');
const db = require('../db/database');

const SESSION_COOKIE_NAME = 'eduexchange_session';
const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getSessionSecret() {
  return process.env.SESSION_SECRET || 'dev-session-secret-change-me';
}

function signValue(value) {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(value)
    .digest('hex');
}

function encodeSignedValue(value) {
  return `${value}.${signValue(value)}`;
}

function decodeSignedValue(rawValue) {
  if (!rawValue) return null;

  const separator = rawValue.lastIndexOf('.');
  if (separator === -1) return null;

  const value = rawValue.slice(0, separator);
  const signature = rawValue.slice(separator + 1);
  const expected = signValue(value);

  if (signature.length !== expected.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  return value;
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separator = part.indexOf('=');
      if (separator === -1) return cookies;
      const key = part.slice(0, separator);
      const value = part.slice(separator + 1);
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function appendSetCookie(res, cookieValue) {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookieValue);
    return;
  }

  res.setHeader('Set-Cookie', Array.isArray(existing) ? [...existing, cookieValue] : [existing, cookieValue]);
}

function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  parts.push('HttpOnly');
  parts.push('SameSite=Lax');

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function setSignedCookie(res, name, value, options = {}) {
  appendSetCookie(res, buildCookie(name, encodeSignedValue(value), options));
}

function clearCookie(res, name) {
  appendSetCookie(res, buildCookie(name, '', { maxAge: 0 }));
}

function createSession(res, userId) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + DEFAULT_SESSION_TTL_MS).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(sessionId, userId, expiresAt);

  setSignedCookie(res, SESSION_COOKIE_NAME, sessionId, {
    maxAge: DEFAULT_SESSION_TTL_MS / 1000,
  });

  return { id: sessionId, expiresAt };
}

function getSessionIdFromRequest(req) {
  return decodeSignedValue(req.cookies?.[SESSION_COOKIE_NAME]);
}

function destroySession(req, res) {
  const sessionId = req.session?.id || getSessionIdFromRequest(req);
  if (sessionId) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }

  clearCookie(res, SESSION_COOKIE_NAME);
}

function sessionMiddleware(req, res, next) {
  req.cookies = parseCookies(req.headers.cookie);
  req.session = null;
  req.user = null;

  const sessionId = getSessionIdFromRequest(req);
  if (!sessionId) {
    return next();
  }

  const session = db.prepare(`
    SELECT
      sessions.id,
      sessions.user_id,
      sessions.expires_at,
      users.username,
      users.name,
      users.email,
      users.university,
      users.google_sub,
      users.avatar_url,
      users.last_login_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ? AND datetime(sessions.expires_at) > datetime('now')
  `).get(sessionId);

  if (!session) {
    clearCookie(res, SESSION_COOKIE_NAME);
    return next();
  }

  req.session = {
    id: session.id,
    userId: session.user_id,
    expiresAt: session.expires_at,
  };
  req.user = {
    id: session.user_id,
    username: session.username,
    name: session.name,
    email: session.email,
    university: session.university,
    google_sub: session.google_sub,
    avatar_url: session.avatar_url,
    last_login_at: session.last_login_at,
  };

  return next();
}

module.exports = {
  createSession,
  destroySession,
  sessionMiddleware,
};
