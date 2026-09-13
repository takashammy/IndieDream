import { Pause, Play, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isListedArtist, liveSongs } from "@/lib/data";
import { useCue, type NowPlaying } from "@/lib/store";
import { coverImage } from "@/lib/r2";
import { useSongSrc } from "./r2-audio";

function poolFrom(artists: ReturnType<typeof useCue.getState>["artists"], excludeId?: string) {
  const all = artists.filter(isListedArtist).flatMap((artist) =>
    liveSongs(artist).map((song) => ({ song, artistName: artist.name, artistId: artist.id })),
  );
  const rest = excludeId ? all.filter((item) => item.song.id !== excludeId) : all;
  const source = rest.length ? rest : all;
  if (source.length === 0) return null;
  return source[Math.floor(Math.random() * source.length)];
}

export function Player() {
  const artists = useCue((s) => s.artists);
  const nowPlaying = useCue((s) => s.nowPlaying);
  const playing = useCue((s) => s.playing);
  const play = useCue((s) => s.play);
  const togglePlay = useCue((s) => s.togglePlay);
  const [idle, setIdle] = useState<NowPlaying | null>(null);
  const shown = nowPlaying ?? idle;
  const src = useSongSrc(nowPlaying?.song);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setIdle((current) => current ?? poolFrom(artists));
  }, [artists]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !src) return;
    if (playing) void el.play().catch(() => undefined);
    else el.pause();
  }, [playing, src]);

  function onPlayPause() {
    if (nowPlaying) {
      togglePlay();
      return;
    }
    if (shown) play(shown);
  }

  function onNext() {
    const next = poolFrom(artists, shown?.song.id);
    if (!next) return;
    setIdle(next);
    if (playing || nowPlaying) play(next);
  }

  return (
    <div className="border-b border-line bg-bg/95 px-5 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-lg bg-elevated p-3">
        {shown ? (
          <img src={coverImage(shown.song.cover)} alt="" className="size-14 shrink-0 rounded-md object-cover" />
        ) : (
          <div className="size-14 shrink-0 rounded-md bg-surface" />
        )}
        <div className="min-w-0 flex-1">
          <p className="cue-kicker text-xs text-muted">{playing ? "Now playing" : "Random from the roster"}</p>
          <p className="truncate font-medium leading-tight">{shown?.song.title ?? "Nothing live yet"}</p>
          <p className="truncate text-xs text-muted">{shown?.artistName ?? "Inner Soul Records"}</p>
        </div>
        <button
          type="button"
          onClick={onPlayPause}
          disabled={!shown}
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-fg disabled:opacity-40"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}
        </button>
        <button type="button" onClick={onNext} disabled={!shown} className="flex size-11 shrink-0 items-center justify-center text-fg disabled:opacity-40" aria-label="Play next random track">
          <SkipForward className="size-4" />
        </button>
      </div>
      {src ? <audio ref={audioRef} src={src} className="hidden" onEnded={() => { if (useCue.getState().playing) togglePlay(); }} /> : null}
    </div>
  );
}
