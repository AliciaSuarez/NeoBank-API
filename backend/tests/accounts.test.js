process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const { closeDb } = require('../src/db/database');

let token;

async function setup() {
  closeDb();
  const signup = await request(app)
    .post('/auth/signup')
    .send({ email: 'jane@example.com', password: 'password123' });
  token = signup.body.token;

  await request(app)
    .post('/account-holders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      full_name: 'Jane Doe',
      national_id: '123456789',
      phone: '+1234567890',
      address: '123 Main St',
    });
}

beforeEach(setup);
afterAll(() => closeDb());

// ─── Account Holder ───────────────────────────────────────────────────────────

describe('GET /account-holders/me', () => {
  test('200 — returns the profile', async () => {
    const res = await request(app)
      .get('/account-holders/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Jane Doe');
  });
});

describe('PUT /account-holders/me', () => {
  test('200 — updates allowed fields', async () => {
    const res = await request(app)
      .put('/account-holders/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+9999999999', address: '456 New Ave' });

    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('+9999999999');
    expect(res.body.address).toBe('456 New Ave');
    expect(res.body.full_name).toBe('Jane Doe'); // unchanged
  });
});

// ─── POST /accounts ───────────────────────────────────────────────────────────

describe('POST /accounts', () => {
  test('201 — creates a checking account', async () => {
    const res = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'checking' });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('checking');
    expect(res.body.account_number).toMatch(/^ACC-\d{6}$/);
    expect(res.body.balance).toBe(0);
    expect(res.body.status).toBe('active');
    expect(res.body.currency).toBe('USD');
  });

  test('201 — creates a savings account', async () => {
    const res = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'savings' });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('savings');
  });

  test('400 — rejects invalid account type', async () => {
    const res = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'mortgage' });

    expect(res.status).toBe(400);
  });
});

// ─── GET /accounts ────────────────────────────────────────────────────────────

describe('GET /accounts', () => {
  test('200 — returns empty list initially', async () => {
    const res = await request(app)
      .get('/accounts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('200 — lists created accounts', async () => {
    await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'checking' });
    await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'savings' });

    const res = await request(app)
      .get('/accounts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

// ─── GET /accounts/:id ────────────────────────────────────────────────────────

describe('GET /accounts/:id', () => {
  test('200 — returns account details', async () => {
    const create = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'checking' });

    const res = await request(app)
      .get(`/accounts/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(create.body.id);
  });

  test('404 — unknown account id', async () => {
    const res = await request(app)
      .get('/accounts/non-existent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /accounts/:id/close ────────────────────────────────────────────────

describe('PATCH /accounts/:id/close', () => {
  test('200 — closes an active account', async () => {
    const create = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'checking' });

    const res = await request(app)
      .patch(`/accounts/${create.body.id}/close`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('closed');
  });

  test('400 — cannot close an already-closed account', async () => {
    const create = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'checking' });

    await request(app)
      .patch(`/accounts/${create.body.id}/close`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/accounts/${create.body.id}/close`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already closed/i);
  });
});

// ─── Transactions ─────────────────────────────────────────────────────────────

describe('GET /accounts/:id/transactions', () => {
  test('200 — empty list for new account', async () => {
    const create = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'checking' });

    const res = await request(app)
      .get(`/accounts/${create.body.id}/transactions`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /accounts/:id/transactions', () => {
  let accountId;

  beforeEach(async () => {
    const create = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'checking' });
    accountId = create.body.id;
  });

  test('201 — credits the account', async () => {
    const res = await request(app)
      .post(`/accounts/${accountId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'credit', amount: 500, description: 'Deposit' });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('credit');
    expect(res.body.amount).toBe(500);

    // Confirm balance updated
    const acc = await request(app)
      .get(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(acc.body.balance).toBe(500);
  });

  test('201 — debits after funding', async () => {
    await request(app)
      .post(`/accounts/${accountId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'credit', amount: 1000 });

    const res = await request(app)
      .post(`/accounts/${accountId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'debit', amount: 300 });

    expect(res.status).toBe(201);

    const acc = await request(app)
      .get(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(acc.body.balance).toBe(700);
  });

  test('400 — debit with insufficient balance', async () => {
    const res = await request(app)
      .post(`/accounts/${accountId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'debit', amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  test('400 — cannot transact on a closed account', async () => {
    await request(app)
      .patch(`/accounts/${accountId}/close`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post(`/accounts/${accountId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'credit', amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/closed/i);
  });
});

// ─── Cards ────────────────────────────────────────────────────────────────────

describe('Cards', () => {
  let accountId;

  beforeEach(async () => {
    const create = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'checking' });
    accountId = create.body.id;
  });

  test('POST /accounts/:id/cards — 201 creates a card', async () => {
    const res = await request(app)
      .post(`/accounts/${accountId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ credit_limit: 3000 });

    expect(res.status).toBe(201);
    expect(res.body.last_four).toMatch(/^\d{4}$/);
    expect(res.body.credit_limit).toBe(3000);
    expect(res.body.current_balance).toBe(0);
    expect(res.body.status).toBe('active');
    // Full card number must never be stored
    expect(res.body.card_number).toBeUndefined();
  });

  test('GET /accounts/:id/cards — 200 lists cards', async () => {
    await request(app)
      .post(`/accounts/${accountId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    const res = await request(app)
      .get(`/accounts/${accountId}/cards`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('PATCH /cards/:id/block — 200 blocks card', async () => {
    const card = await request(app)
      .post(`/accounts/${accountId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    const res = await request(app)
      .patch(`/cards/${card.body.id}/block`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('blocked');
  });

  test('PATCH /cards/:id/unblock — 200 unblocks card', async () => {
    const card = await request(app)
      .post(`/accounts/${accountId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    await request(app)
      .patch(`/cards/${card.body.id}/block`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/cards/${card.body.id}/unblock`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
  });

  test('PATCH /cards/:id/block — 400 cannot block already-blocked card', async () => {
    const card = await request(app)
      .post(`/accounts/${accountId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    await request(app)
      .patch(`/cards/${card.body.id}/block`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/cards/${card.body.id}/block`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
