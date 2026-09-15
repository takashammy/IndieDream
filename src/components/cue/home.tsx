import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import {
  isISR,
  catalogVisible,
  recentTracks,
  shufflePick,
  upcomingEvents,
  type Artist,
  type Song,
} from "@/lib/data";
import { currentAccount, useCue } from "@/lib/store";
import { ScreenHead, TrackSheet, VerifiedMark } from "./chrome";
import { eventDateParts, useLocale, useT, weekdayLabel } from "@/lib/i18n";

function pickHomeArtists(listed: Artist[]) {
  const rest = listed.filter((a) => a.verified);
  return shufflePick(rest, Math.min(6, rest.length));
}

export function HomeScreen() {
  const artists = useCue((s) => s.artists);
  const accounts = useCue((s) => s.accounts);
  const events = useCue((s) => s.events);
  const openArtist = useCue((s) => s.openArtist);
  const openEvent = useCue((s) => s.openEvent);
  const openService = useCue((s) => s.openService);
  const play = useCue((s) => s.play);
  const nowPlaying = useCue((s) => s.nowPlaying);
  const playing = useCue((s) => s.playing);
  const session = useCue((s) => currentAccount(s));
  const [openTrack, setOpenTrack] = useState<{ song: Song; artistName: string; artistId: string } | null>(null);
  const t = useT();
  const { locale } = useLocale();

  const listed = artists.filter((a) => catalogVisible(a, accounts));
  const [featured, setFeatured] = useState(() => listed.slice(0, 6));
  useEffect(() => {
    setFeatured(pickHomeArtists(listed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tracks = recentTracks(artists, 8).filter(({ song }) => song.status === "approved").slice(0, 3);
  const soon = upcomingEvents(events, 3).filter((event) => event.status === "approved");

  return (
    <div className="cue-enter pb-10">
      <ScreenHead
        kicker={t("hongKong")}
        title={t("listenIn")}
        note={session ? session.name : t("guest")}
      />

      <div className="px-5">
        <button
          type="button"
          onClick={() => openService("publishing")}
          className="flex w-full items-center justify-between rounded-md bg-accent px-4 py-3 text-left text-accent-fg"
        >
          <span>
            <span className="cue-kicker block text-xs opacity-80">{t("publishing")}</span>
            <span className="font-display text-xl leading-none">{t("publishSongs")}</span>
          </span>
          <span className="text-sm italic">{t("servicesArrow")}</span>
        </button>
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between px-5">
          <div>
            <p className="cue-kicker text-xs text-muted">{t("heardAround")}</p>
            <h2 className="cue-name font-display text-2xl leading-none">{t("tabArtists")}</h2>
          </div>
          <p className="text-xs italic text-subtle">{t("shuffledSix")}</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-px bg-line">
          {featured.map((artist) => (
            <button
              key={artist.id}
              type="button"
              onClick={() => openArtist(artist.id)}
              className="bg-bg p-2 text-left"
            >
              <img src={artist.photo} alt="" className="aspect-[3/4] w-full object-cover" />
              <p className="mt-2 flex items-center gap-1 font-display text-sm leading-tight">
                <span className="min-w-0 truncate">{artist.name}</span>
                {artist.verified ? <VerifiedMark className="size-3" /> : null}
              </p>
              {isISR(artist) ? (
                <p className="mt-0.5 text-xs italic text-accent">{t("innerSoul")}</p>
              ) : (
                <p className="mt-0.5 truncate text-xs italic text-muted">{artist.role}</p>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="px-5">
          <p className="cue-kicker text-xs text-muted">{t("justIn")}</p>
          <h2 className="cue-name font-display text-2xl leading-none">{t("latestTracks")}</h2>
        </div>
        <ul className="mt-2">
          {tracks.map(({ song, artist }) => {
            const active = nowPlaying?.song.id === song.id && playing;
            return (
              <li key={song.id} className="border-t border-line">
                <div className="flex items-center gap-2 px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenTrack({ song, artistName: artist.name, artistId: artist.id })}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <img src={song.cover} alt="" className="size-12 shrink-0 rounded-sm object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{song.title}</p>
                      <p className="truncate text-xs text-muted">{artist.name}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => play({ song, artistName: artist.name, artistId: artist.id })}
                    className="flex size-10 shrink-0 items-center justify-center rounded-md bg-elevated"
                    aria-label={t("playSong", { title: song.title })}
                  >
                    <Play className={active ? "size-3 fill-accent text-accent" : "size-3 translate-x-px"} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <div className="px-5">
          <p className="cue-kicker text-xs text-muted">{t("tabEvents")}</p>
          <h2 className="cue-name font-display text-2xl leading-none">{t("comingUp")}</h2>
        </div>
        <ul className="mt-2">
          {soon.map((event) => (
            <li key={event.id} className="border-t border-line">
              <button
                type="button"
                onClick={() => openEvent(event.id)}
                className="grid w-full grid-cols-[4.5rem_1fr] gap-3 px-5 py-3 text-left"
              >
                <div className="text-center">
                  <p className="cue-kicker text-xs text-accent">{weekdayLabel(locale, event.weekday)}</p>
                  <p className="font-display text-2xl leading-tight">{eventDateParts(locale, event.date).day}</p>
                  <p className="text-xs text-muted">{eventDateParts(locale, event.date).month}</p>
                </div>
                <div>
                  <p className="cue-name font-display text-lg leading-tight">{event.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {event.time} · {event.venue}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {openTrack ? (
        <TrackSheet artistName={openTrack.artistName} artistId={openTrack.artistId} song={openTrack.song} onClose={() => setOpenTrack(null)} />
      ) : null}
    </div>
  );
}
