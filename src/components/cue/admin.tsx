import { useMemo, useState, type ReactNode } from "react";
import { Briefcase, Calendar, Inbox, MessageSquare, Music2, Search, Trash2, Users } from "lucide-react";
import {
  APP_NAME,
  isListedArtist,
  isPostExpired,
  upcomingEvents,
  todayISO,
  whatsappHref,
  type AccountKind,
  type Artist,
  type BoardPost,
  type CueEvent,
} from "@/lib/data";
import { currentAccount, useCue, type Account, type Notice } from "@/lib/store";
import { scrollMainToTop } from "@/lib/scroll-main";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BackRow, Confirm, ScreenHead, SelectInput, TextInput, VerifiedMark } from "./chrome";
import { NoticeSheet } from "./inbox";
import {
  ageText,
  categoryLabel,
  enquiryTypeLabel,
  eventDateLabel,
  genreLabel,
  kindLabel,
  locationLabel,
  noticeKindLabel,
  useLocale,
  useT,
  weekdayLabel,
  type Msg,
} from "@/lib/i18n";

type DeskPage = "home" | "queue" | "bookings" | "people" | "user" | "roster" | "dates" | "board";

const DESKS: Array<{ id: Exclude<DeskPage, "home" | "user">; label: Msg }> = [
  { id: "queue", label: "queue" },
  { id: "bookings", label: "bookings" },
  { id: "people", label: "people" },
  { id: "roster", label: "roster" },
  { id: "dates", label: "dates" },
  { id: "board", label: "boardKicker" },
];

