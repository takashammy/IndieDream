import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ISR_LABEL, claimsISR } from "@/lib/data";

const STUDIO_ID = "indie-dream";

function parseArray<T>(value: unknown): T[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? (parsed as T[]) : [];
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
    if (!session) {
      return { ok: false as const, error: "Log in first." };
    }
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
    accounts[idx] = acc;

    const artistId = acc.artistId ? String(acc.artistId) : "";
    if (artistId) {
      const ai = artists.findIndex((a) => String(a.id) === artistId);
      const labelRaw = data.label?.trim() ?? "";
      const wantsISR = labelRaw ? claimsISR(labelRaw) : false;
      const nextLabel = wantsISR ? ISR_LABEL : labelRaw || "Independent";
      if (ai >= 0) {
        const art = { ...artists[ai] };
        if (data.name !== undefined) art.name = data.name.trim() || art.name;
        if (data.role !== undefined) art.role = data.role.trim() || art.role;
        if (data.location !== undefined) {
          art.area = data.location;
          art.city = data.city?.trim() || data.location;
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
        artists[ai] = art;
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
    return { ok: true as const };
  });
