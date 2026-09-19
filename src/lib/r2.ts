import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { inspectAudioFile, mp3Filename } from "@/lib/audio-limits";

function stripLegacyCoverSuffix(value: string) {
  return value.split("#r2=")[0] ?? value;
}

function r2KeyFromRef(value?: string): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("r2:")) return raw.slice(3).split("?")[0]?.split("#")[0] ?? null;
  if (raw.startsWith("photos/") || raw.startsWith("covers/")) return raw.split("?")[0]?.split("#")[0] ?? raw;
  return null;
}

function imageServeUrl(key: string) {
  return `/api/r2-image?key=${encodeURIComponent(key)}`;
}

function resolveStoredImage(value: string | undefined, fallback: string) {
  const raw = (value ?? "").trim();
  if (!raw) return fallback;
  const legacy = stripLegacyCoverSuffix(raw);
  if (legacy.startsWith("data:") || legacy.startsWith("/")) return legacy || fallback;
  const key = r2KeyFromRef(raw);
  if (key?.startsWith("photos/") || key?.startsWith("covers/")) return imageServeUrl(key);
  return legacy || fallback;
}

export function coverImage(cover?: string) {
  return resolveStoredImage(cover, "/media/covers/vinyl.jpg");
}

export function photoImage(photo?: string) {
  return resolveStoredImage(photo, "/media/user.jpg");
}

export function r2KeyFromCover(cover?: string) {
  const legacy = (cover ?? "").split("#r2=")[1];
  return legacy ? decodeURIComponent(legacy) : null;
}

export function asR2Image(value?: string) {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (raw.startsWith("r2:")) return raw;
  if (raw.startsWith("photos/") || raw.startsWith("covers/")) return `r2:${raw}`;
  return raw;
}

/** @deprecated Legacy cover+audio coupling — prefer `r2:covers/...` plus `audioUrl`. */
export function withR2Cover(cover: string | undefined, key: string) {
  return `${coverImage(cover)}#r2=${encodeURIComponent(key)}`;
}

export type ImageUploadTarget =
  | { kind: "photo"; accountId: string }
  | { kind: "cover"; artistId: string; songId: string };

export async function putImageBlob(blob: Blob, target: ImageUploadTarget) {
  try {
    const contentType = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    const qs =
      target.kind === "photo"
        ? `kind=photo&accountId=${encodeURIComponent(target.accountId)}`
        : `kind=cover&artistId=${encodeURIComponent(target.artistId)}&songId=${encodeURIComponent(target.songId)}`;
    const res = await fetch(`/api/image-upload?${qs}`, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    const json = (await res.json()) as { ok?: boolean; key?: string; error?: string };
    if (json.ok && json.key) return { ok: true as const, key: json.key };
    return { ok: false as const, error: json.error || "Could not store the image." };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not store the image.",
    };
  }
}

export async function uploadCoverFromDraft(cover: string | null | undefined, artistId: string, songId: string) {
  const raw = (cover ?? "").trim();
  if (!raw || !raw.startsWith("data:image/")) return asR2Image(raw || undefined) ?? "/media/covers/vinyl.jpg";
  const blob = await dataUrlToBlob(raw);
  const put = await putImageBlob(blob, { kind: "cover", artistId, songId });
  if (!put.ok) throw new Error(put.error);
  return `r2:${put.key}`;
}

async function dataUrlToBlob(dataUrl: string) {
  const res = await fetch(dataUrl);
  return res.blob();
}

function trackKeyFromAudioUrl(audioUrl?: string): string | null {
  const raw = (audioUrl ?? "").trim();
  if (!raw) return null;
  let key = raw.startsWith("r2:") ? raw.slice(3) : raw;
  if (!key.startsWith("tracks/")) return null;
  key = key.split("?")[0]?.split("#")[0] ?? key;
  return key;
}

