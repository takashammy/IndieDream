import { whatsappHref } from "@/lib/data";
import { currentAccount, useCue, type Notice } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { coverImage, photoImage } from "@/lib/r2";
import { Sheet } from "./chrome";
import { SongPreview } from "./r2-audio";
import { eventDateLabel, fieldLabel, fieldValue, locationLabel, noticeKindLabel, songStatusLabel, useLocale, useT, weekdayLabel } from "@/lib/i18n";

export function NoticeList({
  notices,
  empty,
  onOpen,
}: {
  notices: Notice[];
  empty: string;
  onOpen: (id: string) => void;
}) {
  const { locale } = useLocale();
  if (notices.length === 0) return <p className="px-5 text-sm italic text-muted">{empty}</p>;
  return (
    <ul>
      {notices.map((n) => (
        <li key={n.id} className="border-t border-line">
          <button type="button" onClick={() => onOpen(n.id)} className="w-full px-5 py-4 text-left">
            <p className="cue-kicker text-xs text-accent">{noticeKindLabel(locale, n.kind)}</p>
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
  const session = useCue((s) => currentAccount(s));
  const artists = useCue((s) => s.artists);
  const events = useCue((s) => s.events);
  const t = useT();
  const { locale } = useLocale();
  const desk = session?.kind === "admin";
  const artist =
    notice.kind === "verify" || notice.kind === "label"
      ? artists.find((a) => a.id === notice.refId)
      : notice.kind === "song"
        ? artists.find((a) => a.songs.some((s) => s.id === notice.refId))
        : null;
  const song = artist?.songs.find((s) => s.id === notice.refId);
  const event = notice.kind === "event" ? events.find((e) => e.id === notice.refId) : null;
  const fields = notice.fields ? Object.entries(notice.fields) : [];

  return (
    <Sheet title={notice.title} kicker={noticeKindLabel(locale, notice.kind)} onClose={onClose}>
      <p className="text-sm leading-6 text-muted">{notice.body}</p>
      {fields.length > 0 ? (
        <dl className="mt-4 space-y-2">
          {fields.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
              <dt className="text-muted">{fieldLabel(locale, k)}</dt>
              <dd className="text-fg">
                {k === "WhatsApp" && whatsappHref(v) ? (
                  <a href={whatsappHref(v)} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">{v}</a>
                ) : (
                  fieldValue(locale, k, v)
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {artist ? (
        <div className="mt-4 flex gap-3 rounded-md bg-surface p-3">
          <img src={photoImage(artist.photo)} alt="" className="size-14 rounded-md object-cover" />
          <div>
            <p className="font-medium">{artist.name}</p>
            <p className="text-xs text-muted">{artist.role} · {locationLabel(locale, artist.area)}</p>
          </div>
        </div>
      ) : null}
      {song ? (
        <div className="mt-4 rounded-md bg-surface p-3">
          <div className="flex items-center gap-3">
            <img src={coverImage(song.cover)} alt="" className="size-12 shrink-0 rounded-md object-cover" />
            <div className="min-w-0">
              <p className="truncate font-medium">{song.title}</p>
              <p className="text-xs text-muted">{song.duration} · {songStatusLabel(locale, song.status)}</p>
            </div>
          </div>
          <SongPreview song={song} />
        </div>
      ) : null}
      {event ? (
        <div className="mt-4 text-sm leading-6">
          <p className="font-medium">{event.title}</p>
          <p className="text-muted">{weekdayLabel(locale, event.weekday)} {eventDateLabel(locale, event.date)} · {event.time}</p>
          <p className="text-muted">{event.venue}, {locationLabel(locale, event.area)}</p>
          <p className="mt-2">{event.blurb}</p>
        </div>
      ) : null}
      {enquiry || notice.kind === "enquiry" ? (
        !desk || readonly || notice.status === "completed" ? (
          <Button className="mt-6 w-full" variant="ghost" onClick={onClose}>{t("close")}</Button>
        ) : (
          <div className="mt-6 flex gap-2">
            <Button className="flex-1" onClick={() => resolveNotice(notice.id, "completed")}>{t("tickCompleted")}</Button>
            <Button variant="ghost" className="flex-1" onClick={onClose}>{t("cancel")}</Button>
          </div>
        )
      ) : desk && notice.status === "pending" ? (
        <div className="mt-6 flex gap-2">
          <Button className="flex-1" onClick={() => resolveNotice(notice.id, "approved")}>{t("approve")}</Button>
          <Button variant="outline" className="flex-1" onClick={() => resolveNotice(notice.id, "declined")}>{t("decline")}</Button>
        </div>
      ) : (
        <Button className="mt-6 w-full" variant="ghost" onClick={onClose}>{t("close")}</Button>
      )}
    </Sheet>
  );
}
