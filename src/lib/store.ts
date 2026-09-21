import { create } from "zustand";
import {
  ARTISTS,
  EVENTS,
  POSTS,
  ISR_LABEL,
  KIND_LABEL,
  claimsISR,
  formatEventDate,
  migrateAccountKind,
  validEmail,
  GENRE_OPTIONS,
  parsePlays,
  formatPlays,
  type AccountKind,
  type Artist,
  type BoardCategory,
  type BoardPost,
  type BoardReply,
  type CueEvent,
  type LocationArea,
  type Song,
} from "@/lib/data";
import { loadStudio } from "@/lib/cue-sync";
import { saveMyProfile, saveMySong } from "@/lib/cue-profile";
import { applyStudioAction, type StudioAction } from "@/lib/cue-actions";
import {
  createFirstAdmin,
  getAuthState,
  loginAccount,
  logoutAccount,
  registerAccount,
  type AuthAccount,
} from "@/lib/cue-auth";
import { useLocaleStore, type Locale } from "@/lib/locale";

export type TabId =
  | "home"
  | "artists"
  | "discover"
  | "events"
  | "board"
  | "services"
  | "me"
  | "inbox";

export type GateKind = "listen" | "board" | "event" | "verify" | "register" | null;
export type ServicePanel = "publishing" | "maas" | "lessons" | "composing" | null;
export type MeMode = "idle" | "login" | "register" | "reset" | "setup";

export type Account = {
  id: string;
  username: string;
  password: string;
  kind: AccountKind;
  name: string;
  role: string;
  location: LocationArea;
  bio: string;
  photo: string;
  email: string;
  whatsapp: string;
  artistId?: string;
  acceptedUploadTerms?: boolean;
  /** Desk: business accounts may enable continuous catalogue play. */
  allowContinuousPlay?: boolean;
  /** User preference: keep advancing after each track (business + allowContinuousPlay). */
  continuousPlayLoop?: boolean;
  locale?: Locale;
};

export type NoticeKind = "verify" | "label" | "event" | "song" | "enquiry";
export type NoticeStatus = "pending" | "approved" | "declined" | "completed";

export type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  status: NoticeStatus;
  refId?: string;
  createdAt: string;
  fields?: Record<string, string>;
};

export type NowPlaying = {
  song: Song;
  artistName: string;
  artistId: string;
};

type PersistSlice = {
  sessionId: string | null;
  artists: Artist[];
  accounts: Account[];
  events: CueEvent[];
  posts: BoardPost[];
  deletedPostIds: string[];
  deletedArtistIds: string[];
  bannedUserIds: string[];
  notices: Notice[];
};

export type CueState = PersistSlice & {
  hydrated: boolean;
  needsFirstAdmin: boolean;
  tab: TabId;
  artistId: string | null;
  eventId: string | null;
  postId: string | null;
  genre: string | null;
  servicePanel: ServicePanel;
  noticeId: string | null;
  eventComposer: boolean;
  meMode: MeMode;
  gate: GateKind;
  nowPlaying: NowPlaying | null;
  playing: boolean;
  hydrate: () => void;
  setTab: (tab: TabId) => void;
  openArtist: (id: string) => void;
  closeArtist: () => void;
  openEvent: (id: string | null) => void;
  openPost: (id: string | null) => void;
  openGenre: (g: string | null) => void;
  openService: (p: ServicePanel) => void;
  openNotice: (id: string | null) => void;
  setEventComposer: (v: boolean) => void;
  setMeMode: (m: MeMode) => void;
  setGate: (g: GateKind) => void;
  play: (np: NowPlaying) => void;
  togglePlay: () => void;
  stop: () => void;
  login: (username: string, password: string) => Promise<string | null>;
  setupAdmin: (input: {
    secret: string;
    username: string;
    password: string;
    name: string;
    email: string;
  }) => Promise<string | null>;
  resetPassword: (email: string, password: string) => string | null;
  register: (input: {
    username: string;
    password: string;
    email: string;
    kind: Exclude<AccountKind, "admin">;
    name: string;
    role: string;
    location: LocationArea;
    genre: string;
    label: string;
    bio: string;
    instrument?: string;
  }) => Promise<string | null>;
  logout: () => void;
  saveLocale: (locale: Locale) => void;
  saveArtistProfile: (patch: {
    name: string;
    role: string;
    area: LocationArea;
    city: string;
    genres: string[];
    label: string;
    bio: string;
    spotify?: string;
    youtube?: string;
    email?: string;
    whatsapp?: string;
    photo?: string;
  }) => void;
  saveAccountProfile: (patch: {
    bio: string;
    location: LocationArea;
    email?: string;
    whatsapp?: string;
    name?: string;
    photo?: string;
    instrument?: string;
  }) => void;
  addPendingSong: (
    title: string,
    extra?: {
      id?: string;
      cover?: string;
      spotify?: string;
      youtube?: string;
      lyrics?: string;
      audioUrl?: string;
      duration?: string;
      genre?: string;
      writers?: string;
      year?: string;
    },
  ) => void;
  rememberDuration: (artistId: string, songId: string, duration: string) => void;
  saveSong: (
    songId: string,
    extra: {
      title?: string;
      spotify?: string;
      youtube?: string;
      cover?: string;
      lyrics?: string;
      audioUrl?: string;
      duration?: string;
      genre?: string;
      writers?: string;
      year?: string;
    },
  ) => void;
  deleteSong: (songId: string) => void;
  acceptUploadTerms: () => void;
  setProfilePhoto: (photo: string) => void;
  addPost: (post: Pick<BoardPost, "title" | "body" | "category" | "image">) => void;
  addReply: (postId: string, body: string) => void;
  deletePost: (id: string) => void;
  deleteReply: (postId: string, replyId: string) => void;
  deleteArtist: (artistId: string) => void;
  banUser: (authorId: string) => void;
  setAccountKind: (accountId: string, kind: Exclude<AccountKind, "admin">) => void;
  setAllowContinuousPlay: (accountId: string, allow: boolean) => void;
  setContinuousPlayLoop: (loop: boolean) => void;
  deleteEvent: (id: string) => void;
  submitEvent: (input: {
    title: string;
    isoDate: string;
    time: string;
    venue: string;
    area: string;
    blurb: string;
    artistIds: string[];
  }) => string | null;
  submitEnquiry: (title: string, body: string, fields?: Record<string, string>) => void;
  resolveNotice: (id: string, status: "approved" | "declined" | "completed") => void;
};

