# NeoBank Frontend

A React-based web client for the NeoBank API. Built with Material UI, Zustand for state management, and Axios for API communication. Designed with a dark theme that meets WCAG 2.1 AA accessibility standards.

---

## Tech Stack

- **Framework:** React 18
- **UI Library:** Material UI (MUI) v5
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Testing:** Vitest + React Testing Library
- **Build Tool:** Vite

---

## Project Structure

```
frontend/
├── src/
│   ├── theme/
│   │   └── index.js            — MUI theme with full color palette
│   ├── store/
│   │   └── useAuthStore.js     — Zustand store (token, userId, user)
│   ├── services/
│   │   ├── api.js              — Axios instance with JWT interceptor
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
```

---

## Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

```
VITE_API_URL=http://localhost:3000
```

---

## Theme & Colors

All colors are defined once in `src/theme/index.js` and consumed via MUI's theme system. No hardcoded hex values in components.

```js
palette: {
  mode: 'dark',
  background: {
    default: '#0B1437',   // page background
    paper: '#142057',     // cards and surfaces
  },
  primary:  { main: '#63B3ED' },  // accents, buttons, links — 5.4:1
  success:  { main: '#68D391' },  // income, positive values — 6.5:1
  error:    { main: '#FC8181' },  // expenses, alerts — 5.2:1
  warning:  { main: '#F6E05E' },  // featured balances — 7.5:1
  text: {
    primary:   '#FFFFFF',   // headings, amounts — 14.2:1
    secondary: '#A0AEC0',   // labels, dates, metadata — 5.1:1
  },
}
```

All contrast ratios measured against `#142057` (card surface). All pass WCAG 2.1 AA (minimum 4.5:1).

---

## Architecture Decisions

### State Management — Zustand
Global state holds only authentication data: `token`, `userId`, and `user` profile. All other state is local to each page or component.

### Component Structure
Atomic design without the atoms layer — MUI provides all base elements. Components are organized as:
- **molecules** — `AccountCard`, `TransactionRow`, `CardItem`, `StatementSummary`
- **organisms** — `TransactionList`, `TransferForm`
- **pages** — full page views connected to the API

### Service Layer
All API calls live in `src/services/`. Components never call Axios directly — they call service functions. This keeps components clean and makes services independently testable.

### Utility Functions
All formatting and helper logic lives in `src/utils/` as pure functions, outside of any component. This makes them trivial to unit test.

### Loading & Error States
Every API interaction must handle three states:
- **idle** — initial state, nothing happening
- **loading** — request in flight, show MUI `CircularProgress`
- **error** — request failed, show inline error message using `getErrorMessage()`

---

## Pages

| Page | Route | Auth |
|------|-------|------|
| Login | `/login` | No |
| Signup | `/signup` | No |
| Dashboard | `/` | Yes |
| Accounts | `/accounts` | Yes |
| Account Detail | `/accounts/:id` | Yes |
| Transfers | `/transfers` | Yes |
| Cards | `/cards` | Yes |
| Statements | `/statements` | Yes |

---

## Responsive Strategy

The app is designed desktop-first but must remain functional on smaller screens. No dedicated mobile app — just a responsive web layout.

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Sidebar | Fixed, always visible | Fixed, always visible | Hidden — hamburger menu triggers MUI Drawer |
| Metric cards | 4 columns | 2 columns | 1 column |
| Transaction table | All columns | All columns | Simplified — hide date column |
| Forms | Fixed width centered | Full width | Full width |

MUI tools used for responsiveness:
- `Grid` with `xs`, `sm`, `md` breakpoints for layout columns
- `useMediaQuery` to detect screen size and toggle sidebar behavior
- `Drawer` component for mobile navigation
- `sx` prop with breakpoint objects for spacing adjustments

---

## Testing

```bash
cd frontend
npm test
```

Tests use Vitest + React Testing Library. No running server required.

| File | Coverage |
|------|----------|
| `tests/utils/formatCurrency.test.js` | Positive amounts, zero, negative, large numbers, null/undefined |
| `tests/utils/formatDate.test.js` | Valid ISO strings, null/undefined, invalid input, timezone safety |
| `tests/utils/getErrorMessage.test.js` | All error resolution paths: `response.data.error`, `response.data.message`, `error.message`, fallback |
| `tests/components/AccountCard.test.jsx` | Renders account number, type, balance, currency, and status chip |
| `tests/components/TransactionRow.test.jsx` | Credit/debit formatting, sign prefix, type label, date visibility |
