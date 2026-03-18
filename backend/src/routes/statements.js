const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../db/database');

// mergeParams: true exposes :id from /accounts/:id/statements
const router = express.Router({ mergeParams: true });
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Statements
 *   description: Monthly account statements (generated on demand)
 */

function getAccountForUser(db, accountId, userId) {
  return db
    .prepare(
      `SELECT a.* FROM accounts a
       JOIN account_holders ah ON a.holder_id = ah.id
       WHERE a.id = ? AND ah.user_id = ?`
    )
    .get(accountId, userId);
}

/** Format a JS Date as YYYY-MM-DD using local time to avoid UTC drift. */
function toDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Compute a statement for [periodStart, periodEnd] from the current account
 * balance and the full transaction history.
 *
 * Because we only store the *current* balance, historical balances are
 * reconstructed by walking the transactions forward/backward:
 *
 *   closing_balance = current_balance
 *                   - SUM(credits after period_end)
 *                   + SUM(debits  after period_end)
 *   opening_balance = closing_balance - total_credits + total_debits
 */
function computeStatement(db, account, periodStart, periodEnd) {
  // Transactions strictly inside the period
  const inPeriod = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) AS total_credits,
         COALESCE(SUM(CASE WHEN type = 'debit'  THEN amount ELSE 0 END), 0) AS total_debits
       FROM transactions
       WHERE account_id = ?
         AND DATE(created_at) >= ?
         AND DATE(created_at) <= ?`
    )
    .get(account.id, periodStart, periodEnd);

  // Transactions that occurred after the period
  const afterPeriod = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) AS credits_after,
         COALESCE(SUM(CASE WHEN type = 'debit'  THEN amount ELSE 0 END), 0) AS debits_after
       FROM transactions
       WHERE account_id = ?
         AND DATE(created_at) > ?`
    )
    .get(account.id, periodEnd);

  const closingBalance =
    account.balance - afterPeriod.credits_after + afterPeriod.debits_after;
  const openingBalance =
    closingBalance - inPeriod.total_credits + inPeriod.total_debits;

  return {
    total_credits: inPeriod.total_credits,
    total_debits: inPeriod.total_debits,
    opening_balance: openingBalance,
    closing_balance: closingBalance,
  };
}

/**
 * @swagger
 * /accounts/{id}/statements:
 *   get:
 *     summary: List all statements for an account
 *     tags: [Statements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of statements ordered by period descending
 *       404:
 *         description: Account not found
 */
router.get('/', (req, res) => {
  const db = getDb();
  const account = getAccountForUser(db, req.params.id, req.userId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const statements = db
    .prepare(
      'SELECT * FROM statements WHERE account_id = ? ORDER BY period_start DESC'
    )
    .all(account.id);

  return res.json(statements);
});

/**
 * @swagger
 * /accounts/{id}/statements/{year}/{month}:
 *   get:
 *     summary: Get (or generate) a statement for a specific month
 *     tags: [Statements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2024
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 1
 *     responses:
 *       200:
 *         description: Statement (returned from cache or freshly generated)
 *       400:
 *         description: Invalid year or month
 *       404:
 *         description: Account not found
 */
router.get('/:year/:month', (req, res) => {
  const year = parseInt(req.params.year, 10);
  const month = parseInt(req.params.month, 10);

  if (
    isNaN(year) ||
    isNaN(month) ||
    month < 1 ||
    month > 12 ||
    year < 2000 ||
    year > 2100
  ) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  const db = getDb();
  const account = getAccountForUser(db, req.params.id, req.userId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  // Period boundaries
  const startDate = new Date(year, month - 1, 1);          // first day of month
  const endDate = new Date(year, month, 0);                  // last day of month
  const periodStart = toDateString(startDate);
  const periodEnd = toDateString(endDate);

  // Return cached statement if it already exists for this period
  const existing = db
    .prepare(
      'SELECT * FROM statements WHERE account_id = ? AND period_start = ? AND period_end = ?'
    )
    .get(account.id, periodStart, periodEnd);

  if (existing) {
    return res.json(existing);
  }

  // Generate and persist
  const { total_credits, total_debits, opening_balance, closing_balance } =
    computeStatement(db, account, periodStart, periodEnd);

  const id = uuidv4();
  db.prepare(
    `INSERT INTO statements
       (id, account_id, period_start, period_end, opening_balance, closing_balance, total_credits, total_debits)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    account.id,
    periodStart,
    periodEnd,
    opening_balance,
    closing_balance,
    total_credits,
    total_debits
  );

  const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(id);
  return res.json(statement);
});

module.exports = router;
