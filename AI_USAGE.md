# AI Usage Report

## Tools Used

| Tool | Role |
|------|------|
| Claude.ai | Architecture decisions, data modeling, documentation, prompt strategy |
| Antigravity (With Claude integration) | Code generation, implementation, debugging |

## Approach

This project was built using an AI-first development strategy. Rather than writing code directly, AI tools were used to accelerate implementation while maintaining architectural control and decision-making throughout the process.

The workflow was:
1. Define architecture and scope with Claude.ai before writing any code
2. Use Antigravity to generate implementation based on well-defined prompts
3. Review, test, and adjust generated code manually
4. Document decisions and iterations throughout the process

---

## Prompts & Iterations

### Session 1 — Architecture Planning (Claude.ai)

**Goal:** Define the domain model and API structure before writing any code

**Key decisions made during this session:**

- Chose Node.js + Express over Python/FastAPI because the developer's primary background is frontend JavaScript — prioritizing code ownership and debuggability over novelty
- Organized the project as a monorepo with `/backend` and `/frontend` folders for simpler delivery
- Kept `User` and `AccountHolder` as separate entities to reflect real banking domain patterns
- Scoped transfers to within the same bank only — external transfers documented as a roadmap item
- Credit cards are linked to an existing account, not a standalone entity
- Statements are generated on demand per month — scheduled generation documented as a roadmap item

---

### Session 2 — Backend Generation (Antigravity)

**Goal:** *(describe what you were trying to build)*

**Prompt 1 — Context loading:**
```
Before generating any code, read the following files already in the project:
- README.md
- SECURITY.md
- ROADMAP.md
- AI_USAGE.md
Use them as context for all decisions.
```

**Prompt 2 — Backend generation:**
```
I need you to build the complete backend for a digital banking REST API.
Create all files inside the /backend folder.

Tech stack:
- Node.js + Express.js
- SQLite with better-sqlite3
- JWT authentication with jsonwebtoken
- Password hashing with bcryptjs
- Input validation with express-validator
- API documentation with swagger-ui-express and swagger-jsdoc
- Testing with Jest and Supertest
- nodemon for development

Project structure to create:
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── accountHolders.js
│   │   ├── accounts.js
│   │   ├── transactions.js
│   │   ├── transfers.js
│   │   ├── cards.js
│   │   └── statements.js
│   ├── middleware/
│   │   └── auth.js
│   ├── db/
│   │   ├── database.js
│   │   └── schema.js
│   └── app.js
├── tests/
│   ├── auth.test.js
│   ├── accounts.test.js
│   └── transfers.test.js
├── .env.example
└── package.json

Domain rules:
- A User has one AccountHolder profile (personal details)
- An AccountHolder can have multiple Accounts (checking or savings)
- Accounts can transfer money only between accounts of the same user
- Each Account can have multiple Cards (credit only)
- Cards have their own balance and credit limit
- Paying a card debits the linked account and reduces the card balance
- Statements are generated per account per month on demand
- Closed accounts cannot send or receive money

Database schema:
- users: id (uuid), email, hashed_password, created_at
- account_holders: id (uuid), user_id (FK), full_name, national_id, phone, address
- accounts: id (uuid), holder_id (FK), account_number, type (checking/savings), balance, currency (default USD), status (active/closed), created_at
- transactions: id (uuid), account_id (FK), type (debit/credit), amount, description, created_at
- cards: id (uuid), account_id (FK), last_four, status (active/blocked/cancelled), credit_limit, current_balance, expiry_date, created_at
- statements: id (uuid), account_id (FK), period_start, period_end, opening_balance, closing_balance, total_credits, total_debits, generated_at

Security rules:
- All routes except POST /auth/signup and POST /auth/login require JWT
- Users can only access their own data — verify ownership on every request
- Never return hashed passwords in responses
- Never store full card numbers — only last 4 digits
- All secrets via environment variables only
- Use parameterized queries always — never string concatenation in SQL

API endpoints to implement:
POST   /auth/signup
POST   /auth/login
GET    /account-holders/me
POST   /account-holders
PUT    /account-holders/me
GET    /accounts
POST   /accounts
GET    /accounts/:id
PATCH  /accounts/:id/close
GET    /accounts/:id/transactions
POST   /accounts/:id/transactions
POST   /transfers
GET    /accounts/:id/cards
POST   /accounts/:id/cards
PATCH  /cards/:id/block
PATCH  /cards/:id/unblock
POST   /cards/:id/pay
GET    /accounts/:id/statements
GET    /accounts/:id/statements/:year/:month

Additional requirements:
- Swagger docs auto-generated and available at /api-docs
- Transfer operations must use SQLite transactions with rollback on failure
- Balance validation before any debit operation
- Generate account numbers in format ACC-XXXXXX
- All IDs must be UUIDs
- Include a .env.example with all required variables (no real values)
- package.json must include scripts: start, dev, test

Generate every file completely. Do not skip any file or leave placeholders.
```

