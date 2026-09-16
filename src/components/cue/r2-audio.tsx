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
  return null;
}

export function useSongSrc(song?: Song | null) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    async function resolve() {
      if (!song) {
        if (alive) setSrc(null);
        return;
      }
      const direct = httpUrl(song.audioUrl);
      if (direct) {
        if (alive) setSrc(direct);
        return;
      }
      const key = objectKey(song);
      if (key) {
        try {
          const play = await requestTrackPlay({ data: { key } });
          if (alive && play.ok) {
            setSrc(play.url);
            return;
          }
        } catch {
          /* fall through */
        }
      }
      const local = await recallAudio(song.id);
      if (alive) setSrc(local);
    }
    void resolve();
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
