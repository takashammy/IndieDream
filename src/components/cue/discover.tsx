import { ChevronLeft } from "lucide-react";
import { APP_NAME, artistsByGenre, genresFromCatalog, isListedArtist } from "@/lib/data";
import { useCue } from "@/lib/store";
import { ScreenHead, VerifiedMark } from "./chrome";

const GENRE_COVER: Record<string, string> = {
  Jazz: "/media/events/jazz.jpg",
  Soul: "/media/covers/silk.jpg",
  Indie: "/media/covers/guitar.jpg",
  Rock: "/media/covers/drums.jpg",
  Electronic: "/media/covers/synth.jpg",
  Ambient: "/media/covers/rain.jpg",
  "Hip-hop": "/media/covers/rain.jpg",
  "R&B": "/media/covers/vinyl.jpg",
  Classical: "/media/covers/cello.jpg",
  Contemporary: "/media/covers/cello.jpg",
  Cantopop: "/media/artists/leo.jpg",
  Pop: "/media/covers/vinyl.jpg",
};

export function DiscoverScreen() {
  const artists = useCue((s) => s.artists);
  const genre = useCue((s) => s.genre);
  const openGenre = useCue((s) => s.openGenre);
  const openArtist = useCue((s) => s.openArtist);
  const listed = artists.filter(isListedArtist);
  const genres = genresFromCatalog(listed);

  if (genre) {
    const people = artistsByGenre(genre, listed);
    return (
      <div className="cue-enter">
        <header className="flex items-center gap-1 px-2 pt-3">
          <button type="button" onClick={() => openGenre(null)} className="flex size-11 items-center justify-center" aria-label="All genres">
            <ChevronLeft className="size-5" />
          </button>
          <div>
            <p className="cue-kicker text-xs text-muted">Genre</p>
            <h1 className="cue-name font-display text-3xl leading-none">{genre}</h1>
          </div>
        </header>
        <p className="px-5 pt-2 text-sm italic text-muted">
          {people.length} {people.length === 1 ? "artist" : "artists"} tagged {genre.toLowerCase()}
        </p>
        <ul className="mt-4">
          {people.map((artist) => (
            <li key={artist.id} className="border-t border-line">
              <button type="button" onClick={() => openArtist(artist.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left">
                <img src={artist.photo} alt="" className="size-14 object-cover" />
                <div>
                  <p className="cue-name flex items-center gap-1.5 font-display text-xl leading-tight">
                    {artist.name}
                    {artist.verified ? <VerifiedMark /> : null}
                  </p>
                  <p className="text-xs italic text-muted">{artist.role} · {artist.city}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="cue-enter">
      <ScreenHead kicker="Listen" title="By genre" note="From the roster" />
      <p className="px-5 pb-4 text-sm italic text-muted">A genre only appears here if someone on {APP_NAME} actually plays it.</p>
      <div className="grid grid-cols-2 gap-px bg-line">
        {genres.map((g) => {
          const count = listed.filter((a) => a.genres.includes(g)).length;
          const cover = GENRE_COVER[g] ?? listed[0]?.photo;
          return (
            <button key={g} type="button" onClick={() => openGenre(g)} className="bg-bg p-3 text-left">
              <img src={cover} alt="" className="aspect-[4/3] w-full object-cover" />
              <p className="cue-name mt-3 font-display text-2xl leading-none">{g}</p>
              <p className="mt-1 text-xs italic text-muted">{count} on roster</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
