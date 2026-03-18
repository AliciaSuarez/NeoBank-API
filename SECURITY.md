# Security Considerations

## Authentication & Authorization
- All endpoints except `/auth/signup` and `/auth/login` require a valid JWT token
- Tokens expire after 24 hours
- Passwords are hashed using bcrypt with a salt rounds factor of 12
- JWT secret is stored in environment variables, never hardcoded

## Data Protection
- Card numbers are stored masked — only the last 4 digits are saved in the database
- No sensitive data is returned in API responses (no passwords, no full card numbers)
- All environment variables are documented in `.env.example` with placeholder values only

## Input Validation
- All incoming request bodies are validated before processing
- SQL injection is prevented by using parameterized queries — never raw string concatenation
- Account ownership is verified on every request — users can only access their own data

## Financial Safety
- Transfer operations use database transactions — if any step fails, the entire operation rolls back
- Balance is checked before any debit operation
- Closed accounts cannot send or receive money

## What Is Not Included (and why)
- **HTTPS** — not configured at the application level; in production this would be handled by a reverse proxy (nginx) or a cloud provider (AWS, GCP, etc.)
- **Rate limiting** — not implemented in this version; documented in the roadmap as a next step
- **Two-factor authentication (2FA)** — documented in the roadmap
