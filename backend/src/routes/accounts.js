const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../db/database');

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Bank account management
 */

/** Returns the account holder for the authenticated user, or null. */
function getHolder(db, userId) {
  return db.prepare('SELECT * FROM account_holders WHERE user_id = ?').get(userId);
}

/**
 * Returns an account by ID only if it belongs to the authenticated user.
 * Exported so nested routers can reuse the ownership check.
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

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: List all my accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of accounts
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account holder profile not found
 */
router.get('/', (req, res) => {
  const db = getDb();
  const holder = getHolder(db, req.userId);
  if (!holder) {
    return res.status(404).json({ error: 'Account holder profile not found' });
  }
  const accounts = db
    .prepare('SELECT * FROM accounts WHERE holder_id = ? ORDER BY created_at ASC')
    .all(holder.id);
  return res.json(accounts);
});

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Open a new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [checking, savings]
 *               currency:
 *                 type: string
 *                 example: USD
 *     responses:
 *       201:
 *         description: Account created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Account holder profile not found — create one first
 */
router.post(
  '/',
  [
    body('type').isIn(['checking', 'savings']).withMessage('type must be checking or savings'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('currency must be a 3-letter code'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const holder = getHolder(db, req.userId);
    if (!holder) {
      return res
        .status(404)
        .json({ error: 'Account holder profile not found — create one first' });
    }

    const { type, currency = 'USD' } = req.body;
    const id = uuidv4();

    // Generate sequential account number. UNIQUE constraint protects against races.
    const { cnt } = db.prepare('SELECT COUNT(*) AS cnt FROM accounts').get();
    const accountNumber = `ACC-${String(cnt + 1).padStart(6, '0')}`;

    db.prepare(
      `INSERT INTO accounts (id, holder_id, account_number, type, balance, currency, status)
       VALUES (?, ?, ?, ?, 0, ?, 'active')`
    ).run(id, holder.id, accountNumber, type, currency.toUpperCase());

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    return res.status(201).json(account);
  }
);

/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     summary: Get account details
 *     tags: [Accounts]
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
 *         description: Account details
 *       404:
 *         description: Account not found
 */
router.get('/:id', (req, res) => {
  const db = getDb();
  const account = getAccountForUser(db, req.params.id, req.userId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  return res.json(account);
});

/**
 * @swagger
 * /accounts/{id}/close:
 *   patch:
 *     summary: Close an account
 *     tags: [Accounts]
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
 *         description: Account closed
 *       400:
 *         description: Account is already closed
 *       404:
 *         description: Account not found
 */
router.patch('/:id/close', (req, res) => {
  const db = getDb();
  const account = getAccountForUser(db, req.params.id, req.userId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  if (account.status === 'closed') {
    return res.status(400).json({ error: 'Account is already closed' });
  }

  db.prepare('UPDATE accounts SET status = ? WHERE id = ?').run('closed', account.id);
  const updated = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account.id);
  return res.json(updated);
});

module.exports = router;
module.exports.getAccountForUser = getAccountForUser;
