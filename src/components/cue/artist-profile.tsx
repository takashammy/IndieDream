import { useState } from "react";
import { ChevronLeft, MapPin, Play } from "lucide-react";
import { APP_NAME, eventsForArtist, isISR, liveSongs, type Song } from "@/lib/data";
import { currentAccount, useCue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { coverImage } from "@/lib/r2";
import { Confirm, SocialPair, TrackSheet, VerifiedMark } from "./chrome";

export function ArtistProfile({ id }: { id: string }) {
  const artists = useCue((s) => s.artists);
  const events = useCue((s) => s.events);
  const artist = artists.find((a) => a.id === id);
  const closeArtist = useCue((s) => s.closeArtist);
  const play = useCue((s) => s.play);
  const nowPlaying = useCue((s) => s.nowPlaying);
  const playing = useCue((s) => s.playing);
  const openEvent = useCue((s) => s.openEvent);
  const openGenre = useCue((s) => s.openGenre);
  const deleteArtist = useCue((s) => s.deleteArtist);
  const session = useCue((s) => currentAccount(s));
  const admin = session?.kind === "admin";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openSong, setOpenSong] = useState<Song | null>(null);

  if (!artist) {
    return (
      <div className="px-5 py-10">
        <p className="text-muted">This artist isn’t on the roster.</p>
        <Button variant="ghost" className="mt-4" onClick={closeArtist}>Back</Button>
      </div>
    );
  }

  const gigs = eventsForArtist(artist.id, events);
  const songs = [...liveSongs(artist)].sort((a, b) => Date.parse(b.uploadedAt || "") - Date.parse(a.uploadedAt || ""));

  return (
    <div className="cue-enter pb-24">
      <div className="relative h-[52vh] min-h-72">
        <img src={artist.photo} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--bg) 35%, transparent) 0%, transparent 30%, color-mix(in oklab, var(--bg) 92%, transparent) 100%)" }} />
        <button type="button" onClick={closeArtist} className="absolute left-3 top-3 z-20 flex size-11 items-center justify-center rounded-md bg-bg/70 text-fg backdrop-blur-sm" aria-label="Back to roster">
          <ChevronLeft className="size-5" />
        </button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 pr-28">
          <p className="cue-kicker text-xs text-accent">{isISR(artist) ? "Inner Soul Records · " : null}{artist.role}</p>
          <h1 className="cue-name mt-1 flex items-center gap-2 font-display text-4xl leading-none sm:text-5xl">{artist.name}{artist.verified ? <VerifiedMark className="size-6" /> : null}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><MapPin className="size-3.5" />{artist.city}</p>
        </div>
        <div className="absolute bottom-3 right-3 z-20">
          <SocialPair spotify={artist.spotify} youtube={artist.youtube} />
        </div>
      </div>
      <div className="px-5 pt-4">
        <div className="flex flex-wrap gap-2">
          {artist.genres.map((g) => (
            <button key={g} type="button" onClick={() => openGenre(g)} className="h-8 rounded-md bg-elevated px-3 text-xs text-fg">{g}</button>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">{artist.bio}</p>
      </div>
      <section className="mt-6">
        <h2 className="px-5 cue-kicker text-xs text-muted">On {APP_NAME}</h2>
        {songs.length === 0 ? <p className="px-5 pt-3 text-sm text-muted">Nothing live yet.</p> : (
          <ul className="mt-2">
            {songs.map((song) => {
              const active = nowPlaying?.song.id === song.id && playing;
              return (
                <li key={song.id} className="border-t border-line">
                  <div className="flex items-center gap-2 px-5 py-3">
                    <button type="button" onClick={() => setOpenSong(song)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <img src={coverImage(song.cover)} alt="" className="size-12 shrink-0 rounded-sm object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{song.title}</p>
                        <p className="text-xs text-muted">{song.duration} · {song.plays} plays</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => play({ song, artistName: artist.name, artistId: artist.id })}
                      className="flex size-10 shrink-0 items-center justify-center rounded-md bg-elevated text-fg"
                      aria-label={`Play ${song.title}`}
                    >
                      <Play className={active ? "size-3 fill-accent text-accent" : "size-3 translate-x-px"} />
                    </button>
                    <SocialPair compact spotify={song.spotify} youtube={song.youtube} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {gigs.length > 0 ? (
        <section className="mt-6 px-5">
          <h2 className="cue-kicker text-xs text-muted">Upcoming</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {gigs.map((gig) => (
              <li key={gig.id}>
                <button type="button" onClick={() => openEvent(gig.id)} className="flex w-full items-center gap-3 rounded-lg bg-surface p-3 text-left">
                  <img src={gig.photo} alt="" className="size-14 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{gig.title}</p>
                    <p className="text-xs text-muted">{gig.weekday} {gig.date} · {gig.venue}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {admin ? <div className="px-5 pt-8"><Button variant="outline" className="w-full" onClick={() => setConfirmDelete(true)}>Delete profile</Button></div> : null}
      {confirmDelete ? <Confirm title="Delete this profile?" body={`Remove ${artist.name} from ${APP_NAME}. This cannot be undone.`} confirmLabel="Yes" cancelLabel="Cancel" onConfirm={() => deleteArtist(artist.id)} onClose={() => setConfirmDelete(false)} /> : null}
      {openSong ? <TrackSheet artistName={artist.name} artistId={artist.id} song={openSong} onClose={() => setOpenSong(null)} /> : null}
    </div>
  );
}
