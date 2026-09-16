import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";

const STUDIO_ID = "indie-dream";
const KEEP = 14;

export type BackupRow = {
  id: string;
  taken_at: string;
  source: string;
  bytes: number;
};

function bearerSecret() {
  return env("CRON_SECRET") || env("BACKUP_SECRET") || "";
}

function tokenOk(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function backupAuthorized(request: Request) {
  const expected = bearerSecret();
  const header = request.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (expected) return tokenOk(token, expected);
  return request.headers.get("x-vercel-cron") === "1";
}

export async function takeStudioBackup(source = "cron"): Promise<{ ok: true; id: string; bytes: number } | { ok: false; error: string }> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<Record<string, unknown>>(
    `select id, artists, accounts, events, posts, notices,
            deleted_post_ids, deleted_artist_ids, banned_user_ids, updated_at
     from cue_studio where id = $1`,
    [STUDIO_ID],
  );
  const studio = rows[0];
  if (!studio) return { ok: false, error: "No studio row to back up." };

  const payload = JSON.stringify(studio);
  const bytes = Buffer.byteLength(payload, "utf8");
  const day = new Date().toISOString().slice(0, 10);
  const id = `bk-${day}-${Date.now().toString(36)}`;

  await sql.query(
    `insert into cue_backups (id, source, studio, bytes) values ($1,$2,$3::jsonb,$4)`,
    [id, source, payload, bytes],
  );

  await sql.query(
    `delete from cue_backups where taken_at < now() - ($1 || ' days')::interval`,
    [String(KEEP)],
  );

  try {
    const r2 = await import("@/lib/r2.server");
    if (r2.r2Configured()) {
      const key = `backups/indie-dream-${day}.json`;
      await r2.putObject(key, new TextEncoder().encode(payload), "application/json");
    }
  } catch {
    /* R2 is optional — the row in cue_backups is the source of truth */
  }

  return { ok: true, id, bytes };
}

export async function listStudioBackups(): Promise<BackupRow[]> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  return sql.query<BackupRow>(
    `select id, taken_at::text as taken_at, source, bytes
     from cue_backups
     order by taken_at desc
     limit $1`,
    [KEEP],
  );
}
