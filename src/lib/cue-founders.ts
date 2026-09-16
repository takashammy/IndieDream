import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type Artist, type LocationArea } from "@/lib/data";
import { passwordTooWeak } from "@/lib/pass";
import type { AuthAccount } from "@/lib/cue-auth";

const STUDIO_ID = "indie-dream";

type FounderSpec = {
  username: string;
  name: string;
  email: string;
  password: string;
  artistId: string;
  role: string;
  location: LocationArea;
  city: string;
  photo: string;
  genres: string[];
  bio: string;
  songId: string;
  songTitle: string;
  songDuration: string;
  songCover: string;
  lyrics: string;
};

function asAccount(row: Record<string, unknown>): AuthAccount {
  return {
    id: String(row.id ?? ""),
    username: String(row.username ?? ""),
    kind: (row.kind as AuthAccount["kind"]) || "explorer",
    name: String(row.name ?? ""),
    role: String(row.role ?? ""),
    location: (row.location as LocationArea) || "HK Island",
    bio: String(row.bio ?? ""),
    photo: String(row.photo ?? ""),
    email: String(row.email ?? ""),
    whatsapp: String(row.whatsapp ?? ""),
    artistId: row.artistId ? String(row.artistId) : undefined,
    acceptedUploadTerms: Boolean(row.acceptedUploadTerms) || undefined,
    locale: row.locale === "zh" || row.locale === "en" ? row.locale : undefined,
  };
}

function parseArray<T>(value: unknown): T[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function founderArtist(spec: FounderSpec): Artist {
  return {
    id: spec.artistId,
    name: spec.name,
    role: spec.role,
    city: spec.city,
    area: spec.location,
    photo: spec.photo,
    genres: spec.genres,
    bio: spec.bio,
    label: "",
    labelApproved: false,
    verified: true,
    songs: [
      {
        id: spec.songId,
        title: spec.songTitle,
        duration: spec.songDuration,
        plays: "0",
        cover: spec.songCover,
        uploadedAt: new Date().toISOString(),
        status: "approved",
        lyrics: spec.lyrics,
      },
    ],
  };
}

export const installFounderStaff = createServerFn({ method: "POST" })
  .validator(
    z.object({
      martinEmail: z.string().min(3),
      martinPassword: z.string().min(1),
      sinlamEmail: z.string().min(3),
      sinlamPassword: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const sessionMod = await import("@/lib/cue-session.server");
    const session = await sessionMod.readCueSession();
    sessionMod.requireAdmin(session);

    const martinEmail = data.martinEmail.trim().toLowerCase();
    const sinlamEmail = data.sinlamEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(martinEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sinlamEmail)) {
      return { ok: false as const, error: "Enter a valid email for both accounts." };
    }
    if (martinEmail === sinlamEmail) {
      return { ok: false as const, error: "Use a different email for each person." };
    }
    if (passwordTooWeak(data.martinPassword) || passwordTooWeak(data.sinlamPassword)) {
      return { ok: false as const, error: "Passwords must be at least 8 characters." };
    }

    const founders: FounderSpec[] = [
      {
        username: "martin",
        name: "Martin Sham",
        email: martinEmail,
        password: data.martinPassword,
        artistId: "martin",
        role: "Guitarist / producer",
        location: "HK Island",
        city: "Wan Chai",
        photo: "/media/artists/jun.jpg",
        genres: ["Indie", "Soul"],
        bio: "Runs Inner Soul Records and still writes guitar parts after the office lights go off. Looking after the roster and the room.",
        songId: "martin-1",
        songTitle: "After the Desk Closes",
        songDuration: "3:36",
        songCover: "/media/covers/guitar.jpg",
        lyrics: "The desk goes dark\nthe guitar still knows the room\nHarbour Road is quiet\nso I write until the morning comes through",
      },
      {
        username: "sinlam",
        name: "Sin Lam",
        email: sinlamEmail,
        password: data.sinlamPassword,
        artistId: "sinlam",
        role: "Vocalist",
        location: "Kowloon",
        city: "Sham Shui Po",
        photo: "/media/artists/nia.jpg",
        genres: ["Soul", "Jazz"],
        bio: "Voice first, paperwork second. Inner Soul on weekdays, small rooms on weekends.",
        songId: "sinlam-1",
        songTitle: "Lantern Over Lai Chi Kok",
        songDuration: "4:02",
        songCover: "/media/covers/silk.jpg",
        lyrics: "Lantern over Lai Chi Kok\nvoice first, paperwork later\nI keep a small room warm\nwhile the city gets greater",
      },
    ];

    const sql = await sessionMod.getSqlSafe();
    const rows = await sql.query<{ accounts: unknown; artists: unknown }>(
      `select accounts, artists from cue_studio where id = $1`,
      [STUDIO_ID],
    );
    let accounts = parseArray<Record<string, unknown>>(rows[0]?.accounts);
    let artists = parseArray<Artist>(rows[0]?.artists);

    const created: AuthAccount[] = [];

    for (const spec of founders) {
      const takenByOther = accounts.find(
        (a) =>
          String(a.username ?? "").toLowerCase() !== spec.username &&
          String(a.email ?? "").trim().toLowerCase() === spec.email,
      );
      if (takenByOther) {
        return { ok: false as const, error: `${spec.email} is already used by another account.` };
      }

      const existing = accounts.find((a) => String(a.username ?? "").toLowerCase() === spec.username);
      const hashed = await sessionMod.hashPassword(spec.password);
      if (existing) {
        existing.kind = "admin";
        existing.name = spec.name;
        existing.role = spec.role;
        existing.location = spec.location;
        existing.bio = spec.bio;
        existing.photo = spec.photo;
        existing.email = spec.email;
        existing.artistId = spec.artistId;
        existing.acceptedUploadTerms = true;
        existing.password = hashed;
        created.push(asAccount(existing));
      } else {
        const account = {
          id: `acc-${spec.username}`,
          username: spec.username,
          password: hashed,
          kind: "admin" as const,
          name: spec.name,
          role: spec.role,
          location: spec.location,
          bio: spec.bio,
          photo: spec.photo,
          email: spec.email,
          whatsapp: "",
          artistId: spec.artistId,
          acceptedUploadTerms: true,
        };
        accounts = [...accounts, account];
        created.push(asAccount(account));
      }

      const nextArtist = founderArtist(spec);
      const idx = artists.findIndex((a) => a.id === spec.artistId);
      if (idx >= 0) {
        const prev = artists[idx];
        artists[idx] = {
          ...nextArtist,
          songs: prev.songs?.length ? prev.songs.map((s) => ({ ...s, status: "approved" as const })) : nextArtist.songs,
          photo: prev.photo || nextArtist.photo,
        };
      } else {
        artists = [...artists, nextArtist];
      }
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

    return { ok: true as const, accounts: created };
  });
