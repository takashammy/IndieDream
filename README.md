# Indie Dream

A platform for musicians chasing dreams.

Reconstructed from the Grok-built prototype (Press editorial look: cream / oxblood, Fraunces + Source Serif 4). Seven tabs — Artists, Discover, Events, Home, Board, Services, Me / Desk — with client-side auth and seed data.

This is a **working reconstruction**, not a byte-for-byte copy of the original TanStack Start workspace (that session was not saved to disk). Behaviour matches the agreed product:

- Roles: admin, artist, explorer, business
- Email-only register (no public house WhatsApp)
- WhatsApp required on bookings
- Admin desk: KPI strip, queue, bookings, people, roster, dates, board archive
- Board: faces, relative times, Open / Mine filters, Latest / Busiest, compose chips, FAB
- Artist profile photo + song cover uploads (stored as compressed data URLs)
- Zustand persist key `indie-dream-v1` in localStorage

Data is **per browser** until a shared database (Neon + API) is wired. Deploying this as-is does **not** sync across users.

## Preview accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin / Desk | `admin@indiedream.hk` | `inner-soul` |
| Artist (Tess, cello) | `tess@indiedream.hk` | `cello` |
| Explorer | `iris@explore.hk` | `listen` |
| Business | `bookings@haven.hk` | `venue` |

Other roster logins follow first-name emails at `indiedream.hk` (kai / yuki / owen / bee / rina / leo / sora / mina / jun / ada) with the short passwords listed in `src/lib/data.ts`.

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL.

```bash
npm run build
npm run preview
```

## Deploy (Vercel, free hobby)

1. This repo: `takashammy/IndieDream`
2. [vercel.com](https://vercel.com) → Import Git repository
3. Framework preset: Vite
4. Deploy

Add a custom domain later. For **shared** sync across phones, the next step is Neon Postgres + server routes — localStorage will not do that.

## Stack

Vite 7 · React 19 · TypeScript · Tailwind CSS v4 · Zustand 5 · lucide-react
