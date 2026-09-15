import { putObject, r2Configured, safeTrackKey } from "@/lib/r2.server";
import { MAX_AUDIO_BYTES } from "@/lib/audio-limits";

function looksLikeMp3(buf: Uint8Array) {
  if (buf.length < 3) return false;
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  return buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
}

export async function handleTrackUpload(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const artistId = url.searchParams.get("artistId")?.trim() || "";
  const filename = url.searchParams.get("filename")?.trim() || "track.mp3";
  const json = (status: number, body: { ok: false; error: string } | { ok: true; key: string }) =>
    Response.json(body, { status });

  const sessionMod = await import("@/lib/cue-session.server");
  const session = await sessionMod.readCueSession();
  if (!session) return json(401, { ok: false, error: "Log in first." });
  const mine = session.account.artistId ? String(session.account.artistId) : "";
  if (!artistId) return json(400, { ok: false, error: "Missing artist." });
  if (session.kind !== "admin" && mine && mine !== artistId) {
    return json(403, { ok: false, error: "That artist page is not yours." });
  }
  if (!/\.mp3$/i.test(filename)) return json(400, { ok: false, error: "MP3 files only." });

  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length) return json(400, { ok: false, error: "Empty MP3 file." });
  if (buf.length > MAX_AUDIO_BYTES) return json(413, { ok: false, error: "File is over 5 MB." });
  if (!looksLikeMp3(buf)) return json(400, { ok: false, error: "MP3 files only." });

  if (!r2Configured()) return json(500, { ok: false, error: "R2 is not configured on the server." });
  try {
    const key = await putObject(safeTrackKey(artistId, filename), buf, "audio/mpeg");
    return json(200, { ok: true, key });
  } catch (err) {
    return json(500, { ok: false, error: err instanceof Error ? err.message : "Server could not store the track." });
  }
}
