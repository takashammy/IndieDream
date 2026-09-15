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

type Sql = {
  query: <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;
};

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

function mergeAccountsForWrite(
  server: Record<string, unknown>[],
  incoming: Record<string, unknown>[],
  sessionId: string,
  isAdmin: boolean,
) {
  const byId = new Map(server.map((a) => [String(a.id), { ...a }]));
  for (const raw of incoming) {
    const id = String(raw.id ?? "");
    if (!id) continue;
    const existing = byId.get(id);
    const mine = id === sessionId;
    if (!existing) {
      if (!isAdmin && !mine) continue;
      if (raw.kind === "admin" && !isAdmin) continue;
      byId.set(id, {
        ...raw,
        password: "",
        kind:
          raw.kind === "admin" && isAdmin
            ? "admin"
            : raw.kind === "artist" || raw.kind === "business"
              ? raw.kind
              : "explorer",
      });
      continue;
    }
    if (!isAdmin && !mine) continue;
    const next = { ...existing };
    if (mine || isAdmin) {
      next.name = raw.name ?? next.name;
      next.role = raw.role ?? next.role;
      next.location = raw.location ?? next.location;
      next.bio = raw.bio ?? next.bio;
      next.photo = raw.photo ?? next.photo;
      next.email = raw.email ?? next.email;
      next.whatsapp = raw.whatsapp ?? next.whatsapp;
      next.locale = raw.locale ?? next.locale;
      next.acceptedUploadTerms = raw.acceptedUploadTerms ?? next.acceptedUploadTerms;
      next.artistId = raw.artistId ?? next.artistId;
    }
    if (isAdmin && raw.kind && raw.kind !== "admin") next.kind = raw.kind;
    next.password = existing.password;
    if (existing.kind === "admin") next.kind = "admin";
    byId.set(id, next);
  }
  return [...byId.values()];
}

