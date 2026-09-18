# Dreamin' Indie

A platform for musicians chasing dreams — Inner Soul Records, Hong Kong.

**Version 1.0.0** — tagged 16 September 2026. This is the first frozen release of the live app.

The live site is built from this repository on Vercel. Shared studio data lives in Neon Postgres.

## First admin after a wipe

Demo staff logins are no longer in the app. After a full wipe (`migrations/0010_cue_full_wipe.sql`):

1. In Vercel → Project → Settings → Environment Variables, confirm  
   `ADMIN_SETUP_SECRET` is set on Production.
2. Wait for the deploy to go green.
3. Open the site in a **private window** → **Me** → **Open the Desk**.
4. Enter that setup key, then the name, username, email, and password you want (8+ characters).
5. That creates the first admin. The form will not work again once an admin exists.
6. Create Sin Lam (or anyone else) as staff later from a signed-in Desk session — public register cannot make admins.

If the installed app still looks logged in or still shows old profiles, delete the site data / remove the home-screen app and open it again. On first load after this deploy the app deletes older local saves (`indie-dream-v1` through `v7`, including the previous test world) so an old phone cannot write that world back onto the live site.

Old demo passwords (`inner-soul`, `Harbour88`, `Lantern88`) are dead. Do not put passwords in this repository.

## Automatic backups

Vercel calls `/api/backup` every night at 00:00 Hong Kong time. That copies the live studio row into `cue_backups` and keeps the last 14 days. If R2 is configured, the same snapshot is also stored as `backups/indie-dream-YYYY-MM-DD.json`.

A signed-in admin can take a snapshot immediately with GET or POST to `/api/backup`. Set `CRON_SECRET` (or `BACKUP_SECRET`) on Vercel so the nightly job can authenticate (`Authorization: Bearer …`). Production deploys **require** one of those secrets — the cron header alone is not accepted when `DATABASE_URL` or `GROK_PROJECT_ID` is set.

Set `MARTIN_ACCOUNT_IDS` to a comma-separated list of account IDs (e.g. `acc-martin`) so signup push alerts only go to Martin's real account — not anyone who registers the username `martin`.

## Haven Group dashboard

The Haven management dashboard reads studio notifications via `GET /api/haven/notifications`. Set `HAVEN_DASHBOARD_SECRET` on Production and send `Authorization: Bearer …` from the dashboard server. The response includes pending queue/booking stats and notice deep links into the admin desk.
