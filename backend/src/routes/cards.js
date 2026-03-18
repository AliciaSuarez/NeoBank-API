const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../db/database');

/**
 * accountCardsRouter — mounted at /accounts/:id/cards
 * mergeParams: true exposes the parent :id param as req.params.id
 */
const accountCardsRouter = express.Router({ mergeParams: true });
accountCardsRouter.use(authenticate);

/**
 * cardsRouter — mounted at /cards
 * Handles /cards/:id/block, /cards/:id/unblock, /cards/:id/pay
 */
const cardsRouter = express.Router();
cardsRouter.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Cards
 *   description: Credit card management
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

function getCardForUser(db, cardId, userId) {
  return db
    .prepare(
      `SELECT c.* FROM cards c
       JOIN accounts a ON c.account_id = a.id
       JOIN account_holders ah ON a.holder_id = ah.id
       WHERE c.id = ? AND ah.user_id = ?`
    )
    .get(cardId, userId);
}

// ─── Account-nested routes ────────────────────────────────────────────────────

/**
 * @swagger
 * /accounts/{id}/cards:
 *   get:
 *     summary: List cards for an account
 *     tags: [Cards]
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
 *         description: Array of cards
 *       404:
 *         description: Account not found
 */
accountCardsRouter.get('/', (req, res) => {
  const db = getDb();
  const account = getAccountForUser(db, req.params.id, req.userId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const cards = db
    .prepare('SELECT * FROM cards WHERE account_id = ? ORDER BY created_at ASC')
    .all(account.id);

  return res.json(cards);
});

/**
 * @swagger
 * /accounts/{id}/cards:
 *   post:
 *     summary: Request a credit card for an account
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credit_limit:
 *                 type: number
 *                 minimum: 1
 *                 example: 5000
 *     responses:
 *       201:
 *         description: Card created (only last 4 digits stored)
 *       400:
 *         description: Validation error or account is closed
 *       404:
 *         description: Account not found
 */
accountCardsRouter.post(
  '/',
  [
    body('credit_limit')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('credit_limit must be a positive number'),
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
      return res.status(400).json({ error: 'Cannot issue a card for a closed account' });
    }

    const creditLimit = req.body.credit_limit || 5000;
    const id = uuidv4();
    const lastFour = String(Math.floor(1000 + Math.random() * 9000));

    // Expiry: 3 years from now
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 3);
    const expiryDate = `${exp.getFullYear()}-${String(exp.getMonth() + 1).padStart(2, '0')}`;

    db.prepare(
      `INSERT INTO cards (id, account_id, last_four, status, credit_limit, current_balance, expiry_date)
       VALUES (?, ?, ?, 'active', ?, 0, ?)`
    ).run(id, account.id, lastFour, creditLimit, expiryDate);

    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
    return res.status(201).json(card);
  }
);

// ─── Standalone card routes ───────────────────────────────────────────────────

/**
 * @swagger
 * /cards/{id}/block:
 *   patch:
 *     summary: Block a card
 *     tags: [Cards]
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
 *         description: Card blocked
 *       400:
 *         description: Card is already blocked or cancelled
 *       404:
 *         description: Card not found
 */
cardsRouter.patch('/:id/block', (req, res) => {
  const db = getDb();
  const card = getCardForUser(db, req.params.id, req.userId);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  if (card.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot block a cancelled card' });
  }
  if (card.status === 'blocked') {
    return res.status(400).json({ error: 'Card is already blocked' });
  }

  db.prepare('UPDATE cards SET status = ? WHERE id = ?').run('blocked', card.id);
  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(card.id);
  return res.json(updated);
});

/**
 * @swagger
 * /cards/{id}/unblock:
 *   patch:
 *     summary: Unblock a card
 *     tags: [Cards]
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
 *         description: Card unblocked
 *       400:
 *         description: Card is already active or cancelled
 *       404:
 *         description: Card not found
 */
cardsRouter.patch('/:id/unblock', (req, res) => {
  const db = getDb();
  const card = getCardForUser(db, req.params.id, req.userId);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  if (card.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot unblock a cancelled card' });
  }
  if (card.status === 'active') {
    return res.status(400).json({ error: 'Card is already active' });
  }

  db.prepare('UPDATE cards SET status = ? WHERE id = ?').run('active', card.id);
  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(card.id);
  return res.json(updated);
});

/**
 * @swagger
 * /cards/{id}/pay:
 *   post:
 *     summary: Pay a card balance from a bank account
 *     tags: [Cards]
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
 *             required: [amount, account_id]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               account_id:
 *                 type: string
 *                 description: The bank account to debit for the payment
 *     responses:
 *       200:
 *         description: Payment applied — returns updated transaction and card
 *       400:
 *         description: No outstanding balance, insufficient account balance, or closed account
 *       404:
 *         description: Card or account not found
 */
cardsRouter.post(
  '/:id/pay',
  [
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
    body('account_id').notEmpty().withMessage('account_id is required'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const card = getCardForUser(db, req.params.id, req.userId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    if (card.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot pay a cancelled card' });
    }
    if (card.current_balance <= 0) {
      return res.status(400).json({ error: 'Card has no outstanding balance' });
    }

    const { amount, account_id } = req.body;

    const account = getAccountForUser(db, account_id, req.userId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    if (account.status === 'closed') {
      return res.status(400).json({ error: 'Account is closed' });
    }

    // Cap payment at the outstanding card balance to prevent overpayment
    const payAmount = Math.min(amount, card.current_balance);

    if (account.balance < payAmount) {
      return res.status(400).json({ error: 'Insufficient balance in account' });
    }

    const txId = uuidv4();

    const run = db.transaction(() => {
      db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(
        payAmount,
        account.id
      );
      db.prepare('UPDATE cards SET current_balance = current_balance - ? WHERE id = ?').run(
        payAmount,
        card.id
      );
      db.prepare(
        'INSERT INTO transactions (id, account_id, type, amount, description) VALUES (?, ?, ?, ?, ?)'
      ).run(
        txId,
        account.id,
        'debit',
        payAmount,
        `Card payment — card ending in ${card.last_four}`
      );

      return {
        transaction: db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId),
        card: db.prepare('SELECT * FROM cards WHERE id = ?').get(card.id),
      };
    });

    const result = run();
    return res.status(200).json(result);
  }
);

module.exports = { accountCardsRouter, cardsRouter };
