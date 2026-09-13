import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Account,
  type AccountKind,
  type Artist,
  type Booking,
  type Gig,
  type Notice,
  type Post,
  type PostCategory,
  type ServiceOffer,
  type Song,
  SEED_ACCOUNTS,
  SEED_ARTISTS,
  SEED_BOOKINGS,
  SEED_EVENTS,
  SEED_NOTICES,
  SEED_POSTS,
  SEED_SERVICES,
  KIND_LABEL,
  migrateAccountKind,
} from "./data";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function mergeAccounts(saved: Account[] | undefined): Account[] {
  const byId = new Map<string, Account>();
  for (const a of SEED_ACCOUNTS) byId.set(a.id, { ...a });
  for (const a of saved ?? []) {
    const kind = migrateAccountKind(a.kind);
    const prev = byId.get(a.id);
    byId.set(a.id, { ...prev, ...a, kind });
  }
  return [...byId.values()];
}

function mergeArtists(saved: Artist[] | undefined): Artist[] {
  const byId = new Map<string, Artist>();
  for (const a of SEED_ARTISTS) byId.set(a.id, { ...a, songs: a.songs.map((s) => ({ ...s })) });
  for (const a of saved ?? []) {
    const prev = byId.get(a.id);
    byId.set(a.id, {
      ...prev,
      ...a,
      songs: a.songs?.length ? a.songs : prev?.songs ?? [],
      photo: a.photo || prev?.photo,
    });
  }
  return [...byId.values()];
}

function mergePosts(saved: Post[] | undefined): Post[] {
  const seedIds = new Set(SEED_POSTS.map((p) => p.id));
  const extra = (saved ?? []).filter((p) => !seedIds.has(p.id));
  const overlay = SEED_POSTS.map((seed) => {
    const old = saved?.find((p) => p.id === seed.id);
    return {
      ...seed,
      archived: old?.archived ?? seed.archived,
      replies: old?.replies?.length ? old.replies : seed.replies,
      createdAt: seed.createdAt,
    };
  });
  extra.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return [...extra, ...overlay];
}

function mergeEvents(saved: Gig[] | undefined): Gig[] {
  const byId = new Map<string, Gig>();
  for (const e of SEED_EVENTS) byId.set(e.id, { ...e });
  for (const e of saved ?? []) {
    const prev = byId.get(e.id);
    byId.set(e.id, { ...prev, ...e, date: prev?.date ?? e.date, status: e.status ?? prev?.status ?? "pending" });
  }
  return [...byId.values()];
}

export type DeskPage = "home" | "queue" | "bookings" | "people" | "roster" | "dates" | "board";

type State = {
  accounts: Account[];
  artists: Artist[];
  posts: Post[];
  events: Gig[];
  services: ServiceOffer[];
  bookings: Booking[];
  notices: Notice[];
  sessionId: string | null;
  tab: "home" | "artists" | "discover" | "events" | "board" | "services" | "me";
  desk: DeskPage;
  selectedArtistId: string | null;
  selectedPostId: string | null;
  selectedUserId: string | null;
  composing: boolean;
  hydrated: boolean;
};

type Actions = {
  session: () => Account | undefined;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  register: (input: { name: string; email: string; password: string; kind: AccountKind; city: string }) => string | null;
  requestReset: (email: string) => string;
  setTab: (tab: State["tab"]) => void;
  setDesk: (desk: DeskPage) => void;
  setArtist: (id: string | null) => void;
  setPost: (id: string | null) => void;
  setUser: (id: string | null) => void;
  setComposing: (v: boolean) => void;
  addPost: (input: { category: PostCategory; title: string; body: string }) => void;
  replyPost: (postId: string, body: string) => void;
  archivePost: (postId: string) => void;
  deletePost: (postId: string) => void;
  addEvent: (input: Omit<Gig, "id" | "status" | "hostId">) => void;
  setEventStatus: (id: string, status: Gig["status"]) => void;
  verifyArtist: (artistId: string, verified: boolean) => void;
  updateArtistMedia: (artistId: string, photo?: string) => void;
  updateSongCover: (artistId: string, songId: string, cover: string) => void;
  addSong: (artistId: string, title: string, year: number) => void;
  bookService: (serviceId: string, whatsapp: string, note: string) => string | null;
  completeBooking: (id: string) => void;
  banUser: (id: string, banned: boolean) => void;
  resolveNotice: (id: string) => void;
  accountById: (id: string) => Account | undefined;
  artistByAccount: (accountId: string) => Artist | undefined;
};

