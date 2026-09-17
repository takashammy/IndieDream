import webpush from "web-push";
import type { Sql } from "@/lib/db";
import { isMartinAccount } from "@/lib/martin";

async function ensureKeys(sql: Sql) {
  const existing = await sql.query<{ public_key: string; private_key: string }>(
    `select public_key, private_key from cue_push_keys where id = 1`,
  );
  if (existing[0]?.public_key && existing[0]?.private_key) return existing[0];
  const generated = webpush.generateVAPIDKeys();
  await sql.query(
    `insert into cue_push_keys (id, public_key, private_key) values (1, $1, $2)
     on conflict (id) do nothing`,
    [generated.publicKey, generated.privateKey],
  );
  const rows = await sql.query<{ public_key: string; private_key: string }>(
    `select public_key, private_key from cue_push_keys where id = 1`,
  );
  return rows[0] ?? { public_key: generated.publicKey, private_key: generated.privateKey };
}

export async function pushPublicKey(sql: Sql) {
  const keys = await ensureKeys(sql);
  return keys.public_key;
}

export async function saveMartinSub(
  sql: Sql,
  accountId: string,
  sub: { endpoint: string; p256dh: string; auth: string },
) {
  await sql.query(
    `insert into cue_push_subs (endpoint, account_id, p256dh, auth, updated_at)
     values ($1, $2, $3, $4, now())
     on conflict (endpoint) do update set
       account_id = excluded.account_id,
       p256dh = excluded.p256dh,
       auth = excluded.auth,
       updated_at = now()`,
    [sub.endpoint, accountId, sub.p256dh, sub.auth],
  );
}

export async function notifyMartinOfSignup(
  sql: Sql,
  who: { name: string; kind: string },
) {
  const sessionMod = await import("@/lib/cue-session.server");
  const accounts = await sessionMod.readStudioAccounts(sql);
  const martinIds = new Set(accounts.filter((a) => isMartinAccount(a)).map((a) => String(a.id)));
  if (martinIds.size === 0) return;
  const subs = await sql.query<{ endpoint: string; p256dh: string; auth: string; account_id: string }>(
    `select endpoint, p256dh, auth, account_id from cue_push_subs`,
  );
  const mine = subs.filter((s) => martinIds.has(String(s.account_id)));
  if (mine.length === 0) return;
  const keys = await ensureKeys(sql);
  webpush.setVapidDetails("mailto:Martinsham8888@msn.com", keys.public_key, keys.private_key);
  const payload = JSON.stringify({
    title: "Dreamin' Indie",
    body: `${who.name} joined as ${who.kind}.`,
    url: "/",
  });
  await Promise.all(
    mine.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 12 },
        );
      } catch (err) {
        const status = Number((err as { statusCode?: number }).statusCode ?? 0);
        if (status === 404 || status === 410) {
          await sql.query(`delete from cue_push_subs where endpoint = $1`, [s.endpoint]);
        }
      }
    }),
  );
}
