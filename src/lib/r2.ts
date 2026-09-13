import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

export const uploadTrackBytes = createServerFn({ method: "POST" })
  .validator(
    z.object({
      artistId: z.string().min(1),
      filename: z.string().min(1),
      contentType: z.string().optional(),
      base64: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const { r2Configured, putObject, safeTrackKey } = await import("@/lib/r2.server");
      if (!r2Configured()) return { ok: false as const, error: "R2 is not configured on the server." };
      const raw = Buffer.from(data.base64, "base64");
      if (!raw.length) return { ok: false as const, error: "Empty audio file." };
      if (raw.length > 5 * 1024 * 1024) return { ok: false as const, error: "File is over 5 MB." };
      const key = safeTrackKey(data.artistId, data.filename);
      await putObject(key, raw, data.contentType || "audio/mpeg");
      return { ok: true as const, key };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Server could not store the track." };
    }
  });

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) bin += String.fromCharCode(...bytes.subarray(i, i + step));
  return btoa(bin);
}

export async function putTrackFile(file: File, artistId: string) {
  try {
    const uploaded = await uploadTrackBytes({
      data: {
        artistId,
        filename: file.name,
        contentType: file.type || "audio/mpeg",
        base64: await fileToBase64(file),
      },
    });
    return uploaded;
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? `Sign/upload request failed: ${err.message}` : "Upload did not reach the server.",
    };
  }
}
