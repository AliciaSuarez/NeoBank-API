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
 *   name: Transfers
 *   description: Move money between accounts owned by the same user
 */

/**
 * @swagger
 * /transfers:
 *   post:
 *     summary: Transfer money between two of my accounts
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from_account_id, to_account_id, amount]
 *             properties:
 *               from_account_id:
 *                 type: string
 *               to_account_id:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transfer completed — returns both transaction records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 debit:
 *                   type: object
 *                 credit:
 *                   type: object
 *       400:
 *         description: Business rule violation (same account, closed, insufficient balance)
 *       404:
 *         description: Source or destination account not found
 */
router.post(
  '/',
  [
    body('from_account_id').notEmpty().withMessage('from_account_id is required'),
    body('to_account_id').notEmpty().withMessage('to_account_id is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
    body('description').optional().trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { from_account_id, to_account_id, amount, description } = req.body;

    if (from_account_id === to_account_id) {
      return res.status(400).json({ error: 'Cannot transfer to the same account' });
    }

    const db = getDb();

    const fromAccount = db
      .prepare(
        `SELECT a.* FROM accounts a
         JOIN account_holders ah ON a.holder_id = ah.id
         WHERE a.id = ? AND ah.user_id = ?`
      )
      .get(from_account_id, req.userId);

    const toAccount = db
      .prepare(
        `SELECT a.* FROM accounts a
         JOIN account_holders ah ON a.holder_id = ah.id
         WHERE a.id = ? AND ah.user_id = ?`
      )
      .get(to_account_id, req.userId);

    if (!fromAccount) {
      return res.status(404).json({ error: 'Source account not found' });
    }
    if (!toAccount) {
      return res.status(404).json({ error: 'Destination account not found' });
    }
    if (fromAccount.status === 'closed') {
      return res.status(400).json({ error: 'Source account is closed' });
    }
    if (toAccount.status === 'closed') {
      return res.status(400).json({ error: 'Destination account is closed' });
    }
    if (fromAccount.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance in source account' });
    }

    const debitId = uuidv4();
    const creditId = uuidv4();
    const debitDesc = description || `Transfer to ${toAccount.account_number}`;
    const creditDesc = `Transfer from ${fromAccount.account_number}`;

    const execute = db.transaction(() => {
      db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(
        amount,
        fromAccount.id
      );
      db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(
        amount,
        toAccount.id
      );
      db.prepare(
        'INSERT INTO transactions (id, account_id, type, amount, description) VALUES (?, ?, ?, ?, ?)'
      ).run(debitId, fromAccount.id, 'debit', amount, debitDesc);
      db.prepare(
        'INSERT INTO transactions (id, account_id, type, amount, description) VALUES (?, ?, ?, ?, ?)'
      ).run(creditId, toAccount.id, 'credit', amount, creditDesc);

      return {
        debit: db.prepare('SELECT * FROM transactions WHERE id = ?').get(debitId),
        credit: db.prepare('SELECT * FROM transactions WHERE id = ?').get(creditId),
      };
    });

    const result = execute();
    return res.status(201).json(result);
  }
);

module.exports = router;
