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
 *   name: Account Holders
 *   description: Personal profile linked to a user account
 */

/**
 * @swagger
 * /account-holders/me:
 *   get:
 *     summary: Get my account holder profile
 *     tags: [Account Holders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account holder profile
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/me', (req, res) => {
  const db = getDb();
  const holder = db
    .prepare('SELECT * FROM account_holders WHERE user_id = ?')
    .get(req.userId);

  if (!holder) {
    return res.status(404).json({ error: 'Account holder profile not found' });
  }
  return res.json(holder);
});

/**
 * @swagger
 * /account-holders:
 *   post:
 *     summary: Create account holder profile
 *     tags: [Account Holders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, national_id, phone, address]
 *             properties:
 *               full_name:
 *                 type: string
 *               national_id:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profile created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Profile already exists for this user
 */
router.post(
  '/',
  [
    body('full_name').trim().notEmpty().withMessage('full_name is required'),
    body('national_id').trim().notEmpty().withMessage('national_id is required'),
    body('phone').trim().notEmpty().withMessage('phone is required'),
    body('address').trim().notEmpty().withMessage('address is required'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const existing = db
      .prepare('SELECT id FROM account_holders WHERE user_id = ?')
      .get(req.userId);

    if (existing) {
      return res.status(409).json({ error: 'Account holder profile already exists for this user' });
    }

    const { full_name, national_id, phone, address } = req.body;
    const id = uuidv4();

    db.prepare(
      'INSERT INTO account_holders (id, user_id, full_name, national_id, phone, address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.userId, full_name, national_id, phone, address);

    const holder = db.prepare('SELECT * FROM account_holders WHERE id = ?').get(id);
    return res.status(201).json(holder);
  }
);

/**
 * @swagger
 * /account-holders/me:
 *   put:
 *     summary: Update my account holder profile
 *     tags: [Account Holders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated profile
 *       400:
 *         description: Validation error
 *       404:
 *         description: Profile not found
 */
router.put(
  '/me',
  [
    body('full_name').optional().trim().notEmpty().withMessage('full_name cannot be empty'),
    body('phone').optional().trim().notEmpty().withMessage('phone cannot be empty'),
    body('address').optional().trim().notEmpty().withMessage('address cannot be empty'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const holder = db
      .prepare('SELECT * FROM account_holders WHERE user_id = ?')
      .get(req.userId);

    if (!holder) {
      return res.status(404).json({ error: 'Account holder profile not found' });
    }

    const full_name = req.body.full_name ?? holder.full_name;
    const phone = req.body.phone ?? holder.phone;
    const address = req.body.address ?? holder.address;

    db.prepare(
      'UPDATE account_holders SET full_name = ?, phone = ?, address = ? WHERE user_id = ?'
    ).run(full_name, phone, address, req.userId);

    const updated = db
      .prepare('SELECT * FROM account_holders WHERE user_id = ?')
      .get(req.userId);

    return res.json(updated);
  }
);

module.exports = router;
