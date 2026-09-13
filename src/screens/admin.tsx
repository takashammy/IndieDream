import { useMemo, useState } from "react";
import { KIND_LABEL, ageLabel, todayISO } from "../lib/data";
import { type DeskPage, useDream } from "../lib/store";
import { BackRow, Button, Card, Face, FilterChips, ScreenHead } from "../lib/ui";

export default function AdminMe() {
  const d = useDream();
  const { desk, setDesk, selectedUserId, setUser } = d;

  if (selectedUserId) return <UserCard />;

  return (
    <div className="pb-24">
      <ScreenHead kicker="Desk" title="Operations" sub="Queue, roster, dates, and the board — one room." />
      <DeskNav desk={desk} setDesk={setDesk} />
      {desk === "home" && <DeskHome />}
      {desk === "queue" && <DeskQueue />}
      {desk === "bookings" && <DeskBookings />}
      {desk === "people" && <DeskPeople />}
      {desk === "roster" && <DeskRoster />}
      {desk === "dates" && <DeskDates />}
      {desk === "board" && <DeskBoard />}
    </div>
  );
}

function DeskNav({ desk, setDesk }: { desk: DeskPage; setDesk: (d: DeskPage) => void }) {
  const { notices, bookings, events, artists } = useDream();
  const openQ = notices.filter((n) => !n.resolved).length;
  const openB = bookings.filter((b) => b.status === "open").length;
  const pendE = events.filter((e) => e.status === "pending").length;
  const awaitA = artists.filter((a) => !a.verified).length;
  return (
    <div className="mb-5">
      <FilterChips
        value={desk}
        onChange={(id) => setDesk(id as DeskPage)}
        items={[
          { id: "home", label: "Home" },
          { id: "queue", label: "Queue", count: openQ },
          { id: "bookings", label: "Bookings", count: openB },
          { id: "people", label: "People" },
          { id: "roster", label: "Roster", count: awaitA },
          { id: "dates", label: "Dates", count: pendE },
          { id: "board", label: "Board" },
        ]}
      />
    </div>
  );
}

function Kpi({ n, label }: { n: number; label: string }) {
  return (
    <div className="min-w-[72px] flex-1 rounded-2xl border border-line bg-elevated px-3 py-2">
      <p className="font-display text-[1.35rem] font-semibold tabular leading-none">{n}</p>
      <p className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
    </div>
  );
}

