import { useEffect, useState } from "react";
import { r2KeyFromCover, requestTrackPlay } from "@/lib/r2";
import { recallAudio } from "@/lib/audio-vault";
import type { Song } from "@/lib/data";

function httpUrl(value?: string) {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

function objectKey(song: Song) {
  const fromCover = r2KeyFromCover(song.cover);
  if (fromCover) return fromCover;
  const raw = (song.audioUrl ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("r2:")) return raw.slice(3);
  if (raw.startsWith("tracks/")) return raw;
  if (raw.includes("tracks/")) {
    const idx = raw.indexOf("tracks/");
    return raw.slice(idx).split("?")[0]?.split("#")[0] ?? null;
  }
  return null;
}

function cacheKey(song: Song) {
  const key = objectKey(song);
  return key ? `r2:${key}` : song.id;
}

const srcCache = new Map<string, { url: string; expires: number }>();
const CACHE_TTL_MS = 840_000; // presigned URLs last ~15 min

function readCache(song: Song) {
  const hit = srcCache.get(cacheKey(song));
  if (hit && hit.expires > Date.now()) return hit.url;
  return null;
}

function writeCache(song: Song, url: string) {
  srcCache.set(cacheKey(song), { url, expires: Date.now() + CACHE_TTL_MS });
}

export async function resolveSongSrc(song: Song): Promise<string | null> {
  const cached = readCache(song);
  if (cached) return cached;

  const direct = httpUrl(song.audioUrl);
  if (direct) {
    writeCache(song, direct);
    return direct;
  }

  const key = objectKey(song);
  if (key) {
    try {
      const play = await requestTrackPlay({ data: { key } });
      if (play.ok) {
        writeCache(song, play.url);
        return play.url;
      }
    } catch {
      /* fall through */
    }
  }

  const local = await recallAudio(song.id);
  if (local) writeCache(song, local);
  return local;
}

export function preloadSongSrc(song: Song) {
  if (readCache(song)) return;
  void resolveSongSrc(song);
}

export function useSongSrc(song?: Song | null) {
  const [src, setSrc] = useState<string | null>(() => (song ? readCache(song) : null));

  useEffect(() => {
    if (!song) {
      setSrc(null);
      return;
    }

    const cached = readCache(song);
    if (cached) {
      setSrc(cached);
      return;
    }

    setSrc(null);
    let alive = true;
    void resolveSongSrc(song).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [song?.id, song?.cover, song?.audioUrl]);

  return src;
}

export function SongPreview({ song }: { song: Song }) {
  const src = useSongSrc(song);
  if (!src) {
    return (
      <p className="mt-3 text-sm leading-6 text-muted">
        No streaming copy on R2 yet. If the artist linked Spotify or YouTube, use that.
      </p>
    );
  }
  return (
    <audio className="mt-3 w-full" controls preload="metadata" src={src}>
      Your browser cannot play this preview.
    </audio>
  );
}
