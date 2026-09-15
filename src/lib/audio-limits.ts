export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

/** MP3 only. Broader `audio/*` picks let through files we then reject. */
export const AUDIO_PICK_ACCEPT = ".mp3,audio/mpeg";

export type AudioCheck = {
  ok: boolean;
  reasons: string[];
  bytes: number;
};

export function mp3Filename(file: File) {
  const raw = (file.name || "track").trim() || "track";
  return /\.mp3$/i.test(raw) ? raw : `${raw.replace(/\.[^.]+$/, "") || "track"}.mp3`;
}

function namedOrTypedMp3(file: File) {
  if (/\.mp3$/i.test(file.name || "")) return true;
  const type = (file.type || "").toLowerCase();
  return type === "audio/mpeg" || type === "audio/mp3" || type === "audio/x-mpeg" || type === "audio/x-mp3";
}

function namedNonMp3(file: File) {
  return /\.(m4a|aac|wav|flac|ogg|oga|aiff|aif|wma|caf|amr)$/i.test(file.name || "");
}

async function headerLooksLikeMp3(file: File) {
  try {
    const head = new Uint8Array(await file.slice(0, 3).arrayBuffer());
    if (head.length < 2) return false;
    if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) return true;
    return head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
  } catch {
    return false;
  }
}

export async function inspectAudioFile(file: File): Promise<AudioCheck> {
  const reasons: string[] = [];
  const mp3 = namedOrTypedMp3(file) || (!namedNonMp3(file) && (await headerLooksLikeMp3(file)));
  if (!mp3) {
    reasons.push("MP3 files only. Export or convert the track to MP3 first.");
  }
  if (file.size > MAX_AUDIO_BYTES) {
    const mb = file.size / (1024 * 1024);
    reasons.push(`This file is ${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB. The limit is 5 MB.`);
  }
  return { ok: reasons.length === 0, reasons, bytes: file.size };
}

export function audioLimitCopy() {
  return "MP3 only, 5 MB max.";
}
