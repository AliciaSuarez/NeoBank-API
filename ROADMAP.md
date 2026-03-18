# Roadmap & Future Considerations

## Short Term
- **Rate limiting** — prevent brute force attacks on `/auth/login`
- **Email verification** — confirm user email on signup before activating the account
- **Refresh tokens** — allow token renewal without requiring re-login
- **Pagination** — add pagination to transaction and statement listings

## Medium Term
- **Two-factor authentication (2FA)** — via SMS or authenticator app
- **Scheduled statements** — auto-generate monthly statements via cron job (currently generated on demand)
- **Transaction notifications** — email or push alerts for transactions above a configurable threshold
- **Multiple currencies** — support currency conversion between accounts
- **Debit cards** — currently only credit cards are supported

## Long Term
- **External transfers** — send money to accounts outside the bank via ACH or SWIFT integration
- **Loans module** — apply for personal loans and track payment schedules
- **KYC integration** — identity verification with a third-party provider
- **Audit logs** — immutable record of all sensitive operations for compliance
- **Microservices migration** — split into independent services (auth, accounts, cards) as the platform scales

## Infrastructure

### Backend
- **PostgreSQL** — migrate from SQLite for production workloads
- **Redis** — session caching and rate limiting
- **Docker** — containerize backend and frontend for consistent deployments
- **CI/CD pipeline** — automated testing and deployment on every push

### Frontend
- **End-to-end testing** — add Playwright or Cypress tests covering critical user flows (login, transfer, card payment)
- **Code splitting** — lazy-load page-level components with `React.lazy` to reduce initial bundle size
- **PWA support** — service worker + manifest to allow installation on mobile devices
- **Internationalization (i18n)** — support multiple languages and locale-aware currency/date formatting
- **Storybook** — document and develop UI components in isolation
