const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../db/database');

// mergeParams: true gives access to :id from the parent route /accounts/:id/transactions
const router = express.Router({ mergeParams: true });
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transactions on an account
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
 * /accounts/{id}/transactions:
 *   get:
 *     summary: List transactions for an account
 *     tags: [Transactions]
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
 *         description: List of transactions ordered by date descending
 *       404:
 *         description: Account not found
 */
router.get('/', (req, res) => {
  const db = getDb();
  const account = getAccountForUser(db, req.params.id, req.userId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const transactions = db
    .prepare(
      'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC'
    )
    .all(account.id);

  return res.json(transactions);
});

/**
 * @swagger
 * /accounts/{id}/transactions:
 *   post:
 *     summary: Post a transaction on an account
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [debit, credit]
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Validation error or insufficient balance or closed account
 *       404:
 *         description: Account not found
 */
router.post(
  '/',
  [
    body('type').isIn(['debit', 'credit']).withMessage('type must be debit or credit'),
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
    body('description').optional().trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const account = getAccountForUser(db, req.params.id, req.userId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (account.status === 'closed') {
      return res.status(400).json({ error: 'Cannot transact on a closed account' });
    }

    const { type, amount, description } = req.body;

    if (type === 'debit' && account.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const id = uuidv4();
    const newBalance =
      type === 'debit' ? account.balance - amount : account.balance + amount;

    const run = db.transaction(() => {
      db.prepare(
        'INSERT INTO transactions (id, account_id, type, amount, description) VALUES (?, ?, ?, ?, ?)'
      ).run(id, account.id, type, amount, description || null);

      db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(
        newBalance,
        account.id
      );
    });
    run();

    const transaction = db
      .prepare('SELECT * FROM transactions WHERE id = ?')
      .get(id);

    return res.status(201).json(transaction);
  }
);

module.exports = router;