export const useDream = create<State & Actions>()(
  persist(
    (set, get) => ({
      accounts: SEED_ACCOUNTS,
      artists: SEED_ARTISTS,
      posts: SEED_POSTS,
      events: SEED_EVENTS,
      services: SEED_SERVICES,
      bookings: SEED_BOOKINGS,
      notices: SEED_NOTICES,
      sessionId: null,
      tab: "home",
      desk: "home",
      selectedArtistId: null,
      selectedPostId: null,
      selectedUserId: null,
      composing: false,
      hydrated: false,

      session: () => get().accounts.find((a) => a.id === get().sessionId && !a.banned),
      accountById: (id) => get().accounts.find((a) => a.id === id),
      artistByAccount: (accountId) => get().artists.find((a) => a.accountId === accountId),

      login: (email, password) => {
        const acc = get().accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (!acc) return "No account for that email.";
        if (acc.banned) return "This account is closed.";
        if (acc.password !== password) return "Password does not match.";
        set({ sessionId: acc.id, tab: acc.kind === "admin" ? "me" : "home" });
        return null;
      },
      logout: () => set({ sessionId: null, desk: "home", selectedUserId: null, composing: false }),
      register: ({ name, email, password, kind, city }) => {
        const exists = get().accounts.some((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (exists) return "That email is already on the books.";
        if (!email.includes("@")) return "Email only — no phone sign-up.";
        const id = uid("u");
        const k = kind === "admin" ? "explorer" : kind;
        const acc: Account = {
          id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          kind: k,
          city: city.trim() || "Hong Kong",
          createdAt: new Date().toISOString(),
        };
        let artist: Artist | undefined;
        if (k === "artist") {
          const artistId = uid("a");
          acc.artistId = artistId;
          artist = {
            id: artistId,
            accountId: id,
            name: acc.name,
            city: acc.city,
            instruments: [],
            bio: "",
            verified: false,
            songs: [],
          };
        }
        const notice: Notice = {
          id: uid("n"),
          kind: k === "artist" ? "artist" : "register",
          title: `${KIND_LABEL[k]} joined — ${acc.name}`,
          body: acc.email,
          refId: artist?.id ?? acc.id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          accounts: [acc, ...s.accounts],
          artists: artist ? [artist, ...s.artists] : s.artists,
          notices: [notice, ...s.notices],
          sessionId: id,
          tab: "me",
        }));
        return null;
      },
      requestReset: (email) => {
        const acc = get().accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (!acc) return "No account for that email.";
        const notice: Notice = {
          id: uid("n"),
          kind: "reset",
          title: `Password reset — ${acc.name}`,
          body: `Requested for ${acc.email}. Preview password remains ${acc.password}.`,
          refId: acc.id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notices: [notice, ...s.notices] }));
        return `Reset noted for ${acc.email}. Check with the desk — preview password is still active.`;
      },
      setTab: (tab) => set({ tab, selectedPostId: tab === "board" ? get().selectedPostId : null, composing: false }),
      setDesk: (desk) => set({ desk, selectedUserId: desk === "people" ? get().selectedUserId : null }),
      setArtist: (id) => set({ selectedArtistId: id, tab: id ? "artists" : get().tab }),
      setPost: (id) => set({ selectedPostId: id, composing: false }),
      setUser: (id) => set({ selectedUserId: id }),
      setComposing: (v) => set({ composing: v, selectedPostId: null }),
      addPost: ({ category, title, body }) => {
        const me = get().session();
        if (!me) return;
        const post: Post = {
          id: uid("p"),
          authorId: me.id,
          category,
          title: title.trim(),
          body: body.trim(),
          createdAt: new Date().toISOString(),
          replies: [],
        };
        set((s) => ({ posts: [post, ...s.posts], composing: false, selectedPostId: post.id }));
      },
      replyPost: (postId, body) => {
        const me = get().session();
        if (!me || !body.trim()) return;
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId
              ? { ...p, replies: [...p.replies, { id: uid("r"), authorId: me.id, body: body.trim(), createdAt: new Date().toISOString() }] }
              : p,
          ),
        }));
      },
      archivePost: (postId) => set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, archived: true } : p)) })),
      deletePost: (postId) =>
        set((s) => ({
          posts: s.posts.filter((p) => p.id !== postId),
          selectedPostId: s.selectedPostId === postId ? null : s.selectedPostId,
        })),
      addEvent: (input) => {
        const me = get().session();
        if (!me) return;
        const gig: Gig = { ...input, id: uid("e"), hostId: me.id, status: "pending" };
        const notice: Notice = {
          id: uid("n"),
          kind: "event",
          title: `Date pending — ${gig.title}`,
          body: `${gig.venue}, ${gig.date}`,
          refId: gig.id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ events: [gig, ...s.events], notices: [notice, ...s.notices] }));
      },
      setEventStatus: (id, status) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, status } : e)),
          notices: s.notices.map((n) => (n.refId === id && n.kind === "event" ? { ...n, resolved: true } : n)),
        })),
      verifyArtist: (artistId, verified) =>
        set((s) => ({
          artists: s.artists.map((a) => (a.id === artistId ? { ...a, verified } : a)),
          notices: s.notices.map((n) => (n.refId === artistId && n.kind === "artist" ? { ...n, resolved: true } : n)),
        })),
      updateArtistMedia: (artistId, photo) =>
        set((s) => ({ artists: s.artists.map((a) => (a.id === artistId ? { ...a, photo: photo ?? a.photo } : a)) })),
      updateSongCover: (artistId, songId, cover) =>
        set((s) => ({
          artists: s.artists.map((a) =>
            a.id === artistId ? { ...a, songs: a.songs.map((song) => (song.id === songId ? { ...song, cover } : song)) } : a,
          ),
        })),
      addSong: (artistId, title, year) =>
        set((s) => ({
          artists: s.artists.map((a) =>
            a.id === artistId ? { ...a, songs: [...a.songs, { id: uid("s"), title, year }] } : a,
          ),
        })),
      bookService: (serviceId, whatsapp, note) => {
        const me = get().session();
        if (!me) return "Sign in to book.";
        const wa = whatsapp.replace(/\s+/g, "");
        if (wa.length < 8) return "WhatsApp is required on bookings.";
        const booking: Booking = {
          id: uid("b"),
          serviceId,
          fromId: me.id,
          whatsapp: wa,
          note: note.trim(),
          status: "open",
          createdAt: new Date().toISOString(),
        };
        const svc = get().services.find((x) => x.id === serviceId);
        const notice: Notice = {
          id: uid("n"),
          kind: "booking",
          title: `Booking — ${svc?.title ?? "service"}`,
          body: `${me.name} · ${wa}`,
          refId: booking.id,
          createdAt: booking.createdAt,
        };
        set((s) => ({
          bookings: [booking, ...s.bookings],
          notices: [notice, ...s.notices],
          accounts: s.accounts.map((a) => (a.id === me.id ? { ...a, whatsapp: a.whatsapp || wa } : a)),
        }));
        return null;
      },
      completeBooking: (id) =>
        set((s) => ({
          bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "completed" } : b)),
          notices: s.notices.map((n) => (n.refId === id ? { ...n, resolved: true } : n)),
        })),
      banUser: (id, banned) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, banned } : a)),
          sessionId: banned && s.sessionId === id ? null : s.sessionId,
        })),
      resolveNotice: (id) => set((s) => ({ notices: s.notices.map((n) => (n.id === id ? { ...n, resolved: true } : n)) })),
    }),
    {
      name: "indie-dream-v1",
      partialize: (s) => ({
        accounts: s.accounts,
        artists: s.artists,
        posts: s.posts,
        events: s.events,
        services: s.services,
        bookings: s.bookings,
        notices: s.notices,
        sessionId: s.sessionId,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          accounts: mergeAccounts(p.accounts),
          artists: mergeArtists(p.artists),
          posts: mergePosts(p.posts),
          events: mergeEvents(p.events),
          services: p.services?.length ? p.services : SEED_SERVICES,
          bookings: p.bookings?.length ? p.bookings : SEED_BOOKINGS,
          notices: [...(p.notices ?? []), ...SEED_NOTICES.filter((n) => !(p.notices ?? []).some((x) => x.id === n.id))],
          hydrated: true,
        };
      },
    },
  ),
);

export async function readLocalImage(file: File, maxEdge = 900, quality = 0.82): Promise<string> {
  const raw = await file.arrayBuffer();
  const blob = new Blob([raw], { type: file.type });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = rej;
      el.src = url;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return url;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
