# Linkly

A link-in-bio app. Sign in with GitHub, add and reorder links, pick a theme, share `/<username>`, and see which links get clicked.

Next.js 14 (App Router) · Auth.js (`next-auth` v4) · Prisma 5 + PostgreSQL · Tailwind · Framer Motion · recharts

## Run it locally

You need Node 20+ and a PostgreSQL database. Locally this uses a database named `linkly` inside the
Postgres container from `../spendly/docker-compose.yml`.

```bash
# 1. Start Postgres (from ../spendly) and create the database once
docker compose up -d
docker exec spendly-db psql -U spendly -d postgres -c "CREATE DATABASE linkly"

# 2. Configure
cp .env.example .env.local        # then fill in the values (see below)
cp .env.local .env                # the Prisma CLI reads .env

# 3. Install, migrate, seed, run  (http://localhost:3003)
npm install
npx prisma migrate dev
npx prisma db seed                # creates /demo with 5 links and ~320 clicks
npm run dev
```

Open http://localhost:3003/demo for the seeded public page, or http://localhost:3003/login to sign in.

### Signing in

**Dev login (no setup).** With `ENABLE_DEV_LOGIN="true"` the login page shows a "Dev login" button. It only
exists when `NODE_ENV=development`, so it is never active in a production build.

**GitHub (the real thing).** Create an OAuth App at GitHub, Settings, Developer settings, OAuth Apps, New:

- Homepage URL: `http://localhost:3003`
- Authorization callback URL: `http://localhost:3003/api/auth/callback/github`

Then put the Client ID and a generated Client Secret into `.env.local` as `GITHUB_ID` and `GITHUB_SECRET`.
Never paste the secret into chat or commit it. After the first GitHub sign-in you pick a username.

## How it works

| Route | What it does |
| --- | --- |
| `/` | Landing page |
| `/login`, `/onboarding` | Sign in, then claim a username |
| `/dashboard` | Profile (photo, name, bio) and links: add, edit, toggle, delete, drag to reorder |
| `/dashboard/appearance` | Mode, accent colour, button style, font, with a live phone preview |
| `/dashboard/analytics` | Clicks over time and per link, for 7, 30 or 90 days |
| `/[username]` | The public page |
| `/r/[linkId]` | Click tracking: records the click, then redirects (302) to the real URL |

Notes on behaviour:

- **Click tracking** works without JavaScript. Bots and requests with no User-Agent are redirected but not counted.
  A failure to record a click never blocks the visitor. Only `http(s)` URLs are ever redirected to.
- **Security:** every server action requires a session, validates input with `zod`, and filters every query by the
  signed-in user's id. `src/app/dashboard/actions.test.ts` checks this against the real database as two users.
- **Profile photos** are cropped and shrunk to 256 px in the browser and stored in Postgres (about 100 KB max).
- **Sessions** are JWT-based because the dev login can't use database sessions. Users and GitHub accounts are
  still stored in Postgres by the Prisma adapter.

## Tests

```bash
npm test      # 53 tests: validators, analytics maths, reorder logic, the redirect handler, server actions
```

`actions.test.ts` needs the local database to be running. It creates and removes its own users.

## Deploying later (not set up yet)

Database on Railway, app on Vercel. Nothing here has been deployed.

1. **Railway:** add a PostgreSQL service and copy its **public** connection string.
2. **Migrate it:** `DATABASE_URL="<railway url>" npx prisma migrate deploy`.
3. **Vercel:** import the repo, set the root directory to `linkly`, and set the environment variables:
   `DATABASE_URL`, `NEXTAUTH_URL` (your Vercel URL), `NEXTAUTH_SECRET` (`openssl rand -base64 32`),
   `GITHUB_ID`, `GITHUB_SECRET`. Do **not** set `ENABLE_DEV_LOGIN`.
4. **GitHub:** add a second OAuth App (or update the callback) for `https://<your-app>.vercel.app/api/auth/callback/github`.

## Known limits

- No rate limiting on `/r/[linkId]`, so click counts can be inflated by someone who scripts a browser User-Agent.
- Bot detection is a simple User-Agent check. It filters crawlers and link previews, not determined abuse.
- Link order saves one request per drop. Very large lists (the cap is 50 links) are fine, thousands would not be.
