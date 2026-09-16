import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ISR_LABEL, claimsISR } from "@/lib/data";

const STUDIO_ID = "indie-dream";

function parseArray<T>(value: unknown): T[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function slugId(raw: string) {
  return raw.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "user";
}

function asR2Audio(value?: string) {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("r2:")) return raw;
  if (raw.startsWith("tracks/")) return `r2:${raw}`;
  return raw;
}

export const saveMyProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().optional(),
      role: z.string().optional(),
      location: z.enum(["HK Island", "Kowloon", "New Territories"]).optional(),
      city: z.string().optional(),
      bio: z.string().optional(),
      email: z.string().optional(),
      whatsapp: z.string().optional(),
      photo: z.string().optional(),
      genres: z.array(z.string()).optional(),
      label: z.string().optional(),
      spotify: z.string().optional(),
      youtube: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sessionMod = await import("@/lib/cue-session.server");
    const session = await sessionMod.readCueSession();
    if (!session) return { ok: false as const, error: "Log in first." };
    const email = data.email?.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false as const, error: "Enter a valid email." };
    }

    const { withStudioTx } = await import("@/lib/db");
    return withStudioTx(async (tx) => {
    const rows = await tx.query<{ accounts: unknown; artists: unknown }>(
      `select accounts, artists from cue_studio where id = $1`,
      [STUDIO_ID],
    );
    const accounts = parseArray<Record<string, unknown>>(rows[0]?.accounts);
    const artists = parseArray<Record<string, unknown>>(rows[0]?.artists);
    const idx = accounts.findIndex((a) => String(a.id) === session.accountId);
    if (idx < 0) return { ok: false as const, error: "Account not found." };

    const acc = { ...accounts[idx] };
    if (data.name !== undefined) acc.name = data.name.trim() || acc.name;
    if (data.role !== undefined) acc.role = data.role.trim() || acc.role;
    if (data.location !== undefined) acc.location = data.location;
    if (data.bio !== undefined) acc.bio = data.bio;
    if (email) acc.email = email;
    if (data.whatsapp !== undefined) acc.whatsapp = data.whatsapp.trim();
    if (data.photo !== undefined) acc.photo = data.photo;

    const canHaveArtist = acc.kind === "artist" || acc.kind === "admin";
    let artistId = acc.artistId ? String(acc.artistId) : "";
    if (!artistId && canHaveArtist) {
      artistId = `art-${slugId(String(acc.username || acc.id))}`;
      acc.artistId = artistId;
    }
    accounts[idx] = acc;

    if (artistId) {
      const ai = artists.findIndex((a) => String(a.id) === artistId);
      const art: Record<string, unknown> =
        ai >= 0
          ? { ...artists[ai] }
          : {
              id: artistId,
              name: acc.name,
              role: acc.role || "Artist",
              city: data.city?.trim() || data.location || acc.location || "HK Island",
              area: data.location || acc.location || "HK Island",
              photo: acc.photo || "/media/user.jpg",
              genres: data.genres?.length ? data.genres : ["Indie"],
              bio: acc.bio || "",
              songs: [],
              label: "",
              labelApproved: false,
              verified: acc.kind === "admin",
            };
      if (data.name !== undefined) art.name = data.name.trim() || art.name;
      if (data.role !== undefined) art.role = data.role.trim() || art.role;
      if (data.location !== undefined) {
        art.area = data.location;
        art.city = data.city?.trim() || data.location;
      } else if (data.city !== undefined) {
        art.city = data.city.trim() || art.city;
      }
      if (data.bio !== undefined) art.bio = data.bio;
      if (data.photo !== undefined) art.photo = data.photo;
      if (data.genres?.length) art.genres = data.genres;
      if (data.label !== undefined) {
        const typed = data.label.trim();
        if (claimsISR(typed)) {
          if (art.labelApproved) art.label = ISR_LABEL;
        } else {
          art.label = typed;
        }
      }
      if (data.spotify !== undefined) art.spotify = data.spotify.trim() || undefined;
      if (data.youtube !== undefined) art.youtube = data.youtube.trim() || undefined;
      if (!Array.isArray(art.songs)) art.songs = [];
      if (ai >= 0) artists[ai] = art;
      else artists.push(art);
    }

    await tx.query(
      `insert into cue_studio (id, accounts, artists, updated_at)
       values ($1, $2::jsonb, $3::jsonb, now())
       on conflict (id) do update set
         accounts = excluded.accounts,
         artists = excluded.artists,
         updated_at = now()`,
      [STUDIO_ID, JSON.stringify(accounts), JSON.stringify(artists)],
    );
    await sessionMod.writeStudioAccounts(tx, accounts as Parameters<typeof sessionMod.writeStudioAccounts>[1]);
    return { ok: true as const };
    });
  });

