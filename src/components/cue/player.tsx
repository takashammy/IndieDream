import { Pause, Play, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { catalogVisible, liveSongs } from "@/lib/data";
import { useCue, type NowPlaying } from "@/lib/store";
import { coverImage } from "@/lib/r2";
import { useT } from "@/lib/i18n";
import { useSongSrc } from "./r2-audio";
import { TrackSheet } from "./chrome";

function livePool(artists: ReturnType<typeof useCue.getState>["artists"], accounts: ReturnType<typeof useCue.getState>["accounts"]) {
  return artists.filter((a) => catalogVisible(a, accounts)).flatMap((artist) =>
    liveSongs(artist).map((song) => ({ song, artistName: artist.name, artistId: artist.id })),
  );
}

function pickUnheard(
  artists: ReturnType<typeof useCue.getState>["artists"],
  accounts: ReturnType<typeof useCue.getState>["accounts"],
  heard: Set<string>,
  excludeId?: string,
) {
  const all = livePool(artists, accounts);
  let remaining = all.filter((item) => !heard.has(item.song.id) && item.song.id !== excludeId);
  if (!remaining.length) {
    heard.clear();
    remaining = all.filter((item) => item.song.id !== excludeId);
  }
  const source = remaining.length ? remaining : all;
  if (!source.length) return null;
  return source[Math.floor(Math.random() * source.length)];
}

export function Player() {
  const artists = useCue((s) => s.artists);
  const accounts = useCue((s) => s.accounts);
  const nowPlaying = useCue((s) => s.nowPlaying);
  const playing = useCue((s) => s.playing);
  const play = useCue((s) => s.play);
  const togglePlay = useCue((s) => s.togglePlay);
  const [idle, setIdle] = useState<NowPlaying | null>(null);
  const [openTrack, setOpenTrack] = useState(false);
  const heardRef = useRef<Set<string>>(new Set());
  const shown = nowPlaying ?? idle;
  const src = useSongSrc(nowPlaying?.song);
  const audioRef = useRef<HTMLAudioElement>(null);
  const t = useT();

  useEffect(() => {
    setIdle((current) => current ?? pickUnheard(artists, accounts, heardRef.current));
  }, [artists, accounts]);

  useEffect(() => {
    if (nowPlaying && playing) heardRef.current.add(nowPlaying.song.id);
  }, [nowPlaying?.song.id, playing]);

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
    const next = pickUnheard(artists, accounts, heardRef.current, shown?.song.id);
    if (!next) return;
    setIdle(next);
    if (playing || nowPlaying) play(next);
  }

  return (
    <div className="border-b border-line bg-bg/95 px-5 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-lg bg-elevated p-3">
        {shown ? (
          <button
            type="button"
            onClick={() => setOpenTrack(true)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            aria-label={`${t("lyricsFor")} ${shown.song.title}`}
          >
            <img src={coverImage(shown.song.cover)} alt="" className="size-14 shrink-0 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="cue-kicker text-xs text-muted">{playing ? t("nowPlaying") : t("randomRoster")}</p>
              <p className="truncate font-medium leading-tight">{shown.song.title}</p>
              <p className="truncate text-xs text-muted">{shown.artistName}</p>
            </div>
          </button>
        ) : (
          <>
            <div className="size-14 shrink-0 rounded-md bg-surface" />
            <div className="min-w-0 flex-1">
              <p className="cue-kicker text-xs text-muted">{t("randomRoster")}</p>
              <p className="truncate font-medium leading-tight">{t("nothingLive")}</p>
              <p className="truncate text-xs text-muted">Inner Soul Records</p>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={onPlayPause}
          disabled={!shown}
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-fg disabled:opacity-40"
          aria-label={playing ? t("pause") : t("play")}
        >
          {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}
        </button>
        <button type="button" onClick={onNext} disabled={!shown} className="flex size-11 shrink-0 items-center justify-center text-fg disabled:opacity-40" aria-label={t("nextTrack")}>
          <SkipForward className="size-4" />
        </button>
      </div>
      {src ? <audio ref={audioRef} src={src} className="hidden" onEnded={() => { if (useCue.getState().playing) togglePlay(); }} /> : null}
      {openTrack && shown ? (
        <TrackSheet artistName={shown.artistName} artistId={shown.artistId} song={shown.song} onClose={() => setOpenTrack(false)} />
      ) : null}
    </div>
  );
}
