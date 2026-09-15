import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const STUDIO_ID = "indie-dream";

const studioSliceSchema = z.object({
  artists: z.array(z.any()),
  accounts: z.array(z.any()),
  events: z.array(z.any()),
  posts: z.array(z.any()),
  deletedPostIds: z.array(z.string()),
  deletedArtistIds: z.array(z.string()),
  bannedUserIds: z.array(z.string()),
  notices: z.array(z.any()),
});

export type StudioSlice = z.infer<typeof studioSliceSchema>;

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function asArray<T>(value: unknown): T[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function asStringArray(value: unknown): string[] {
  return asArray<unknown>(value).map((item) => String(item));
}

function stripAccount(account: Record<string, unknown>, revealContact: boolean) {
  const next: Record<string, unknown> = { ...account, password: "" };
  if (!revealContact) {
    next.email = "";
    next.whatsapp = "";
  }
  return next;
}

export const loadStudio = createServerFn({ method: "GET" }).handler(async (): Promise<StudioSlice | null> => {
  try {
    const { getSql } = await import("@/lib/db");
    const sessionMod = await import("@/lib/cue-session.server");
    const sql = await getSql();
    const session = await sessionMod.readCueSession();
    const rows = await sql.query<{
      artists: unknown;
      accounts: unknown;
      events: unknown;
      posts: unknown;
      notices: unknown;
      deleted_post_ids: unknown;
      deleted_artist_ids: unknown;
      banned_user_ids: unknown;
    }>(
      `select artists, accounts, events, posts, notices,
              deleted_post_ids, deleted_artist_ids, banned_user_ids
       from cue_studio where id = $1`,
      [STUDIO_ID],
    );
    const row = rows[0];
    if (!row) return null;
    const admin = session?.kind === "admin";
    const selfId = session?.accountId;
    return {
      artists: asArray(row.artists),
      accounts: asArray<Record<string, unknown>>(row.accounts).map((account) =>
        stripAccount(account, Boolean(admin || account.id === selfId)),
      ),
      events: asArray(row.events),
      posts: asArray(row.posts),
      notices: asArray(row.notices),
      deletedPostIds: asStringArray(row.deleted_post_ids),
      deletedArtistIds: asStringArray(row.deleted_artist_ids),
      bannedUserIds: asStringArray(row.banned_user_ids),
    };
  } catch {
    return null;
  }
});

/** Old phones used to POST the whole site here. That write is ignored. */
export const saveStudio = createServerFn({ method: "POST" })
  .validator(studioSliceSchema)
  .handler(async (): Promise<{ ok: true }> => {
    const sessionMod = await import("@/lib/cue-session.server");
    const session = await sessionMod.readCueSession();
    if (!session) {
      const err = new Error("Sign in to save.");
      (err as Error & { status?: number }).status = 401;
      throw err;
    }
    return { ok: true };
  });
