import { useState } from "react";
import { ChevronLeft, Clock, MapPin, Plus } from "lucide-react";
import { isListedArtist, type LocationArea, LOCATIONS } from "@/lib/data";
import { currentAccount, currentArtist, useCue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AreaInput, Confirm, Field, ScreenHead, SelectInput, TextInput, Sheet, VerifiedMark } from "./chrome";

export function EventsScreen() {
  const events = useCue((s) => s.events);
  const artists = useCue((s) => s.artists);
  const eventId = useCue((s) => s.eventId);
  const openEvent = useCue((s) => s.openEvent);
  const openArtist = useCue((s) => s.openArtist);
  const composing = useCue((s) => s.eventComposer);
  const setEventComposer = useCue((s) => s.setEventComposer);
  const session = useCue((s) => currentAccount(s));
  const deleteEvent = useCue((s) => s.deleteEvent);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selected = events.find((e) => e.id === eventId && e.status === "approved");
  const live = events
    .filter((e) => e.status === "approved")
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));

  if (selected) {
    const lineup = artists.filter((a) => selected.artistIds.includes(a.id));
    return (
      <div className="cue-enter pb-8">
        <div className="relative h-[42vh] min-h-56">
          <img src={selected.photo} alt="" className="absolute inset-0 size-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in oklab, var(--bg) 30%, transparent), transparent 35%, color-mix(in oklab, var(--bg) 90%, transparent)",
            }}
          />
          <button
            type="button"
            onClick={() => openEvent(null)}
            className="absolute left-3 top-3 flex size-11 items-center justify-center rounded-md bg-bg/70 text-fg backdrop-blur-sm"
            aria-label="All events"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="cue-kicker text-xs text-accent">
              {selected.weekday} {selected.date}
            </p>
            <h1 className="cue-name mt-1 font-display text-3xl leading-none">{selected.title}</h1>
          </div>
        </div>
        <div className="space-y-3 px-5 pt-4 text-sm text-muted">
          <p className="flex items-center gap-2">
            <Clock className="size-4" /> {selected.time}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4" /> {selected.venue}, {selected.area}
          </p>
          <p className="text-sm leading-6 text-fg/90">{selected.blurb}</p>
        </div>
        <section className="mt-6 px-5 pb-8">
          <h2 className="cue-kicker text-xs text-muted">Lineup</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {lineup.map((artist) => (
              <li key={artist.id}>
                <button
                  type="button"
                  onClick={() => openArtist(artist.id)}
                  className="flex w-full items-center gap-3 rounded-lg bg-surface p-3 text-left"
                >
                  <img src={artist.photo} alt="" className="size-12 rounded-md object-cover" />
                  <div>
                    <p className="cue-name flex items-center gap-1.5 font-display text-lg leading-tight">
                      {artist.name}
                      {artist.verified ? <VerifiedMark /> : null}
                    </p>
                    <p className="text-xs text-muted">{artist.role}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {session?.kind === "admin" ? (
            <Button variant="outline" className="mt-8 w-full" onClick={() => setConfirmDelete(true)}>
              Delete event
            </Button>
          ) : null}
        </section>
        {confirmDelete ? (
          <Confirm
            title="Delete this event?"
            body={`Remove “${selected.title}” from Indie Dream. This cannot be undone.`}
            confirmLabel="Yes"
            onConfirm={() => deleteEvent(selected.id)}
            onClose={() => setConfirmDelete(false)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="cue-enter">
      <ScreenHead kicker="Dates" title="This month" note="Hong Kong rooms" />
      <ul className="flex flex-col pb-24">
        {live.map((event) => (
          <li key={event.id} className="border-t border-line">
            <button
              type="button"
              onClick={() => openEvent(event.id)}
              className="grid w-full grid-cols-[4.5rem_1fr] gap-4 px-5 py-4 text-left"
            >
              <div className="text-center">
                <p className="cue-kicker text-xs text-accent">{event.weekday}</p>
                <p className="font-display text-2xl leading-tight">{event.date.split(" ")[0]}</p>
                <p className="text-xs text-muted">{event.date.split(" ")[1]}</p>
              </div>
              <div>
                <img src={event.photo} alt="" className="mb-3 h-28 w-full rounded-md object-cover" />
                <p className="cue-name font-display text-xl leading-tight">{event.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {event.time} · {event.venue}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {composing ? <EventForm onClose={() => setEventComposer(false)} /> : null}
    </div>
  );
}

export function EventsFab() {
  const session = useCue((s) => currentAccount(s));
  const meArtist = useCue((s) => currentArtist(s));
  const setGate = useCue((s) => s.setGate);
  const setEventComposer = useCue((s) => s.setEventComposer);

  function onPost() {
    if (!session) {
      setGate("event");
      return;
    }
    if (session.kind !== "admin" && !meArtist?.verified) {
      setGate("verify");
      return;
    }
    setEventComposer(true);
  }

  return (
    <button
      type="button"
      onClick={onPost}
      className="fixed right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-accent px-4 text-sm text-accent-fg"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 4.15rem)" }}
    >
      <Plus className="size-4" />
      Post event
    </button>
  );
}

function EventForm({ onClose }: { onClose: () => void }) {
  const allArtists = useCue((s) => s.artists);
  const artists = allArtists.filter(isListedArtist);
  const me = useCue((s) => currentArtist(s));
  const submitEvent = useCue((s) => s.submitEvent);
  const [title, setTitle] = useState("");
  const [isoDate, setIsoDate] = useState("2026-09-20");
  const [time, setTime] = useState("21:00");
  const [venue, setVenue] = useState("");
  const [area, setArea] = useState<LocationArea>("HK Island");
  const [blurb, setBlurb] = useState("");
  const [tagged, setTagged] = useState<string[]>(me ? [me.id] : []);
  const [sent, setSent] = useState(false);

  function toggle(id: string) {
    setTagged((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  return (
    <Sheet title="Post an event" kicker="Needs approval" onClose={onClose}>
      {sent ? (
        <p className="text-sm leading-6 text-muted">
          Sent for review. It goes live once Inner Soul Records approves it.
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !venue.trim() || !blurb.trim()) return;
            const err = submitEvent({
              title: title.trim(),
              isoDate,
              time,
              venue: venue.trim(),
              area,
              blurb: blurb.trim(),
              artistIds: tagged,
            });
            if (!err) setSent(true);
          }}
        >
          <p className="text-sm italic text-muted">
            Verified artists can file a date. It goes live after Inner Soul Records reviews it. Tag anyone sharing the bill.
          </p>
          <Field label="Title">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <TextInput type="date" value={isoDate} onChange={(e) => setIsoDate(e.target.value)} required />
            </Field>
            <Field label="Time">
              <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </Field>
          </div>
          <Field label="Venue">
            <TextInput value={venue} onChange={(e) => setVenue(e.target.value)} required />
          </Field>
          <Field label="Area">
            <SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Details">
            <AreaInput rows={4} value={blurb} onChange={(e) => setBlurb(e.target.value)} required />
          </Field>
          <fieldset>
            <legend className="text-xs text-muted">Tag artists</legend>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {artists.map((a) => (
                <li key={a.id}>
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={tagged.includes(a.id)}
                      onChange={() => toggle(a.id)}
                    />
                    {a.name}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <Button type="submit" className="w-full">
            Submit for approval
          </Button>
        </form>
      )}
    </Sheet>
  );
}
