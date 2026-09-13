import { useEffect, useState } from "react";
import { r2KeyFromCover, requestTrackPlay } from "@/lib/r2";
import { recallAudio } from "@/lib/audio-vault";
import type { Song } from "@/lib/data";

export function useSongSrc(song?: Song | null) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    async function resolve() {
      if (!song) {
        if (alive) setSrc(null);
        return;
      }
      if (song.audioUrl && !song.audioUrl.startsWith("r2:")) {
        if (alive) setSrc(song.audioUrl);
        return;
      }
      const key = r2KeyFromCover(song.cover) || (song.audioUrl?.startsWith("r2:") ? song.audioUrl.slice(3) : null);
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
