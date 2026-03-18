# NeoBank API

A modern digital banking REST API built with Node.js, Express, and SQLite. Designed to simulate a virtual-only bank where users can manage accounts, transfer money, handle credit cards, and receive monthly statements.

---

## Project Structure

```
backend/
├── src/
│   ├── routes/
│   ├── middleware/
│   ├── db/
│   └── app.js
├── tests/
├── .env.example
└── package.json
```

---

## Tech Stack

- **Runtime:** Node.js v23+
- **Framework:** Express.js
- **Database:** SQLite (via better-sqlite3 v11+)
- **Auth:** JWT + bcryptjs
- **Docs:** Swagger UI (available at `/api-docs`)
- **Testing:** Jest + Supertest

---

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

---

## Environment Variables

```
PORT=3000
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
DB_PATH=./banking.db
```

---

## API Docs

Once the server is running, visit:

```
http://localhost:3000/api-docs
```

Swagger UI provides an interactive playground for all endpoints.

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | Login + get JWT token | No |

### Account Holders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/account-holders/me` | Get my profile | Yes |
| POST | `/account-holders` | Create profile | Yes |
| PUT | `/account-holders/me` | Update profile | Yes |

### Accounts
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/accounts` | List my accounts | Yes |
| POST | `/accounts` | Open new account | Yes |
| GET | `/accounts/:id` | Get account details | Yes |
| PATCH | `/accounts/:id/close` | Close account | Yes |

### Transactions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/accounts/:id/transactions` | List transactions | Yes |
| POST | `/accounts/:id/transactions` | Create transaction | Yes |

### Transfers
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/transfers` | Transfer between my accounts | Yes |

### Cards
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/accounts/:id/cards` | List cards for account | Yes |
| POST | `/accounts/:id/cards` | Request credit card | Yes |
| PATCH | `/cards/:id/block` | Block card | Yes |
| PATCH | `/cards/:id/unblock` | Unblock card | Yes |
| POST | `/cards/:id/pay` | Pay card balance from account | Yes |

### Statements
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/accounts/:id/statements` | List all statements | Yes |
| GET | `/accounts/:id/statements/:year/:month` | Get specific month | Yes |

---

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### AccountHolder
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "full_name": "Jane Doe",
  "national_id": "123456789",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

### Account
```json
{
  "id": "uuid",
  "holder_id": "uuid",
  "account_number": "ACC-000001",
  "type": "checking | savings",
  "balance": 1000.00,
  "currency": "USD",
  "status": "active | closed"
}
```

### Card
```json
{
  "id": "uuid",
  "account_id": "uuid",
  "last_four": "4242",
  "type": "credit",
  "status": "active | blocked | cancelled",
  "credit_limit": 5000.00,
  "current_balance": 250.00,
  "expiry_date": "2027-03"
}
```

### Transaction
```json
{
  "id": "uuid",
  "account_id": "uuid",
  "type": "debit | credit",
  "amount": 100.00,
  "description": "Transfer to savings",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Statement
```json
{
  "id": "uuid",
  "account_id": "uuid",
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "opening_balance": 1000.00,
  "closing_balance": 1500.00,
  "total_credits": 700.00,
  "total_debits": 200.00,
  "generated_at": "2024-02-01T00:00:00Z"
}
```

---

## Running Tests

```bash
cd backend
npm test
```

46/46 tests passing.

Tests use Jest + Supertest against an in-memory SQLite database — no running server or external dependencies required.

| File | Coverage |
|------|----------|
| `tests/auth.test.js` | Signup, login, token validation, duplicate email |
| `tests/accounts.test.js` | Create account, list accounts, get by ID, close account, ownership checks |
| `tests/transfers.test.js` | Transfer between accounts, insufficient balance, closed account, cross-user rejection |

---
