const Database = require('better-sqlite3');
const path = require('path');
const schema = require('./schema');

let db;

function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || './banking.db';
    const resolved = dbPath === ':memory:' ? ':memory:' : path.resolve(dbPath);
    db = new Database(resolved);
    if (process.env.DB_PATH !== ':memory:') {
      db.pragma('journal_mode = WAL');
    }
    db.pragma('foreign_keys = ON');
    db.exec(schema);
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };
