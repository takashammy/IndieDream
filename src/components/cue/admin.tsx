import { useMemo, useState, type ReactNode } from "react";
import { Briefcase, Calendar, Inbox, MessageSquare, Music2, Search, Trash2, Users } from "lucide-react";
import {
  CATEGORY_LABEL,
  APP_NAME,
  KIND_LABEL,
  ageLabel,
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BackRow, Confirm, ScreenHead, TextInput, VerifiedMark } from "./chrome";
import { NoticeSheet, labelFor } from "./inbox";

type DeskPage = "home" | "queue" | "bookings" | "people" | "user" | "roster" | "dates" | "board";

const DESKS: Array<{ id: Exclude<DeskPage, "home" | "user">; label: string }> = [
  { id: "queue", label: "Queue" },
  { id: "bookings", label: "Bookings" },
  { id: "people", label: "People" },
  { id: "roster", label: "Roster" },
  { id: "dates", label: "Dates" },
  { id: "board", label: "Board" },
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
          title="Ban this user?"
          body={`Remove ${banConfirm.name} from ${APP_NAME}. Their posts, profile, and login will go.`}
          confirmLabel="Yes"
          onConfirm={() => {
            banUser(banConfirm.id);
            setBanId(null);
            setUserId(null);
            setPage("people");
          }}
          onClose={() => setBanId(null)}
        />
      ) : null}
      {banPost ? (
        <Confirm
          title="Delete this post?"
          body={`Remove this post. You can also ban ${banPost.author} and take them off ${APP_NAME}.`}
          confirmLabel="Delete"
          onConfirm={() => deletePost(banPost.id)}
          onClose={() => setBanPostId(null)}
          extra={
            banPost.authorId
              ? {
                  label: `Ban and remove ${banPost.author}`,
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
          title="Delete this date?"
          body={`Remove “${dropEvent.title}” from ${APP_NAME}. This cannot be undone.`}
          confirmLabel="Yes"
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
          <BackRow label="People" onClick={() => go("people")} />
          <p className="mt-4 text-sm text-muted">That account is no longer on {APP_NAME}.</p>
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
      ? { kicker: "Review", title: "Queue", note: `${stats.queue.length} waiting` }
      : page === "bookings"
        ? { kicker: "Services", title: "Bookings", note: `${stats.bookingsOpen.length} open` }
        : page === "people"
          ? { kicker: "Directory", title: "People", note: `${accounts.length} on file` }
          : page === "roster"
            ? { kicker: "Artists", title: "Roster", note: `${stats.liveRoster.length} live` }
            : page === "dates"
              ? { kicker: "Calendar", title: "Dates", note: `${stats.pendingDates.length} pending` }
              : page === "board"
                ? { kicker: "Board", title: "Posts", note: `${stats.livePosts.length} live` }
                : null;

  return (
    <div className="cue-enter pb-12">
      {page === "home" ? (
        <ScreenHead kicker="Admin" title="Desk" note="Inner Soul Records" />
      ) : (
        <BackRow label="Desk" onClick={() => go("home")} />
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
            Log out
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
  const bits = [
    stats.queue.length ? `${stats.queue.length} in the review queue` : null,
    stats.bookingsOpen.length ? `${stats.bookingsOpen.length} open bookings` : null,
    stats.awaiting.length ? `${stats.awaiting.length} still off the live roster` : null,
  ].filter(Boolean);
  const briefing = bits.length ? `${bits.join(". ")}.` : "Nothing waiting. The catalogue is clear.";
  const attention = [
    ...stats.queue.slice(0, 4).map((n) => ({
      id: n.id,
      kicker: labelFor(n.kind),
      title: n.title,
      body: n.body,
      age: ageLabel(n.createdAt),
      go: () => onOpenNotice(n.id),
    })),
    ...stats.bookingsOpen.slice(0, 2).map((n) => ({
      id: n.id,
      kicker: enquiryType(n),
      title: n.title,
      body: n.body,
      age: ageLabel(n.createdAt),
      go: () => onOpen("bookings"),
    })),
  ].slice(0, 5);
  const nextDate = stats.upcoming[0] ?? null;

  const tiles: Array<{
    id: Exclude<DeskPage, "home" | "user">;
    label: string;
    value: number;
    hint: string;
    icon: typeof Inbox;
  }> = [
    { id: "queue", label: "Queue", value: counts.queue, hint: "to review", icon: Inbox },
    { id: "bookings", label: "Bookings", value: counts.bookings, hint: "open", icon: Briefcase },
    { id: "people", label: "People", value: counts.people, hint: "on file", icon: Users },
    { id: "roster", label: "Roster", value: counts.roster, hint: "live artists", icon: Music2 },
    { id: "dates", label: "Dates", value: counts.dates, hint: "pending + upcoming", icon: Calendar },
    { id: "board", label: "Board", value: counts.board, hint: "live posts", icon: MessageSquare },
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
                <span className="cue-kicker text-xs">{tile.label}</span>
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
              <span className="mt-3 block font-display text-3xl leading-none tabular-nums">{tile.value}</span>
              <span className="mt-2 block text-xs text-subtle">{tile.hint}</span>
            </button>
          );
        })}
      </div>

      <section className="mt-8">
        <div className="px-5 pb-2">
          <p className="cue-kicker text-xs text-muted">Needs a decision</p>
          <h2 className="cue-name font-display text-2xl leading-none">Attention</h2>
        </div>
        {attention.length === 0 ? (
          <p className="px-5 text-sm italic text-muted">Queue and bookings are clear.</p>
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
          <p className="cue-kicker text-xs text-muted">Next date</p>
          <button type="button" onClick={() => onOpen("dates")} className="mt-2 w-full rounded-lg bg-surface p-4 text-left">
            <p className="cue-kicker text-xs text-accent">
              {nextDate.weekday} {nextDate.date}
            </p>
            <p className="cue-name mt-1 font-display text-2xl leading-none">{nextDate.title}</p>
            <p className="mt-2 text-sm text-muted">
              {nextDate.time} · {nextDate.venue}, {nextDate.area}
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
            <span>{desk.label}</span>
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
          { id: "all", label: "All", count: counts.all },
          { id: "verify", label: "Artists", count: counts.verify },
          { id: "label", label: "Label", count: counts.label },
          { id: "song", label: "Tracks", count: counts.song },
          { id: "event", label: "Events", count: counts.event },
        ]}
      />
      {shown.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">Nothing in this filter.</p>
      ) : (
        <ul>
          {shown.map((n) => (
            <li key={n.id} className="border-t border-line">
              <button type="button" onClick={() => onOpen(n.id)} className="w-full px-5 pb-2 pt-4 text-left">
                <span className="flex items-center justify-between gap-3">
                  <span className="cue-kicker text-xs text-accent">{labelFor(n.kind)}</span>
                  <span className="text-xs tabular-nums text-subtle">{ageLabel(n.createdAt)}</span>
                </span>
                <span className="mt-1 block font-medium leading-snug">{n.title}</span>
                <span className="mt-1 block line-clamp-2 text-sm text-muted">{n.body}</span>
              </button>
              <div className="flex gap-2 px-5 pb-4">
                <Button size="sm" className="flex-1" onClick={() => onResolve(n.id, "approved")}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => onResolve(n.id, "declined")}>
                  Decline
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
  const items = mode === "open" ? open : done;

  return (
    <div>
      <FilterChips
        value={mode}
        onChange={setMode}
        options={[
          { id: "open", label: "Open", count: open.length },
          { id: "done", label: "Completed", count: done.length },
        ]}
      />
      <p className="px-5 pb-3 text-sm leading-6 text-muted">
        Purchases, rooms, and lessons. WhatsApp is on each brief.
      </p>
      {items.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">
          {mode === "open" ? "No open enquiries." : "Nothing completed yet."}
        </p>
      ) : (
        <ul>
          {items.map((n) => {
            const wa = n.fields?.WhatsApp ? whatsappHref(n.fields.WhatsApp) : undefined;
            return (
              <li key={n.id} className="border-t border-line">
                <button type="button" onClick={() => onOpen(n.id)} className="w-full px-5 pb-2 pt-4 text-left">
                  <span className="flex items-center justify-between gap-3">
                    <span className="cue-kicker text-xs text-accent">{enquiryType(n)}</span>
                    <span className="text-xs tabular-nums text-subtle">{ageLabel(n.createdAt)}</span>
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
                      Tick complete
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
                    <p className="flex h-9 flex-1 items-center text-xs italic text-subtle">No WhatsApp on file</p>
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
  const kinds: AccountKind[] = ["artist", "explorer", "business", "admin"];
  const query = q.trim().toLowerCase();
  const shown = accounts
    .filter((a) => (kind === "all" ? true : a.kind === kind))
    .filter((a) => {
      if (!query) return true;
      const hay = `${a.name} ${a.username} ${a.email} ${a.role} ${a.location} ${KIND_LABEL[a.kind]}`.toLowerCase();
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
            placeholder="Search name, email, username"
            aria-label="Search people"
          />
        </label>
      </div>
      <FilterChips<"all" | AccountKind>
        value={kind}
        onChange={setKind}
        options={[
          { id: "all", label: "All", count: accounts.length },
          ...kinds.map((k) => ({
            id: k as "all" | AccountKind,
            label: KIND_LABEL[k],
            count: accounts.filter((a) => a.kind === k).length,
          })),
        ]}
      />
      {shown.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">No one matches.</p>
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
                      @{user.username} · {KIND_LABEL[user.kind]}
                      {user.artistId ? " · Artist" : ""} · {user.location}
                    </p>
                  </div>
                  {!user.whatsapp && user.kind !== "admin" ? (
                    <span className="shrink-0 text-xs italic text-subtle">No WA</span>
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
          { id: "live", label: "Live", count: live.length },
          { id: "awaiting", label: "Awaiting", count: awaiting.length },
        ]}
      />
      {items.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">
          {mode === "live" ? "No live artists." : "Everyone listed is live."}
        </p>
      ) : (
        <ul>
          {items.map((artist) => {
            const acc = accountFor(artist.id);
            const pendingSongs = artist.songs.filter((s) => s.status === "pending").length;
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
                        {artist.role} · {artist.area}
                        {mode === "awaiting"
                          ? ` · ${pendingSongs} pending track${pendingSongs === 1 ? "" : "s"}`
                          : ` · ${artist.songs.filter((s) => s.status === "approved").length} live`}
                      </p>
                    </div>
                  </button>
                  {notice ? (
                    <Button size="sm" variant="subtle" onClick={() => onOpenNotice(notice.id)}>
                      Review
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
  const items = mode === "pending" ? pending : mode === "upcoming" ? upcoming : past;

  return (
    <div>
      <FilterChips
        value={mode}
        onChange={setMode}
        options={[
          { id: "pending", label: "Pending", count: pending.length },
          { id: "upcoming", label: "Upcoming", count: upcoming.length },
          { id: "past", label: "Past", count: past.length },
        ]}
      />
      {items.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">No dates in this filter.</p>
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
                  {event.weekday} {event.date} · {event.time}
                </p>
                <p className="mt-1 font-medium leading-snug">{event.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {event.venue}, {event.area}
                </p>
                <p className="mt-1 text-xs text-subtle">{lineup}</p>
                <div className="mt-3 flex gap-2">
                  {notice ? (
                    <>
                      <Button size="sm" className="flex-1" onClick={() => onApprove(notice.id)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => onDecline(notice.id)}>
                        Decline
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => onDelete(event.id)}>
                      Delete
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
  const items = mode === "live" ? live : archived;

  return (
    <div>
      <FilterChips
        value={mode}
        onChange={setMode}
        options={[
          { id: "live", label: "Live", count: live.length },
          { id: "archive", label: "Archived", count: archived.length },
        ]}
      />
      <p className="px-5 pb-3 text-sm italic text-muted">
        {mode === "archive" ? "Posts older than 30 days. Admin only." : "Current board. Delete or ban from here."}
      </p>
      {items.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">{mode === "live" ? "Board is empty." : "No archived posts."}</p>
      ) : (
        <ul>
          {items.map((post) => (
            <li key={post.id} className="border-t border-line">
              <div className="flex items-start">
                <div className="min-w-0 flex-1 px-5 py-4">
                  <p className="cue-kicker text-xs text-accent">{CATEGORY_LABEL[post.category]}</p>
                  <p className="mt-1 font-medium leading-snug">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{post.body}</p>
                  <p className="mt-2 text-xs text-subtle">
                    {post.author} · {ageLabel(post.createdAt) || post.time} · {post.thread.length}{" "}
                    {post.thread.length === 1 ? "reply" : "replies"}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex size-11 shrink-0 items-center justify-center text-muted"
                  aria-label="Delete post"
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
  const wa = whatsappHref(user.whatsapp);
  return (
    <div className="cue-enter pb-12">
      <BackRow label="People" onClick={onBack} />
      <div className="flex items-end gap-4 px-5 pt-2">
        <img src={user.photo} alt="" className="size-20 rounded-lg object-cover" />
        <div>
          <p className="cue-name flex items-center gap-1.5 font-display text-2xl leading-tight">
            {user.name}
            {artist?.verified ? <VerifiedMark /> : null}
          </p>
          <p className="text-sm text-muted">
            @{user.username} · {KIND_LABEL[user.kind]}
            {user.artistId ? " · Artist" : ""}
          </p>
        </div>
      </div>
      <dl className="mt-6 space-y-3 px-5 text-sm">
        <InfoRow label="Email" value={user.email} href={user.email ? `mailto:${user.email}` : undefined} />
        <div className="grid grid-cols-[7rem_1fr] gap-2">
          <dt className="text-muted">WhatsApp</dt>
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
        <InfoRow label="Location" value={user.location} />
        <InfoRow label="Role" value={artist?.role ?? user.role} />
        {artist ? (
          <>
            <InfoRow label="Label" value={artist.labelApproved ? artist.label : `${artist.label} (pending)`} />
            <InfoRow label="Genres" value={artist.genres.join(", ")} />
            <InfoRow
              label="Tracks"
              value={`${artist.songs.length} · ${artist.songs.filter((s) => s.status === "approved").length} live`}
            />
          </>
        ) : null}
      </dl>
      {user.bio ? <p className="mt-6 px-5 text-sm leading-6 text-muted">{user.bio}</p> : null}
      <div className="flex flex-col gap-2 px-5 pt-8">
        {onOpenArtist ? (
          <Button className="w-full" onClick={onOpenArtist}>
            Open artist page
          </Button>
        ) : null}
        {user.kind !== "admin" ? (
          <Button variant="outline" className="w-full" onClick={onBan}>
            Ban user
          </Button>
        ) : (
          <p className="text-sm italic text-subtle">Admin accounts cannot be banned.</p>
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

function enquiryType(n: Notice) {
  if (n.fields?.Package) return "Purchase";
  if (n.title.startsWith("Lesson")) return "Lesson";
  if (n.title.startsWith("MaaS")) return "MaaS";
  return "Enquiry";
}
