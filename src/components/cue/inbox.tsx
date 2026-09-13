import { isListedArtist, whatsappHref } from "@/lib/data";
import { useCue, type Notice } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet } from "./chrome";

export function labelFor(kind: Notice["kind"]) {
  if (kind === "verify") return "Artist";
  if (kind === "label") return "Label";
  if (kind === "event") return "Event";
  if (kind === "song") return "Track";
  return "Enquiry";
}

export function NoticeList({
  notices,
  empty,
  onOpen,
}: {
  notices: Notice[];
  empty: string;
  onOpen: (id: string) => void;
}) {
  if (notices.length === 0) {
    return <p className="px-5 text-sm italic text-muted">{empty}</p>;
  }
  return (
    <ul>
      {notices.map((n) => (
        <li key={n.id} className="border-t border-line">
          <button
            type="button"
            onClick={() => onOpen(n.id)}
            className="w-full px-5 py-4 text-left"
          >
            <p className="cue-kicker text-xs text-accent">{labelFor(n.kind)}</p>
            <p className="mt-1 font-medium leading-snug">{n.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{n.body}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function NoticeSheet({
  notice,
  onClose,
  enquiry,
  readonly,
}: {
  notice: Notice;
  onClose: () => void;
  enquiry?: boolean;
  readonly?: boolean;
}) {
  const resolveNotice = useCue((s) => s.resolveNotice);
  const artists = useCue((s) => s.artists);
  const events = useCue((s) => s.events);
  const artist =
    notice.kind === "verify" || notice.kind === "label"
      ? artists.find((a) => a.id === notice.refId)
      : notice.kind === "song"
        ? artists.find((a) => a.songs.some((s) => s.id === notice.refId))
        : null;
  const song = artist?.songs.find((s) => s.id === notice.refId);
  const event = notice.kind === "event" ? events.find((e) => e.id === notice.refId) : null;
  const listed = artists.filter(isListedArtist);
  const fields = notice.fields ? Object.entries(notice.fields) : [];

  return (
    <Sheet title={notice.title} kicker={labelFor(notice.kind)} onClose={onClose}>
      <p className="text-sm leading-6 text-muted">{notice.body}</p>
      {fields.length > 0 ? (
        <dl className="mt-4 space-y-2">
          {fields.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="text-fg">
                {k === "WhatsApp" && whatsappHref(v) ? (
                  <a
                    href={whatsappHref(v)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    {v}
                  </a>
                ) : (
                  v
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {artist ? (
        <div className="mt-4 flex gap-3 rounded-md bg-surface p-3">
          <img src={artist.photo} alt="" className="size-14 rounded-md object-cover" />
          <div>
            <p className="font-medium">{artist.name}</p>
            <p className="text-xs text-muted">
              {artist.role} · {artist.area}
            </p>
            <p className="mt-1 text-xs text-muted">
              {artist.songs.length} track{artist.songs.length === 1 ? "" : "s"} · {artist.label}
            </p>
          </div>
        </div>
      ) : null}
      {song ? (
        <p className="mt-3 text-sm">
          {song.title} · {song.status}
        </p>
      ) : null}
      {event ? (
        <div className="mt-4 text-sm leading-6">
          <p className="font-medium">{event.title}</p>
          <p className="text-muted">
            {event.weekday} {event.date} · {event.time}
          </p>
          <p className="text-muted">
            {event.venue}, {event.area}
          </p>
          <p className="mt-2">{event.blurb}</p>
          <p className="mt-2 text-xs text-muted">
            Lineup:{" "}
            {event.artistIds
              .map((id) => listed.find((a) => a.id === id)?.name ?? artists.find((a) => a.id === id)?.name ?? id)
              .join(", ")}
          </p>
        </div>
      ) : null}

      {enquiry || notice.kind === "enquiry" ? (
        readonly || notice.status === "completed" ? (
          <Button className="mt-6 w-full" variant="ghost" onClick={onClose}>
            Close
          </Button>
        ) : (
          <div className="mt-6 flex gap-2">
            <Button className="flex-1" onClick={() => resolveNotice(notice.id, "completed")}>
              Tick as completed
            </Button>
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )
      ) : (
        <div className="mt-6 flex gap-2">
          <Button className="flex-1" onClick={() => resolveNotice(notice.id, "approved")}>
            Approve
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => resolveNotice(notice.id, "declined")}>
            Decline
          </Button>
        </div>
      )}
    </Sheet>
  );
}
