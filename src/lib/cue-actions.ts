import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ISR_LABEL, formatPlays, parsePlays } from "@/lib/data";

const STUDIO_ID = "indie-dream";

const postSchema = z.object({
  id: z.string(),
  author: z.string(),
  authorId: z.string().optional(),
  role: z.string(),
  category: z.string(),
  title: z.string(),
  body: z.string(),
  time: z.string(),
  thread: z.array(z.any()),
  createdAt: z.string(),
  image: z.string().optional(),
});

const replySchema = z.object({
  id: z.string(),
  author: z.string(),
  authorId: z.string().optional(),
  role: z.string(),
  body: z.string(),
  createdAt: z.string(),
});

const noticeSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  status: z.string(),
  refId: z.string().optional(),
  createdAt: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
});

const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("addPost"), post: postSchema }),
  z.object({ type: z.literal("addReply"), postId: z.string(), reply: replySchema }),
  z.object({ type: z.literal("deletePost"), id: z.string() }),
  z.object({ type: z.literal("deleteReply"), postId: z.string(), replyId: z.string() }),
  z.object({ type: z.literal("submitEvent"), event: z.any(), notice: noticeSchema.optional() }),
  z.object({ type: z.literal("deleteEvent"), id: z.string() }),
  z.object({ type: z.literal("submitEnquiry"), notice: noticeSchema }),
  z.object({ type: z.literal("resolveNotice"), id: z.string(), status: z.enum(["approved", "declined", "completed"]) }),
  z.object({ type: z.literal("deleteArtist"), artistId: z.string() }),
  z.object({ type: z.literal("banUser"), accountId: z.string() }),
  z.object({ type: z.literal("setAccountKind"), accountId: z.string(), kind: z.enum(["artist", "explorer", "business"]) }),
  z.object({ type: z.literal("addSong"), artistId: z.string(), song: z.any(), notice: noticeSchema.optional() }),
  z.object({ type: z.literal("recordPlay"), artistId: z.string(), songId: z.string() }),
  z.object({ type: z.literal("patchSong"), artistId: z.string(), songId: z.string(), patch: z.any() }),
  z.object({ type: z.literal("deleteSong"), artistId: z.string(), songId: z.string() }),
  z.object({ type: z.literal("addArtist"), artist: z.any(), notice: noticeSchema.optional() }),
  z.object({
    type: z.literal("patchMe"),
    locale: z.enum(["en", "zh"]).optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
    name: z.string().optional(),
    photo: z.string().optional(),
    acceptedUploadTerms: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("patchProfile"),
    artistId: z.string(),
    artist: z.any(),
    account: z.any(),
    notice: noticeSchema.optional(),
  }),
]);

type Action = z.infer<typeof actionSchema>;
export type StudioAction = Action;

