import { getRequest } from "@tanstack/react-start/server";

type RateLimitSql = {
  query: <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;
};

const MAX_ATTEMPTS = 5;
const BLOCK_MS = 60 * 60 * 1000;

export type AuthRateLimitAction = "login" | "register" | "createFirstAdmin";

export function clientIp(): string {
  const request = getRequest();
  if (!request) return "unknown";
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function rateLimitKey(action: AuthRateLimitAction, ip: string, identifier?: string) {
  if (action === "login") {
    const user = (identifier ?? "").trim().toLowerCase();
    return `login:${ip}:${user}`;
  }
  if (action === "register") return `register:${ip}`;
  return `bootstrap:${ip}`;
}

async function ensureTable(sql: RateLimitSql) {
  await sql.query(
    `create table if not exists cue_auth_attempts (
       key text primary key,
       failures integer not null default 0,
       blocked_until timestamptz,
       updated_at timestamptz not null default now()
     )`,
  ).catch(() => {});
}

export async function checkAuthRateLimit(
  sql: RateLimitSql,
  action: AuthRateLimitAction,
  identifier?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureTable(sql);
  const key = rateLimitKey(action, clientIp(), identifier);
  const rows = await sql.query<{ failures: number; blocked_until: string | null }>(
    `select failures, blocked_until from cue_auth_attempts where key = $1`,
    [key],
  );
  const row = rows[0];
  if (row?.blocked_until && new Date(row.blocked_until).getTime() > Date.now()) {
    return {
      ok: false,
      error:
        "You have used all attempts. Wait 1 hour before trying again.",
    };
  }
  return { ok: true };
}

export async function recordAuthFailure(
  sql: RateLimitSql,
  action: AuthRateLimitAction,
  identifier?: string,
): Promise<{ ok: false; error: string } | null> {
  await ensureTable(sql);
  const key = rateLimitKey(action, clientIp(), identifier);
  const rows = await sql.query<{ failures: number }>(
    `select failures from cue_auth_attempts where key = $1`,
    [key],
  );
  const prev = rows[0]?.failures ?? 0;
  const failures = prev + 1;
  const blockedUntil =
    failures >= MAX_ATTEMPTS ? new Date(Date.now() + BLOCK_MS).toISOString() : null;
  await sql.query(
    `insert into cue_auth_attempts (key, failures, blocked_until, updated_at)
     values ($1, $2, $3, now())
     on conflict (key) do update set
       failures = excluded.failures,
       blocked_until = excluded.blocked_until,
       updated_at = now()`,
    [key, failures, blockedUntil],
  );
  if (failures >= MAX_ATTEMPTS) {
    return {
      ok: false,
      error:
        "You have used all attempts. Wait 1 hour before trying again.",
    };
  }
  return null;
}

export async function clearAuthRateLimit(
  sql: RateLimitSql,
  action: AuthRateLimitAction,
  identifier?: string,
): Promise<void> {
  await ensureTable(sql);
  const key = rateLimitKey(action, clientIp(), identifier);
  await sql.query(`delete from cue_auth_attempts where key = $1`, [key]).catch(() => {});
}
