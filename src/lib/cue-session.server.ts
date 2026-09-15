import { getCookie, setCookie } from "@tanstack/react-start/server";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { AccountKind } from "@/lib/data";
import { env } from "@/lib/env.server";

const scrypt = promisify(scryptCb);

export const SESSION_COOKIE = "indie-cue-session";
const SESSION_DAYS = 14;
const STUDIO_ID = "indie-dream";

export type CueAccountRow = {
  id: string;
  username: string;
  password: string;
  kind: AccountKind;
  name: string;
  role: string;
  location: string;
  bio: string;
  photo: string;
  email: string;
  whatsapp: string;
  artistId?: string;
  acceptedUploadTerms?: boolean;
  locale?: "en" | "zh";
};

export type PublicAccount = Omit<CueAccountRow, "password"> & { password?: never };

export type CueSession = {
  accountId: string;
  kind: AccountKind;
  account: PublicAccount;
};

type Sql = {
  query: <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;
};

export function publicAccount(row: CueAccountRow): PublicAccount {
  const { password: _drop, ...rest } = row;
  return rest;
}

export function setupSecretConfigured() {
  return Boolean(env("ADMIN_SETUP_SECRET"));
}

function setupSecret() {
  return env("ADMIN_SETUP_SECRET") ?? "";
}

export function setupSecretOk(given: string) {
  const expected = setupSecret();
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function hashPassword(plain: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scrypt(plain, salt, 32)) as Buffer;
  return `s2:${salt}:${buf.toString("hex")}`;
}

export async function verifyPassword(stored: string, plain: string) {
  if (!stored || !plain) return false;
  if (stored.startsWith("s2:")) {
    const [, salt, hex] = stored.split(":");
    if (!salt || !hex) return false;
    const buf = (await scrypt(plain, salt, 32)) as Buffer;
    const a = Buffer.from(hex, "hex");
    if (a.length !== buf.length) return false;
    return timingSafeEqual(a, buf);
  }
  // Legacy plaintext from the preview — refuse after wipe.
  return false;
}

export async function getSqlSafe(): Promise<Sql> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql.query(
    `create table if not exists cue_sessions (
       token text primary key,
       account_id text not null,
       expires_at timestamptz not null,
       created_at timestamptz not null default now()
     )`,
  ).catch(() => {});
  return sql;
}

export async function readStudioAccounts(sql: Sql): Promise<CueAccountRow[]> {
  const rows = await sql.query<{ accounts: unknown }>(
    `select accounts from cue_studio where id = $1`,
    [STUDIO_ID],
  );
  const raw = rows[0]?.accounts;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return Array.isArray(parsed) ? (parsed as CueAccountRow[]) : [];
}

export async function writeStudioAccounts(sql: Sql, accounts: CueAccountRow[]) {
  await sql.query(
    `insert into cue_studio (id, accounts, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (id) do update set accounts = excluded.accounts, updated_at = now()`,
    [STUDIO_ID, JSON.stringify(accounts)],
  );
  for (const a of accounts) {
    await sql.query(
      `insert into cue_accounts (
         id, username, password, kind, name, role, location, bio, photo, email, whatsapp, artist_id, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
       on conflict (id) do update set
         username = excluded.username,
         password = case when excluded.password = '' then cue_accounts.password else excluded.password end,
         kind = excluded.kind,
         name = excluded.name,
         role = excluded.role,
         location = excluded.location,
         bio = excluded.bio,
         photo = excluded.photo,
         email = excluded.email,
         whatsapp = excluded.whatsapp,
         artist_id = excluded.artist_id,
         updated_at = now()`,
      [
        a.id,
        a.username,
        a.password,
        a.kind,
        a.name,
        a.role,
        a.location,
        a.bio,
        a.photo,
        a.email,
        a.whatsapp,
        a.artistId ?? null,
      ],
    );
  }
}

export async function adminCount(sql: Sql) {
  const accounts = await readStudioAccounts(sql);
  return accounts.filter((a) => a.kind === "admin").length;
}

function newToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession(sql: Sql, accountId: string) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql.query(
    `insert into cue_sessions (token, account_id, expires_at) values ($1,$2,$3)`,
    [token, accountId, expires.toISOString()],
  );
  setCookie(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return token;
}

export async function clearSession(sql?: Sql) {
  const token = getCookie(SESSION_COOKIE);
  if (token && sql) {
    await sql.query(`delete from cue_sessions where token = $1`, [token]).catch(() => {});
  }
  setCookie(SESSION_COOKIE, "", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
  });
}

export async function readCueSession(): Promise<CueSession | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  try {
    const sql = await getSqlSafe();
    const rows = await sql.query<{ account_id: string }>(
      `select account_id from cue_sessions where token = $1 and expires_at > now()`,
      [token],
    );
    const accountId = rows[0]?.account_id;
    if (!accountId) return null;
    const accounts = await readStudioAccounts(sql);
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return null;
    return { accountId, kind: account.kind, account: publicAccount(account) };
  } catch {
    return null;
  }
}

export function requireAdmin(session: CueSession | null): CueSession {
  if (!session || session.kind !== "admin") {
    const err = new Error("Forbidden");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
  return session;
}
