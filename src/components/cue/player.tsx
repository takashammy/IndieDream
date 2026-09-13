import { Pause, Play, SkipForward, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { liveSongs } from "@/lib/data";
import { useCue } from "@/lib/store";
import { coverImage } from "@/lib/r2";
import { useSongSrc } from "./r2-audio";

export function Player() {
  const nowPlaying = useCue((s) => s.nowPlaying);
  const playing = useCue((s) => s.playing);
  const togglePlay = useCue((s) => s.togglePlay);
  const play = useCue((s) => s.play);
  const stop = useCue((s) => s.stop);
  const artists = useCue((s) => s.artists);
  const src = useSongSrc(nowPlaying?.song);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !src) return;
    if (playing) void el.play().catch(() => undefined);
    else el.pause();
  }, [playing, src]);

  function playNext() {
    const pool = artists.flatMap((artist) => liveSongs(artist).map((song) => ({ song, artistName: artist.name, artistId: artist.id })));
    if (pool.length === 0) return;
    const rest = pool.filter((item) => item.song.id !== nowPlaying?.song.id);
    const source = rest.length ? rest : pool;
    play(source[Math.floor(Math.random() * source.length)]);
  }

  if (!nowPlaying) return null;

  return (
    <div className="border-b border-line bg-elevated/90 px-3 py-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <img src={coverImage(nowPlaying.song.cover)} alt="" className="size-10 shrink-0 rounded-sm object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{nowPlaying.song.title}</p>
          <p className="truncate text-xs text-muted">{nowPlaying.artistName}</p>
        </div>
        <button type="button" onClick={togglePlay} className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-fg" aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}
        </button>
        <button type="button" onClick={playNext} className="flex size-10 shrink-0 items-center justify-center text-fg" aria-label="Play next random track">
          <SkipForward className="size-4" />
        </button>
        <button type="button" onClick={stop} className="flex size-10 shrink-0 items-center justify-center text-muted" aria-label="Close player">
          <X className="size-4" />
        </button>
      </div>
      {src ? <audio ref={audioRef} src={src} className="hidden" onEnded={() => { if (useCue.getState().playing) togglePlay(); }} /> : null}
    </div>
  );
}
