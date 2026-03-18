process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const { closeDb } = require('../src/db/database');

let token;
let account1Id; // funded checking account
let account2Id; // savings account (initially empty)

async function setup() {
  closeDb();

  // Create user
  const signup = await request(app)
    .post('/auth/signup')
    .send({ email: 'jane@example.com', password: 'password123' });
  token = signup.body.token;

  // Create account holder profile
  await request(app)
    .post('/account-holders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      full_name: 'Jane Doe',
      national_id: '123456789',
      phone: '+1234567890',
      address: '123 Main St',
    });

  // Open two accounts
  const acc1 = await request(app)
    .post('/accounts')
    .set('Authorization', `Bearer ${token}`)
    .send({ type: 'checking' });
  account1Id = acc1.body.id;

  const acc2 = await request(app)
    .post('/accounts')
    .set('Authorization', `Bearer ${token}`)
    .send({ type: 'savings' });
  account2Id = acc2.body.id;

  // Fund account 1
  await request(app)
    .post(`/accounts/${account1Id}/transactions`)
    .set('Authorization', `Bearer ${token}`)
    .send({ type: 'credit', amount: 1000, description: 'Initial deposit' });
}

beforeEach(setup);
afterAll(() => closeDb());

// ─── POST /transfers ──────────────────────────────────────────────────────────

describe('POST /transfers', () => {
  test('201 — transfers money and updates both balances', async () => {
    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({ from_account_id: account1Id, to_account_id: account2Id, amount: 400 });

    expect(res.status).toBe(201);
    expect(res.body.debit).toBeDefined();
    expect(res.body.credit).toBeDefined();
    expect(res.body.debit.amount).toBe(400);
    expect(res.body.debit.type).toBe('debit');
    expect(res.body.credit.amount).toBe(400);
    expect(res.body.credit.type).toBe('credit');

    // Verify updated balances
    const src = await request(app)
      .get(`/accounts/${account1Id}`)
      .set('Authorization', `Bearer ${token}`);
    const dst = await request(app)
      .get(`/accounts/${account2Id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(src.body.balance).toBe(600);
    expect(dst.body.balance).toBe(400);
  });

  test('201 — full balance transfer leaves source at zero', async () => {
    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({ from_account_id: account1Id, to_account_id: account2Id, amount: 1000 });

    expect(res.status).toBe(201);

    const src = await request(app)
      .get(`/accounts/${account1Id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(src.body.balance).toBe(0);
  });

  test('400 — rejects transfer with insufficient balance', async () => {
    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({ from_account_id: account1Id, to_account_id: account2Id, amount: 5000 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  test('400 — rejects transfer to the same account', async () => {
    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({ from_account_id: account1Id, to_account_id: account1Id, amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/same account/i);
  });

  test('400 — rejects transfer from a closed account', async () => {
    await request(app)
      .patch(`/accounts/${account1Id}/close`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({ from_account_id: account1Id, to_account_id: account2Id, amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/closed/i);
  });

  test('400 — rejects transfer to a closed account', async () => {
    await request(app)
      .patch(`/accounts/${account2Id}/close`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({ from_account_id: account1Id, to_account_id: account2Id, amount: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/closed/i);
  });

  test('400 — rejects missing required fields', async () => {
    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({ from_account_id: account1Id });

    expect(res.status).toBe(400);
  });

  test('401 — rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/transfers')
      .send({ from_account_id: account1Id, to_account_id: account2Id, amount: 100 });

    expect(res.status).toBe(401);
  });

  test('404 — rejects unknown source account', async () => {
    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        from_account_id: 'non-existent-id',
        to_account_id: account2Id,
        amount: 100,
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/source/i);
  });

  test('404 — rejects unknown destination account', async () => {
    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        from_account_id: account1Id,
        to_account_id: 'non-existent-id',
        amount: 100,
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/destination/i);
  });
});

// ─── Cross-user isolation ─────────────────────────────────────────────────────

describe('Cross-user isolation', () => {
  test("cannot transfer to another user's account", async () => {
    // Create a second user with their own account
    const signup2 = await request(app)
      .post('/auth/signup')
      .send({ email: 'other@example.com', password: 'password123' });
    const token2 = signup2.body.token;

    await request(app)
      .post('/account-holders')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        full_name: 'Other User',
        national_id: '987654321',
        phone: '+0987654321',
        address: '456 Other St',
      });

    const otherAcc = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token2}`)
      .send({ type: 'checking' });

    // user1 tries to transfer to user2's account
    const res = await request(app)
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        from_account_id: account1Id,
        to_account_id: otherAcc.body.id,
        amount: 100,
      });

    // The destination is found but belongs to another user — treated as 404
    expect(res.status).toBe(404);
  });
});

// ─── Card payment ─────────────────────────────────────────────────────────────

describe('POST /cards/:id/pay', () => {
  let cardId;

  beforeEach(async () => {
    const cardRes = await request(app)
      .post(`/accounts/${account2Id}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ credit_limit: 2000 });
    cardId = cardRes.body.id;

    // Manually give the card a balance by funding account1 and setting card balance
    // via a direct transaction (simulate card spend by calling the transaction endpoint)
    // In a real card scenario spending would go through the card, but here we test
    // the pay endpoint by first adding a balance to the card via a raw DB approach.
    // Instead, we'll use the /transactions endpoint to credit account1, then pay card
    // using account1 — but we need the card to have a balance first.
    // We'll do a workaround: use the db module to set card balance directly.
    const { getDb } = require('../src/db/database');
    getDb()
      .prepare('UPDATE cards SET current_balance = 200 WHERE id = ?')
      .run(cardId);
  });

  test('200 — pays card balance from account', async () => {
    const res = await request(app)
      .post(`/cards/${cardId}/pay`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100, account_id: account1Id });

    expect(res.status).toBe(200);
    expect(res.body.card.current_balance).toBe(100); // 200 - 100
    expect(res.body.transaction.amount).toBe(100);
    expect(res.body.transaction.type).toBe('debit');

    // Account balance should have decreased
    const acc = await request(app)
      .get(`/accounts/${account1Id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(acc.body.balance).toBe(900); // 1000 - 100
  });

  test('200 — caps payment at outstanding card balance', async () => {
    // Try to pay more than the card balance (200)
    const res = await request(app)
      .post(`/cards/${cardId}/pay`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 500, account_id: account1Id });

    expect(res.status).toBe(200);
    expect(res.body.card.current_balance).toBe(0); // fully paid
    expect(res.body.transaction.amount).toBe(200); // capped at 200
  });

  test('400 — rejects payment when account has insufficient balance', async () => {
    // Set card balance to more than account balance
    const { getDb } = require('../src/db/database');
    getDb()
      .prepare('UPDATE cards SET current_balance = 5000 WHERE id = ?')
      .run(cardId);

    const res = await request(app)
      .post(`/cards/${cardId}/pay`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000, account_id: account1Id });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });
});