export function AdminMe({ artistPanel }: { artistPanel?: ReactNode }) {
  const acc = useCue((s) => currentAccount(s))!;
  const logout = useCue((s) => s.logout);
  const notices = useCue((s) => s.notices);
  const noticeId = useCue((s) => s.noticeId);
  const openNotice = useCue((s) => s.openNotice);
  const posts = useCue((s) => s.posts);
  const deleted = useCue((s) => s.deletedPostIds);
  const accounts = useCue((s) => s.accounts);
  const artists = useCue((s) => s.artists);
  const events = useCue((s) => s.events);
  const banUser = useCue((s) => s.banUser);
  const deletePost = useCue((s) => s.deletePost);
  const deleteEvent = useCue((s) => s.deleteEvent);
  const resolveNotice = useCue((s) => s.resolveNotice);
  const openArtist = useCue((s) => s.openArtist);
  const t = useT();

  const [page, setPage] = useState<DeskPage>("home");
  const [userId, setUserId] = useState<string | null>(null);
  const [banId, setBanId] = useState<string | null>(null);
  const [banPostId, setBanPostId] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [dropEventId, setDropEventId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const queue = notices.filter((n) => n.status === "pending" && n.kind !== "enquiry");
    const bookingsOpen = notices.filter((n) => n.kind === "enquiry" && n.status === "pending");
    const bookingsDone = notices.filter((n) => n.kind === "enquiry" && n.status === "completed");
    const liveRoster = artists.filter(isListedArtist);
    const awaiting = artists.filter((a) => !isListedArtist(a));
    const livePosts = posts.filter((p) => !deleted.includes(p.id) && !isPostExpired(p));
    const archived = posts.filter((p) => !deleted.includes(p.id) && isPostExpired(p));
    const pendingDates = events
      .filter((e) => e.status === "pending")
      .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
    const upcoming = upcomingEvents(events, 12);
    const today = todayISO();
    const past = events
      .filter((e) => e.status === "approved" && e.isoDate < today)
      .sort((a, b) => b.isoDate.localeCompare(a.isoDate));
    return {
      queue,
      bookingsOpen,
      bookingsDone,
      liveRoster,
      awaiting,
      livePosts,
      archived,
      pendingDates,
      upcoming,
      past,
    };
  }, [notices, artists, posts, deleted, events]);

  const viewed = accounts.find((a) => a.id === userId) ?? null;
  const viewedArtist = viewed?.artistId ? (artists.find((a) => a.id === viewed.artistId) ?? null) : null;
  const selectedQueue = stats.queue.find((n) => n.id === noticeId) ?? null;
  const selectedBooking =
    [...stats.bookingsOpen, ...stats.bookingsDone].find((n) => n.id === noticeId || n.id === doneId) ?? null;
  const banPost = [...stats.livePosts, ...stats.archived].find((p) => p.id === banPostId) ?? null;
  const banConfirm = banId ? (accounts.find((a) => a.id === banId) ?? viewed) : null;
  const dropEvent = events.find((e) => e.id === dropEventId) ?? null;

  const counts: Record<Exclude<DeskPage, "home" | "user">, number> = {
    queue: stats.queue.length,
    bookings: stats.bookingsOpen.length,
    people: accounts.length,
    roster: stats.liveRoster.length,
    dates: stats.pendingDates.length + stats.upcoming.length,
    board: stats.livePosts.length,
  };

  function go(next: DeskPage, id?: string) {
    setPage(next);
    if (next === "user" && id) setUserId(id);
    if (next !== "user") setUserId(null);
    openNotice(null);
    setDoneId(null);
    scrollMainToTop();
  }

  const overlays = (
    <>
      {selectedQueue ? <NoticeSheet notice={selectedQueue} onClose={() => openNotice(null)} /> : null}
      {selectedBooking && page !== "queue" ? (
        <NoticeSheet
          enquiry
          readonly={selectedBooking.status === "completed"}
          notice={selectedBooking}
          onClose={() => {
            openNotice(null);
            setDoneId(null);
          }}
        />
      ) : null}
      {banConfirm ? (
        <Confirm
          title={t("banUserQ")}
          body={t("banUserBody", { name: banConfirm.name, app: APP_NAME })}
          confirmLabel={t("yes")}
          onConfirm={() => {
            banUser(banConfirm.id);
            setBanId(null);
            setUserId(null);
            setPage("people");
            scrollMainToTop();
          }}
          onClose={() => setBanId(null)}
        />
      ) : null}
      {banPost ? (
        <Confirm
          title={t("deleteThis", { noun: t("post") })}
          body={t("removeBoard", { noun: t("post"), author: banPost.author, app: APP_NAME })}
          confirmLabel={t("delete")}
          onConfirm={() => deletePost(banPost.id)}
          onClose={() => setBanPostId(null)}
          extra={
            banPost.authorId
              ? {
                  label: t("banRemove", { author: banPost.author }),
                  onClick: () => {
                    deletePost(banPost.id);
                    banUser(banPost.authorId!);
                  },
                }
              : undefined
          }
        />
      ) : null}
      {dropEvent ? (
        <Confirm
          title={t("deleteDateQ")}
          body={t("removeEvent", { title: dropEvent.title, app: APP_NAME })}
          confirmLabel={t("yes")}
          onConfirm={() => deleteEvent(dropEvent.id)}
          onClose={() => setDropEventId(null)}
        />
      ) : null}
    </>
  );

  if (page === "user") {
    if (!viewed) {
      return (
        <div className="cue-enter px-5 py-10">
          <BackRow label={t("people")} onClick={() => go("people")} />
          <p className="mt-4 text-sm text-muted">{t("noLonger", { app: APP_NAME })}</p>
        </div>
      );
    }
    return (
      <>
        <AdminUserProfile
          user={viewed}
          artist={viewedArtist}
          onBack={() => go("people")}
          onBan={() => setBanId(viewed.id)}
          onOpenArtist={viewed.artistId ? () => openArtist(viewed.artistId!) : undefined}
        />
        {overlays}
      </>
    );
  }

  const head =
    page === "queue"
      ? { kicker: t("review"), title: t("queue"), note: t("nWaiting", { n: stats.queue.length }) }
      : page === "bookings"
        ? { kicker: t("services"), title: t("bookings"), note: t("nOpen", { n: stats.bookingsOpen.length }) }
        : page === "people"
          ? { kicker: t("directory"), title: t("people"), note: t("nOnFile", { n: accounts.length }) }
          : page === "roster"
            ? { kicker: t("tabArtists"), title: t("roster"), note: t("nLiveCount", { n: stats.liveRoster.length }) }
            : page === "dates"
              ? { kicker: t("calendar"), title: t("dates"), note: t("nPendingCount", { n: stats.pendingDates.length }) }
              : page === "board"
                ? { kicker: t("boardKicker"), title: t("posts"), note: t("nLiveCount", { n: stats.livePosts.length }) }
                : null;

  return (
    <div className="cue-enter pb-12">
      {page === "home" ? (
        <ScreenHead kicker={t("admin")} title={t("desk")} note={t("innerSoulRecords")} />
      ) : (
        <BackRow label={t("desk")} onClick={() => go("home")} />
      )}

      {head ? <ScreenHead kicker={head.kicker} title={head.title} note={head.note} /> : null}

      {page === "home" ? (
        <>
          <DeskHome
            name={acc.name}
            stats={stats}
            counts={counts}
            onOpen={go}
            onOpenNotice={(id) => openNotice(id)}
          />
          {artistPanel}
        </>
      ) : (
        <DeskNav page={page} counts={counts} onOpen={go} />
      )}

      {page === "queue" ? (
        <DeskQueue
          items={stats.queue}
          onOpen={(id) => openNotice(id)}
          onResolve={(id, status) => resolveNotice(id, status)}
        />
      ) : null}
      {page === "bookings" ? (
        <DeskBookings
          open={stats.bookingsOpen}
          done={stats.bookingsDone}
          onOpen={(id) => {
            openNotice(id);
            setDoneId(id);
          }}
          onComplete={(id) => resolveNotice(id, "completed")}
        />
      ) : null}
      {page === "people" ? (
        <DeskPeople
          accounts={accounts}
          artists={artists}
          onOpen={(id) => go("user", id)}
        />
      ) : null}
      {page === "roster" ? (
        <DeskRoster
          live={stats.liveRoster}
          awaiting={stats.awaiting}
          accounts={accounts}
          queue={stats.queue}
          onOpenUser={(id) => go("user", id)}
          onOpenNotice={(id) => {
            go("queue");
            openNotice(id);
          }}
          onOpenArtist={openArtist}
        />
      ) : null}
      {page === "dates" ? (
        <DeskDates
          pending={stats.pendingDates}
          upcoming={stats.upcoming}
          past={stats.past}
          artists={artists}
          notices={notices}
          onApprove={(noticeId) => resolveNotice(noticeId, "approved")}
          onDecline={(noticeId) => resolveNotice(noticeId, "declined")}
          onDelete={(id) => setDropEventId(id)}
        />
      ) : null}
      {page === "board" ? (
        <DeskBoard
          live={stats.livePosts}
          archived={stats.archived}
          onDelete={(id) => setBanPostId(id)}
        />
      ) : null}

      {page === "home" ? (
        <div className="px-5 pt-8">
          <Button variant="ghost" className="w-full" onClick={logout}>
            {t("logOut")}
          </Button>
        </div>
      ) : null}

      {overlays}
    </div>
  );
}

