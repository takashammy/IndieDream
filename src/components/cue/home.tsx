import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import {
  isISR,
  isListedArtist,
  recentTracks,
  shufflePick,
  upcomingEvents,
} from "@/lib/data";
import { currentAccount, useCue } from "@/lib/store";
import { ScreenHead, VerifiedMark } from "./chrome";

export function HomeScreen() {
  const artists = useCue((s) => s.artists);
  const events = useCue((s) => s.events);
  const openArtist = useCue((s) => s.openArtist);
  const openEvent = useCue((s) => s.openEvent);
  const openService = useCue((s) => s.openService);
  const play = useCue((s) => s.play);
  const nowPlaying = useCue((s) => s.nowPlaying);
  const playing = useCue((s) => s.playing);
  const session = useCue((s) => currentAccount(s));

  const listed = artists.filter(isListedArtist);
  const [featured, setFeatured] = useState(() => listed.slice(0, 6));
  useEffect(() => {
    setFeatured(shufflePick(listed, 6));
    // listed is captured on visit; reshuffle when returning to Home (remount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tracks = recentTracks(artists, 3);
  const soon = upcomingEvents(events, 3);

  return (
    <div className="cue-enter pb-10">
      <ScreenHead
        kicker="Hong Kong"
        title="Listen in"
        note={session ? session.name : "Guest"}
      />

      <div className="px-5">
        <button
          type="button"
          onClick={() => openService("publishing")}
          className="flex w-full items-center justify-between rounded-md bg-accent px-4 py-3 text-left text-accent-fg"
        >
          <span>
            <span className="cue-kicker block text-xs opacity-80">Publishing</span>
            <span className="font-display text-xl leading-none">Publish your songs</span>
          </span>
          <span className="text-sm italic">Services →</span>
        </button>
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between px-5">
          <div>
            <p className="cue-kicker text-xs text-muted">Heard around town</p>
            <h2 className="cue-name font-display text-2xl leading-none">Artists</h2>
          </div>
          <p className="text-xs italic text-subtle">Shuffled · six</p>
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
                <p className="mt-0.5 text-xs italic text-accent">Inner Soul</p>
              ) : (
                <p className="mt-0.5 truncate text-xs italic text-muted">{artist.role}</p>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="px-5">
          <p className="cue-kicker text-xs text-muted">Just in</p>
          <h2 className="cue-name font-display text-2xl leading-none">Latest tracks</h2>
        </div>
        <ul className="mt-2">
          {tracks.map(({ song, artist }) => {
            const active = nowPlaying?.song.id === song.id && playing;
            return (
              <li key={song.id} className="border-t border-line">
                <button
                  type="button"
                  onClick={() => play({ song, artistName: artist.name, artistId: artist.id })}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left"
                >
                  <img src={song.cover} alt="" className="size-12 shrink-0 rounded-sm object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{song.title}</p>
                    <p className="truncate text-xs text-muted">{artist.name}</p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-md bg-elevated">
                    <Play className={active ? "size-3 fill-accent text-accent" : "size-3 translate-x-px"} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <div className="px-5">
          <p className="cue-kicker text-xs text-muted">Dates</p>
          <h2 className="cue-name font-display text-2xl leading-none">Coming up</h2>
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
                  <p className="cue-kicker text-xs text-accent">{event.weekday}</p>
                  <p className="font-display text-2xl leading-tight">{event.date.split(" ")[0]}</p>
                  <p className="text-xs text-muted">{event.date.split(" ")[1]}</p>
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
    </div>
  );
}
