# NeoBank

A full-stack digital banking application that simulates a virtual-only bank. Users can manage accounts, transfer money, handle credit cards, and receive monthly statements.

---

## Projects

- [Backend](./backend/README.md) — REST API built with Node.js, Express and SQLite
- [Frontend](./frontend/README.md) — Web client built with React and Material UI

---

## Documentation

- [Security Considerations](./SECURITY.md)
- [Roadmap & Future Considerations](./ROADMAP.md)
- [AI Usage Report](./AI_USAGE.md)

---

## Running the App

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API will be available at `http://localhost:3000`.
Interactive API docs (Swagger UI) at `http://localhost:3000/api-docs`.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Demo Data

A fresh database is empty — new users have no accounts or transactions, so pages like Statements and Cards won't have anything to show.

To load a demo user with two accounts and two months of realistic transactions, run the seed script **after** starting the backend at least once (so the database and schema are created):

```bash
cd backend
npm run seed
```

This creates the following account:

| Field    | Value            |
|----------|------------------|
| Email    | demo@neobank.com |
| Password | demo1234         |

The demo user has:
- A **checking account** with 20 transactions across January–February 2026
- A **savings account** with 7 transactions across January–February 2026

Once logged in, go to **Statements**, select an account, pick a month (January or February 2026), and click **Generate Statement** to see the full statement view.

The seed script is idempotent — running it more than once will not create duplicates.

---

## Running Tests

Both projects have independent test suites. No running servers required.

```bash
# Backend — Jest + Supertest (46 tests)
cd backend && npm test

# Frontend — Vitest + React Testing Library
cd frontend && npm test
```

---

## Full Flow Walkthrough

1. **Start both servers** (backend on `:3000`, frontend on `:5173`)
2. **Run the seed script** (`npm run seed` from the `backend` folder)
3. **Open** `http://localhost:5173`
4. **Log in** with `demo@neobank.com` / `demo1234`
5. **Dashboard** — overview of balances, active accounts, and recent transactions
6. **Accounts** — list of accounts; click one to see its transaction history
7. **Transfers** — move money between accounts
8. **Cards** — request a credit card, block/unblock, pay balance
9. **Statements** — select account + month + year → click Generate Statement
