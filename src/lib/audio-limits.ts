export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

/** MP3 only. Broader `audio/*` picks let through files we then reject. */
export const AUDIO_PICK_ACCEPT = ".mp3,audio/mpeg";

export type AudioCheck = {
  ok: boolean;
  reasons: string[];
  bytes: number;
  duration: string;
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

export function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const BR_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const BR_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
const SR_V1 = [44100, 48000, 32000];
const SR_V2 = [22050, 24000, 16000];

function id3v2Size(buf: Uint8Array) {
  if (buf.length < 10) return 0;
  if (buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) return 0;
  return 10 + (((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f));
}

function frameAt(buf: Uint8Array, i: number) {
  if (i + 4 > buf.length) return null;
  if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) return null;
  const verBits = (buf[i + 1] >> 3) & 3;
  const layer = (buf[i + 1] >> 1) & 3;
  if (verBits === 1 || layer === 0) return null;
  const brIdx = (buf[i + 2] >> 4) & 0xf;
  const srIdx = (buf[i + 2] >> 2) & 3;
  const padding = (buf[i + 2] >> 1) & 1;
  if (brIdx === 0 || brIdx === 15 || srIdx === 3) return null;
  const mpeg1 = verBits === 3;
  const mpeg25 = verBits === 0;
  const srBase = mpeg1 ? SR_V1[srIdx] : SR_V2[srIdx];
  const sr = mpeg25 ? srBase / 2 : srBase;
  const br = (mpeg1 ? BR_V1_L3[brIdx] : BR_V2_L3[brIdx]) * 1000;
  if (!sr || !br) return null;
  const samples = mpeg1 ? 1152 : 576;
  const size = Math.floor((samples / 8) * br / sr) + padding;
  return { br, sr, samples, size: Math.max(size, 4), mpeg1 };
}

function latinSlice(buf: Uint8Array, start: number, end: number) {
  let out = "";
  for (let i = start; i < end && i < buf.length; i++) out += String.fromCharCode(buf[i]);
  return out;
}

function durationFromBytes(buf: Uint8Array) {
  let i = id3v2Size(buf);
  const limit = Math.min(buf.length - 4, i + 64 * 1024);
  while (i < limit && !frameAt(buf, i)) i++;
  const first = frameAt(buf, i);
  if (!first) return 0;
  const probe = latinSlice(buf, i + 4, i + 4 + 160);
  const tag = probe.indexOf("Xing") >= 0 ? probe.indexOf("Xing") : probe.indexOf("Info");
  if (tag >= 0) {
    const off = i + 4 + tag;
    if (off + 12 <= buf.length) {
      const flags = ((buf[off + 4] << 24) | (buf[off + 5] << 16) | (buf[off + 6] << 8) | buf[off + 7]) >>> 0;
      if (flags & 1) {
        const frames = ((buf[off + 8] << 24) | (buf[off + 9] << 16) | (buf[off + 10] << 8) | buf[off + 11]) >>> 0;
        if (frames > 0) return (frames * first.samples) / first.sr;
      }
    }
  }
  return (Math.max(0, buf.length - i) * 8) / first.br;
}

async function durationFromElement(file: Blob) {
  if (typeof Audio === "undefined") return 0;
  const url = URL.createObjectURL(file);
  try {
    const audio = new Audio();
    audio.preload = "metadata";
    const seconds = await new Promise<number>((resolve) => {
      const done = (n: number) => {
        audio.removeAttribute("src");
        audio.load();
        resolve(n);
      };
      audio.onloadedmetadata = () => done(audio.duration);
      audio.onerror = () => done(0);
      window.setTimeout(() => done(0), 2500);
      audio.src = url;
    });
    return Number.isFinite(seconds) ? seconds : 0;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function readMp3Duration(file: Blob): Promise<string> {
  let seconds = 0;
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    seconds = durationFromBytes(buf);
  } catch {
    seconds = 0;
  }
  if (seconds < 0.5) {
    try {
      seconds = await durationFromElement(file);
    } catch {
      seconds = 0;
    }
  }
  return formatClock(seconds);
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
  const duration = mp3 ? await readMp3Duration(file) : "—";
  return { ok: reasons.length === 0, reasons, bytes: file.size, duration };
}

export function audioLimitCopy() {
  return "MP3 only, 5 MB max.";
}