---

### Session 3 — Frontend Generation (Antigravity)

**Goal:** Generate the complete frontend structure.

**Prompt 1 — Context loading:**
```
Before generating any code, read the following files:
- README.md (root)
- backend/README.md
- frontend/README.md
- SECURITY.md
- AI_USAGE.md
```

**Prompt 2 — Frontend generation:**
```
Build the complete frontend for NeoBank inside the /frontend folder.

Tech stack:
- React 18 + Vite
- Material UI (MUI) v5
- Zustand for global state
- Axios for HTTP requests
- Vitest + React Testing Library for tests
- React Router v6 for routing

Project structure to create:
frontend/
├── src/
│   ├── theme/
│   │   └── index.js
│   ├── store/
│   │   └── useAuthStore.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── accountService.js
│   │   ├── transactionService.js
│   │   ├── transferService.js
│   │   ├── cardService.js
│   │   └── statementService.js
│   ├── utils/
│   │   ├── formatCurrency.js
│   │   ├── formatDate.js
│   │   └── getErrorMessage.js
│   ├── components/
│   │   ├── AccountCard.jsx
│   │   ├── TransactionRow.jsx
│   │   ├── TransactionList.jsx
│   │   ├── TransferForm.jsx
│   │   ├── CardItem.jsx
│   │   ├── StatementSummary.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Accounts.jsx
│   │   ├── AccountDetail.jsx
│   │   ├── Transfers.jsx
│   │   ├── Cards.jsx
│   │   └── Statements.jsx
│   ├── tests/
│   │   ├── components/
│   │   └── utils/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json

MUI Theme — define once in src/theme/index.js, never hardcode colors in components:
- mode: dark
- background.default: #0B1437
- background.paper: #142057
- primary.main: #63B3ED
- success.main: #68D391
- error.main: #FC8181
- warning.main: #F6E05E
- text.primary: #FFFFFF
- text.secondary: #A0AEC0

All contrast ratios pass WCAG 2.1 AA.

Zustand store — src/store/useAuthStore.js:
- token (string | null)
- userId (string | null)
- user (object | null)
- setAuth(token, userId, user)
- clearAuth()
- persist token to localStorage

Axios instance — src/services/api.js:
- baseURL from import.meta.env.VITE_API_URL
- JWT interceptor: attach token from Zustand store to every request header
- Response interceptor: if 401, clear auth and redirect to /login

Service layer rules:
- Each service file handles one domain (auth, accounts, cards, etc.)
- Components never call axios directly — always through service functions
- All service functions are async and return data directly (not the full response)

Pages and routes:
- /login — Login page (public)
- /signup — Signup page (public)
- / — Dashboard (protected)
- /accounts — Accounts list (protected)
- /accounts/:id — Account detail + transactions (protected)
- /transfers — Transfer form (protected)
- /cards — Cards list + actions (protected)
- /statements — Statements list (protected)

Layout:
- Persistent sidebar navigation on desktop (Dashboard, Accounts, Transfers, Cards, Statements)
- On mobile: sidebar collapses into hamburger menu using MUI Drawer
- All pages use the same layout wrapper with sidebar

Responsive rules:
- Metric cards grid: 4 columns desktop, 2 tablet, 1 mobile
- Transaction table: all columns desktop, hide date column on mobile
- Forms: fixed width centered on desktop, full width on mobile
- Use MUI Grid with xs/sm/md breakpoints throughout

UX rules — apply to every page and component:
- Every API call must show a loading state (MUI CircularProgress)
- Every API call must handle errors (show inline error message)
- Use getErrorMessage(error) utility to extract readable error messages
- No API calls inside components — call service functions only
- All helper/formatting logic in src/utils/ as pure functions

Component rules:
- Components must be small and focused — one responsibility each
- No business logic inside components
- Props must be explicit and documented with comments
- All formatting (currency, dates) via utils functions

Testing:
- Vitest + React Testing Library
- Test all utils functions
- Test key components with mocked services
- vite.config.js must include test configuration

Environment:
- .env.example with VITE_API_URL=http://localhost:3000

The backend API base URL is http://localhost:3000. All endpoint signatures are documented in backend/README.md — use them exactly as specified to build the service layer.

Generate every file completely. Do not skip any file or leave placeholders.
```

**Steps that happened:**
1. Used plan mode to review all 33 files before generating
2. Generated complete frontend: theme, Zustand store, services, components, pages, tests
3. Ran Vitest test suite — some tests failed
4. Developer shared the error output with Claude
5. Claude identified the root cause and fixed the failing tests

**Result:** All tests passing. Frontend running at localhost:5173.

**Manual intervention:** Developer reviewed and approved the plan before execution and Developer shared error logs to guide Claude toward the fix.

---

### Session 4 — Frontend–Backend Integration (Antigravity)

