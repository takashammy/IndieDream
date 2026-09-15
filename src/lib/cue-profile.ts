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

    const sql = await sessionMod.getSqlSafe();
    const rows = await sql.query<{ accounts: unknown; artists: unknown }>(
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
      const labelRaw = data.label?.trim() ?? "";
      const wantsISR = labelRaw ? claimsISR(labelRaw) : false;
      const nextLabel = wantsISR ? ISR_LABEL : labelRaw || "Independent";
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
              label: nextLabel,
              labelApproved: acc.kind === "admin" && wantsISR,
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
        art.label = nextLabel;
        if (!wantsISR) art.labelApproved = false;
      }
      if (data.spotify !== undefined) art.spotify = data.spotify.trim() || undefined;
      if (data.youtube !== undefined) art.youtube = data.youtube.trim() || undefined;
      if (!Array.isArray(art.songs)) art.songs = [];
      if (ai >= 0) artists[ai] = art;
      else artists.push(art);
    }

    await sql.query(
      `insert into cue_studio (id, accounts, artists, updated_at)
       values ($1, $2::jsonb, $3::jsonb, now())
       on conflict (id) do update set
         accounts = excluded.accounts,
         artists = excluded.artists,
         updated_at = now()`,
      [STUDIO_ID, JSON.stringify(accounts), JSON.stringify(artists)],
    );
    await sessionMod.writeStudioAccounts(sql, accounts as Parameters<typeof sessionMod.writeStudioAccounts>[1]);
    return { ok: true as const };
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
      status: z.enum(["approved", "pending", "declined"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sessionMod = await import("@/lib/cue-session.server");
    const session = await sessionMod.readCueSession();
    if (!session) return { ok: false as const, error: "Log in first." };

    const sql = await sessionMod.getSqlSafe();
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
        label: "Independent",
        labelApproved: acc.kind === "admin",
        verified: acc.kind === "admin",
      });
      ai = artists.length - 1;
    }

    const art = { ...artists[ai] };
    const songs = parseArray<Record<string, unknown>>(art.songs);
    const live = acc.kind === "admin";
    const song = {
      id: data.id,
      title: data.title.trim(),
      duration: "—",
      plays: "0",
      cover: data.cover || "/media/covers/vinyl.jpg",
      uploadedAt: new Date().toISOString(),
      status: data.status ?? (live ? "approved" : "pending"),
      lyrics: data.lyrics?.trim() || undefined,
      spotify: data.spotify?.trim() || undefined,
      youtube: data.youtube?.trim() || undefined,
      audioUrl: data.audioUrl?.trim() || undefined,
    };
    const si = songs.findIndex((s) => String(s.id) === data.id);
    if (si >= 0) songs[si] = { ...songs[si], ...song };
    else songs.unshift(song);
    art.songs = songs;
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