async function writeMirrors(sql: Sql, slice: StudioSlice) {
  const deletedArtists = new Set(slice.deletedArtistIds);
  const deletedPosts = new Set(slice.deletedPostIds);

  for (const account of slice.accounts) {
    const a = account as Record<string, unknown>;
    const password = String(a.password ?? "");
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
        String(a.id ?? ""),
        String(a.username ?? ""),
        password,
        String(a.kind ?? "explorer"),
        String(a.name ?? ""),
        String(a.role ?? ""),
        String(a.location ?? ""),
        String(a.bio ?? ""),
        String(a.photo ?? ""),
        String(a.email ?? ""),
        String(a.whatsapp ?? ""),
        a.artistId ? String(a.artistId) : null,
      ],
    );
  }

  for (const artist of slice.artists) {
    const art = artist as Record<string, unknown>;
    const artistId = String(art.id ?? "");
    if (!artistId || deletedArtists.has(artistId)) continue;
    await sql.query(
      `insert into cue_artists (
         id, name, role, city, area, photo, genres, bio, label, label_approved, verified, spotify, youtube, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13, now())
       on conflict (id) do update set
         name = excluded.name,
         role = excluded.role,
         city = excluded.city,
         area = excluded.area,
         photo = excluded.photo,
         genres = excluded.genres,
         bio = excluded.bio,
         label = excluded.label,
         label_approved = excluded.label_approved,
         verified = excluded.verified,
         spotify = excluded.spotify,
         youtube = excluded.youtube,
         updated_at = now()`,
      [
        artistId,
        String(art.name ?? ""),
        String(art.role ?? ""),
        String(art.city ?? ""),
        String(art.area ?? ""),
        String(art.photo ?? ""),
        JSON.stringify(asArray(art.genres)),
        String(art.bio ?? ""),
        String(art.label ?? ""),
        Boolean(art.labelApproved),
        Boolean(art.verified),
        art.spotify ? String(art.spotify) : null,
        art.youtube ? String(art.youtube) : null,
      ],
    );
    const songs = asArray<Record<string, unknown>>(art.songs);
    for (const song of songs) {
      await sql.query(
        `insert into cue_songs (
           id, artist_id, title, duration, plays, cover, uploaded_at, status, spotify, youtube, lyrics
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (id) do update set
           artist_id = excluded.artist_id,
           title = excluded.title,
           duration = excluded.duration,
           plays = excluded.plays,
           cover = excluded.cover,
           uploaded_at = excluded.uploaded_at,
           status = excluded.status,
           spotify = excluded.spotify,
           youtube = excluded.youtube,
           lyrics = excluded.lyrics`,
        [
          String(song.id ?? ""),
          artistId,
          String(song.title ?? ""),
          String(song.duration ?? ""),
          String(song.plays ?? ""),
          String(song.cover ?? ""),
          String(song.uploadedAt ?? ""),
          String(song.status ?? "pending"),
          song.spotify ? String(song.spotify) : null,
          song.youtube ? String(song.youtube) : null,
          song.lyrics ? String(song.lyrics) : null,
        ],
      );
    }
  }

  for (const event of slice.events) {
    const e = event as Record<string, unknown>;
    await sql.query(
      `insert into cue_events (
         id, title, date, weekday, time, venue, area, photo, artist_ids, blurb, iso_date, status, posted_by
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13)
       on conflict (id) do update set
         title = excluded.title,
         date = excluded.date,
         weekday = excluded.weekday,
         time = excluded.time,
         venue = excluded.venue,
         area = excluded.area,
         photo = excluded.photo,
         artist_ids = excluded.artist_ids,
         blurb = excluded.blurb,
         iso_date = excluded.iso_date,
         status = excluded.status,
         posted_by = excluded.posted_by`,
      [
        String(e.id ?? ""),
        String(e.title ?? ""),
        String(e.date ?? ""),
        String(e.weekday ?? ""),
        String(e.time ?? ""),
        String(e.venue ?? ""),
        String(e.area ?? ""),
        String(e.photo ?? ""),
        JSON.stringify(asArray(e.artistIds)),
        String(e.blurb ?? ""),
        String(e.isoDate ?? ""),
        String(e.status ?? "pending"),
        e.postedBy ? String(e.postedBy) : null,
      ],
    );
  }

  for (const post of slice.posts) {
    const p = post as Record<string, unknown>;
    const postId = String(p.id ?? "");
    if (!postId || deletedPosts.has(postId)) continue;
    await sql.query(
      `insert into cue_posts (
         id, author, author_id, role, category, title, body, time, created_at, archived
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (id) do update set
         author = excluded.author,
         author_id = excluded.author_id,
         role = excluded.role,
         category = excluded.category,
         title = excluded.title,
         body = excluded.body,
         time = excluded.time,
         created_at = excluded.created_at,
         archived = excluded.archived`,
      [
        postId,
        String(p.author ?? ""),
        p.authorId ? String(p.authorId) : null,
        String(p.role ?? ""),
        String(p.category ?? "seeking"),
        String(p.title ?? ""),
        String(p.body ?? ""),
        String(p.time ?? ""),
        String(p.createdAt ?? ""),
        Boolean(p.archived),
      ],
    );
    const thread = asArray<Record<string, unknown>>(p.thread);
    for (const reply of thread) {
      await sql.query(
        `insert into cue_replies (
           id, post_id, author, author_id, role, body, created_at
         ) values ($1,$2,$3,$4,$5,$6,$7)
         on conflict (id) do update set
           post_id = excluded.post_id,
           author = excluded.author,
           author_id = excluded.author_id,
           role = excluded.role,
           body = excluded.body,
           created_at = excluded.created_at`,
        [
          String(reply.id ?? ""),
          postId,
          String(reply.author ?? ""),
          reply.authorId ? String(reply.authorId) : null,
          String(reply.role ?? ""),
          String(reply.body ?? ""),
          String(reply.createdAt ?? ""),
        ],
      );
    }
  }

  for (const notice of slice.notices) {
    const n = notice as Record<string, unknown>;
    await sql.query(
      `insert into cue_notices (
         id, kind, title, body, status, ref_id, created_at, fields
       ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
       on conflict (id) do update set
         kind = excluded.kind,
         title = excluded.title,
         body = excluded.body,
         status = excluded.status,
         ref_id = excluded.ref_id,
         created_at = excluded.created_at,
         fields = excluded.fields`,
      [
        String(n.id ?? ""),
        String(n.kind ?? "enquiry"),
        String(n.title ?? ""),
        String(n.body ?? ""),
        String(n.status ?? "pending"),
        n.refId ? String(n.refId) : null,
        String(n.createdAt ?? ""),
        JSON.stringify(n.fields && typeof n.fields === "object" ? n.fields : {}),
      ],
    );
  }

  for (const artistId of slice.deletedArtistIds) {
    await sql.query(`delete from cue_songs where artist_id = $1`, [artistId]);
    await sql.query(`delete from cue_artists where id = $1`, [artistId]);
  }
  for (const postId of slice.deletedPostIds) {
    await sql.query(`delete from cue_replies where post_id = $1`, [postId]);
    await sql.query(`delete from cue_posts where id = $1`, [postId]);
  }
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

