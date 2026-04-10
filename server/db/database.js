const Database = require('better-sqlite3');
const db = new Database('./server/db/eduexchange.db');

// I just set this up but I figure that someone could create the database schema and seed data as a task

module.exports = db;