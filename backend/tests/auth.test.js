// Set env vars before any module is required so database.js and auth.js
// pick them up correctly from the start.
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('../src/app');
const { closeDb } = require('../src/db/database');

// Reset the in-memory database before every test for full isolation.
beforeEach(() => closeDb());
afterAll(() => closeDb());

// ─── POST /auth/signup ────────────────────────────────────────────────────────

describe('POST /auth/signup', () => {
  test('201 — creates a user and returns a token', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'jane@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.userId).toBeDefined();
  });

  test('400 — rejects an invalid email', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('400 — rejects a password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'jane@example.com', password: 'short' });

    expect(res.status).toBe(400);
  });

  test('400 — rejects missing fields', async () => {
    const res = await request(app).post('/auth/signup').send({});
    expect(res.status).toBe(400);
  });

  test('409 — rejects duplicate email', async () => {
    await request(app)
      .post('/auth/signup')
      .send({ email: 'jane@example.com', password: 'password123' });

    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'jane@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already in use/i);
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  beforeEach(async () => {
    closeDb(); // ensure fresh db for each login test
    await request(app)
      .post('/auth/signup')
      .send({ email: 'jane@example.com', password: 'password123' });
  });

  test('200 — returns token for valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.userId).toBeDefined();
  });

  test('401 — rejects wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  test('401 — rejects non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  test('400 — rejects missing password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@example.com' });

    expect(res.status).toBe(400);
  });
});

// ─── Protected route — no token ───────────────────────────────────────────────

describe('Protected routes', () => {
  test('401 — /account-holders/me without token', async () => {
    const res = await request(app).get('/account-holders/me');
    expect(res.status).toBe(401);
  });

  test('401 — /accounts without token', async () => {
    const res = await request(app).get('/accounts');
    expect(res.status).toBe(401);
  });
});