**Goal:** Connect the generated frontend to the running backend, resolve all issues that surfaced when both systems ran together for the first time, and validate the full user flow end to end.

---

**Issue 1 — Timezone bug in date utility tests**

**Prompt:**
```
The formatDate test is failing with: expected 'December 2023' to match /January\s+2024/.
The test uses '2024-01-01T00:00:00Z', which is midnight UTC — in negative UTC offset
timezones this resolves to December 31, 2023. Fix the test so it passes regardless
of the timezone of the machine running it.
```

**Steps that happened:**
1. Developer ran the test suite and shared the failure output
2. Claude identified the root cause: midnight UTC on January 1st rolls back to December in negative-offset timezones
3. Fixed the date to `2024-01-15T12:00:00Z` (noon UTC, day 15 — safe across all UTC offsets)
4. Replaced the exact month string with a flexible regex `/Jan(uary)?\s+2024/` to tolerate locale differences in month formatting

**Result:** Test passing consistently across all timezones and locales.

**Manual intervention:** Developer shared the exact error output and questioned whether the fix would hold for all timezones — which prompted the additional regex improvement.

---

**Issue 2 — CardItem crash on undefined `card.type`**

**Prompt:**
```
The /cards page is crashing with: TypeError: Cannot read properties of undefined
(reading 'toUpperCase') at CardItem.jsx:49. Fix it.
```

**Steps that happened:**
1. Developer shared the browser console error with the full stack trace
2. Claude identified that `CardItem` called `card.type.toUpperCase()`, but the `cards` table has no `type` column — all cards in NeoBank are credit by definition
3. Replaced the reference with the hardcoded string `"CREDIT"`

**Result:** Cards page rendering correctly.

**Manual intervention:** Developer navigated to `/cards` and shared the console error.

---

**Issue 3 — Signup redirect flow**

**Prompt:**
```
After a successful signup the app should redirect to /login, not directly to
the dashboard. The user logs in manually from there and is then redirected
to the dashboard.
```

**Steps that happened:**
1. Developer clarified the intended flow after the initial implementation redirected straight to the dashboard post-signup
2. Reverted `navigate('/')` to `navigate('/login')` in `Signup.jsx` and removed the premature `setAuth` call

**Result:** Signup → `/login` → dashboard flow working as intended.

**Manual intervention:** Developer defined the correct redirect behavior after reviewing the initial implementation.

---

## Challenges & How AI Helped

| Challenge | How AI helped | Manual intervention |
|-----------|---------------|---------------------|
| better-sqlite3 v9 incompatible with Node.js 23 (V8/C++20 requirements) — caused native bindings to fail, breaking all database operations and returning 401 on all authenticated tests | Developer shared error logs and test output iteratively with Claude. Through multiple rounds of analysis, Claude identified two root causes: WAL pragma incompatibility with in-memory SQLite, and the version mismatch with Node.js 23. Fixed by upgrading better-sqlite3 to v11.10.0 and adding a conditional WAL pragma. | Developer coordinated the debugging process by sharing logs and guiding Claude toward the root cause |
| CORS error on every API call — browser blocked all requests from the frontend at `:5173` to the backend at `:3000` | Claude identified that the Express backend had no CORS configuration. Installed the `cors` package, added it as middleware before all routes with `FRONTEND_URL` as the allowed origin, and added the variable to `.env.example` | Developer ran both servers simultaneously and shared the browser console error |
| Dashboard crashed on first login with "Account holder profile not found" — the `User` and `AccountHolder` domain separation leaked into the UX | Claude traced the error to the signup route only creating a `User` record, leaving `AccountHolder` (required by all account endpoints) uncreated. Proposed two solutions — a frontend onboarding form vs. auto-creation at signup. Fixed by modifying the signup route to auto-create a blank `AccountHolder` immediately, keeping the two-entity model transparent to the user | Developer chose the backend-level fix over a frontend onboarding form to preserve clean UX |
| Statements page always showed an empty list — no statements were ever generated | Claude identified that `GET /accounts/:id/statements` only lists pre-existing statements, while generation requires calling `GET /accounts/:id/statements/:year/:month`. The frontend only called the first endpoint. Fixed by adding a month/year selector and a "Generate Statement" button that calls the generation endpoint, then refreshes the list | Developer flagged the empty list after creating mock data with two months of transactions |

---

## What I Learned

- Defining architecture before generating code produced significantly better 
  results — Claude's output was coherent and required fewer corrections when 
  given a detailed spec upfront.
- AI tools are most effective when given a clear role: Claude.ai for decisions 
  and strategy, Antigravity for execution.
- Debugging with AI requires directing it — sharing exact error output and 
  guiding it toward the right area was faster than letting it search freely.
- Full-stack development is approachable with AI assistance, even without 
  prior backend experience, as long as the developer understands the domain 
  and can validate the output.