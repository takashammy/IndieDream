export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_KBPS = 128;

export type AudioCheck = {
  ok: boolean;
  reasons: string[];
  kbps: number | null;
  bytes: number;
  seconds: number | null;
};

export function isMp3File(file: File) {
  return /\.mp3$/i.test(file.name);
}

function durationOf(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      done(Number.isFinite(d) && d > 0 ? d : null);
    };
    audio.onerror = () => done(null);
    audio.src = url;
  });
}

export async function inspectAudioFile(file: File): Promise<AudioCheck> {
  if (!isMp3File(file)) {
    return { ok: false, reasons: ["MP3 files only."], kbps: null, bytes: file.size, seconds: null };
  }

  const seconds = await durationOf(file);
  const kbps =
    seconds && seconds > 0 ? Math.round((file.size * 8) / seconds / 1000) : null;
  const reasons: string[] = [];

  if (file.size > MAX_AUDIO_BYTES) {
    const mb = file.size / (1024 * 1024);
    reasons.push(
      `This file is ${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB. The limit is 5 MB.`,
    );
  }
  if (kbps !== null && kbps > MAX_AUDIO_KBPS) {
    reasons.push(`This file is about ${kbps} kbps. The highest quality we take is 128 kbps.`);
  }

  return { ok: reasons.length === 0, reasons, kbps, bytes: file.size, seconds };
}

export function audioLimitCopy() {
  return "MP3 only, 128 kbps max, 5 MB max.";
}
