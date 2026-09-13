import { useMemo, useState } from "react";
import { TAGLINE, ageLabel, todayISO } from "../lib/data";
import { useDream } from "../lib/store";
import { BackRow, Button, Card, Face, FilterChips, ScreenHead, TextInput } from "../lib/ui";

export function HomeScreen() {
  const { artists, events, posts, setTab, setArtist, setPost } = useDream();
  const today = todayISO();
  const next = [...events].filter((e) => e.status === "live" && e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const live = artists.filter((a) => a.verified).slice(0, 4);
  const open = posts.filter((p) => !p.archived && p.replies.length === 0).slice(0, 3);
  return (
    <div className="pb-24">
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Indie Dream</p>
      <h1 className="mt-1 font-display text-[2rem] font-semibold leading-[1.05]">{TAGLINE}</h1>
      <p className="mt-3 max-w-[34ch] font-serif text-[16px] text-muted">
        Roster, dates, and a noticeboard for working rooms in Hong Kong.
      </p>
      {next && (
        <Card className="mt-6" onClick={() => setTab("events")}>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Next date</p>
          <p className="font-display text-[18px] font-semibold">{next.title}</p>
          <p className="font-serif text-[14px] text-muted">
            {next.venue} · {next.date} {next.time}
          </p>
        </Card>
      )}
      <section className="mt-7">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-[1.15rem] font-semibold">On the roster</h2>
          <button type="button" className="text-[12px] font-semibold text-accent" onClick={() => setTab("artists")}>
            All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {live.map((a) => (
            <Card key={a.id} onClick={() => setArtist(a.id)}>
              <Face name={a.name} photo={a.photo} size={44} />
              <p className="mt-2 font-display text-[15px] font-semibold">{a.name}</p>
              <p className="font-serif text-[12px] text-muted">{a.instruments.join(" · ")}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="mt-7">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-[1.15rem] font-semibold">Open calls</h2>
          <button type="button" className="text-[12px] font-semibold text-accent" onClick={() => setTab("board")}>
            Board
          </button>
        </div>
        <div className="space-y-2">
          {open.map((p) => (
            <Card key={p.id} onClick={() => { setTab("board"); setPost(p.id); }}>
              <p className="font-display text-[16px] font-semibold">{p.title}</p>
              <p className="font-serif text-[13px] text-muted">{ageLabel(p.createdAt)} · unanswered</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ArtistsScreen() {
  const { artists, selectedArtistId, setArtist, accounts } = useDream();
  const [q, setQ] = useState("");
  const live = artists.filter((a) => a.verified);
  const picked = artists.find((a) => a.id === selectedArtistId);

  if (picked) {
    const acc = accounts.find((x) => x.id === picked.accountId);
    return (
      <div className="pb-24">
        <BackRow label="Artists" onClick={() => setArtist(null)} />
        <div className="flex items-center gap-3">
          <Face name={picked.name} photo={picked.photo} size={72} />
          <div>
            <h1 className="font-display text-[1.6rem] font-semibold">{picked.name}</h1>
            <p className="font-serif text-muted">
              {picked.instruments.join(" · ")} · {picked.city}
            </p>
          </div>
        </div>
        <p className="mt-4 font-serif text-[16px] leading-relaxed">{picked.bio}</p>
        {acc?.email && (
          <a className="mt-3 inline-block text-[13px] font-semibold text-accent" href={`mailto:${acc.email}`}>
            Write
          </a>
        )}
        <div className="mt-6 space-y-2">
          {picked.songs.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-line bg-elevated p-3">
              <span className="h-12 w-12 overflow-hidden rounded-lg bg-paper">
                {s.cover ? <img src={s.cover} alt="" className="h-full w-full object-cover" /> : null}
              </span>
              <div>
                <p className="font-display font-semibold">{s.title}</p>
                <p className="font-serif text-[13px] text-muted">{s.year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const list = live.filter((a) => `${a.name} ${a.city} ${a.instruments.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="pb-24">
      <ScreenHead kicker="Artists" title="Roster" sub="Verified names only. New files wait on the desk." />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or instrument…"
        className="mb-4 w-full rounded-full border border-line bg-elevated px-3 py-2 text-[14px] outline-none"
      />
      <div className="space-y-2">
        {list.map((a) => (
          <Card key={a.id} onClick={() => setArtist(a.id)}>
            <div className="flex items-center gap-3">
              <Face name={a.name} photo={a.photo} size={48} />
              <div>
                <p className="font-display text-[16px] font-semibold">{a.name}</p>
                <p className="font-serif text-[13px] text-muted">
                  {a.instruments.join(" · ")} · {a.city}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DiscoverScreen() {
  const { artists, posts, setArtist, setTab } = useDream();
  const picks = artists.filter((a) => a.verified).slice().reverse().slice(0, 5);
  return (
    <div className="pb-24">
      <ScreenHead kicker="Discover" title="This week’s paper" sub="A short stack — not a feed." />
      <div className="space-y-3">
        {picks.map((a) => (
          <Card key={a.id} onClick={() => setArtist(a.id)}>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{a.city}</p>
            <p className="font-display text-[18px] font-semibold">{a.name}</p>
            <p className="font-serif text-[14px] text-muted">{a.bio}</p>
          </Card>
        ))}
        <Card onClick={() => setTab("board")}>
          <p className="font-display text-[18px] font-semibold">{posts.filter((p) => !p.archived).length} live notices</p>
          <p className="font-serif text-[14px] text-muted">Open the board for calls and spare gear.</p>
        </Card>
      </div>
    </div>
  );
}

export function EventsScreen() {
  const { events, session, addEvent, accounts } = useDream();
  const today = todayISO();
  const me = session();
  const [form, setForm] = useState(false);
  const [draft, setDraft] = useState({ title: "", venue: "", date: "", time: "20:00", city: "Hong Kong", blurb: "" });
  const upcoming = events.filter((e) => e.status === "live" && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const pending = events.filter((e) => e.status === "pending");
  return (
    <div className="pb-24">
      <ScreenHead kicker="Events" title="Dates" sub="Approved bills only. New rooms wait on the desk." />
      {me && (me.kind === "artist" || me.kind === "business" || me.kind === "admin") && (
        <div className="mb-4">
          <Button kind="line" onClick={() => setForm(!form)}>
            {form ? "Close form" : "Propose a date"}
          </Button>
        </div>
      )}
      {form && (
        <div className="mb-6 space-y-3">
          <TextInput label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
          <TextInput label="Venue" value={draft.venue} onChange={(v) => setDraft({ ...draft, venue: v })} />
          <TextInput label="Date" type="date" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
          <TextInput label="Time" value={draft.time} onChange={(v) => setDraft({ ...draft, time: v })} />
          <TextInput label="Note" textarea value={draft.blurb} onChange={(v) => setDraft({ ...draft, blurb: v })} />
          <Button
            disabled={!draft.title || !draft.venue || !draft.date}
            onClick={() => {
              addEvent(draft);
              setForm(false);
            }}
          >
            Send to desk
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {upcoming.map((e) => {
          const host = accounts.find((a) => a.id === e.hostId);
          return (
            <Card key={e.id}>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                {e.date} · {e.time}
              </p>
              <p className="font-display text-[17px] font-semibold">{e.title}</p>
              <p className="font-serif text-[14px] text-muted">
                {e.venue}, {e.city}
                {host ? ` · ${host.name}` : ""}
              </p>
              <p className="mt-1 font-serif text-[14px]">{e.blurb}</p>
            </Card>
          );
        })}
      </div>
      {me?.kind === "admin" && pending.length > 0 && (
        <p className="mt-4 font-serif text-[13px] text-muted">{pending.length} pending on the desk.</p>
      )}
    </div>
  );
}

export function ServicesScreen() {
  const { services, accounts, session, bookService } = useDream();
  const me = session();
  const [openId, setOpenId] = useState<string | null>(null);
  const [wa, setWa] = useState(me?.whatsapp ?? "");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const kinds = useMemo(() => Array.from(new Set(services.map((s) => s.kind))), [services]);
  const [kind, setKind] = useState("all");
  const list = services.filter((s) => kind === "all" || s.kind === kind);
  return (
    <div className="pb-24">
      <ScreenHead kicker="Services" title="Rooms and hands" sub="Bookings need a WhatsApp. The house number stays off the page." />
      <FilterChips
        value={kind}
        onChange={setKind}
        items={[{ id: "all", label: "All" }, ...kinds.map((k) => ({ id: k, label: k }))]}
      />
      <div className="mt-3 space-y-2">
        {list.map((s) => {
          const who = accounts.find((a) => a.id === s.providerId);
          const open = openId === s.id;
          return (
            <Card key={s.id}>
              <p className="font-display text-[16px] font-semibold">{s.title}</p>
              <p className="font-serif text-[14px] text-muted">
                {who?.name} · {s.price}
              </p>
              <p className="mt-1 font-serif text-[14px]">{s.detail}</p>
              <div className="mt-3">
                <Button kind="line" onClick={() => setOpenId(open ? null : s.id)}>
                  {open ? "Close" : "Request"}
                </Button>
              </div>
              {open && (
                <div className="mt-3 space-y-2">
                  <TextInput label="WhatsApp (required)" value={wa} onChange={setWa} placeholder="8529…" />
                  <TextInput label="Note" textarea value={note} onChange={setNote} />
                  {msg && <p className="font-serif text-[14px] text-accent">{msg}</p>}
                  <Button
                    onClick={() => {
                      const err = bookService(s.id, wa, note);
                      setMsg(err ?? "Sent to the desk.");
                      if (!err) setOpenId(null);
                    }}
                  >
                    {me ? "Send booking" : "Sign in first"}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
