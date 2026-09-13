import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import {
  CATEGORY_LABEL,
  ageLabel,
  isPostExpired,
  type Artist,
  type BoardCategory,
  type BoardPost,
  type BoardReply,
} from "@/lib/data";
import { currentAccount, useCue, type Account } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AreaInput, BackRow, Confirm, Field, ScreenHead, TextInput, VerifiedMark } from "./chrome";
import { cn } from "@/lib/utils";

type BoardFilter = "all" | BoardCategory | "open" | "mine";
type BoardSort = "latest" | "busy";

type BanTarget = {
  kind: "post" | "reply";
  postId: string;
  replyId?: string;
  author: string;
  authorId?: string;
};

type AuthorCard = {
  photo: string;
  artistId?: string;
  verified: boolean;
};

function resolveAuthor(
  authorId: string | undefined,
  artists: Artist[],
  accounts: Account[],
): AuthorCard {
  if (!authorId) return { photo: "/media/user.jpg", verified: false };
  const asArtist = artists.find((a) => a.id === authorId);
  if (asArtist) return { photo: asArtist.photo, artistId: asArtist.id, verified: asArtist.verified };
  const acc = accounts.find((a) => a.id === authorId);
  if (acc?.artistId) {
    const linked = artists.find((a) => a.id === acc.artistId);
    if (linked) return { photo: linked.photo || acc.photo, artistId: linked.id, verified: linked.verified };
  }
  if (acc) return { photo: acc.photo, artistId: acc.artistId, verified: false };
  return { photo: "/media/user.jpg", verified: false };
}

const PLACEHOLDER: Record<BoardCategory, { title: string; body: string }> = {
  seeking: {
    title: "Bassist for a Saturday residency",
    body: "Room, dates, pay, and what you actually need.",
  },
  collab: {
    title: "Producer for six cello sketches",
    body: "What you’ve got, what you’re looking for, and the kind of player who shouldn’t write.",
  },
  gear: {
    title: "Selling a 1966 Ludwig snare",
    body: "Condition, pickup, and the price. No lowballs from strangers.",
  },
  session: {
    title: "Horn charts available this month",
    body: "When you’re free, what you play, and how to reach you.",
  },
};

