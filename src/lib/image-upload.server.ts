import {
  migrateDataUrlToR2,
  putObject,
  r2Configured,
  safeCoverKey,
  safePhotoKey,
} from "@/lib/r2.server";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function looksLikeImage(buf: Uint8Array) {
  if (buf.length < 4) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  return false;
}

function imageContentType(contentType: string, buf: Uint8Array) {
  const type = contentType.split(";")[0]?.trim().toLowerCase() || "";
  if (type === "image/png") return "image/png";
  if (type === "image/jpeg" || type === "image/jpg") return "image/jpeg";
  if (buf[0] === 0x89) return "image/png";
  return "image/jpeg";
}

export async function handleImageUpload(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind")?.trim() || "";
  const accountId = url.searchParams.get("accountId")?.trim() || "";
  const artistId = url.searchParams.get("artistId")?.trim() || "";
  const songId = url.searchParams.get("songId")?.trim() || "";
  const contentType = request.headers.get("content-type") || "image/jpeg";
  const json = (status: number, body: { ok: false; error: string } | { ok: true; key: string }) =>
    Response.json(body, { status });

  const { assertCueSessionSafeRequest } = await import("@/lib/auth/cue-session-guard.server");
  assertCueSessionSafeRequest();
  const sessionMod = await import("@/lib/cue-session.server");
  const session = await sessionMod.readCueSession();
  if (!session) return json(401, { ok: false, error: "Log in first." });

  if (kind === "photo") {
    if (!accountId || accountId !== session.accountId) {
      return json(403, { ok: false, error: "You can only upload your own photo." });
    }
  } else if (kind === "cover") {
    const gate = sessionMod.canUploadToArtist(session, artistId);
    if (!gate.ok) return json(gate.status, { ok: false, error: gate.error });
    if (!songId) return json(400, { ok: false, error: "Song id required for cover art." });
  } else {
    return json(400, { ok: false, error: "Unknown image kind." });
  }

  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length) return json(400, { ok: false, error: "Empty image file." });
  if (buf.length > MAX_IMAGE_BYTES) return json(413, { ok: false, error: "Keep images under 8 MB." });
  if (!looksLikeImage(buf)) return json(400, { ok: false, error: "Images only." });
  if (!r2Configured()) return json(500, { ok: false, error: "R2 is not configured on the server." });

  try {
    const type = imageContentType(contentType, buf);
    const key =
      kind === "photo"
        ? await putObject(safePhotoKey(accountId), buf, type)
        : await putObject(safeCoverKey(artistId, songId), buf, type);
    return json(200, { ok: true, key });
  } catch (err) {
    return json(500, { ok: false, error: err instanceof Error ? err.message : "Server could not store the image." });
  }
}

export async function handleR2ImageGet(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key")?.trim() || "";
  if (!keyParam) return new Response("Missing key", { status: 400 });

  const { assertImageKey, presign, publicImageUrl, r2Configured } = await import("@/lib/r2.server");
  if (!r2Configured()) return new Response("R2 is not configured", { status: 503 });

  try {
    const key = assertImageKey(keyParam);
    const direct = publicImageUrl(key);
    if (direct) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: direct,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }
    const signed = await presign("GET", key, undefined, 86400);
    return new Response(null, {
      status: 302,
      headers: {
        Location: signed.url,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Invalid image key", { status: 400 });
  }
}

export async function maybeMigrateStoredImage(
  value: string | undefined,
  makeKey: () => string,
): Promise<string | undefined> {
  const raw = value?.trim();
  if (!raw || !raw.startsWith("data:image/")) return value;
  try {
    return await migrateDataUrlToR2(raw, makeKey());
  } catch {
    return value;
  }
}
