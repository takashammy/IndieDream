import { putObject, r2Configured, safeTrackKey } from "@/lib/r2.server";

export async function handleTrackUpload(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const artistId = url.searchParams.get("artistId")?.trim() || "";
  const filename = url.searchParams.get("filename")?.trim() || "track.mp3";
  const json = (status: number, body: { ok: false; error: string } | { ok: true; key: string }) =>
    Response.json(body, { status });

  if (!artistId) return json(400, { ok: false, error: "Missing artist." });
  if (!/\.mp3$/i.test(filename)) return json(400, { ok: false, error: "MP3 files only." });

  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length) return json(400, { ok: false, error: "Empty MP3 file." });
  if (buf.length > 5 * 1024 * 1024) return json(413, { ok: false, error: "File is over 5 MB." });

  if (!r2Configured()) return json(500, { ok: false, error: "R2 is not configured on the server." });
  try {
    const key = await putObject(safeTrackKey(artistId, filename), buf, "audio/mpeg");
    return json(200, { ok: true, key });
  } catch (err) {
    return json(500, { ok: false, error: err instanceof Error ? err.message : "Server could not store the track." });
  }
}
