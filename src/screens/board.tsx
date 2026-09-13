import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CATEGORY_LABEL, ageLabel, type PostCategory } from "../lib/data";
import { useDream } from "../lib/store";
import { BackRow, Button, Card, Face, FilterChips, ScreenHead, TextInput } from "../lib/ui";

type Chip = "all" | PostCategory | "open" | "mine";

export default function BoardScreen() {
  const {
    posts,
    accounts,
    artists,
    session,
    selectedPostId,
    composing,
    setPost,
    setComposing,
    addPost,
    replyPost,
    setArtist,
  } = useDream();
  const me = session();
  const [chip, setChip] = useState<Chip>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"latest" | "busiest">("latest");
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState({ category: "seeking" as PostCategory, title: "", body: "" });

  const resolve = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    const art = artists.find((a) => a.accountId === id);
    return { name: acc?.name ?? "Unknown", photo: art?.photo, artistId: art?.id, kind: acc?.kind, verified: art?.verified };
  };

  const live = posts.filter((p) => !p.archived);
  const filtered = useMemo(() => {
    let list = live;
    if (chip === "open") list = list.filter((p) => p.replies.length === 0);
    else if (chip === "mine") list = list.filter((p) => p.authorId === me?.id);
    else if (chip !== "all") list = list.filter((p) => p.category === chip);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((p) => (p.title + p.body + resolve(p.authorId).name).toLowerCase().includes(s));
    }
    return [...list].sort((a, b) =>
      sort === "busiest" ? b.replies.length - a.replies.length : +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [live, chip, q, sort, me?.id, posts, accounts, artists]);

  const counts = {
    all: live.length,
    seeking: live.filter((p) => p.category === "seeking").length,
    collab: live.filter((p) => p.category === "collab").length,
    gear: live.filter((p) => p.category === "gear").length,
    session: live.filter((p) => p.category === "session").length,
    open: live.filter((p) => p.replies.length === 0).length,
    mine: live.filter((p) => p.authorId === me?.id).length,
  };

  if (composing) {
    return (
      <div className="pb-24">
        <BackRow label="Board" onClick={() => setComposing(false)} />
        <ScreenHead kicker="Compose" title="New notice" sub="Short, specific, and dated by the room — not the algorithm." />
        <FilterChips
          value={draft.category}
          onChange={(id) => setDraft({ ...draft, category: id as PostCategory })}
          items={(Object.keys(CATEGORY_LABEL) as PostCategory[]).map((id) => ({ id, label: CATEGORY_LABEL[id] }))}
        />
        <div className="mt-4 space-y-3">
          <TextInput label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} placeholder="What do you need?" />
          <TextInput label="Detail" textarea value={draft.body} onChange={(v) => setDraft({ ...draft, body: v })} placeholder="Place, time, constraints." />
          <Button disabled={!me || !draft.title.trim() || !draft.body.trim()} onClick={() => addPost(draft)}>
            {me ? "Post to the board" : "Sign in to post"}
          </Button>
        </div>
      </div>
    );
  }

  const thread = posts.find((p) => p.id === selectedPostId);
  if (thread) {
    const author = resolve(thread.authorId);
    return (
      <div className="pb-24">
        <BackRow label="Board" onClick={() => setPost(null)} />
        <div className="mb-4 flex items-start gap-3">
          <button type="button" onClick={() => author.artistId && setArtist(author.artistId)}>
            <Face name={author.name} photo={author.photo} size={48} />
          </button>
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {CATEGORY_LABEL[thread.category]} · {ageLabel(thread.createdAt)}
              {thread.replies.length === 0 && " · Open"}
            </p>
            <h1 className="font-display text-[1.45rem] font-semibold leading-tight">{thread.title}</h1>
            <p className="mt-0.5 font-serif text-[14px] text-muted">
              {author.name}
              {author.verified ? " · verified" : ""}
              {thread.authorId === me?.id ? " · You" : ""}
            </p>
          </div>
        </div>
        <p className="font-serif text-[16px] leading-relaxed">{thread.body}</p>
        <div className="mt-6 space-y-3">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
          </p>
          {thread.replies.map((r) => {
            const a = resolve(r.authorId);
            return (
              <div key={r.id} className="flex gap-3 rounded-2xl border border-line bg-elevated p-3">
                <Face name={a.name} photo={a.photo} size={32} />
                <div>
                  <p className="font-sans text-[12px] font-semibold">
                    {a.name}
                    {r.authorId === me?.id ? " · You" : ""}{" "}
                    <span className="font-normal text-muted">{ageLabel(r.createdAt)}</span>
                  </p>
                  <p className="font-serif text-[15px]">{r.body}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 space-y-2">
          <TextInput label="Reply" textarea value={reply} onChange={setReply} placeholder={me ? "Keep it useful." : "Sign in to reply."} />
          <Button
            disabled={!me || !reply.trim()}
            onClick={() => {
              replyPost(thread.id, reply);
              setReply("");
            }}
          >
            Send reply
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <ScreenHead kicker="Board" title="Noticeboard" sub="Calls, gear, sessions — the room still reads paper." />
      <FilterChips
        value={chip}
        onChange={(id) => setChip(id as Chip)}
        items={[
          { id: "all", label: "All", count: counts.all },
          { id: "seeking", label: "Seeking", count: counts.seeking },
          { id: "collab", label: "Collab", count: counts.collab },
          { id: "gear", label: "Gear", count: counts.gear },
          { id: "session", label: "Session", count: counts.session },
          { id: "open", label: "Open", count: counts.open },
          { id: "mine", label: "Mine", count: counts.mine },
        ]}
      />
      <div className="mt-3 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search cello, room, name…"
          className="min-w-0 flex-1 rounded-full border border-line bg-elevated px-3 py-2 text-[14px] outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setSort(sort === "latest" ? "busiest" : "latest")}
          className="shrink-0 rounded-full border border-line bg-elevated px-3 py-2 text-[12px] font-semibold"
        >
          {sort === "latest" ? "Latest" : "Busiest"}
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {filtered.map((p) => {
          const a = resolve(p.authorId);
          return (
            <Card key={p.id} onClick={() => setPost(p.id)}>
              <div className="flex gap-3">
                <Face name={a.name} photo={a.photo} />
                <div className="min-w-0">
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                    {CATEGORY_LABEL[p.category]}
                    {p.replies.length === 0 ? " · Open" : ` · ${p.replies.length}`}
                    {" · "}
                    {ageLabel(p.createdAt)}
                  </p>
                  <p className="truncate font-display text-[17px] font-semibold">{p.title}</p>
                  <p className="truncate font-serif text-[14px] text-muted">
                    {a.name} — {p.body}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="font-serif text-muted">Nothing on this rail.</p>}
      </div>
      <button
        type="button"
        onClick={() => setComposing(true)}
        className="fixed bottom-24 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-[#faf6ee] shadow-lg"
        aria-label="New post"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