export const grantArtistIsr = createServerFn({ method: "POST" })
  .validator(z.object({ artistId: z.string().min(1), on: z.boolean() }))
  .handler(async ({ data }) => {
    const sessionMod = await import("@/lib/cue-session.server");
    const session = await sessionMod.readCueSession();
    if (!session || session.kind !== "admin") return { ok: false as const, error: "Desk only." };
    const { withStudioTx } = await import("@/lib/db");
    return withStudioTx(async (sql) => {
    const rows = await sql.query<{ artists: unknown }>(`select artists from cue_studio where id = $1`, [STUDIO_ID]);
    const artists = parseArray<Record<string, unknown>>(rows[0]?.artists);
    const next = artists.map((a) => {
      if (String(a.id) !== data.artistId) return a;
      if (data.on) return { ...a, label: ISR_LABEL, labelApproved: true };
      const prev = String(a.label ?? "");
      return {
        ...a,
        labelApproved: false,
        label: claimsISR(prev) ? "" : prev,
      };
    });
    await sql.query(
      `insert into cue_studio (id, artists, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (id) do update set artists = excluded.artists, updated_at = now()`,
      [STUDIO_ID, JSON.stringify(next)],
    );
    return { ok: true as const };
    });
  });

export const saveMySong = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      cover: z.string().optional(),
      spotify: z.string().optional(),
      youtube: z.string().optional(),
      lyrics: z.string().optional(),
      audioUrl: z.string().optional(),
      duration: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sessionMod = await import("@/lib/cue-session.server");
    const session = await sessionMod.readCueSession();
    if (!session) return { ok: false as const, error: "Log in first." };
    if (session.kind !== "artist" && session.kind !== "admin") {
      return { ok: false as const, error: "Only artists can upload songs." };
    }

    const { withStudioTx } = await import("@/lib/db");
    return withStudioTx(async (sql) => {
    const rows = await sql.query<{ accounts: unknown; artists: unknown }>(
      `select accounts, artists from cue_studio where id = $1`,
      [STUDIO_ID],
    );
    const accounts = parseArray<Record<string, unknown>>(rows[0]?.accounts);
    const artists = parseArray<Record<string, unknown>>(rows[0]?.artists);
    const acc = accounts.find((a) => String(a.id) === session.accountId);
    if (!acc) return { ok: false as const, error: "Account not found." };

    let artistId = acc.artistId ? String(acc.artistId) : "";
    if (!artistId) {
      artistId = `art-${slugId(String(acc.username || acc.id))}`;
      acc.artistId = artistId;
    }

    let ai = artists.findIndex((a) => String(a.id) === artistId);
    if (ai < 0) {
      artists.push({
        id: artistId,
        name: acc.name,
        role: acc.role || "Artist",
        city: acc.location || "HK Island",
        area: acc.location || "HK Island",
        photo: acc.photo || "/media/user.jpg",
        genres: ["Indie"],
        bio: acc.bio || "",
        songs: [],
        label: "",
        labelApproved: false,
        verified: false,
      });
      ai = artists.length - 1;
    }

    const art = { ...artists[ai] };
    if (String(art.id) !== String(acc.artistId)) {
      return { ok: false as const, error: "Songs can only be added to your own page." };
    }
    const songs = parseArray<Record<string, unknown>>(art.songs);
    const live = session.kind === "admin";
    const clock = (data.duration || "").trim();
    const lyricsIn = data.lyrics?.trim() || "";
    const song = {
      id: data.id,
      title: data.title.trim(),
      duration: clock && clock !== "—" ? clock : "—",
      plays: "0",
      cover: data.cover || "/media/covers/vinyl.jpg",
      uploadedAt: new Date().toISOString(),
      status: live ? "approved" : "pending",
      lyrics: lyricsIn || undefined,
      spotify: data.spotify?.trim() || undefined,
      youtube: data.youtube?.trim() || undefined,
      audioUrl: asR2Audio(data.audioUrl),
    };
    const si = songs.findIndex((s) => String(s.id) === data.id);
    if (si >= 0) {
      const prev = songs[si];
      songs[si] = {
        ...prev,
        ...song,
        status: live
          ? "approved"
          : prev.status === "approved" || prev.status === "declined"
            ? prev.status
            : "pending",
        uploadedAt: prev.uploadedAt || song.uploadedAt,
        duration: clock && clock !== "—" ? clock : String(prev.duration ?? "—"),
        plays: prev.plays ?? "0",
        lyrics: lyricsIn || prev.lyrics,
      };
    } else songs.unshift(song);
    art.songs = songs;
    if (live) art.verified = true;
    artists[ai] = art;

    await sql.query(
      `insert into cue_studio (id, accounts, artists, updated_at)
       values ($1, $2::jsonb, $3::jsonb, now())
       on conflict (id) do update set
         accounts = excluded.accounts,
         artists = excluded.artists,
         updated_at = now()`,
      [STUDIO_ID, JSON.stringify(accounts), JSON.stringify(artists)],
    );
    return { ok: true as const };
    });
  });