function DeskHome() {
  const { notices, events, bookings, setDesk } = useDream();
  const today = todayISO();
  const open = notices.filter((n) => !n.resolved);
  const next = [...events]
    .filter((e) => e.status === "live" && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return (
    <>
      <div className="mb-5 flex gap-2">
        <Kpi n={open.length} label="Queue" />
        <Kpi n={bookings.filter((b) => b.status === "open").length} label="Bookings" />
        <Kpi n={events.filter((e) => e.status === "pending").length} label="Dates" />
      </div>
      <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Needs a hand</p>
      <div className="space-y-2">
        {open.slice(0, 5).map((n) => (
          <Card key={n.id} onClick={() => setDesk(n.kind === "booking" ? "bookings" : n.kind === "event" ? "dates" : n.kind === "artist" ? "roster" : "queue")}>
            <p className="font-display text-[16px] font-semibold">{n.title}</p>
            <p className="font-serif text-[14px] text-muted">
              {n.body} · {ageLabel(n.createdAt)}
            </p>
          </Card>
        ))}
      </div>
      {next && (
        <div className="mt-6">
          <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Next date</p>
          <Card>
            <p className="font-display text-[16px] font-semibold">{next.title}</p>
            <p className="font-serif text-[14px] text-muted">
              {next.venue} · {next.date} {next.time}
            </p>
          </Card>
        </div>
      )}
    </>
  );
}

function DeskQueue() {
  const { notices, resolveNotice, verifyArtist, setEventStatus, setDesk } = useDream();
  const [kind, setKind] = useState("open");
  const list = notices.filter((n) => {
    if (kind === "open") return !n.resolved;
    if (kind === "done") return !!n.resolved;
    return n.kind === kind;
  });
  return (
    <>
      <FilterChips
        value={kind}
        onChange={setKind}
        items={[
          { id: "open", label: "Open" },
          { id: "artist", label: "Artist" },
          { id: "event", label: "Event" },
          { id: "booking", label: "Booking" },
          { id: "reset", label: "Reset" },
          { id: "done", label: "Done" },
        ]}
      />
      <div className="mt-3 space-y-2">
        {list.map((n) => (
          <Card key={n.id}>
            <p className="font-display text-[16px] font-semibold">{n.title}</p>
            <p className="font-serif text-[14px] text-muted">
              {n.body} · {ageLabel(n.createdAt)}
            </p>
            {!n.resolved && (
              <div className="mt-3 flex flex-wrap gap-2">
                {n.kind === "artist" && n.refId && (
                  <Button onClick={() => verifyArtist(n.refId!, true)}>Approve</Button>
                )}
                {n.kind === "event" && n.refId && (
                  <Button onClick={() => setEventStatus(n.refId!, "live")}>Approve date</Button>
                )}
                {n.kind === "booking" && <Button kind="line" onClick={() => setDesk("bookings")}>Open bookings</Button>}
                <Button kind="ghost" onClick={() => resolveNotice(n.id)}>
                  Clear
                </Button>
              </div>
            )}
          </Card>
        ))}
        {list.length === 0 && <p className="font-serif text-muted">Queue is quiet.</p>}
      </div>
    </>
  );
}

function DeskBookings() {
  const { bookings, services, accounts, completeBooking } = useDream();
  const [rail, setRail] = useState("open");
  const list = bookings.filter((b) => (rail === "all" ? true : b.status === rail));
  return (
    <>
      <FilterChips
        value={rail}
        onChange={setRail}
        items={[
          { id: "open", label: "Open", count: bookings.filter((b) => b.status === "open").length },
          { id: "completed", label: "Completed" },
          { id: "all", label: "All" },
        ]}
      />
      <div className="mt-3 space-y-2">
        {list.map((b) => {
          const svc = services.find((s) => s.id === b.serviceId);
          const who = accounts.find((a) => a.id === b.fromId);
          return (
            <Card key={b.id}>
              <p className="font-display text-[16px] font-semibold">{svc?.title}</p>
              <p className="font-serif text-[14px] text-muted">
                {who?.name} · {ageLabel(b.createdAt)}
              </p>
              <p className="mt-1 font-serif text-[14px]">{b.note}</p>
              <a className="mt-2 inline-block text-[13px] font-semibold text-accent" href={`https://wa.me/${b.whatsapp}`}>
                WhatsApp {b.whatsapp}
              </a>
              {b.status === "open" && (
                <div className="mt-3">
                  <Button onClick={() => completeBooking(b.id)}>Mark completed</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function DeskPeople() {
  const { accounts, artists, setUser } = useDream();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const list = accounts.filter((a) => {
    if (kind !== "all" && a.kind !== kind) return false;
    const s = q.toLowerCase();
    return !s || `${a.name} ${a.email} ${a.city}`.toLowerCase().includes(s);
  });
  const chips = [
    { id: "all", label: "All" },
    { id: "artist", label: "Artist" },
    { id: "explorer", label: "Explorer" },
    { id: "business", label: "Business" },
    { id: "admin", label: "Admin" },
  ];
  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name, email, city…"
        className="mb-3 w-full rounded-full border border-line bg-elevated px-3 py-2 text-[14px] outline-none"
      />
      <FilterChips value={kind} onChange={setKind} items={chips} />
      <div className="mt-3 space-y-2">
        {list.map((a) => {
          const art = artists.find((x) => x.accountId === a.id);
          return (
            <Card key={a.id} onClick={() => setUser(a.id)}>
              <div className="flex items-center gap-3">
                <Face name={a.name} photo={art?.photo} />
                <div>
                  <p className="font-display text-[16px] font-semibold">
                    {a.name}
                    {a.banned ? " · closed" : ""}
                  </p>
                  <p className="font-serif text-[13px] text-muted">
                    {KIND_LABEL[a.kind]} · {a.city}
                    {!a.whatsapp ? " · No WA" : ""}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function UserCard() {
  const { selectedUserId, setUser, accounts, artists, banUser, posts } = useDream();
  const a = accounts.find((x) => x.id === selectedUserId);
  if (!a) return null;
  const art = artists.find((x) => x.accountId === a.id);
  return (
    <div className="pb-24">
      <BackRow label="People" onClick={() => setUser(null)} />
      <div className="flex items-center gap-3">
        <Face name={a.name} photo={art?.photo} size={56} />
        <div>
          <h1 className="font-display text-[1.5rem] font-semibold">{a.name}</h1>
          <p className="font-serif text-muted">
            {KIND_LABEL[a.kind]} · {a.city}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-1 font-serif text-[15px]">
        <p>
          <a className="text-accent" href={`mailto:${a.email}`}>
            {a.email}
          </a>
        </p>
        {a.whatsapp ? (
          <p>
            <a className="text-accent" href={`https://wa.me/${a.whatsapp}`}>
              WhatsApp {a.whatsapp}
            </a>
          </p>
        ) : (
          <p className="text-muted">No WhatsApp on file</p>
        )}
        <p className="text-muted">{posts.filter((p) => p.authorId === a.id).length} board posts</p>
      </div>
      {a.kind !== "admin" && (
        <div className="mt-5">
          <Button kind={a.banned ? "solid" : "line"} onClick={() => banUser(a.id, !a.banned)}>
            {a.banned ? "Reopen account" : "Close account"}
          </Button>
        </div>
      )}
    </div>
  );
}

function DeskRoster() {
  const { artists, accounts, verifyArtist, setDesk, setUser } = useDream();
  const [rail, setRail] = useState("awaiting");
  const list = artists.filter((a) => (rail === "live" ? a.verified : !a.verified));
  return (
    <>
      <FilterChips
        value={rail}
        onChange={setRail}
        items={[
          { id: "awaiting", label: "Awaiting", count: artists.filter((a) => !a.verified).length },
          { id: "live", label: "Live", count: artists.filter((a) => a.verified).length },
        ]}
      />
      <div className="mt-3 space-y-2">
        {list.map((a) => {
          const acc = accounts.find((x) => x.id === a.accountId);
          return (
            <Card key={a.id}>
              <div className="flex items-center gap-3">
                <Face name={a.name} photo={a.photo} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[16px] font-semibold">{a.name}</p>
                  <p className="font-serif text-[13px] text-muted">
                    {a.instruments.join(" · ") || "No instruments listed"} · {a.city}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {!a.verified && <Button onClick={() => verifyArtist(a.id, true)}>Verify</Button>}
                {a.verified && (
                  <Button kind="line" onClick={() => verifyArtist(a.id, false)}>
                    Unlist
                  </Button>
                )}
                {acc && (
                  <Button kind="ghost" onClick={() => { setUser(acc.id); setDesk("people"); }}>
                    File
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function DeskDates() {
  const { events, setEventStatus, accounts } = useDream();
  const today = todayISO();
  const [rail, setRail] = useState("pending");
  const list = useMemo(() => {
    if (rail === "pending") return events.filter((e) => e.status === "pending");
    if (rail === "upcoming") return events.filter((e) => e.status === "live" && e.date >= today);
    return events.filter((e) => e.status === "past" || e.date < today);
  }, [events, rail, today]);
  return (
    <>
      <FilterChips
        value={rail}
        onChange={setRail}
        items={[
          { id: "pending", label: "Pending", count: events.filter((e) => e.status === "pending").length },
          { id: "upcoming", label: "Upcoming" },
          { id: "past", label: "Past" },
        ]}
      />
      <div className="mt-3 space-y-2">
        {list.map((e) => {
          const host = accounts.find((a) => a.id === e.hostId);
          return (
            <Card key={e.id}>
              <p className="font-display text-[16px] font-semibold">{e.title}</p>
              <p className="font-serif text-[14px] text-muted">
                {e.venue} · {e.date} {e.time} · {host?.name}
              </p>
              {e.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => setEventStatus(e.id, "live")}>Approve</Button>
                  <Button kind="line" onClick={() => setEventStatus(e.id, "past")}>
                    Decline
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function DeskBoard() {
  const { posts, accounts, archivePost, deletePost } = useDream();
  const [rail, setRail] = useState("live");
  const list = posts.filter((p) => (rail === "live" ? !p.archived : !!p.archived));
  return (
    <>
      <FilterChips
        value={rail}
        onChange={setRail}
        items={[
          { id: "live", label: "Live", count: posts.filter((p) => !p.archived).length },
          { id: "archive", label: "Archive" },
        ]}
      />
      <div className="mt-3 space-y-2">
        {list.map((p) => {
          const a = accounts.find((x) => x.id === p.authorId);
          return (
            <Card key={p.id}>
              <p className="font-display text-[16px] font-semibold">{p.title}</p>
              <p className="font-serif text-[13px] text-muted">
                {a?.name} · {ageLabel(p.createdAt)} · {p.replies.length} replies
              </p>
              <div className="mt-3 flex gap-2">
                {!p.archived && (
                  <Button kind="line" onClick={() => archivePost(p.id)}>
                    Archive
                  </Button>
                )}
                <Button kind="ghost" onClick={() => deletePost(p.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
