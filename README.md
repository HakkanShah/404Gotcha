# Link Tracker & Dashboard

Instant redirect, capture visit details, email notification, and password-protected dashboard.

## Local development

- `npm install`
- Optional: set `.env` with SMTP and TARGET_URL
- `npm start`
- Tracking: `http://localhost:3000/s`
- Dashboard: `http://localhost:3000/admin` (user: `admin`, pass: `Hakkan@123`)

## Email setup

Set:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `EMAIL_FROM` (e.g. `Link Tracker <no-reply@example.com>`)
- `EMAIL_TO` (defaults to `hakkanparbej@gmail.com`)

## Deploy to Vercel

- Add environment variables:
  - `TARGET_URL` (default `https://github.com/HakkanShah`)
  - `ADMIN_USERNAME` (default `admin`)
  - `ADMIN_PASSWORD` (default `Hakkan@123`)
  - `LIBSQL_URL` and `LIBSQL_AUTH_TOKEN` (Turso/libSQL)
  - SMTP variables above for email
- Routes:
  - `/s`, `/track`, `/go` -> tracked redirect
  - `/admin` -> dashboard
- Config: `vercel.json` included

## Deploy to Netlify

- Add environment variables same as above
- `netlify.toml` included
- Routes:
  - `/s`, `/track`, `/go` -> tracked redirect
  - `/admin` -> dashboard

## Database

- Local: SQLite via `better-sqlite3` in `data/visits.db`
- Serverless: Turso/libSQL via `@libsql/client`

## Security notes

- Dashboard protected with HTTP Basic Auth, set strong `ADMIN_PASSWORD` in production.
- App trusts proxy headers for IP. Ensure your platform sets `x-forwarded-for`.