const PERSIST_KEY = "indie-dream-v8";

export const SEED_ACCOUNTS: Account[] = [];
const SEED_NOTICES: Notice[] = [];

function fromAuth(acc: AuthAccount): Account {
  return {
    id: acc.id,
    username: acc.username,
    password: "",
    kind: acc.kind,
    name: acc.name,
    role: acc.role,
    location: acc.location,
    bio: acc.bio,
    photo: acc.photo || "/media/user.jpg",
    email: acc.email,
    whatsapp: acc.whatsapp,
    artistId: acc.artistId,
    acceptedUploadTerms: acc.acceptedUploadTerms,
    allowContinuousPlay: acc.allowContinuousPlay,
    continuousPlayLoop: acc.continuousPlayLoop,
    locale: acc.locale,
  };
}

function upsertAccount(accounts: Account[], acc: Account): Account[] {
  const i = accounts.findIndex((a) => a.id === acc.id || a.username.toLowerCase() === acc.username.toLowerCase());
  if (i < 0) return [...accounts, acc];
  return accounts.map((a, idx) => (idx === i ? { ...a, ...acc, password: acc.password || a.password } : a));
}

function mergeAccounts(saved?: Account[]): Account[] {
  if (!saved?.length) return [];
  return saved.map((a) => ({
    ...a,
    email: a.email || "",
    whatsapp: a.whatsapp || "",
    photo: a.photo || "",
    kind: migrateAccountKind(a.kind),
    name: a.name || a.username,
    role:
      a.role === "Listener" || a.role === "listener"
        ? KIND_LABEL.explorer
        : a.role || KIND_LABEL[migrateAccountKind(a.kind)],
  }));
}

function stitchSeed(
  accounts: Account[],
  artists: Artist[],
  deletedArtistIds: string[],
): { accounts: Account[]; artists: Artist[] } {
  const catalogIds = new Set(artists.map((a) => a.id));
  const nextArtists = [
    ...artists,
    ...ARTISTS.filter((a) => !catalogIds.has(a.id) && !deletedArtistIds.includes(a.id)),
  ];
  return { accounts: mergeAccounts(accounts), artists: nextArtists };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function readPersist(): PersistSlice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistSlice;
  } catch {
    return null;
  }
}

function writePersist(s: CueState) {
  if (typeof window === "undefined") return;
  const slice: PersistSlice = {
    sessionId: s.sessionId,
    artists: s.artists,
    accounts: s.accounts,
    events: s.events,
    posts: s.posts,
    deletedPostIds: s.deletedPostIds,
    deletedArtistIds: s.deletedArtistIds,
    bannedUserIds: s.bannedUserIds,
    notices: s.notices,
  };
  try {
    window.localStorage.setItem(PERSIST_KEY, JSON.stringify(slice));
  } catch {
    /* ignore quota */
  }
}

function cleanUrl(value?: string) {
  const raw = value?.trim();
  if (!raw) return undefined;
  const v = /^https?:\/\//i.test(raw)
    ? raw
    : raw.startsWith("//")
      ? `https:${raw}`
      : `https://${raw}`;
  try {
    const u = new URL(v);
    if (u.protocol === "http:" || u.protocol === "https:") return v;
  } catch {
    return undefined;
  }
  return undefined;
}

export function currentAccount(s: Pick<CueState, "sessionId" | "accounts">) {
  if (!s.sessionId) return null;
  return s.accounts.find((a) => a.id === s.sessionId) ?? null;
}

export function currentArtist(s: Pick<CueState, "sessionId" | "accounts" | "artists">) {
  const acc = currentAccount(s);
  if (!acc?.artistId) return null;
  return s.artists.find((a) => a.id === acc.artistId) ?? null;
}

