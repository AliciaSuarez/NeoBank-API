/**
 * seed.js — Populates the database with a demo user, two accounts,
 * and two months of realistic transactions so reviewers can explore
 * all features immediately without manual setup.
 *
 * Usage:
 *   node backend/seed.js
 *
 * The script is idempotent — running it twice will not create duplicates.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(__dirname, process.env.DB_PATH)
  : path.join(__dirname, 'banking.db');

const DEMO_EMAIL    = 'demo@neobank.com';
const DEMO_PASSWORD = 'demo1234';

// ─── Open DB (it must already exist — start the server first once to create it) ─
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ─── Guard: skip if demo user already exists ─────────────────────────────────
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
if (existing) {
  console.log(`Demo user already exists (${DEMO_EMAIL}). Nothing to do.`);
  process.exit(0);
}

// ─── IDs ─────────────────────────────────────────────────────────────────────
const userId   = uuidv4();
const holderId = uuidv4();
const acc1Id   = uuidv4(); // checking
const acc2Id   = uuidv4(); // savings

// ─── User ─────────────────────────────────────────────────────────────────────
const hashedPassword = bcrypt.hashSync(DEMO_PASSWORD, 12);
db.prepare(
  'INSERT INTO users (id, email, hashed_password) VALUES (?, ?, ?)'
).run(userId, DEMO_EMAIL, hashedPassword);

// ─── Account holder (auto-created, blank profile) ────────────────────────────
db.prepare(
  'INSERT INTO account_holders (id, user_id, full_name, national_id, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
).run(holderId, userId, 'Demo User', '', '', '');

// ─── Accounts ────────────────────────────────────────────────────────────────
const accCount = db.prepare('SELECT COUNT(*) AS cnt FROM accounts').get().cnt;

db.prepare(
  `INSERT INTO accounts (id, holder_id, account_number, type, balance, currency, status)
   VALUES (?, ?, ?, ?, 0, 'USD', 'active')`
).run(acc1Id, holderId, `ACC-${String(accCount + 1).padStart(6, '0')}`,'checking');

db.prepare(
  `INSERT INTO accounts (id, holder_id, account_number, type, balance, currency, status)
   VALUES (?, ?, ?, ?, 0, 'USD', 'active')`
).run(acc2Id, holderId, `ACC-${String(accCount + 2).padStart(6, '0')}`, 'savings');

// ─── Transactions ─────────────────────────────────────────────────────────────
// (account_id, type, amount, description, date)
const transactions = [
  // Checking — January 2026
  [acc1Id, 'credit', 4500.00, 'Salary deposit',               '2026-01-02 09:00:00'],
  [acc1Id, 'debit',  1200.00, 'Rent payment',                 '2026-01-03 10:30:00'],
  [acc1Id, 'debit',   120.50, 'Netflix subscription',         '2026-01-05 11:00:00'],
  [acc1Id, 'debit',   340.00, 'Grocery store',                '2026-01-08 14:20:00'],
  [acc1Id, 'debit',    85.00, 'Electric bill',                '2026-01-10 09:15:00'],
  [acc1Id, 'credit',  250.00, 'Freelance payment',            '2026-01-15 16:00:00'],
  [acc1Id, 'debit',    60.00, 'Streaming services',           '2026-01-18 08:00:00'],
  [acc1Id, 'debit',   220.00, 'Restaurant — dinner',          '2026-01-22 20:30:00'],
  [acc1Id, 'debit',    45.00, 'Gas station',                  '2026-01-25 07:45:00'],
  [acc1Id, 'credit',  100.00, 'Cashback reward',              '2026-01-28 12:00:00'],

  // Checking — February 2026
  [acc1Id, 'credit', 4500.00, 'Salary deposit',               '2026-02-02 09:00:00'],
  [acc1Id, 'debit',  1200.00, 'Rent payment',                 '2026-02-03 10:30:00'],
  [acc1Id, 'debit',   120.50, 'Netflix subscription',         '2026-02-05 11:00:00'],
  [acc1Id, 'debit',   510.00, 'Grocery store',                '2026-02-09 14:20:00'],
  [acc1Id, 'debit',    92.00, 'Electric bill',                '2026-02-11 09:15:00'],
  [acc1Id, 'debit',   175.00, 'Pharmacy',                     '2026-02-14 15:00:00'],
  [acc1Id, 'credit',  500.00, 'Client invoice paid',          '2026-02-17 10:00:00'],
  [acc1Id, 'debit',    38.00, 'Parking fees',                 '2026-02-20 18:00:00'],
  [acc1Id, 'debit',   290.00, 'Online shopping',              '2026-02-24 13:00:00'],
  [acc1Id, 'debit',    55.00, 'Internet bill',                '2026-02-27 09:00:00'],

  // Savings — January 2026
  [acc2Id, 'credit', 10000.00, 'Initial deposit',             '2026-01-01 08:00:00'],
  [acc2Id, 'credit',   500.00, 'Monthly savings transfer',    '2026-01-15 09:00:00'],
  [acc2Id, 'credit',   300.00, 'Bonus saved',                 '2026-01-20 10:00:00'],
  [acc2Id, 'debit',    200.00, 'Emergency withdrawal',        '2026-01-28 11:00:00'],

  // Savings — February 2026
  [acc2Id, 'credit',   500.00, 'Monthly savings transfer',    '2026-02-15 09:00:00'],
  [acc2Id, 'credit',   750.00, 'Tax refund deposit',          '2026-02-18 14:00:00'],
  [acc2Id, 'debit',    150.00, 'Transfer to checking',        '2026-02-25 10:00:00'],
];

const insertTx = db.prepare(
  'INSERT INTO transactions (id, account_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?, ?)'
);

const balances = { [acc1Id]: 0, [acc2Id]: 0 };

const seedAll = db.transaction(() => {
  for (const [accId, type, amount, desc, date] of transactions) {
    insertTx.run(uuidv4(), accId, type, amount, desc, date);
    balances[accId] += type === 'credit' ? amount : -amount;
  }
  for (const [accId, bal] of Object.entries(balances)) {
    db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(bal, accId);
  }
});

seedAll();

console.log('');
console.log('✓ Demo user created');
console.log(`  Email:    ${DEMO_EMAIL}`);
console.log(`  Password: ${DEMO_PASSWORD}`);
console.log('');
console.log('✓ Accounts created');
console.log(`  Checking — balance: $${balances[acc1Id].toFixed(2)}`);
console.log(`  Savings  — balance: $${balances[acc2Id].toFixed(2)}`);
console.log('');
console.log(`✓ ${transactions.length} transactions inserted (January–February 2026)`);
console.log('');
console.log('→ Go to http://localhost:5173 and log in with the credentials above.');
console.log('');