export function BoardScreen() {
  const posts = useCue((s) => s.posts);
  const deleted = useCue((s) => s.deletedPostIds);
  const artists = useCue((s) => s.artists);
  const accounts = useCue((s) => s.accounts);
  const postId = useCue((s) => s.postId);
  const openPost = useCue((s) => s.openPost);
  const openArtist = useCue((s) => s.openArtist);
  const addPost = useCue((s) => s.addPost);
  const addReply = useCue((s) => s.addReply);
  const deletePost = useCue((s) => s.deletePost);
  const deleteReply = useCue((s) => s.deleteReply);
  const banUser = useCue((s) => s.banUser);
  const session = useCue((s) => currentAccount(s));
  const setGate = useCue((s) => s.setGate);
  const nowPlaying = useCue((s) => s.nowPlaying);
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [sort, setSort] = useState<BoardSort>("latest");
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [reply, setReply] = useState("");
  const [ban, setBan] = useState<BanTarget | null>(null);

  const admin = session?.kind === "admin";
  const living = posts.filter((p) => !deleted.includes(p.id));
  const active = living.filter((p) => !isPostExpired(p));
  const selected = living.find((p) => p.id === postId);

  const counts = useMemo(() => {
    const mineId = session ? new Set([session.id, session.artistId].filter(Boolean) as string[]) : null;
    return {
      all: active.length,
      seeking: active.filter((p) => p.category === "seeking").length,
      collab: active.filter((p) => p.category === "collab").length,
      gear: active.filter((p) => p.category === "gear").length,
      session: active.filter((p) => p.category === "session").length,
      open: active.filter((p) => p.thread.length === 0).length,
      mine: mineId ? active.filter((p) => p.authorId && mineId.has(p.authorId)).length : 0,
    };
  }, [active, session]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mineId = session ? new Set([session.id, session.artistId].filter(Boolean) as string[]) : null;
    const filtered = active.filter((p) => {
      if (filter === "open") {
        if (p.thread.length > 0) return false;
      } else if (filter === "mine") {
        if (!mineId || !p.authorId || !mineId.has(p.authorId)) return false;
      } else if (filter !== "all" && p.category !== filter) {
        return false;
      }
      if (!q) return true;
      const hay = `${p.title} ${p.body} ${p.author} ${p.role} ${CATEGORY_LABEL[p.category]}`.toLowerCase();
      return hay.includes(q);
    });
    const ranked = [...filtered];
    ranked.sort((a, b) => {
      if (sort === "busy") {
        const gap = b.thread.length - a.thread.length;
        if (gap) return gap;
      }
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return ranked;
  }, [active, filter, query, session, sort]);

  function runBan(target: BanTarget) {
    if (target.kind === "reply" && target.replyId) {
      deleteReply(target.postId, target.replyId);
    } else {
      deletePost(target.postId);
      if (selected?.id === target.postId) openPost(null);
    }
    if (target.authorId) banUser(target.authorId);
  }

  function startCompose() {
    if (!session) {
      setGate("board");
      return;
    }
    setComposing(true);
  }

  const chipOptions: Array<{ id: BoardFilter; label: string; count: number }> = [
    { id: "all", label: "All", count: counts.all },
    { id: "seeking", label: "Seeking", count: counts.seeking },
    { id: "collab", label: "Collab", count: counts.collab },
    { id: "gear", label: "Gear", count: counts.gear },
    { id: "session", label: "Session", count: counts.session },
    { id: "open", label: "Open", count: counts.open },
  ];
  if (session) chipOptions.push({ id: "mine", label: "Mine", count: counts.mine });

  if (selected) {
    const face = resolveAuthor(selected.authorId, artists, accounts);
    const mine =
      session &&
      (selected.authorId === session.id || (session.artistId && selected.authorId === session.artistId));
    return (
      <div className="cue-enter pb-12">
        <BackRow label="Board" onClick={() => openPost(null)} />
        <p className="cue-kicker px-5 text-xs text-accent">
          {CATEGORY_LABEL[selected.category]}
          {selected.thread.length === 0 ? " · Open" : null}
        </p>
        <h1 className="cue-name px-5 pt-2 font-display text-3xl leading-tight">{selected.title}</h1>
        <AuthorLine
          name={selected.author}
          role={selected.role}
          photo={face.photo}
          verified={face.verified}
          age={ageLabel(selected.createdAt)}
          you={Boolean(mine)}
          onOpen={face.artistId ? () => openArtist(face.artistId!) : undefined}
        />
        <p className="mt-5 px-5 text-sm leading-6">{selected.body}</p>
        {admin ? (
          <div className="px-5">
            <Button
              variant="outline"
              className="mt-6 w-full"
              onClick={() =>
                setBan({
                  kind: "post",
                  postId: selected.id,
                  author: selected.author,
                  authorId: selected.authorId,
                })
              }
            >
              <Trash2 className="size-4" /> Delete post
            </Button>
          </div>
        ) : null}

        <section className="mt-8">
          <div className="px-5">
            <h2 className="cue-kicker text-xs text-muted">
              Replies · {selected.thread.length}
            </h2>
          </div>
          {selected.thread.length === 0 ? (
            <p className="mt-3 px-5 text-sm italic text-muted">No replies yet. Be the first.</p>
          ) : (
            <ul className="mt-3">
              {selected.thread.map((item) => (
                <ReplyRow
                  key={item.id}
                  item={item}
                  admin={admin}
                  you={
                    Boolean(
                      session &&
                        (item.authorId === session.id ||
                          (session.artistId && item.authorId === session.artistId)),
                    )
                  }
                  face={resolveAuthor(item.authorId, artists, accounts)}
                  onOpenArtist={openArtist}
                  onDelete={() =>
                    setBan({
                      kind: "reply",
                      postId: selected.id,
                      replyId: item.id,
                      author: item.author,
                      authorId: item.authorId,
                    })
                  }
                />
              ))}
            </ul>
          )}
          {session ? (
            <form
              className="mt-4 space-y-2 px-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                addReply(selected.id, reply);
                setReply("");
              }}
            >
              <Field label="Write a reply">
                <AreaInput
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Keep it about the music."
                />
              </Field>
              <Button type="submit" className="w-full">
                Reply
              </Button>
            </form>
          ) : (
            <div className="px-5">
              <Button className="mt-4 w-full" onClick={() => setGate("board")}>
                Sign in to reply
              </Button>
            </div>
          )}
        </section>

        {ban ? (
          <BanConfirm
            target={ban}
            onDelete={() => {
              if (ban.kind === "reply" && ban.replyId) deleteReply(ban.postId, ban.replyId);
              else {
                deletePost(ban.postId);
                openPost(null);
              }
            }}
            onBan={() => runBan(ban)}
            onClose={() => setBan(null)}
          />
        ) : null}
      </div>
    );
  }

  if (composing) {
    return (
      <Compose
        onCancel={() => setComposing(false)}
        onSubmit={(post) => {
          addPost(post);
          setComposing(false);
        }}
      />
    );
  }

  const emptyCopy =
    query.trim()
      ? "Nothing matches that search."
      : filter === "open"
        ? "Every call has an answer."
        : filter === "mine"
          ? "You haven’t posted yet."
          : "No threads in this filter.";

  return (
    <div className="cue-enter pb-24">
      <ScreenHead kicker="Board" title="Talk shop" note={`${counts.all} live`} />
      <p className="px-5 pb-4 text-sm leading-6 text-muted">
        Calls, gear, and collabs. Music only — anything else comes off.
      </p>
      <BoardChips value={filter} onChange={setFilter} options={chipOptions} />
      <div className="relative px-5 pb-3">
        <Search className="pointer-events-none absolute left-8 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <TextInput
          className="mt-0 pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, player, room…"
          aria-label="Search the board"
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-5 pb-2">
        <p className="text-xs tabular-nums text-subtle">
          {visible.length} {visible.length === 1 ? "thread" : "threads"}
        </p>
        <div className="flex">
          <button
            type="button"
            className={cn("h-11 px-2 text-sm", sort === "latest" ? "text-accent" : "text-muted")}
            onClick={() => setSort("latest")}
          >
            Latest
          </button>
          <button
            type="button"
            className={cn("h-11 px-2 text-sm", sort === "busy" ? "text-accent" : "text-muted")}
            onClick={() => setSort("busy")}
          >
            Busiest
          </button>
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="px-5 pt-6 text-sm italic text-muted">{emptyCopy}</p>
      ) : (
        <ul>
          {visible.map((post) => {
            const face = resolveAuthor(post.authorId, artists, accounts);
            const open = post.thread.length === 0;
            const busy = post.thread.length >= 3;
            return (
              <li key={post.id} className="border-t border-line">
                <div className="flex items-start">
                  <button
                    type="button"
                    onClick={() => openPost(post.id)}
                    className="flex min-w-0 flex-1 gap-3 px-5 py-4 text-left"
                  >
                    <img src={face.photo} alt="" className="size-12 shrink-0 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="cue-kicker text-xs text-accent">
                        {CATEGORY_LABEL[post.category]}
                        {open ? " · Open" : busy ? " · Busy" : null}
                      </p>
                      <p className="mt-1 font-medium leading-snug">{post.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{post.body}</p>
                      <p className="mt-2 text-xs text-subtle">
                        {post.author} · {ageLabel(post.createdAt)} · {post.thread.length}{" "}
                        {post.thread.length === 1 ? "reply" : "replies"}
                      </p>
                    </div>
                  </button>
                  {admin ? (
                    <button
                      type="button"
                      className="flex size-11 shrink-0 items-center justify-center text-muted"
                      aria-label="Delete post"
                      onClick={() =>
                        setBan({
                          kind: "post",
                          postId: post.id,
                          author: post.author,
                          authorId: post.authorId,
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={startCompose}
        className="fixed right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-accent px-4 text-sm text-accent-fg"
        style={{
          bottom: nowPlaying
            ? "calc(env(safe-area-inset-bottom) + 9.25rem)"
            : "calc(env(safe-area-inset-bottom) + 5.5rem)",
        }}
      >
        <Plus className="size-4" />
        New post
      </button>

      {ban ? (
        <BanConfirm
          target={ban}
          onDelete={() => deletePost(ban.postId)}
          onBan={() => runBan(ban)}
          onClose={() => setBan(null)}
        />
      ) : null}
    </div>
  );
}

function BoardChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ id: T; label: string; count?: number }>;
}) {
  return (
    <div className="scrollbar-none flex w-full flex-nowrap gap-2 overflow-x-auto px-5 pb-3">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm",
            value === opt.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
          )}
        >
          <span>{opt.label}</span>
          {opt.count !== undefined ? <span className="tabular-nums">{opt.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

function AuthorLine({
  name,
  role,
  photo,
  verified,
  age,
  you,
  onOpen,
}: {
  name: string;
  role: string;
  photo: string;
  verified: boolean;
  age: string;
  you?: boolean;
  onOpen?: () => void;
}) {
  const inner = (
    <>
      <img src={photo} alt="" className="size-12 rounded-md object-cover" />
      <div className="min-w-0 text-left">
        <p className="flex items-center gap-1.5 font-medium">
          {name}
          {verified ? <VerifiedMark /> : null}
          {you ? <span className="text-xs font-normal italic text-subtle">You</span> : null}
        </p>
        <p className="text-xs text-muted">
          {role} · {age}
        </p>
      </div>
    </>
  );
  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className="mt-4 flex w-full items-center gap-3 px-5">
        {inner}
      </button>
    );
  }
  return <div className="mt-4 flex items-center gap-3 px-5">{inner}</div>;
}

function ReplyRow({
  item,
  admin,
  you,
  face,
  onOpenArtist,
  onDelete,
}: {
  item: BoardReply;
  admin: boolean;
  you: boolean;
  face: AuthorCard;
  onOpenArtist: (id: string) => void;
  onDelete: () => void;
}) {
  return (
    <li className="border-t border-line px-5 py-3">
      <div className="flex items-start gap-3">
        {face.artistId ? (
          <button
            type="button"
            className="size-10 shrink-0 overflow-hidden rounded-md"
            onClick={() => onOpenArtist(face.artistId!)}
            aria-label={`${item.author} on the roster`}
          >
            <img src={face.photo} alt="" className="size-full object-cover" />
          </button>
        ) : (
          <img src={face.photo} alt="" className="size-10 shrink-0 rounded-md object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {item.author}{" "}
            <span className="font-normal text-muted">
              · {item.role} · {ageLabel(item.createdAt)}
            </span>
            {you ? <span className="ml-1 text-xs font-normal italic text-subtle">You</span> : null}
          </p>
          <p className="mt-1 text-sm leading-6">{item.body}</p>
        </div>
        {admin ? (
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center text-muted"
            aria-label="Delete reply"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
    </li>
  );
}

function BanConfirm({
  target,
  onDelete,
  onBan,
  onClose,
}: {
  target: BanTarget;
  onDelete: () => void;
  onBan: () => void;
  onClose: () => void;
}) {
  const noun = target.kind === "reply" ? "reply" : "post";
  return (
    <Confirm
      title={`Delete this ${noun}?`}
      body={`Remove this ${noun} from the board. You can also ban ${target.author} and take them off Indie Dream.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={onDelete}
      onClose={onClose}
      extra={
        target.authorId
          ? { label: `Ban and remove ${target.author}`, onClick: onBan }
          : undefined
      }
    />
  );
}

function Compose({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (post: Pick<BoardPost, "title" | "body" | "category">) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<BoardCategory>("seeking");
  const hint = PLACEHOLDER[category];

  return (
    <form
      className="cue-enter pb-12"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        onSubmit({ title: title.trim(), body: body.trim(), category });
      }}
    >
      <BackRow label="Board" onClick={onCancel} />
      <div className="px-5">
        <p className="cue-kicker text-xs text-muted">New post</p>
        <h1 className="cue-name mt-1 font-display text-3xl leading-none">Start a thread</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Music related only. Rooms, players, gear, and work — not general chat.
        </p>
      </div>
      <div className="mt-4">
        <BoardChips
          value={category}
          onChange={setCategory}
          options={(Object.keys(CATEGORY_LABEL) as BoardCategory[]).map((c) => ({
            id: c,
            label: CATEGORY_LABEL[c],
          }))}
        />
      </div>
      <div className="space-y-4 px-5">
        <Field label="Title">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={hint.title}
          />
        </Field>
        <Field label="Details">
          <AreaInput
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder={hint.body}
          />
        </Field>
        <Button type="submit" className="w-full">
          Post
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
