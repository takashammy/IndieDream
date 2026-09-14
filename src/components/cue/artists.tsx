import { useEffect, useState } from "react";
import { APP_NAME, isISR, isListedArtist, shufflePick, type Artist } from "@/lib/data";
import { useCue } from "@/lib/store";
import { ScreenHead, VerifiedMark } from "./chrome";

export function ArtistsScreen() {
  const all = useCue((s) => s.artists);
  const artists = all.filter(isListedArtist);
  const label = artists.filter(isISR);
  const rest = artists.filter((a) => !isISR(a));
  const restKey = rest.map((a) => a.id).join("|");
  const [independents, setIndependents] = useState(rest);

  useEffect(() => {
    setIndependents(shufflePick(rest, rest.length));
    // Shuffle independents on visit; Inner Soul Records stay pinned above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restKey]);

  return (
    <div className="cue-enter">
      <ScreenHead kicker="Catalogue" title="The roster" note={`${artists.length} listed`} />
      {label.length > 0 ? (
        <section className="mb-8">
          <div className="px-5 pb-3">
            <p className="cue-kicker text-xs text-accent">Inner Soul Records</p>
            <p className="mt-1 text-sm italic text-muted">The label roster. Assigned, not claimed.</p>
          </div>
          <CatalogGrid artists={label} />
        </section>
      ) : null}
      <section>
        <div className="px-5 pb-3">
          <p className="cue-kicker text-xs text-muted">Independent & verified</p>
          <p className="mt-1 text-sm italic text-muted">Artists with a live track on {APP_NAME}.</p>
        </div>
        <CatalogGrid artists={independents} />
      </section>
    </div>
  );
}

function CatalogGrid({ artists }: { artists: Artist[] }) {
  const openArtist = useCue((s) => s.openArtist);
  return (
    <div className="grid grid-cols-2 gap-px bg-line">
      {artists.map((artist) => (
        <button
          key={artist.id}
          type="button"
          onClick={() => openArtist(artist.id)}
          className="bg-bg p-3 text-left"
        >
          <div className="aspect-[3/4] overflow-hidden">
            <img src={artist.photo} alt="" className="size-full object-cover" />
          </div>
          <p className="mt-3 cue-kicker text-xs text-accent">{artist.role}</p>
          <p className="cue-name mt-1 flex items-center gap-1.5 font-display text-xl leading-tight">
            <span className="min-w-0 truncate">{artist.name}</span>
            {artist.verified ? <VerifiedMark /> : null}
          </p>
          <p className="mt-1 text-xs italic text-muted">{artist.city}</p>
        </button>
      ))}
    </div>
  );
}