export const saveStudio = createServerFn({ method: "POST" })
  .validator(studioSliceSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sessionMod = await import("@/lib/cue-session.server");
    const session = await sessionMod.readCueSession();
    if (!session) {
      const err = new Error("Sign in to save.");
      (err as Error & { status?: number }).status = 401;
      throw err;
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{
      accounts: unknown;
      deleted_post_ids: unknown;
      deleted_artist_ids: unknown;
      banned_user_ids: unknown;
    }>(
      `select accounts, deleted_post_ids, deleted_artist_ids, banned_user_ids
       from cue_studio where id = $1`,
      [STUDIO_ID],
    );
    const current = rows[0];
    const serverAccounts = asArray<Record<string, unknown>>(current?.accounts);
    const isAdmin = session.kind === "admin";
    const accounts = mergeAccountsForWrite(
      serverAccounts,
      data.accounts as Record<string, unknown>[],
      session.accountId,
      isAdmin,
    );
    const bannedUserIds = isAdmin ? data.bannedUserIds : asStringArray(current?.banned_user_ids);
    const deletedArtistIds = isAdmin ? data.deletedArtistIds : asStringArray(current?.deleted_artist_ids);
    const deletedPostIds = isAdmin ? data.deletedPostIds : asStringArray(current?.deleted_post_ids);

    const merged: StudioSlice = {
      artists: data.artists,
      accounts,
      events: data.events,
      posts: data.posts,
      notices: data.notices,
      deletedPostIds,
      deletedArtistIds,
      bannedUserIds,
    };

    await sql.query(
      `insert into cue_studio (
         id, artists, accounts, events, posts, notices,
         deleted_post_ids, deleted_artist_ids, banned_user_ids, updated_at
       ) values ($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb, now())
       on conflict (id) do update set
         artists = excluded.artists,
         accounts = excluded.accounts,
         events = excluded.events,
         posts = excluded.posts,
         notices = excluded.notices,
         deleted_post_ids = excluded.deleted_post_ids,
         deleted_artist_ids = excluded.deleted_artist_ids,
         banned_user_ids = excluded.banned_user_ids,
         updated_at = now()`,
      [
        STUDIO_ID,
        JSON.stringify(merged.artists),
        JSON.stringify(merged.accounts),
        JSON.stringify(merged.events),
        JSON.stringify(merged.posts),
        JSON.stringify(merged.notices),
        JSON.stringify(merged.deletedPostIds),
        JSON.stringify(merged.deletedArtistIds),
        JSON.stringify(merged.bannedUserIds),
      ],
    );
    await writeMirrors(sql, merged);
    return { ok: true };
  });