function asArray<T>(value: unknown): T[] {
  const parsed = typeof value === "string" ? (() => { try { return JSON.parse(value); } catch { return value; } })() : value;
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

export const applyStudioAction = createServerFn({ method: "POST" })
  .validator(actionSchema)
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const sessionMod = await import("@/lib/cue-session.server");
    const session = await sessionMod.readCueSession();
    if (!session) return { ok: false, error: "Log in first." };

    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
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
    const row = rows[0] ?? {
      artists: [],
      accounts: [],
      events: [],
      posts: [],
      notices: [],
      deleted_post_ids: [],
      deleted_artist_ids: [],
      banned_user_ids: [],
    };

    let artists = asArray<Record<string, unknown>>(row.artists);
    let accounts = asArray<Record<string, unknown>>(row.accounts);
    let events = asArray<Record<string, unknown>>(row.events);
    let posts = asArray<Record<string, unknown>>(row.posts);
    let notices = asArray<Record<string, unknown>>(row.notices);
    let deletedPostIds = asArray<unknown>(row.deleted_post_ids).map(String);
    let deletedArtistIds = asArray<unknown>(row.deleted_artist_ids).map(String);
    let bannedUserIds = asArray<unknown>(row.banned_user_ids).map(String);

    const admin = session.kind === "admin";
    const mine = session.accountId;
    const myArtist = String(session.account.artistId ?? "");
    const myName = String(session.account.name || session.account.username || "");
    const myRole = String(session.account.role || session.kind);

    const deny = (error: string) => ({ ok: false as const, error });
    if (bannedUserIds.includes(mine) || (myArtist && bannedUserIds.includes(myArtist))) {
      return deny("This account is banned.");
    }

    const ownPage = (artistId: string) => myArtist !== "" && myArtist === artistId;

    const pickSongPatch = (patch: Record<string, unknown>) => {
      const next: Record<string, unknown> = {};
      if (typeof patch.title === "string") next.title = patch.title;
      if (typeof patch.cover === "string") next.cover = patch.cover;
      if (typeof patch.spotify === "string" || patch.spotify === undefined) next.spotify = patch.spotify;
      if (typeof patch.youtube === "string" || patch.youtube === undefined) next.youtube = patch.youtube;
      if (typeof patch.lyrics === "string" || patch.lyrics === undefined) next.lyrics = patch.lyrics;
      return next;
    };

    const pickArtistPatch = (patch: Record<string, unknown>) => {
      const next: Record<string, unknown> = {};
      for (const key of ["name", "role", "city", "area", "photo", "genres", "bio", "spotify", "youtube", "label"] as const) {
        if (patch[key] !== undefined) next[key] = patch[key];
      }
      return next;
    };

    const action: Action = data;
    switch (action.type) {
      case "addPost": {
        if (posts.some((p) => p.id === action.post.id)) break;
        posts = [
          {
            ...action.post,
            author: myName,
            authorId: myArtist || mine,
            role: myRole,
          } as Record<string, unknown>,
          ...posts,
        ];
        break;
      }
      case "addReply": {
        posts = posts.map((p) => {
          if (String(p.id) !== action.postId) return p;
          const thread = asArray<Record<string, unknown>>(p.thread);
          if (thread.some((r) => r.id === action.reply.id)) return p;
          return {
            ...p,
            thread: [
              ...thread,
              { ...action.reply, author: myName, authorId: myArtist || mine, role: myRole },
            ],
          };
        });
        break;
      }
      case "deletePost": {
        if (!admin && !posts.some((p) => String(p.id) === action.id && String(p.authorId ?? "") === mine)) {
          return deny("You can only remove your own post.");
        }
        deletedPostIds = deletedPostIds.includes(action.id) ? deletedPostIds : [...deletedPostIds, action.id];
        posts = posts.filter((p) => String(p.id) !== action.id);
        break;
      }
      case "deleteReply": {
        posts = posts.map((p) => {
          if (String(p.id) !== action.postId) return p;
          const thread = asArray<Record<string, unknown>>(p.thread).filter((r) => {
            if (String(r.id) !== action.replyId) return true;
            if (admin || String(r.authorId ?? "") === mine) return false;
            return true;
          });
          return { ...p, thread };
        });
        break;
      }
      case "submitEvent": {
        const event: Record<string, unknown> = {
          ...(action.event as Record<string, unknown>),
          status: "pending",
          postedBy: mine,
        };
        if (!events.some((e) => String(e.id) === String(event.id))) events = [event, ...events];
        if (action.notice && !notices.some((n) => n.id === action.notice!.id)) {
          notices = [{ ...action.notice, status: "pending" }, ...notices];
        }
        break;
      }
      case "deleteEvent": {
        if (!admin) return deny("Desk only.");
        events = events.filter((e) => String(e.id) !== action.id);
        break;
      }
      case "submitEnquiry": {
        if (!notices.some((n) => n.id === action.notice.id)) notices = [action.notice, ...notices];
        break;
      }
      case "resolveNotice": {
        if (!admin) return deny("Desk only.");
        const notice = notices.find((n) => String(n.id) === action.id);
        notices = notices.map((n) => (String(n.id) === action.id ? { ...n, status: action.status } : n));
        if (notice && action.status === "approved") {
          if ((notice.kind === "verify" || notice.kind === "label") && notice.refId) {
            artists = artists.map((a) => {
              if (String(a.id) !== String(notice.refId)) return a;
              if (notice.kind === "verify") return { ...a, verified: true };
              return { ...a, label: ISR_LABEL, labelApproved: true };
            });
          }
          if (notice.kind === "song" && notice.refId) {
            artists = artists.map((a) => ({
              ...a,
              songs: asArray<Record<string, unknown>>(a.songs).map((s) =>
                String(s.id) === String(notice.refId) ? { ...s, status: "approved" } : s,
              ),
            }));
          }
          if (notice.kind === "event" && notice.refId) {
            events = events.map((e) => (String(e.id) === String(notice.refId) ? { ...e, status: "approved" } : e));
          }
        }
        if (notice && action.status === "declined") {
          if (notice.kind === "song" && notice.refId) {
            artists = artists.map((a) => ({
              ...a,
              songs: asArray<Record<string, unknown>>(a.songs).map((s) =>
                String(s.id) === String(notice.refId) ? { ...s, status: "declined" } : s,
              ),
            }));
          }
          if (notice.kind === "event" && notice.refId) {
            events = events.map((e) => (String(e.id) === String(notice.refId) ? { ...e, status: "declined" } : e));
          }
        }
        break;
      }
      case "deleteArtist": {
        if (!admin) return deny("Desk only.");
        deletedArtistIds = deletedArtistIds.includes(action.artistId)
          ? deletedArtistIds
          : [...deletedArtistIds, action.artistId];
        artists = artists.filter((a) => String(a.id) !== action.artistId);
        accounts = accounts.map((a) =>
          String(a.artistId ?? "") === action.artistId
            ? { ...a, artistId: undefined, kind: a.kind === "artist" ? "explorer" : a.kind }
            : a,
        );
        break;
      }
      case "banUser": {
        if (!admin) return deny("Desk only.");
        if (!bannedUserIds.includes(action.accountId)) bannedUserIds = [...bannedUserIds, action.accountId];
        accounts = accounts.filter((a) => String(a.id) !== action.accountId);
        break;
      }
      case "setAccountKind": {
        if (!admin) return deny("Desk only.");
        accounts = accounts.map((a) =>
          String(a.id) === action.accountId && a.kind !== "admin" ? { ...a, kind: action.kind } : a,
        );
        break;
      }
      case "addSong": {
        if (!ownPage(action.artistId)) return deny("Songs can only be added to your own page.");
        const song: Record<string, unknown> = { ...(action.song as Record<string, unknown>), status: "pending" };
        artists = artists.map((a) => {
          if (String(a.id) !== action.artistId) return a;
          const songs = asArray<Record<string, unknown>>(a.songs);
          if (songs.some((s) => String(s.id) === String(song.id))) return a;
          return { ...a, songs: [song, ...songs] };
        });
        if (action.notice && !notices.some((n) => n.id === action.notice!.id)) {
          notices = [{ ...action.notice, status: "pending", kind: "song" }, ...notices];
        }
        break;
      }
      case "recordPlay": {
        let found = false;
        artists = artists.map((a) => {
          if (String(a.id) !== action.artistId) return a;
          return {
            ...a,
            songs: asArray<Record<string, unknown>>(a.songs).map((s) => {
              if (String(s.id) !== action.songId) return s;
              found = true;
              const next = parsePlays(String(s.plays ?? "0")) + 1;
              return { ...s, plays: formatPlays(next) };
            }),
          };
        });
        if (!found) return deny("Track not found.");
        break;
      }
      case "patchSong": {
        if (!admin && !ownPage(action.artistId)) return deny("That artist page is not yours.");
        const patch = pickSongPatch((action.patch ?? {}) as Record<string, unknown>);
        artists = artists.map((a) => {
          if (String(a.id) !== action.artistId) return a;
          return {
            ...a,
            songs: asArray<Record<string, unknown>>(a.songs).map((s) =>
              String(s.id) === action.songId ? { ...s, ...patch } : s,
            ),
          };
        });
        break;
      }
      case "deleteSong": {
        if (!admin && myArtist !== action.artistId) return deny("That artist page is not yours.");
        artists = artists.map((a) => {
          if (String(a.id) !== action.artistId) return a;
          return { ...a, songs: asArray<Record<string, unknown>>(a.songs).filter((s) => String(s.id) !== action.songId) };
        });
        notices = notices.filter((n) => !(n.kind === "song" && String(n.refId ?? "") === action.songId));
        break;
      }
      case "addArtist": {
        const incoming = action.artist as Record<string, unknown>;
        if (!incoming?.id) return deny("Missing artist.");
        if (!admin && String(incoming.id) !== myArtist) return deny("You can only create your own page.");
        const artist: Record<string, unknown> = {
          ...incoming,
          verified: false,
          labelApproved: false,
          songs: asArray<Record<string, unknown>>(incoming.songs).map((s) => ({ ...s, status: "pending" })),
        };
        if (!artists.some((a) => String(a.id) === String(artist.id))) artists = [...artists, artist];
        if (action.notice && !notices.some((n) => n.id === action.notice!.id)) {
          notices = [{ ...action.notice, status: "pending" }, ...notices];
        }
        break;
      }
      case "patchMe": {
        accounts = accounts.map((a) => {
          if (String(a.id) !== mine) return a;
          const next = { ...a };
          if (action.locale) next.locale = action.locale;
          if (action.bio !== undefined) next.bio = action.bio;
          if (action.location !== undefined) next.location = action.location;
          if (action.email !== undefined) next.email = action.email;
          if (action.whatsapp !== undefined) next.whatsapp = action.whatsapp;
          if (action.name !== undefined) next.name = action.name;
          if (action.photo !== undefined) next.photo = action.photo;
          if (action.acceptedUploadTerms !== undefined) next.acceptedUploadTerms = action.acceptedUploadTerms;
          return next;
        });
        if (action.photo && myArtist) {
          artists = artists.map((a) => (String(a.id) === myArtist ? { ...a, photo: action.photo } : a));
        }
        break;
      }
      case "patchProfile": {
        if (!ownPage(action.artistId) && !admin) return deny("That artist page is not yours.");
        if (admin && !ownPage(action.artistId)) return deny("Edit another artist from the Desk queue, not by replacing their page.");
        const artistPatch = pickArtistPatch((action.artist ?? {}) as Record<string, unknown>);
        artists = artists.map((a) => (String(a.id) === action.artistId ? { ...a, ...artistPatch } : a));
        accounts = accounts.map((a) => {
          if (String(a.id) !== mine) return a;
          const acc = (action.account ?? {}) as Record<string, unknown>;
          const next: Record<string, unknown> = { ...a, password: a.password };
          if (typeof acc.bio === "string") next.bio = acc.bio;
          if (typeof acc.location === "string") next.location = acc.location;
          if (typeof acc.email === "string") next.email = acc.email;
          if (typeof acc.whatsapp === "string") next.whatsapp = acc.whatsapp;
          if (typeof acc.name === "string") next.name = acc.name;
          if (typeof acc.photo === "string") next.photo = acc.photo;
          return next;
        });
        break;
      }
      default:
        return deny("Unknown action.");
    }

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
        JSON.stringify(artists),
        JSON.stringify(accounts),
        JSON.stringify(events),
        JSON.stringify(posts),
        JSON.stringify(notices),
        JSON.stringify(deletedPostIds),
        JSON.stringify(deletedArtistIds),
        JSON.stringify(bannedUserIds),
      ],
    );
    return { ok: true };
  });
