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

export const requestTrackUpload = createServerFn({ method: "POST" })
  .validator(z.object({ artistId: z.string().min(1), filename: z.string().min(1), contentType: z.string().optional() }))
  .handler(async ({ data }) => {
    try {
      const { r2Configured, presign, safeTrackKey } = await import("@/lib/r2.server");
      if (!r2Configured()) return { ok: false as const, error: "R2 is not configured on the server." };
      const type = data.contentType || "audio/mpeg";
      const key = safeTrackKey(data.artistId, data.filename);
      const signed = await presign("PUT", key, type, 600);
      return { ok: true as const, key: signed.key, uploadUrl: signed.url, contentType: type };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Could not sign the upload." };
    }
  });

export const requestTrackPlay = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      const { r2Configured, presign, assertTrackKey } = await import("@/lib/r2.server");
      if (!r2Configured()) return { ok: false as const, error: "R2 is not configured on the server." };
      const key = assertTrackKey(data.key);
      const signed = await presign("GET", key, undefined, 3600);
      return { ok: true as const, url: signed.url };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Could not sign playback." };
    }
  });

export async function putTrackFile(file: File, artistId: string) {
  try {
    const signed = await requestTrackUpload({
      data: { artistId, filename: file.name, contentType: file.type || "audio/mpeg" },
    });
    if (!signed.ok) return signed;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 25000);
    let put: Response;
    try {
      put = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": signed.contentType },
        body: file,
        signal: ctrl.signal,
      });
    } finally {
      window.clearTimeout(timer);
    }
    if (!put.ok) {
      return {
        ok: false as const,
        error: `Upload failed (${put.status}). Replace the bucket CORS with the JSON I sent, then try again.`,
      };
    }
    return { ok: true as const, key: signed.key };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return {
      ok: false as const,
      error: aborted
        ? "Upload timed out. R2 CORS is blocking the browser PUT — paste the updated CORS JSON, save, then retry."
        : err instanceof Error
          ? err.message
          : "Upload did not reach R2.",
    };
  }
}
