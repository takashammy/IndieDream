# Dreamin' Indie

A platform for musicians chasing dreams — Inner Soul Records, Hong Kong.

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

If the installed app still looks logged in or still shows old profiles, delete the site data / remove the home-screen app and open it again. Local cache key is now `indie-dream-v7`.

Old demo passwords (`inner-soul`, `Harbour88`, `Lantern88`) are dead. Do not put passwords in this repository.
