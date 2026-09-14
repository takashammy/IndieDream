import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mp3Filename } from "@/lib/audio-limits";

export function coverImage(cover?: string) {
  return (cover ?? "").split("#r2=")[0] || "/media/covers/vinyl.jpg";
}

export function r2KeyFromCover(cover?: string) {
  const raw = (cover ?? "").split("#r2=")[1];
  return raw ? decodeURIComponent(raw) : null;
}

export function withR2Cover(cover: string | undefined, key: string) {
  return `${coverImage(cover)}#r2=${encodeURIComponent(key)}`;
}

export const requestTrackPlay = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      const { r2Configured, presign, assertTrackKey } = await import("@/lib/r2.server");
      if (!r2Configured()) return { ok: false as const, error: "R2 is not configured on the server." };
      const signed = await presign("GET", assertTrackKey(data.key), undefined, 3600);
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
    const filename = mp3Filename(file);
    const signed = await requestTrackUpload({
      data: { artistId, filename },
    });
    if (!signed.ok) return signed;
    try {
      const direct = await fetch(signed.url, {
        method: "PUT",
        headers: { "Content-Type": "audio/mpeg" },
        body: file,
      });
      if (direct.ok) return { ok: true as const, key: signed.key };
    } catch {
      /* CORS or network — store through the app instead */
    }
    const res = await fetch(
      `/api/track-upload?artistId=${encodeURIComponent(artistId)}&filename=${encodeURIComponent(filename)}`,
      { method: "POST", headers: { "Content-Type": "audio/mpeg" }, body: file },
    );
    const json = (await res.json()) as { ok?: boolean; key?: string; error?: string };
    if (json.ok && json.key) return { ok: true as const, key: json.key };
    return { ok: false as const, error: json.error || "Could not store the MP3." };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? `Upload did not reach storage: ${err.message}` : "Upload did not reach storage.",
    };
  }
}
