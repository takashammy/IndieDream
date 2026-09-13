import { Pause, Play, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCue } from "@/lib/store";
import { coverImage } from "@/lib/r2";
import { useSongSrc } from "./r2-audio";

export function Player() {
  const nowPlaying = useCue((s) => s.nowPlaying);
  const playing = useCue((s) => s.playing);
  const togglePlay = useCue((s) => s.togglePlay);
  const stop = useCue((s) => s.stop);
  const src = useSongSrc(nowPlaying?.song);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !src) return;
    if (playing) void el.play().catch(() => undefined);
    else el.pause();
  }, [playing, src]);

  if (!nowPlaying) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 mx-auto w-full max-w-lg px-3"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <div
        className="pointer-events-auto flex items-center gap-3 rounded-lg bg-elevated px-3 py-2"
        style={{ boxShadow: "var(--shadow-border)" }}
      >
        <img src={coverImage(nowPlaying.song.cover)} alt="" className="size-10 shrink-0 rounded-sm object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{nowPlaying.song.title}</p>
          <p className="truncate text-xs text-muted">{nowPlaying.artistName}</p>
        </div>
        <div className="flex h-5 items-end gap-px" aria-hidden>
          {[7, 14, 9, 18, 11, 16, 8].map((h, i) => (
            <span
              key={i}
              className="block w-0.5 origin-bottom rounded-full bg-accent"
              style={{
                height: `${h}px`,
                transformOrigin: "bottom",
                animation: playing ? `eq ${380 + i * 55}ms ease-in-out ${i * 40}ms infinite alternate` : "none",
                opacity: playing ? 1 : 0.4,
              }}
            />
          ))}
        </div>
        <button type="button" onClick={togglePlay} className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-fg" aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}
        </button>
        <button type="button" onClick={stop} className="flex size-10 shrink-0 items-center justify-center text-muted" aria-label="Close player">
          <X className="size-4" />
        </button>
      </div>
      {src ? <audio ref={audioRef} src={src} onEnded={stop} className="hidden" /> : null}
      <style>{`@keyframes eq { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }`}</style>
    </div>
  );
}
