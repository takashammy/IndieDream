# Dreamin' Indie

A platform for musicians chasing dreams — Inner Soul Records, Hong Kong.

The live site is built from this repository on Vercel. Shared studio data lives in Neon Postgres.

## First admin after a wipe

Demo staff logins are no longer in the app. After deploy:

1. In Vercel → Project → Settings → Environment Variables, add  
   `ADMIN_SETUP_SECRET` = a long random phrase only you know.
2. Redeploy.
3. Open the site → **Me** → **Open the Desk**.
4. Enter that setup key, then your name, username, email, and a new password (8+ characters).
5. That creates the only admin. The form will not work again once an admin exists.
6. Extra staff accounts can be added later from a signed-in Desk session (server function `createStaffAdmin`).

Do not put passwords in this repository.
