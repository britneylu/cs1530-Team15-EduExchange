const Database = require('better-sqlite3');
const db = new Database('./server/db/eduexchange.db');

// Enable WAL mode for better concurrent read performance (supports NFR2 / NFR6 goals)
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

// ─────────────────────────────────────────────
// Schema Initialization
// ─────────────────────────────────────────────

db.exec(`
  -- Users: university-verified accounts (FR1)
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    university  TEXT    NOT NULL,
    trust_score INTEGER NOT NULL DEFAULT 100,
    is_banned   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Listings: marketplace items (FR2, FR7, FR12)
  CREATE TABLE IF NOT EXISTS listings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id   INTEGER NOT NULL REFERENCES users(id),
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    price       REAL    NOT NULL,
    category    TEXT    NOT NULL,
    condition   TEXT    NOT NULL CHECK(condition IN ('New','Like New','Used')),
    image_url   TEXT,
    status      TEXT    NOT NULL DEFAULT 'Available'
                        CHECK(status IN ('Available','Pending','Sold','Archived')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Chats: one thread per (listing, buyer) pair (FR4)
  CREATE TABLE IF NOT EXISTS chats (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id  INTEGER NOT NULL REFERENCES listings(id),
    buyer_id    INTEGER NOT NULL REFERENCES users(id),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(listing_id, buyer_id)
  );

  -- Messages: individual chat messages (FR4)
  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id     INTEGER NOT NULL REFERENCES chats(id),
    sender_id   INTEGER NOT NULL REFERENCES users(id),
    content     TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Wishlist: bookmarked listings per user (FR10)
  CREATE TABLE IF NOT EXISTS wishlist (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    listing_id  INTEGER NOT NULL REFERENCES listings(id),
    saved_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, listing_id)
  );

  -- Meetups: Safe Exchange Zone scheduling (FR5, FR6)
  CREATE TABLE IF NOT EXISTS meetups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id     INTEGER NOT NULL REFERENCES chats(id),
    location    TEXT    NOT NULL,
    proposed_at TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'Pending'
                        CHECK(status IN ('Pending','Confirmed','Cancelled')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Reports: listing/user reports for moderation (FR8, FR9)
  CREATE TABLE IF NOT EXISTS reports (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id      INTEGER NOT NULL REFERENCES users(id),
    listing_id       INTEGER REFERENCES listings(id),
    reported_user_id INTEGER REFERENCES users(id),
    reason           TEXT    NOT NULL,
    details          TEXT,
    status           TEXT    NOT NULL DEFAULT 'Pending'
                             CHECK(status IN ('Pending','Reviewed','Dismissed')),
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- No-show reports (FR13, FR14)
  CREATE TABLE IF NOT EXISTS no_show_reports (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    meetup_id    INTEGER NOT NULL REFERENCES meetups(id),
    reporter_id  INTEGER NOT NULL REFERENCES users(id),
    reported_id  INTEGER NOT NULL REFERENCES users(id),
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(meetup_id, reporter_id)
  );

  -- Persistent login sessions for future OAuth-based authentication
  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

ensureColumn('users', 'google_sub', 'TEXT');
ensureColumn('users', 'avatar_url', 'TEXT');
ensureColumn('users', 'last_login_at', 'TEXT');

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub
  ON users(google_sub)
  WHERE google_sub IS NOT NULL;
`);

// ─────────────────────────────────────────────
// Seed Data (only inserted if tables are empty)
// ─────────────────────────────────────────────

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (username, name, email, university)
    VALUES (@username, @name, @email, @university)
  `);
  const seedUsers = [
    { username: 'alice_pitt', name: 'Alice Chen',    email: 'alice@pitt.edu',  university: 'University of Pittsburgh' },
    { username: 'bob_pitt',   name: 'Bob Martinez',  email: 'bob@pitt.edu',    university: 'University of Pittsburgh' },
    { username: 'carol_pitt', name: 'Carol Smith',   email: 'carol@pitt.edu',  university: 'University of Pittsburgh' },
  ];
  seedUsers.forEach(u => insertUser.run(u));

  const insertListing = db.prepare(`
    INSERT INTO listings (seller_id, title, description, price, category, condition, image_url)
    VALUES (@seller_id, @title, @description, @price, @category, @condition, @image_url)
  `);
  const seedListings = [
    { seller_id: 1, title: 'Calculus Textbook',    description: 'Stewart Calculus 8th edition, minimal highlights', price: 35.00, category: 'Textbooks',  condition: 'Like New', image_url: null },
    { seller_id: 2, title: 'Desk Lamp',             description: 'LED desk lamp, white, works perfectly',            price: 12.00, category: 'Furniture',   condition: 'Used',     image_url: null },
    { seller_id: 3, title: 'Scientific Calculator', description: 'TI-84 Plus, includes batteries and manual',        price: 50.00, category: 'Electronics', condition: 'Like New', image_url: null },
  ];
  seedListings.forEach(l => insertListing.run(l));

  console.log('[DB] Seed data inserted successfully.');
}

module.exports = db;