export const requestTrackPlay = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      const { assertCueSessionSafeRequest } = await import("@/lib/auth/cue-session-guard.server");
      assertCueSessionSafeRequest();
      const sessionMod = await import("@/lib/cue-session.server");
      const session = await sessionMod.readCueSession();
      if (!session) return { ok: false as const, error: "Log in to play tracks." };

      const { r2Configured, presign, assertTrackKey } = await import("@/lib/r2.server");
      if (!r2Configured()) return { ok: false as const, error: "R2 is not configured on the server." };
      const trackKey = assertTrackKey(data.key);

      const sql = await sessionMod.getSqlSafe();
      const rows = await sql.query<{ artists: unknown }>(
        `select artists from cue_studio where id = $1`,
        ["indie-dream"],
      );
      const artists = rows[0]?.artists;
      const list = Array.isArray(artists)
        ? artists
        : typeof artists === "string"
          ? (JSON.parse(artists) as unknown[])
          : [];

      let matched: { status: string; artistId: string } | null = null;
      for (const artist of list) {
        if (!artist || typeof artist !== "object") continue;
        const record = artist as Record<string, unknown>;
        const songs = Array.isArray(record.songs) ? record.songs : [];
        for (const song of songs) {
          if (!song || typeof song !== "object") continue;
          const s = song as Record<string, unknown>;
          if (trackKeyFromAudioUrl(String(s.audioUrl ?? "")) !== trackKey) continue;
          matched = {
            status: String(s.status ?? ""),
            artistId: String(record.id ?? ""),
          };
          break;
        }
        if (matched) break;
      }
      if (!matched) {
        return { ok: false as const, error: "Track not found or not available to play." };
      }
      const ownsPage =
        session.account.artistId != null &&
        String(session.account.artistId) === matched.artistId;
      if (
        session.kind !== "admin" &&
        matched.status !== "approved" &&
        !ownsPage
      ) {
        return { ok: false as const, error: "This track is not available to play." };
      }

      const signed = await presign("GET", trackKey, undefined, 900);
      return { ok: true as const, url: signed.url };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Could not sign playback." };
    }
  });

export const requestTrackUpload = createServerFn({ method: "POST" })
  .validator(
    z.object({
      artistId: z.string().min(1),
      filename: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const { assertCueSessionSafeRequest } = await import("@/lib/auth/cue-session-guard.server");
      assertCueSessionSafeRequest();
      const sessionMod = await import("@/lib/cue-session.server");
      const session = await sessionMod.readCueSession();
      const gate = sessionMod.canUploadToArtist(session, data.artistId);
      if (!gate.ok) return { ok: false as const, error: gate.error };
      const { r2Configured, presign, safeTrackKey, ensureUploadCors } = await import("@/lib/r2.server");
      if (!r2Configured()) return { ok: false as const, error: "R2 is not configured on the server." };
      if (!/\.mp3$/i.test(data.filename)) return { ok: false as const, error: "MP3 files only." };
      await ensureUploadCors().catch(() => undefined);
      const key = safeTrackKey(data.artistId, data.filename);
      const signed = await presign("PUT", key, "audio/mpeg", 600);
      return { ok: true as const, url: signed.url, key };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Could not start the upload." };
    }
  });

export async function putTrackFile(file: File, artistId: string) {
  try {
    const check = await inspectAudioFile(file);
    if (!check.ok) return { ok: false as const, error: check.reasons[0] || "MP3 files only, 5 MB max." };
    const filename = mp3Filename(file);
    const res = await fetch(
      `/api/track-upload?artistId=${encodeURIComponent(artistId)}&filename=${encodeURIComponent(filename)}`,
      { method: "POST", headers: { "Content-Type": "audio/mpeg" }, body: file },
    );
    if (res.ok) {
      const json = (await res.json()) as { ok?: boolean; key?: string; error?: string };
      if (json.ok && json.key) return { ok: true as const, key: json.key };
      if (json.error) return { ok: false as const, error: json.error };
    }
    const signed = await requestTrackUpload({ data: { artistId, filename } });
    if (!signed.ok) return { ok: false as const, error: signed.error || "Could not store the MP3." };
    try {
      const direct = await fetch(signed.url, {
        method: "PUT",
        headers: { "Content-Type": "audio/mpeg" },
        body: file,
      });
      if (direct.ok) return { ok: true as const, key: signed.key };
    } catch {
      /* CORS */
    }
    return { ok: false as const, error: "Could not store the MP3." };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? `Upload did not reach storage: ${err.message}` : "Upload did not reach storage.",
    };
  }
}