export const useCue = create<CueState>((set, get) => {
  const persist = () => {
    writePersist(get());
  };

  let writeChain: Promise<void> = Promise.resolve();
  const enqueueWrite = (task: () => Promise<unknown>) => {
    const run = writeChain.then(async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const res = await task();
          if (res && typeof res === "object" && "ok" in res && (res as { ok: boolean }).ok === false) {
            if (attempt === 2) return;
            await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
            continue;
          }
          return;
        } catch {
          if (attempt === 2) return;
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        }
      }
    });
    writeChain = run.catch(() => undefined);
    return run;
  };

  const pushAction = (action: StudioAction) =>
    enqueueWrite(() => applyStudioAction({ data: action }));

  const pushProfile = (patch: {
    name?: string;
    role?: string;
    location?: LocationArea;
    city?: string;
    bio?: string;
    email?: string;
    whatsapp?: string;
    photo?: string;
    genres?: string[];
    label?: string;
    spotify?: string;
    youtube?: string;
  }) => {
    void enqueueWrite(() => saveMyProfile({ data: patch }));
  };

  const applySaved = (saved: PersistSlice) => {
    const deletedArtistIds = saved.deletedArtistIds ?? [];
    const bannedUserIds = saved.bannedUserIds ?? [];
    const catalogIds = new Set(ARTISTS.map((a) => a.id));
    const savedById = new Map((saved.artists ?? []).map((a) => [a.id, a]));
    const livePlays = new Map<string, number>();
    const liveLyrics = new Map<string, string>();
    for (const a of get().artists) {
      for (const s of a.songs ?? []) {
        livePlays.set(s.id, parsePlays(s.plays));
        if (s.lyrics?.trim()) liveLyrics.set(s.id, s.lyrics);
      }
    }
    const keepPlays = (songId: string, ...values: Array<string | undefined>) =>
      formatPlays(Math.max(livePlays.get(songId) ?? 0, ...values.map((v) => parsePlays(v ?? "0"))));
    const keepLyrics = (songId: string, ...values: Array<string | undefined>) =>
      values.find((v) => v && v.trim()) || liveLyrics.get(songId);
    const artists: Artist[] = [
      ...ARTISTS.filter((a) => !deletedArtistIds.includes(a.id)).map((a) => {
        const over = savedById.get(a.id);
        if (!over) return a;
        const overSongs = over.songs ?? [];
        const catalogSongIds = new Set(a.songs.map((s) => s.id));
        const extraSongs = overSongs.filter((s) => !catalogSongIds.has(s.id)).map((s) => ({
          ...s,
          plays: keepPlays(s.id, s.plays),
          lyrics: keepLyrics(s.id, s.lyrics) || s.lyrics,
        }));
        const songs = [
          ...a.songs.map((s) => {
            const overS = overSongs.find((x) => x.id === s.id);
            if (!overS) return { ...s, plays: keepPlays(s.id, s.plays), lyrics: keepLyrics(s.id, s.lyrics) || s.lyrics };
            return {
              ...s,
              ...overS,
              plays: keepPlays(s.id, s.plays, overS.plays),
              lyrics: keepLyrics(s.id, overS.lyrics, s.lyrics) || overS.lyrics || s.lyrics,
            };
          }),
          ...extraSongs,
        ];
        return {
          ...a,
          verified: over.verified,
          label: over.label,
          labelApproved: over.labelApproved,
          bio: over.bio || a.bio,
          name: over.name || a.name,
          role: over.role || a.role,
          area: over.area || a.area,
          city: over.city || a.city,
          genres: over.genres?.length ? over.genres : a.genres,
          spotify: over.spotify ?? a.spotify,
          youtube: over.youtube ?? a.youtube,
          photo: over.photo || a.photo,
          songs,
        };
      }),
      ...(saved.artists ?? [])
        .filter((a) => !catalogIds.has(a.id) && !deletedArtistIds.includes(a.id))
        .map((a) => ({
          ...a,
          songs: (a.songs ?? []).map((s) => ({
            ...s,
            plays: keepPlays(s.id, s.plays),
            lyrics: keepLyrics(s.id, s.lyrics) || s.lyrics,
          })),
        })),
    ];
    const posts = (() => {
      const savedPosts = saved.posts ?? [];
      const savedIds = new Set(savedPosts.map((p) => p.id));
      const source = savedPosts.length
        ? [...POSTS.filter((p) => !savedIds.has(p.id)), ...savedPosts]
        : POSTS;
      return source.map((p) => {
        const seed = POSTS.find((s) => s.id === p.id);
        const existing = (p as BoardPost).thread;
        const savedThread = Array.isArray(existing) ? existing : [];
        const seedThread = seed?.thread ?? [];
        const savedReplyIds = new Set(savedThread.map((r) => r.id));
        const extraReplies = seedThread.filter((r) => !savedReplyIds.has(r.id));
        return {
          ...p,
          createdAt: seed?.createdAt ?? p.createdAt,
          thread: extraReplies.length ? [...savedThread, ...extraReplies] : savedThread.length ? savedThread : seedThread,
        };
      });
    })();
    const savedNotices = saved.notices ?? [];
    set({
      sessionId: saved.sessionId,
      artists,
      accounts: mergeAccounts(saved.accounts),
      events: (() => {
        const savedEvents = Array.isArray(saved.events) ? saved.events : [];
        if (!savedEvents.length) return EVENTS;
        const savedIds = new Set(savedEvents.map((e) => e.id));
        const extras = EVENTS.filter((e) => !savedIds.has(e.id));
        return extras.length ? [...extras, ...savedEvents] : savedEvents;
      })(),
      posts,
      deletedPostIds: saved.deletedPostIds ?? [],
      deletedArtistIds,
      bannedUserIds,
      notices: savedNotices,
      hydrated: true,
    });
  };

  return {
    hydrated: false,
    needsFirstAdmin: true,
    tab: "home",
    artistId: null,
    eventId: null,
    postId: null,
    genre: null,
    servicePanel: null,
    noticeId: null,
    eventComposer: false,
    meMode: "idle",
    gate: null,
    sessionId: null,
    nowPlaying: null,
    playing: false,
    artists: ARTISTS,
    accounts: [],
    events: EVENTS,
    posts: POSTS,
    deletedPostIds: [],
    deletedArtistIds: [],
    bannedUserIds: [],
    notices: SEED_NOTICES,

    hydrate: () => {
      const applyStitch = () => {
        const next = stitchSeed(get().accounts, get().artists, get().deletedArtistIds);
        set({ ...next, hydrated: true });
      };
      if (!get().hydrated) {
        const saved = readPersist();
        if (saved) applySaved(saved);
        applyStitch();
        void getAuthState()
          .then((auth) => {
            set({ needsFirstAdmin: Boolean(auth.needsFirstAdmin) });
            if (auth.session) {
              const acc = fromAuth(auth.session);
              set({
                sessionId: acc.id,
                accounts: upsertAccount(get().accounts, acc),
                needsFirstAdmin: false,
              });
              const loc: Locale = acc.locale === "zh" || acc.locale === "en" ? acc.locale : useLocaleStore.getState().locale;
              useLocaleStore.getState().setLocale(loc);
            }
          })
          .catch(() => {});
        void loadStudio()
          .then((remote) => {
            if (remote) {
              applySaved({ ...remote, sessionId: get().sessionId ?? saved?.sessionId ?? null });
              applyStitch();
              writePersist(get());
              return;
            }
            writePersist(get());
          })
          .catch(() => {});
        return;
      }
      applyStitch();
    },

    setTab: (tab) =>
      set({
        tab: tab === "inbox" ? "me" : tab,
        artistId: null,
        eventId: null,
        postId: null,
        genre: null,
        servicePanel: null,
        noticeId: null,
        eventComposer: false,
        gate: null,
        meMode: tab === "me" || tab === "inbox" ? get().meMode : "idle",
      }),

    openArtist: (id) => set({ tab: "artists", artistId: id }),
    closeArtist: () => set({ artistId: null, tab: "artists" }),
    openEvent: (id) => set({ tab: "events", eventId: id }),
    openPost: (id) => set({ tab: "board", postId: id }),
    openGenre: (g) => set({ tab: "discover", genre: g, artistId: null }),
    openService: (p) => set({ tab: "services", servicePanel: p }),
    openNotice: (id) => set({ noticeId: id }),
    setEventComposer: (v) => set({ eventComposer: v }),
    setMeMode: (m) => set({ meMode: m, tab: "me", gate: null }),
    setGate: (g) => set({ gate: g }),

    play: (np) => {
      if (!currentAccount(get())) {
        set({ gate: "listen" });
        return;
      }
      const prevId = get().nowPlaying?.song.id;
      const isNew = prevId !== np.song.id;
      const song = isNew
        ? { ...np.song, plays: formatPlays(parsePlays(np.song.plays) + 1) }
        : np.song;
      set({ nowPlaying: { ...np, song }, playing: true });
      if (isNew) {
        queueMicrotask(() => {
          set({
            artists: get().artists.map((a) =>
              a.id !== np.artistId
                ? a
                : { ...a, songs: a.songs.map((s) => (s.id === np.song.id ? { ...s, plays: song.plays } : s)) },
            ),
          });
          persist();
          pushAction({ type: "recordPlay", artistId: np.artistId, songId: np.song.id });
        });
      }
    },
    togglePlay: () => {
      if (!get().nowPlaying) return;
      if (!currentAccount(get())) {
        set({ gate: "listen" });
        return;
      }
      set({ playing: !get().playing });
    },
    stop: () => set({ nowPlaying: null, playing: false }),

    login: async (username, password) => {
      try {
        const res = await loginAccount({ data: { username, password } });
        if (!res.ok) return res.error;
        const acc = fromAuth(res.account);
        const loc: Locale = acc.locale === "zh" || acc.locale === "en" ? acc.locale : useLocaleStore.getState().locale;
        useLocaleStore.getState().setLocale(loc);
        set({
          sessionId: acc.id,
          meMode: "idle",
          gate: null,
          needsFirstAdmin: acc.kind === "admin" ? false : get().needsFirstAdmin,
          accounts: upsertAccount(get().accounts, { ...acc, locale: loc }),
        });
        persist();
        return null;
      } catch {
        return "Could not reach the server.";
      }
    },

    setupAdmin: async (input) => {
      try {
        const res = await createFirstAdmin({
          data: {
            secret: input.secret,
            username: input.username,
            password: input.password,
            name: input.name,
            email: input.email,
          },
        });
        if (!res.ok) return res.error;
        const acc = fromAuth(res.account);
        set({
          sessionId: acc.id,
          meMode: "idle",
          gate: null,
          needsFirstAdmin: false,
          accounts: upsertAccount(get().accounts, acc),
        });
        persist();
        return null;
      } catch {
        return "Could not reach the server.";
      }
    },

    resetPassword: (email, password) => {
      const em = email.trim().toLowerCase();
      if (!validEmail(em)) return "Enter a valid email.";
      if (password.trim().length < 8) return "Password is too short.";
      return "Ask an admin to reset this password.";
    },

    register: async (input) => {
      const username = input.username.trim();
      const password = input.password;
      const email = input.email.trim();
      const name = input.name.trim() || username;
      if (!username || !password) return "Username and password are required.";
      if (!validEmail(email)) return "Enter a valid email.";
      if (input.kind === "artist") {
        if (!input.name.trim() || !input.role.trim()) return "Name and role are required.";
      }
      if (input.kind === "musician" && !input.instrument?.trim()) {
        return "Instrument is required.";
      }
      try {
        const res = await registerAccount({
          data: {
            username,
            password,
            email,
            kind: input.kind,
            name: input.kind === "artist" ? input.name.trim() : name,
            role:
              input.kind === "artist"
                ? input.role.trim()
                : input.kind === "musician"
                  ? input.instrument!.trim()
                  : KIND_LABEL[input.kind],
            location: input.location,
            bio: input.bio.trim(),
          },
        });
        if (!res.ok) return res.error;
        const acc = fromAuth(res.account);
        const artistId = input.kind === "artist" ? uid("art") : undefined;
        const wantsISR = claimsISR(input.label);
        const artist: Artist | null =
          input.kind === "artist"
            ? {
                id: artistId!,
                name: input.name.trim(),
                role: input.role.trim(),
                city: input.location,
                area: input.location,
                photo: "/media/user.jpg",
                genres: [input.genre],
                bio: input.bio.trim(),
                songs: [],
                label: wantsISR ? ISR_LABEL : input.label.trim() || "Independent",
                labelApproved: false,
                verified: false,
              }
            : null;
        const account: Account = {
          ...acc,
          artistId,
          locale: useLocaleStore.getState().locale,
        };
        const notices = [...get().notices];
        if (artist && wantsISR) {
          notices.unshift({
            id: uid("n"),
            kind: "label",
            title: `Inner Soul stamp — ${artist.name}`,
            body: `${artist.name} asked to be listed under ${ISR_LABEL}.`,
            status: "pending",
            refId: artist.id,
            createdAt: new Date().toISOString(),
          });
        }
        set({
          accounts: upsertAccount(get().accounts, account),
          artists: artist ? [...get().artists, artist] : get().artists,
          notices,
          sessionId: account.id,
          meMode: "idle",
          gate: null,
          tab: "me",
        });
        persist();
        if (artist) {
          pushAction({
            type: "addArtist",
            artist,
            notice: wantsISR ? notices.find((n) => n.kind === "label" && n.refId === artist.id) : undefined,
          });
        }
        return null;
      } catch {
        return "Could not reach the server.";
      }
    },

    logout: () => {
      void logoutAccount().catch(() => {});
      set({ sessionId: null, meMode: "idle", nowPlaying: null, playing: false });
      persist();
    },

    saveLocale: (locale) => {
      const acc = currentAccount(get());
      if (!acc) return;
      set({
        accounts: get().accounts.map((a) => (a.id === acc.id ? { ...a, locale } : a)),
      });
      persist();
    },

    saveArtistProfile: (patch) => {
      const acc = currentAccount(get());
      const artist = currentArtist(get());
      if (!acc?.artistId || !artist) return;
      const typed = patch.label.trim();
      let label = claimsISR(typed) ? (artist.labelApproved ? ISR_LABEL : "") : typed;
      if (artist.labelApproved && (label === "" || claimsISR(label))) label = ISR_LABEL;
      const next: Artist = {
        ...artist,
        name: patch.name.trim() || artist.name,
        role: patch.role.trim() || artist.role,
        area: patch.area,
        city: patch.city,
        genres: patch.genres.length ? patch.genres : artist.genres,
        label,
        labelApproved: artist.labelApproved,
        bio: patch.bio,
        photo: patch.photo ?? artist.photo,
      };
      if (patch.spotify !== undefined) next.spotify = cleanUrl(patch.spotify);
      if (patch.youtube !== undefined) next.youtube = cleanUrl(patch.youtube);
      const email = patch.email !== undefined ? patch.email.trim() : acc.email;
      const whatsapp = patch.whatsapp !== undefined ? patch.whatsapp.trim() : acc.whatsapp;
      set({
        artists: get().artists.map((a) => (a.id === artist.id ? next : a)),
        accounts: get().accounts.map((a) =>
          a.id === acc.id
            ? {
                ...a,
                name: next.name,
                role: next.role,
                location: next.area,
                bio: next.bio,
                email,
                whatsapp,
                photo: patch.photo ?? a.photo,
              }
            : a,
        ),
      });
      persist();
      pushProfile({
        name: next.name,
        role: next.role,
        location: next.area,
        city: next.city,
        bio: next.bio,
        email,
        whatsapp,
        photo: next.photo,
        genres: next.genres,
        label: next.label,
        spotify: next.spotify,
        youtube: next.youtube,
      });
    },

    saveAccountProfile: (patch) => {
      const acc = currentAccount(get());
      if (!acc) return;
      const email = patch.email !== undefined ? patch.email.trim() : acc.email;
      const whatsapp = patch.whatsapp !== undefined ? patch.whatsapp.trim() : acc.whatsapp;
      const name = patch.name?.trim() || acc.name;
      const photo = patch.photo ?? acc.photo;
      const role =
        acc.kind === "musician" && patch.instrument !== undefined
          ? patch.instrument.trim() || acc.role
          : acc.role;
      set({
        accounts: get().accounts.map((a) =>
          a.id === acc.id
            ? { ...a, bio: patch.bio, location: patch.location, email, whatsapp, name, photo, role }
            : a,
        ),
      });
      persist();
      pushProfile({
        name,
        role: acc.kind === "musician" ? role : undefined,
        bio: patch.bio,
        location: patch.location,
        email,
        whatsapp,
        photo,
      });
    },

    setProfilePhoto: (photo) => {
      const acc = currentAccount(get());
      if (!acc) return;
      const artist = currentArtist(get());
      set({
        accounts: get().accounts.map((a) => (a.id === acc.id ? { ...a, photo } : a)),
        artists: artist
          ? get().artists.map((a) => (a.id === artist.id ? { ...a, photo } : a))
          : get().artists,
      });
      persist();
      pushProfile({ photo, name: acc.name, bio: acc.bio });
    },

    addPendingSong: (title, extra) => {
      const artist = currentArtist(get());
      const acc = currentAccount(get());
      if (!artist) return;
      const live = acc?.kind === "admin";
      const song: Song = {
        id: extra?.id || uid("song"),
        title: title.trim(),
        duration: extra?.duration && extra.duration !== "—" ? extra.duration : "—",
        plays: "0",
        cover: extra?.cover ?? "/media/covers/vinyl.jpg",
        uploadedAt: new Date().toISOString(),
        status: live ? "approved" : "pending",
        lyrics: extra?.lyrics?.trim() || undefined,
        spotify: cleanUrl(extra?.spotify),
        youtube: cleanUrl(extra?.youtube),
        audioUrl: extra?.audioUrl,
        genre: extra?.genre?.trim() || undefined,
        writers: extra?.writers?.trim() || undefined,
        year: extra?.year?.trim() || undefined,
      };
      const notice = live
        ? null
        : {
            id: uid("n"),
            kind: "song" as const,
            title: `Track — ${song.title}`,
            body: `${artist.name} uploaded “${song.title}” for review.`,
            status: "pending" as const,
            refId: song.id,
            createdAt: new Date().toISOString(),
          };
      set({
        artists: get().artists.map((a) => {
          if (a.id !== artist.id) return a;
          const songs = a.songs.some((s) => s.id === song.id)
            ? a.songs.map((s) => (s.id === song.id ? { ...s, ...song, status: live ? "approved" : s.status } : s))
            : [song, ...a.songs];
          return { ...a, songs, verified: live ? true : a.verified };
        }),
        notices: notice && !get().notices.some((n) => n.kind === "song" && n.refId === song.id)
          ? [notice, ...get().notices]
          : get().notices,
      });
      persist();
      return pushAction({ type: "addSong", artistId: artist.id, song, notice: notice ?? undefined });
    },

    rememberDuration: (artistId, songId, duration) => {
      const clock = duration.trim();
      if (!clock || clock === "—") return;
      const artist = get().artists.find((a) => a.id === artistId);
      const song = artist?.songs.find((s) => s.id === songId);
      if (!song || (song.duration && song.duration !== "—")) return;
      const np = get().nowPlaying;
      set({
        artists: get().artists.map((a) =>
          a.id !== artistId
            ? a
            : { ...a, songs: a.songs.map((s) => (s.id === songId ? { ...s, duration: clock } : s)) },
        ),
        nowPlaying:
          np && np.song.id === songId ? { ...np, song: { ...np.song, duration: clock } } : np,
      });
      persist();
      pushAction({ type: "noteDuration", artistId, songId, duration: clock });
    },

    saveSong: (songId, extra) => {
      const artist = currentArtist(get());
      if (!artist) return;
      const nextSong = artist.songs.find((s) => s.id === songId);
      const patched = nextSong
        ? {
            ...nextSong,
            title: extra.title?.trim() || nextSong.title,
            spotify: extra.spotify !== undefined ? cleanUrl(extra.spotify) : nextSong.spotify,
            youtube: extra.youtube !== undefined ? cleanUrl(extra.youtube) : nextSong.youtube,
            cover: extra.cover !== undefined ? extra.cover : nextSong.cover,
            lyrics: extra.lyrics !== undefined ? extra.lyrics.trim() || undefined : nextSong.lyrics,
            audioUrl: extra.audioUrl !== undefined ? extra.audioUrl : nextSong.audioUrl,
            duration:
              extra.duration && extra.duration !== "—" ? extra.duration : nextSong.duration,
            genre: extra.genre !== undefined ? extra.genre.trim() || undefined : nextSong.genre,
            writers: extra.writers !== undefined ? extra.writers.trim() || undefined : nextSong.writers,
            year: extra.year !== undefined ? extra.year.trim() || undefined : nextSong.year,
          }
        : null;
      const np = get().nowPlaying;
      set({
        artists: get().artists.map((a) =>
          a.id !== artist.id
            ? a
            : {
                ...a,
                songs: a.songs.map((s) => (s.id === songId && patched ? patched : s)),
              },
        ),
        nowPlaying: np && patched && np.song.id === songId ? { ...np, song: patched } : np,
      });
      persist();
      if (patched) {
        pushAction({
          type: "patchSong",
          artistId: artist.id,
          songId,
          patch: {
            title: patched.title,
            spotify: patched.spotify,
            youtube: patched.youtube,
            cover: patched.cover,
            lyrics: patched.lyrics,
            audioUrl: patched.audioUrl,
            duration: patched.duration,
            genre: patched.genre,
            writers: patched.writers,
            year: patched.year,
          },
        });
        void enqueueWrite(() =>
          saveMySong({
            data: {
              id: patched.id,
              title: patched.title,
              cover: patched.cover,
              spotify: patched.spotify,
              youtube: patched.youtube,
              lyrics: patched.lyrics,
              audioUrl: patched.audioUrl,
              duration: patched.duration,
              genre: patched.genre,
              writers: patched.writers,
              year: patched.year,
            },
          }),
        );
      }
    },

    deleteSong: (songId) => {
      const artist = currentArtist(get());
      if (!artist || !artist.songs.some((s) => s.id === songId)) return;
      const np = get().nowPlaying;
      const playingThis = np?.song.id === songId;
      set({
        artists: get().artists.map((a) =>
          a.id === artist.id ? { ...a, songs: a.songs.filter((s) => s.id !== songId) } : a,
        ),
        notices: get().notices.filter((n) => !(n.kind === "song" && n.refId === songId)),
        nowPlaying: playingThis ? null : np,
        playing: playingThis ? false : get().playing,
        noticeId: get().notices.find((n) => n.id === get().noticeId && n.refId === songId)
          ? null
          : get().noticeId,
      });
      persist();
      pushAction({ type: "deleteSong", artistId: artist.id, songId });
    },

    acceptUploadTerms: () => {
      const acc = currentAccount(get());
      if (!acc || acc.acceptedUploadTerms) return;
      set({
        accounts: get().accounts.map((a) => (a.id === acc.id ? { ...a, acceptedUploadTerms: true } : a)),
      });
      persist();
      pushAction({ type: "patchMe", acceptedUploadTerms: true });
    },

    addPost: (input) => {
      const acc = currentAccount(get());
      if (!acc) {
        set({ gate: "board" });
        return;
      }
      const artist = currentArtist(get());
      const post: BoardPost = {
        id: uid("p"),
        author: artist?.name ?? acc.name,
        authorId: artist?.id ?? acc.id,
        role: artist?.role ?? acc.role,
        category: input.category as BoardCategory,
        title: input.title,
        body: input.body,
        time: "Just now",
        thread: [],
        createdAt: new Date().toISOString(),
        image: input.category === "gear" ? input.image : undefined,
      };
      set({ posts: [post, ...get().posts] });
      persist();
      pushAction({ type: "addPost", post });
    },

    addReply: (postId, body) => {
      const acc = currentAccount(get());
      if (!acc) {
        set({ gate: "board" });
        return;
      }
      const text = body.trim();
      if (!text) return;
      const artist = currentArtist(get());
      const reply: BoardReply = {
        id: uid("r"),
        author: artist?.name ?? acc.name,
        authorId: artist?.id ?? acc.id,
        role: artist?.role ?? acc.role,
        body: text,
        createdAt: new Date().toISOString(),
      };
      set({
        posts: get().posts.map((p) =>
          p.id === postId ? { ...p, thread: [...p.thread, reply] } : p,
        ),
      });
      persist();
      pushAction({ type: "addReply", postId, reply });
    },

    deletePost: (id) => {
      set({
        deletedPostIds: get().deletedPostIds.includes(id)
          ? get().deletedPostIds
          : [...get().deletedPostIds, id],
        postId: get().postId === id ? null : get().postId,
      });
      persist();
      pushAction({ type: "deletePost", id });
    },

    deleteReply: (postId, replyId) => {
      set({
        posts: get().posts.map((p) =>
          p.id === postId ? { ...p, thread: p.thread.filter((r) => r.id !== replyId) } : p,
        ),
      });
      persist();
      pushAction({ type: "deleteReply", postId, replyId });
    },

    deleteArtist: (artistId) => {
      const deletedArtistIds = get().deletedArtistIds.includes(artistId)
        ? get().deletedArtistIds
        : [...get().deletedArtistIds, artistId];
      set({
        artists: get().artists.filter((a) => a.id !== artistId),
        deletedArtistIds,
        accounts: get().accounts.map((a) =>
          a.artistId === artistId ? { ...a, artistId: undefined, kind: a.kind === "artist" ? "explorer" : a.kind } : a,
        ),
        artistId: get().artistId === artistId ? null : get().artistId,
        nowPlaying: get().nowPlaying?.artistId === artistId ? null : get().nowPlaying,
        playing: get().nowPlaying?.artistId === artistId ? false : get().playing,
      });
      persist();
      pushAction({ type: "deleteArtist", artistId });
    },

    setAccountKind: (accountId, kind) => {
      const acc = get().accounts.find((a) => a.id === accountId);
      if (!acc || acc.kind === "admin") return;
      let artists = get().artists;
      let artistId = acc.artistId;
      if (kind === "artist") {
        if (!artistId || !artists.some((a) => a.id === artistId)) {
          artistId = artistId || uid("art");
          artists = [
            ...artists,
            {
              id: artistId,
              name: acc.name,
              role: "Artist",
              city: acc.location,
              area: acc.location,
              photo: acc.photo || "/media/user.jpg",
              genres: [GENRE_OPTIONS[0]],
              bio: acc.bio,
              songs: [],
              label: "Independent",
              labelApproved: false,
              verified: false,
            },
          ];
        }
      }
      const artist = artists.find((a) => a.id === artistId);
      set({
        accounts: get().accounts.map((a) =>
          a.id === accountId
            ? {
                ...a,
                kind,
                artistId: kind === "artist" ? artistId : a.artistId,
                role: kind === "artist" ? artist?.role || "Artist" : KIND_LABEL[kind],
                ...(kind !== "business"
                  ? { allowContinuousPlay: false, continuousPlayLoop: false }
                  : {}),
              }
            : a,
        ),
        artists,
      });
      persist();
      pushAction({ type: "setAccountKind", accountId, kind });
    },

    setAllowContinuousPlay: (accountId, allow) => {
      const acc = get().accounts.find((a) => a.id === accountId);
      if (!acc || acc.kind !== "business") return;
      set({
        accounts: get().accounts.map((a) =>
          a.id === accountId
            ? {
                ...a,
                allowContinuousPlay: allow,
                ...(allow ? {} : { continuousPlayLoop: false }),
              }
            : a,
        ),
      });
      persist();
      pushAction({ type: "setAllowContinuousPlay", accountId, allow });
    },

    setContinuousPlayLoop: (loop) => {
      const acc = currentAccount(get());
      if (!acc || acc.kind !== "business" || !acc.allowContinuousPlay) return;
      set({
        accounts: get().accounts.map((a) => (a.id === acc.id ? { ...a, continuousPlayLoop: loop } : a)),
      });
      persist();
      pushAction({ type: "patchMe", continuousPlayLoop: loop });
    },

    banUser: (authorId) => {
      if (!authorId) return;
      const acc = get().accounts.find((a) => a.id === authorId || a.artistId === authorId);
      if (acc?.kind === "admin") return;
      const artistId =
        acc?.artistId ?? (get().artists.some((a) => a.id === authorId) ? authorId : undefined);
      const accountId = acc?.id;
      const ids = [authorId, artistId, accountId].filter(Boolean) as string[];
      const bannedUserIds = [...new Set([...get().bannedUserIds, ...ids])];
      const posts = get().posts.map((p) => ({
        ...p,
        thread: p.thread.filter((r) => !ids.includes(r.authorId ?? "")),
      }));
      const toDelete = posts.filter((p) => ids.includes(p.authorId ?? "")).map((p) => p.id);
      const deletedPostIds = [...new Set([...get().deletedPostIds, ...toDelete])];
      let next = get();
      if (artistId) {
        get().deleteArtist(artistId);
        next = get();
      }
      set({
        accounts: next.accounts.filter((a) => a.id !== accountId),
        bannedUserIds,
        posts,
        deletedPostIds,
        sessionId: next.sessionId === accountId ? null : next.sessionId,
        postId: toDelete.includes(next.postId ?? "") ? null : next.postId,
      });
      persist();
      if (accountId) pushAction({ type: "banUser", accountId });
    },

    deleteEvent: (id) => {
      set({
        events: get().events.filter((e) => e.id !== id),
        eventId: get().eventId === id ? null : get().eventId,
      });
      persist();
      pushAction({ type: "deleteEvent", id });
    },

    submitEvent: (input) => {
      const acc = currentAccount(get());
      if (!acc) {
        set({ gate: "event" });
        return "Sign in first.";
      }
      const artist = currentArtist(get());
      if (acc.kind !== "admin" && !artist?.verified) {
        set({ gate: "verify" });
        return "Verified artists only.";
      }
      const live = acc.kind === "admin";
      const { weekday, date } = formatEventDate(input.isoDate);
      const id = uid("ev");
      const event: CueEvent = {
        id,
        title: input.title,
        date,
        weekday,
        time: input.time,
        venue: input.venue,
        area: input.area,
        photo: "/media/events/warehouse.jpg",
        artistIds: input.artistIds,
        blurb: input.blurb,
        isoDate: input.isoDate,
        status: live ? "approved" : "pending",
        postedBy: acc.id,
      };
      const notice = live
        ? null
        : {
            id: uid("n"),
            kind: "event" as const,
            title: `Event — ${event.title}`,
            body: `${acc.name} posted ${event.title} at ${event.venue} on ${event.date}.`,
            status: "pending" as const,
            refId: id,
            createdAt: new Date().toISOString(),
          };
      set({
        events: [event, ...get().events],
        notices: notice ? [notice, ...get().notices] : get().notices,
        eventComposer: false,
      });
      persist();
      pushAction({ type: "submitEvent", event, notice: notice ?? undefined });
      return null;
    },

    submitEnquiry: (title, body, fields) => {
      const acc = currentAccount(get());
      if (!acc) {
        set({ gate: "register" });
        return;
      }
      const notice = {
        id: uid("n"),
        kind: "enquiry" as const,
        title,
        body,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        fields: {
          From: acc.name,
          Account: acc.username,
          ...fields,
        },
      };
      set({
        notices: [notice, ...get().notices],
      });
      persist();
      pushAction({ type: "submitEnquiry", notice });
    },

    resolveNotice: (id, status) => {
      const acc = currentAccount(get());
      if (acc?.kind !== "admin") return;
      const notice = get().notices.find((n) => n.id === id);
      if (!notice) return;
      let artists = get().artists;
      let events = get().events;
      if (status === "approved") {
        if ((notice.kind === "verify" || notice.kind === "label") && notice.refId) {
          artists = artists.map((a) => {
            if (a.id !== notice.refId) return a;
            if (notice.kind === "verify") return { ...a, verified: true };
            return { ...a, label: ISR_LABEL, labelApproved: true };
          });
        }
        if (notice.kind === "song" && notice.refId) {
          artists = artists.map((a) => ({
            ...a,
            songs: a.songs.map((s) => (s.id === notice.refId ? { ...s, status: "approved" as const } : s)),
          }));
        }
        if (notice.kind === "event" && notice.refId) {
          events = events.map((e) => (e.id === notice.refId ? { ...e, status: "approved" as const } : e));
        }
      }
      if (status === "declined") {
        if (notice.kind === "song" && notice.refId) {
          artists = artists.map((a) => ({
            ...a,
            songs: a.songs.map((s) => (s.id === notice.refId ? { ...s, status: "declined" as const } : s)),
          }));
        }
        if (notice.kind === "event" && notice.refId) {
          events = events.map((e) => (e.id === notice.refId ? { ...e, status: "declined" as const } : e));
        }
      }
      set({
        artists,
        events,
        notices: get().notices.map((n) => (n.id === id ? { ...n, status } : n)),
        noticeId: get().noticeId === id ? null : get().noticeId,
      });
      persist();
      pushAction({ type: "resolveNotice", id, status });
    },
  };
});