function DeskHome({
  name,
  stats,
  counts,
  onOpen,
  onOpenNotice,
}: {
  name: string;
  stats: {
    queue: Notice[];
    bookingsOpen: Notice[];
    awaiting: Artist[];
    upcoming: ReturnType<typeof upcomingEvents>;
  };
  counts: Record<Exclude<DeskPage, "home" | "user">, number>;
  onOpen: (page: DeskPage) => void;
  onOpenNotice: (id: string) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const bits = [
    stats.queue.length ? t("inReviewQueue", { n: stats.queue.length }) : null,
    stats.bookingsOpen.length ? t("openBookings", { n: stats.bookingsOpen.length }) : null,
    stats.awaiting.length ? t("stillOffRoster", { n: stats.awaiting.length }) : null,
  ].filter(Boolean);
  const briefing = bits.length ? `${bits.join(". ")}.` : t("nothingWaiting");
  const attention = [
    ...stats.queue.slice(0, 4).map((n) => ({
      id: n.id,
      kicker: noticeKindLabel(locale, n.kind),
      title: n.title,
      body: n.body,
      age: ageText(locale, n.createdAt),
      go: () => onOpenNotice(n.id),
    })),
    ...stats.bookingsOpen.slice(0, 2).map((n) => ({
      id: n.id,
      kicker: enquiryTypeLabel(locale, n.title, n.fields),
      title: n.title,
      body: n.body,
      age: ageText(locale, n.createdAt),
      go: () => onOpen("bookings"),
    })),
  ].slice(0, 5);
  const nextDate = stats.upcoming[0] ?? null;

  const tiles: Array<{
    id: Exclude<DeskPage, "home" | "user">;
    label: Msg;
    value: number;
    hint: Msg;
    icon: typeof Inbox;
  }> = [
    { id: "queue", label: "queue", value: counts.queue, hint: "toReview", icon: Inbox },
    { id: "bookings", label: "bookings", value: counts.bookings, hint: "openHint", icon: Briefcase },
    { id: "people", label: "people", value: counts.people, hint: "onFile", icon: Users },
    { id: "roster", label: "roster", value: counts.roster, hint: "liveArtists", icon: Music2 },
    { id: "dates", label: "dates", value: counts.dates, hint: "pendingUpcoming", icon: Calendar },
    { id: "board", label: "boardKicker", value: counts.board, hint: "livePosts", icon: MessageSquare },
  ];

  return (
    <>
      <div className="px-5">
        <p className="cue-name font-display text-2xl leading-tight">{name}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{briefing}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 px-5">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => onOpen(tile.id)}
              className="rounded-lg bg-surface p-4 text-left"
            >
              <span className="flex items-center justify-between text-muted">
                <span className="cue-kicker text-xs">{t(tile.label)}</span>
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
              <span className="mt-3 block font-display text-3xl leading-none tabular-nums">{tile.value}</span>
              <span className="mt-2 block text-xs text-subtle">{t(tile.hint)}</span>
            </button>
          );
        })}
      </div>

      <section className="mt-8">
        <div className="px-5 pb-2">
          <p className="cue-kicker text-xs text-muted">{t("needsDecision")}</p>
          <h2 className="cue-name font-display text-2xl leading-none">{t("attention")}</h2>
        </div>
        {attention.length === 0 ? (
          <p className="px-5 text-sm italic text-muted">{t("queueClear")}</p>
        ) : (
          <ul>
            {attention.map((item) => (
              <li key={item.id} className="border-t border-line">
                <button type="button" onClick={item.go} className="w-full px-5 py-4 text-left">
                  <span className="flex items-center justify-between gap-3">
                    <span className="cue-kicker text-xs text-accent">{item.kicker}</span>
                    <span className="text-xs tabular-nums text-subtle">{item.age}</span>
                  </span>
                  <span className="mt-1 block font-medium leading-snug">{item.title}</span>
                  <span className="mt-1 block line-clamp-2 text-sm text-muted">{item.body}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {nextDate ? (
        <section className="mt-8 px-5">
          <p className="cue-kicker text-xs text-muted">{t("nextDate")}</p>
          <button type="button" onClick={() => onOpen("dates")} className="mt-2 w-full rounded-lg bg-surface p-4 text-left">
            <p className="cue-kicker text-xs text-accent">
              {weekdayLabel(locale, nextDate.weekday)} {eventDateLabel(locale, nextDate.date)}
            </p>
            <p className="cue-name mt-1 font-display text-2xl leading-none">{nextDate.title}</p>
            <p className="mt-2 text-sm text-muted">
              {nextDate.time} · {nextDate.venue}, {locationLabel(locale, nextDate.area)}
            </p>
          </button>
        </section>
      ) : null}
    </>
  );
}

function DeskNav({
  page,
  counts,
  onOpen,
}: {
  page: DeskPage;
  counts: Record<Exclude<DeskPage, "home" | "user">, number>;
  onOpen: (page: DeskPage) => void;
}) {
  const t = useT();
  return (
    <div className={cn("scrollbar-none flex flex-nowrap gap-2 overflow-x-auto px-5 pb-1", page === "home" ? "mt-6" : "mt-1")}>
      {DESKS.map((desk) => {
        const active = page === desk.id;
        return (
          <button
            key={desk.id}
            type="button"
            onClick={() => onOpen(desk.id)}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm",
              active ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
            )}
          >
            <span>{t(desk.label)}</span>
            <span className="tabular-nums">{counts[desk.id]}</span>
          </button>
        );
      })}
    </div>
  );
}

function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ id: T; label: string; count?: number }>;
}) {
  return (
    <div className="scrollbar-none flex flex-nowrap gap-2 overflow-x-auto px-5 pb-3">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm",
              active ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
            )}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined ? <span className="tabular-nums">{opt.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function DeskQueue({
  items,
  onOpen,
  onResolve,
}: {
  items: Notice[];
  onOpen: (id: string) => void;
  onResolve: (id: string, status: "approved" | "declined") => void;
}) {
  const [kind, setKind] = useState<"all" | Notice["kind"]>("all");
  const t = useT();
  const { locale } = useLocale();
  const counts = {
    all: items.length,
    verify: items.filter((n) => n.kind === "verify").length,
    label: items.filter((n) => n.kind === "label").length,
    song: items.filter((n) => n.kind === "song").length,
    event: items.filter((n) => n.kind === "event").length,
  };
  const shown = kind === "all" ? items : items.filter((n) => n.kind === kind);

  return (
    <div>
      <FilterChips
        value={kind}
        onChange={setKind}
        options={[
          { id: "all", label: t("all"), count: counts.all },
          { id: "verify", label: t("tabArtists"), count: counts.verify },
          { id: "label", label: t("label"), count: counts.label },
          { id: "song", label: t("tracks"), count: counts.song },
          { id: "event", label: t("tabEvents"), count: counts.event },
        ]}
      />
      {shown.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">{t("nothingInFilter")}</p>
      ) : (
        <ul>
          {shown.map((n) => (
            <li key={n.id} className="border-t border-line">
              <button type="button" onClick={() => onOpen(n.id)} className="w-full px-5 pb-2 pt-4 text-left">
                <span className="flex items-center justify-between gap-3">
                  <span className="cue-kicker text-xs text-accent">{noticeKindLabel(locale, n.kind)}</span>
                  <span className="text-xs tabular-nums text-subtle">{ageText(locale, n.createdAt)}</span>
                </span>
                <span className="mt-1 block font-medium leading-snug">{n.title}</span>
                <span className="mt-1 block line-clamp-2 text-sm text-muted">{n.body}</span>
              </button>
              <div className="flex gap-2 px-5 pb-4">
                <Button size="sm" className="flex-1" onClick={() => onResolve(n.id, "approved")}>
                  {t("approve")}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => onResolve(n.id, "declined")}>
                  {t("decline")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeskBookings({
  open,
  done,
  onOpen,
  onComplete,
}: {
  open: Notice[];
  done: Notice[];
  onOpen: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const [mode, setMode] = useState<"open" | "done">("open");
  const t = useT();
  const { locale } = useLocale();
  const items = mode === "open" ? open : done;

  return (
    <div>
      <FilterChips
        value={mode}
        onChange={setMode}
        options={[
          { id: "open", label: t("open"), count: open.length },
          { id: "done", label: t("completed"), count: done.length },
        ]}
      />
      <p className="px-5 pb-3 text-sm leading-6 text-muted">{t("bookingsBrief")}</p>
      {items.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">
          {mode === "open" ? t("noOpenEnquiries") : t("nothingCompleted")}
        </p>
      ) : (
        <ul>
          {items.map((n) => {
            const wa = n.fields?.WhatsApp ? whatsappHref(n.fields.WhatsApp) : undefined;
            return (
              <li key={n.id} className="border-t border-line">
                <button type="button" onClick={() => onOpen(n.id)} className="w-full px-5 pb-2 pt-4 text-left">
                  <span className="flex items-center justify-between gap-3">
                    <span className="cue-kicker text-xs text-accent">{enquiryTypeLabel(locale, n.title, n.fields)}</span>
                    <span className="text-xs tabular-nums text-subtle">{ageText(locale, n.createdAt)}</span>
                  </span>
                  <span className="mt-1 block font-medium leading-snug">{n.title}</span>
                  <span className="mt-1 block line-clamp-2 text-sm text-muted">{n.body}</span>
                  <span className="mt-1 block text-xs text-subtle">
                    {[n.fields?.From, n.fields?.WhatsApp].filter(Boolean).join(" · ")}
                  </span>
                </button>
                <div className="flex gap-2 px-5 pb-4">
                  {mode === "open" ? (
                    <Button size="sm" className="flex-1" onClick={() => onComplete(n.id)}>
                      {t("tickComplete")}
                    </Button>
                  ) : null}
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "inline-flex h-9 flex-1 items-center justify-center rounded-md px-3 text-sm font-medium",
                        mode === "open" ? "bg-elevated text-fg" : "bg-accent text-accent-fg",
                      )}
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <p className="flex h-9 flex-1 items-center text-xs italic text-subtle">{t("noWhatsAppOnFile")}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DeskPeople({
  accounts,
  artists,
  onOpen,
}: {
  accounts: Account[];
  artists: Artist[];
  onOpen: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | AccountKind>("all");
  const t = useT();
  const { locale } = useLocale();
  const kinds: AccountKind[] = ["artist", "explorer", "business", "admin"];
  const query = q.trim().toLowerCase();
  const shown = accounts
    .filter((a) => (kind === "all" ? true : a.kind === kind))
    .filter((a) => {
      if (!query) return true;
      const hay = `${a.name} ${a.username} ${a.email} ${a.role} ${a.location} ${kindLabel(locale, a.kind)}`.toLowerCase();
      return hay.includes(query);
    })
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="px-5 pb-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <TextInput
            className="mt-0 pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPeoplePlaceholder")}
            aria-label={t("searchPeople")}
          />
        </label>
      </div>
      <FilterChips<"all" | AccountKind>
        value={kind}
        onChange={setKind}
        options={[
          { id: "all", label: t("all"), count: accounts.length },
          ...kinds.map((k) => ({
            id: k as "all" | AccountKind,
            label: kindLabel(locale, k),
            count: accounts.filter((a) => a.kind === k).length,
          })),
        ]}
      />
      {shown.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">{t("noOneMatches")}</p>
      ) : (
        <ul>
          {shown.map((user) => {
            const artist = user.artistId ? artists.find((a) => a.id === user.artistId) : undefined;
            return (
              <li key={user.id} className="border-t border-line">
                <button type="button" onClick={() => onOpen(user.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                  <img src={user.photo} alt="" className="size-12 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-medium">
                      {user.name}
                      {artist?.verified ? <VerifiedMark /> : null}
                    </p>
                    <p className="truncate text-xs text-muted">
                      @{user.username} · {kindLabel(locale, user.kind)}
                      {user.artistId ? t("linkedArtist") : ""} · {locationLabel(locale, user.location)}
                    </p>
                  </div>
                  {!user.whatsapp && user.kind !== "admin" ? (
                    <span className="shrink-0 text-xs italic text-subtle">{t("noWA")}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DeskRoster({
  live,
  awaiting,
  accounts,
  queue,
  onOpenUser,
  onOpenNotice,
  onOpenArtist,
}: {
  live: Artist[];
  awaiting: Artist[];
  accounts: Account[];
  queue: Notice[];
  onOpenUser: (id: string) => void;
  onOpenNotice: (id: string) => void;
  onOpenArtist: (id: string) => void;
}) {
  const [mode, setMode] = useState<"live" | "awaiting">("live");
  const t = useT();
  const { locale } = useLocale();
  const items = mode === "live" ? live : awaiting;

  function accountFor(artistId: string) {
    return accounts.find((a) => a.artistId === artistId);
  }

  return (
    <div>
      <FilterChips
        value={mode}
        onChange={setMode}
        options={[
          { id: "live", label: t("liveOn"), count: live.length },
          { id: "awaiting", label: t("awaitingRoster"), count: awaiting.length },
        ]}
      />
      {items.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">
          {mode === "live" ? t("noLiveArtists") : t("everyoneLive")}
        </p>
      ) : (
        <ul>
          {items.map((artist) => {
            const acc = accountFor(artist.id);
            const pendingSongs = artist.songs.filter((s) => s.status === "pending").length;
            const liveSongs = artist.songs.filter((s) => s.status === "approved").length;
            const notice =
              queue.find((n) => n.refId === artist.id && (n.kind === "verify" || n.kind === "label")) ??
              queue.find((n) => artist.songs.some((s) => s.id === n.refId));
            return (
              <li key={artist.id} className="border-t border-line">
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => (acc ? onOpenUser(acc.id) : onOpenArtist(artist.id))}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <img src={artist.photo} alt="" className="size-12 rounded-md object-cover" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-medium">
                        {artist.name}
                        {artist.verified ? <VerifiedMark /> : null}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {artist.role} · {locationLabel(locale, artist.area)}
                        {mode === "awaiting"
                          ? ` · ${pendingSongs === 1 ? t("pendingTrack", { n: pendingSongs }) : t("pendingTracks", { n: pendingSongs })}`
                          : ` · ${t("nLiveSongs", { n: liveSongs })}`}
                      </p>
                    </div>
                  </button>
                  {notice ? (
                    <Button size="sm" variant="subtle" onClick={() => onOpenNotice(notice.id)}>
                      {t("review")}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DeskDates({
  pending,
  upcoming,
  past,
  artists,
  notices,
  onApprove,
  onDecline,
  onDelete,
}: {
  pending: CueEvent[];
  upcoming: CueEvent[];
  past: CueEvent[];
  artists: Artist[];
  notices: Notice[];
  onApprove: (noticeId: string) => void;
  onDecline: (noticeId: string) => void;
  onDelete: (id: string) => void;
}) {
  const [mode, setMode] = useState<"pending" | "upcoming" | "past">(pending.length ? "pending" : "upcoming");
  const t = useT();
  const { locale } = useLocale();
  const items = mode === "pending" ? pending : mode === "upcoming" ? upcoming : past;

  return (
    <div>
      <FilterChips
        value={mode}
        onChange={setMode}
        options={[
          { id: "pending", label: t("pending"), count: pending.length },
          { id: "upcoming", label: t("upcoming"), count: upcoming.length },
          { id: "past", label: t("past"), count: past.length },
        ]}
      />
      {items.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">{t("noDatesInFilter")}</p>
      ) : (
        <ul>
          {items.map((event) => {
            const notice = notices.find((n) => n.kind === "event" && n.refId === event.id && n.status === "pending");
            const lineup = event.artistIds
              .map((id) => artists.find((a) => a.id === id)?.name ?? id)
              .join(", ");
            return (
              <li key={event.id} className="border-t border-line px-5 py-4">
                <p className="cue-kicker text-xs text-accent">
                  {weekdayLabel(locale, event.weekday)} {eventDateLabel(locale, event.date)} · {event.time}
                </p>
                <p className="mt-1 font-medium leading-snug">{event.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {event.venue}, {locationLabel(locale, event.area)}
                </p>
                <p className="mt-1 text-xs text-subtle">{lineup}</p>
                <div className="mt-3 flex gap-2">
                  {notice ? (
                    <>
                      <Button size="sm" className="flex-1" onClick={() => onApprove(notice.id)}>
                        {t("approve")}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => onDecline(notice.id)}>
                        {t("decline")}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => onDelete(event.id)}>
                      {t("delete")}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DeskBoard({
  live,
  archived,
  onDelete,
}: {
  live: BoardPost[];
  archived: BoardPost[];
  onDelete: (id: string) => void;
}) {
  const [mode, setMode] = useState<"live" | "archive">("live");
  const t = useT();
  const { locale } = useLocale();
  const items = mode === "live" ? live : archived;

  return (
    <div>
      <FilterChips
        value={mode}
        onChange={setMode}
        options={[
          { id: "live", label: t("liveOn"), count: live.length },
          { id: "archive", label: t("archived"), count: archived.length },
        ]}
      />
      <p className="px-5 pb-3 text-sm italic text-muted">
        {mode === "archive" ? t("archiveNote") : t("liveBoardNote")}
      </p>
      {items.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">{mode === "live" ? t("boardEmpty") : t("noArchivedPosts")}</p>
      ) : (
        <ul>
          {items.map((post) => (
            <li key={post.id} className="border-t border-line">
              <div className="flex items-start">
                <div className="min-w-0 flex-1 px-5 py-4">
                  <p className="cue-kicker text-xs text-accent">{categoryLabel(locale, post.category)}</p>
                  <p className="mt-1 font-medium leading-snug">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{post.body}</p>
                  <p className="mt-2 text-xs text-subtle">
                    {post.author} · {ageText(locale, post.createdAt) || post.time} · {post.thread.length}{" "}
                    {post.thread.length === 1 ? t("reply") : t("replies")}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex size-11 shrink-0 items-center justify-center text-muted"
                  aria-label={t("deletePost")}
                  onClick={() => onDelete(post.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminUserProfile({
  user,
  artist,
  onBack,
  onBan,
  onOpenArtist,
}: {
  user: Account;
  artist: Artist | null;
  onBack: () => void;
  onBan: () => void;
  onOpenArtist?: () => void;
}) {
  const setAccountKind = useCue((s) => s.setAccountKind);
  const wa = whatsappHref(user.whatsapp);
  const t = useT();
  const { locale } = useLocale();
  return (
    <div className="cue-enter pb-12">
      <BackRow label={t("people")} onClick={onBack} />
      <div className="flex items-end gap-4 px-5 pt-2">
        <img src={user.photo} alt="" className="size-20 rounded-lg object-cover" />
        <div>
          <p className="cue-name flex items-center gap-1.5 font-display text-2xl leading-tight">
            {user.name}
            {artist?.verified ? <VerifiedMark /> : null}
          </p>
          <p className="text-sm text-muted">
            @{user.username} · {kindLabel(locale, user.kind)}
            {user.artistId ? t("linkedArtist") : ""}
          </p>
        </div>
      </div>
      <dl className="mt-6 space-y-3 px-5 text-sm">
        <InfoRow label={t("email")} value={user.email} href={user.email ? `mailto:${user.email}` : undefined} />
        <div className="grid grid-cols-[7rem_1fr] gap-2">
          <dt className="text-muted">{t("fldWhatsApp")}</dt>
          <dd>
            {wa ? (
              <a href={wa} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">
                {user.whatsapp}
              </a>
            ) : (
              user.whatsapp || "—"
            )}
          </dd>
        </div>
        <InfoRow label={t("location")} value={locationLabel(locale, user.location)} />
        <InfoRow label={t("role")} value={artist?.role ?? user.role} />
        {artist ? (
          <>
            <InfoRow label={t("label")} value={artist.labelApproved ? artist.label : t("labelPending", { label: artist.label })} />
            <InfoRow label={t("genres")} value={artist.genres.map((g) => genreLabel(locale, g)).join(", ")} />
            <InfoRow
              label={t("tracks")}
              value={t("tracksLive", { n: artist.songs.length, live: artist.songs.filter((s) => s.status === "approved").length })}
            />
          </>
        ) : null}
      </dl>
      {user.kind !== "admin" ? (
        <div className="mt-6 px-5">
          <p className="text-xs text-muted">{t("userType")}</p>
          <SelectInput
            value={user.kind}
            onChange={(e) => setAccountKind(user.id, e.target.value as Exclude<AccountKind, "admin">)}
          >
            <option value="explorer">{t("kindExplorer")}</option>
            <option value="artist">{t("kindArtist")}</option>
            <option value="business">{t("kindBusiness")}</option>
          </SelectInput>
        </div>
      ) : null}
      {user.bio ? <p className="mt-6 px-5 text-sm leading-6 text-muted">{user.bio}</p> : null}
      <div className="flex flex-col gap-2 px-5 pt-8">
        {onOpenArtist ? (
          <Button className="w-full" onClick={onOpenArtist}>
            {t("openArtistPage")}
          </Button>
        ) : null}
        {user.kind !== "admin" ? (
          <Button variant="outline" className="w-full" onClick={onBan}>
            {t("banUser")}
          </Button>
        ) : (
          <p className="text-sm italic text-subtle">{t("adminNoBan")}</p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <dt className="text-muted">{label}</dt>
      <dd>
        {href ? (
          <a href={href} className="text-accent underline-offset-2 hover:underline">
            {value || "—"}
          </a>
        ) : (
          value || "—"
        )}
      </dd>
    </div>
  );
}
