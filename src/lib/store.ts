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
import { loadStudio, saveStudio } from "@/lib/cue-sync";
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
export type ServicePanel = "publishing" | "maas" | "lessons" | null;
export type MeMode = "idle" | "login" | "register" | "reset";

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
  login: (username: string, password: string) => string | null;
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
    trackTitle?: string;
  }) => string | null;
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
  }) => void;
  addPendingSong: (
    title: string,
    extra?: { cover?: string; spotify?: string; youtube?: string; lyrics?: string },
  ) => void;
  updateSongLinks: (songId: string, extra: { spotify?: string; youtube?: string; cover?: string }) => void;
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

const PERSIST_KEY = "indie-dream-v3";

function accountFromArtist(artist: Artist): Account {
  const extras: Record<string, { email?: string; whatsapp?: string; password?: string }> = {
    kai: { email: "kai@indiedream.hk", whatsapp: "+852 6345 7788" },
    amina: { email: "amina@indiedream.hk", whatsapp: "+852 9012 4481" },
    jun: { email: "jun@indiedream.hk", whatsapp: "+852 6881 3340" },
    sofia: { email: "sofia@indiedream.hk", whatsapp: "+852 2557 1190" },
    leo: { email: "leo@indiedream.hk", whatsapp: "+852 9128 7703" },
    nia: { email: "nia@indiedream.hk", whatsapp: "+852 6230 5518" },
    ryo: { email: "ryo@indiedream.hk", whatsapp: "+852 9784 2266" },
  };
  const extra = extras[artist.id] ?? {};
  return {
    id: `acc-${artist.id}`,
    username: artist.id,
    password: extra.password || artist.id,
    kind: "artist",
    name: artist.name,
    role: artist.role,
    location: artist.area,
    bio: artist.bio,
    photo: artist.photo,
    email: extra.email || `${artist.id}@indiedream.hk`,
    whatsapp: extra.whatsapp || "",
    artistId: artist.id,
  };
}

function linkArtistAccounts(accounts: Account[], artists: Artist[]): Account[] {
  const linked = new Set(accounts.map((acc) => acc.artistId).filter((id): id is string => Boolean(id)));
  const usedUser = new Set(accounts.map((acc) => acc.username.toLowerCase()));
  const usedId = new Set(accounts.map((acc) => acc.id));
  const extras = artists
    .filter((artist) => !linked.has(artist.id))
    .map((artist) => {
      const acc = accountFromArtist(artist);
      if (usedId.has(acc.id) || usedUser.has(acc.username.toLowerCase())) {
        return {
          ...acc,
          id: usedId.has(acc.id) ? `acc-${artist.id}-link` : acc.id,
          username: usedUser.has(acc.username.toLowerCase()) ? `${artist.id}.artist` : acc.username,
        };
      }
      return acc;
    });
  return extras.length ? [...accounts, ...extras] : accounts;
}

export const SEED_ACCOUNTS: Account[] = linkArtistAccounts([
  {
    id: "acc-admin",
    username: "admin",
    password: "inner-soul",
    kind: "admin",
    name: "Inner Soul Admin",
    role: "Admin",
    location: "HK Island",
    bio: "Runs Dreamin' Indie for Inner Soul Records.",
    photo: "/media/covers/vinyl.jpg",
    email: "admin@innersoulrecords.hk",
    whatsapp: "",
  },
  {
    id: "acc-martin",
    username: "martin",
    password: "Harbour88",
    kind: "admin",
    name: "Martin Sham",
    role: "Guitarist / producer",
    location: "HK Island",
    bio: "Runs Inner Soul Records and still writes guitar parts after the office lights go off.",
    photo: "/media/artists/jun.jpg",
    email: "martin@innersoulrecords.hk",
    whatsapp: "+852 6355 3466",
    artistId: "martin",
  },
  {
    id: "acc-sinlam",
    username: "sinlam",
    password: "Lantern88",
    kind: "admin",
    name: "Sin Lam",
    role: "Vocalist",
    location: "Kowloon",
    bio: "Voice first, paperwork second. Inner Soul on weekdays, small rooms on weekends.",
    photo: "/media/artists/nia.jpg",
    email: "sinlam@innersoulrecords.hk",
    whatsapp: "+852 9128 8801",
    artistId: "sinlam",
  },
  {
    id: "acc-mei",
    username: "mei",
    password: "melody",
    kind: "artist",
    name: "Mei Ling Chan",
    role: "Jazz vocalist",
    location: "HK Island",
    bio: "Sings standards like they still owe her something.",
    photo: "/media/artists/mei.jpg",
    email: "mei@indiedream.hk",
    whatsapp: "+852 6123 4567",
    artistId: "mei",
  },
  {
    id: "acc-patrice",
    username: "patrice",
    password: "patrice",
    kind: "explorer",
    name: "Patrice Ng",
    role: "Explorer",
    location: "Kowloon",
    bio: "Listens first, talks later.",
    photo: "/media/user.jpg",
    email: "patrice@example.com",
    whatsapp: "+852 9123 4567",
  },
  {
    id: "acc-tess",
    username: "tess",
    password: "tess",
    kind: "artist",
    name: "Tess Wong",
    role: "Folk songwriter",
    location: "HK Island",
    bio: "Quiet songs about leaving and coming back. Plays open tunings in rooms that still have ceiling fans.",
    photo: "/media/covers/silk.jpg",
    email: "tess@indiedream.hk",
    whatsapp: "+852 9188 2201",
    artistId: "tess",
  },
  {
    id: "acc-hassan",
    username: "hassan",
    password: "hassan",
    kind: "artist",
    name: "Hassan Malik",
    role: "Saxophonist",
    location: "Kowloon",
    bio: "Horns for hire, charts on request. Prefers small rooms and players who leave space.",
    photo: "/media/covers/vinyl.jpg",
    email: "hassan@indiedream.hk",
    whatsapp: "+852 6340 1192",
    artistId: "hassan",
  },
  {
    id: "acc-yuki",
    username: "yuki",
    password: "yuki",
    kind: "artist",
    name: "Yuki Cheung",
    role: "DJ / producer",
    location: "New Territories",
    bio: "Warehouse edits and late buses home. First upload is sitting with Inner Soul for review.",
    photo: "/media/covers/synth.jpg",
    email: "yuki@indiedream.hk",
    whatsapp: "",
    artistId: "yuki",
  },
  {
    id: "acc-daniel",
    username: "daniel",
    password: "daniel",
    kind: "artist",
    name: "Daniel Ho",
    role: "Beatmaker",
    location: "Kowloon",
    bio: "Makes beats in a subdivided flat and names them after minibus routes. Open to Cantonese features.",
    photo: "/media/covers/rain.jpg",
    email: "daniel@indiedream.hk",
    whatsapp: "+852 9755 4410",
    artistId: "daniel",
  },
  {
    id: "acc-clara",
    username: "clara",
    password: "clara",
    kind: "artist",
    name: "Clara Ip",
    role: "Violinist",
    location: "HK Island",
    bio: "Session strings, quartet work, and the occasional pop overdub. Will not play over a loop that is already doing her job.",
    photo: "/media/covers/cello.jpg",
    email: "clara@indiedream.hk",
    whatsapp: "+852 6012 7783",
    artistId: "clara",
  },
  {
    id: "acc-samira",
    username: "samira",
    password: "samira",
    kind: "explorer",
    name: "Samira Fong",
    role: "Explorer",
    location: "New Territories",
    bio: "Takes the East Rail in with headphones and a notebook. Collects live rooms, not playlists.",
    photo: "/media/user.jpg",
    email: "samira@example.com",
    whatsapp: "",
  },
  {
    id: "acc-owen",
    username: "owen",
    password: "owen",
    kind: "explorer",
    name: "Owen Lam",
    role: "Explorer",
    location: "Kowloon",
    bio: "Works late in Kwun Tong and stays for the last set. Knows more bassists than he admits.",
    photo: "/media/events/jazz.jpg",
    email: "owen@example.com",
    whatsapp: "+852 9221 0064",
  },
  {
    id: "acc-bee",
    username: "bee",
    password: "bee",
    kind: "explorer",
    name: "Bee Chan",
    role: "Explorer",
    location: "HK Island",
    bio: "Writes on ferries. Looking for someone to put the words to a guitar.",
    photo: "/media/events/rooftop.jpg",
    email: "bee@example.com",
    whatsapp: "",
  },
  {
    id: "acc-marlowe",
    username: "marlowe",
    password: "marlowe",
    kind: "business",
    name: "Marlowe House",
    role: "Business",
    location: "HK Island",
    bio: "Wine bar in Sai Ying Pun. Live three nights a week, no playlists over dinner.",
    photo: "/media/events/warehouse.jpg",
    email: "bookings@marlowe.hk",
    whatsapp: "+852 2559 4410",
  },
  {
    id: "acc-lantern",
    username: "lantern",
    password: "lantern",
    kind: "business",
    name: "Lantern Hotel",
    role: "Business",
    location: "Kowloon",
    bio: "Lobby and restaurant programming in Tsim Sha Tsui. Looking for a house sound that isn’t a spa playlist.",
    photo: "/media/events/recital.jpg",
    email: "music@lanternhotel.hk",
    whatsapp: "+852 2311 8800",
  },
], ARTISTS);

const SEED_NOTICES: Notice[] = [
  {
    id: "n-enq-1",
    kind: "enquiry",
    title: "Publishing — Publish music and cover art",
    body: "A first single with a designed sleeve. Ready to go this quarter.",
    status: "pending",
    createdAt: "2026-09-07T11:00:00+08:00",
    fields: {
      From: "Kai Rivera",
      Account: "guest-form",
      Package: "Publish music and cover art",
      Price: "$1,500",
      Contact: "kai@example.com",
      WhatsApp: "+852 6345 7788",
      Name: "Kai Rivera",
    },
  },
  {
    id: "n-enq-2",
    kind: "enquiry",
    title: "MaaS quotation — Harbour Room",
    body: "Restaurant in Sheung Wan. Evening playlist and a monthly live night.",
    status: "pending",
    createdAt: "2026-09-06T16:20:00+08:00",
    fields: {
      From: "Patrice Ng",
      Account: "patrice",
      Company: "Harbour Room",
      Type: "Restaurant",
      Location: "HK Island",
      Hours: "Tue–Sun, 6pm–1am",
      WhatsApp: "+852 9123 4567",
    },
  },
  {
    id: "n-enq-3",
    kind: "enquiry",
    title: "Lesson enquiry — Voice",
    body: "Looking for weekly jazz vocals, intermediate.",
    status: "pending",
    createdAt: "2026-09-05T09:40:00+08:00",
    fields: {
      From: "Patrice Ng",
      Account: "patrice",
      Name: "Patrice Ng",
      Instrument: "Voice",
      Level: "Intermediate",
      Location: "Kowloon",
      WhatsApp: "+852 9123 4567",
    },
  },
  {
    id: "n-enq-done",
    kind: "enquiry",
    title: "Lesson enquiry — Piano",
    body: "Four weeks of beginner piano, Saturday mornings.",
    status: "completed",
    createdAt: "2026-09-01T10:00:00+08:00",
    fields: {
      From: "Patrice Ng",
      Account: "patrice",
      Name: "Patrice Ng",
      Instrument: "Piano",
      Level: "Beginner",
      Location: "Kowloon",
      WhatsApp: "+852 9123 4567",
    },
  },
  {
    id: "n-enq-4",
    kind: "enquiry",
    title: "Publishing — Publish music only",
    body: "Two folk singles, already mixed. Need distribution and a clean release sheet this autumn.",
    status: "pending",
    createdAt: "2026-09-07T20:30:00+08:00",
    fields: {
      From: "Tess Wong",
      Account: "tess",
      Name: "Tess Wong",
      Contact: "tess@indiedream.hk",
      WhatsApp: "+852 9188 2201",
      Package: "Publish music only",
      Price: "$800",
    },
  },
  {
    id: "n-enq-5",
    kind: "enquiry",
    title: "MaaS quotation — Marlowe House",
    body: "Wine bar in Sai Ying Pun. Evening playlist plus a live trio three nights a week.",
    status: "pending",
    createdAt: "2026-09-07T15:10:00+08:00",
    fields: {
      From: "Marlowe House",
      Account: "marlowe",
      Company: "Marlowe House",
      Type: "Bar",
      Location: "HK Island",
      Hours: "Thu–Sat, 8pm–11pm",
      WhatsApp: "+852 2559 4410",
    },
  },
  {
    id: "n-enq-6",
    kind: "enquiry",
    title: "Lesson enquiry — Guitar",
    body: "Adult beginner, evenings after work in Kwun Tong. Acoustic, folk chords, no exams.",
    status: "pending",
    createdAt: "2026-09-06T21:45:00+08:00",
    fields: {
      From: "Owen Lam",
      Account: "owen",
      Name: "Owen Lam",
      Instrument: "Guitar",
      Level: "Beginner",
      Location: "Kowloon",
      WhatsApp: "+852 9221 0064",
    },
  },
  {
    id: "n-enq-7",
    kind: "enquiry",
    title: "MaaS quotation — Lantern Hotel",
    body: "Lobby and restaurant in TST. Need a house sound that isn’t spa music. Quotation already filed and ticked complete.",
    status: "completed",
    createdAt: "2026-08-28T11:20:00+08:00",
    fields: {
      From: "Lantern Hotel",
      Account: "lantern",
      Company: "Lantern Hotel",
      Type: "Hotel",
      Location: "Kowloon",
      Hours: "Daily, 11am–11pm",
      WhatsApp: "+852 2311 8800",
    },
  },
  {
    id: "n-enq-8",
    kind: "enquiry",
    title: "Publishing — Publish music and professional production",
    body: "Warehouse Edit 07 needs a proper mix and a release path once the profile is approved.",
    status: "pending",
    createdAt: "2026-09-08T00:20:00+08:00",
    fields: {
      From: "Yuki Cheung",
      Account: "yuki",
      Name: "Yuki Cheung",
      Contact: "yuki@indiedream.hk",
      WhatsApp: "+852 9601 3388",
      Package: "Publish music and professional production",
      Price: "$8,000",
    },
  },
  {
    id: "n-ver-yuki",
    kind: "verify",
    title: "Verify Yuki Cheung",
    body: "Yuki Cheung registered as DJ / producer in New Territories and uploaded “Warehouse Edit 07”.",
    status: "pending",
    refId: "yuki",
    createdAt: "2026-09-07T23:12:00+08:00",
  },
  {
    id: "n-song-yuki",
    kind: "song",
    title: "Track — Warehouse Edit 07",
    body: "Yuki Cheung uploaded a first track for review.",
    status: "pending",
    refId: "yuki-1",
    createdAt: "2026-09-07T23:12:00+08:00",
  },
  {
    id: "n-event-ssp",
    kind: "event",
    title: "Event — Warehouse open mic",
    body: "Kai Rivera posted Warehouse open mic at Unit 12, Kwun Tong on 20 Sep.",
    status: "pending",
    refId: "ssp-open",
    createdAt: "2026-09-08T10:00:00+08:00",
  },
];

function mergeAccounts(saved?: Account[]): Account[] {
  if (!saved?.length) return SEED_ACCOUNTS;
  const seedById = new Map(SEED_ACCOUNTS.map((a) => [a.id, a]));
  const seedByUser = new Map(SEED_ACCOUNTS.map((a) => [a.username.toLowerCase(), a]));
  const forceIds = new Set(["acc-martin", "acc-sinlam", "acc-admin"]);
  const merged = saved.map((a) => {
    const seed = seedById.get(a.id) ?? seedByUser.get(a.username.toLowerCase());
    if (seed && forceIds.has(seed.id)) {
      return {
        ...a,
        ...seed,
        photo: a.photo || seed.photo,
        bio: a.bio || seed.bio,
        email: a.email || seed.email,
        whatsapp: a.whatsapp || seed.whatsapp,
      };
    }
    const kind = migrateAccountKind(a.kind || seed?.kind);
    const roleRaw = a.role || seed?.role || "";
    const role =
      roleRaw === "Listener" || roleRaw === "listener" ? KIND_LABEL.explorer : roleRaw;
    return {
      ...a,
      email: a.email || seed?.email || "",
      whatsapp: a.whatsapp || seed?.whatsapp || "",
      artistId: a.artistId || seed?.artistId,
      photo: a.photo || seed?.photo || "",
      kind,
      name: a.name || seed?.name || a.username,
      role,
    };
  });
  const seenId = new Set(merged.map((a) => a.id));
  const seenUser = new Set(merged.map((a) => a.username.toLowerCase()));
  const extras = SEED_ACCOUNTS.filter(
    (s) => !seenId.has(s.id) && !seenUser.has(s.username.toLowerCase()),
  );
  return extras.length ? [...merged, ...extras] : merged;
}

function stitchSeed(accounts: Account[], artists: Artist[], deletedArtistIds: string[]): { accounts: Account[]; artists: Artist[] } {
  const catalogIds = new Set(artists.map((a) => a.id));
  const nextArtists = [
    ...artists,
    ...ARTISTS.filter((a) => !catalogIds.has(a.id) && !deletedArtistIds.includes(a.id)),
  ];
  return {
    accounts: linkArtistAccounts(mergeAccounts(accounts), nextArtists),
    artists: nextArtists,
  };
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

function studioPayload(s: Pick<PersistSlice, keyof Omit<PersistSlice, "sessionId">>) {
  return {
    artists: s.artists,
    accounts: s.accounts,
    events: s.events,
    posts: s.posts,
    deletedPostIds: s.deletedPostIds,
    deletedArtistIds: s.deletedArtistIds,
    bannedUserIds: s.bannedUserIds,
    notices: s.notices,
  };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function queueStudioSave(s: CueState) {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  const payload = studioPayload(s);
  saveTimer = setTimeout(() => {
    void saveStudio({ data: payload }).catch(() => {});
  }, 400);
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
    const state = get();
    writePersist(state);
    queueStudioSave(state);
  };

  const applySaved = (saved: PersistSlice) => {
    const deletedArtistIds = saved.deletedArtistIds ?? [];
    const bannedUserIds = saved.bannedUserIds ?? [];
    const catalogIds = new Set(ARTISTS.map((a) => a.id));
    const savedById = new Map((saved.artists ?? []).map((a) => [a.id, a]));
    const artists: Artist[] = [
      ...ARTISTS.filter((a) => !deletedArtistIds.includes(a.id)).map((a) => {
        const over = savedById.get(a.id);
        if (!over) return a;
        const overSongs = over.songs ?? [];
        const catalogSongIds = new Set(a.songs.map((s) => s.id));
        const extraSongs = overSongs.filter((s) => !catalogSongIds.has(s.id));
        const songs = [
          ...a.songs.map((s) => {
            const overS = overSongs.find((x) => x.id === s.id);
            return overS ? { ...s, ...overS } : s;
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
      ...(saved.artists ?? []).filter(
        (a) => !catalogIds.has(a.id) && !deletedArtistIds.includes(a.id),
      ),
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
    const notices = savedNotices.length
      ? [
          ...SEED_NOTICES.filter((s) => !savedNotices.some((n) => n.id === s.id)),
          ...savedNotices,
        ]
      : SEED_NOTICES;
    set({
      sessionId: saved.sessionId,
      artists,
      accounts: linkArtistAccounts(mergeAccounts(saved.accounts), artists),
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
      notices,
      hydrated: true,
    });
  };

  return {
    hydrated: false,
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
    accounts: SEED_ACCOUNTS,
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
        void loadStudio()
          .then((remote) => {
            if (remote) {
              applySaved({ ...remote, sessionId: get().sessionId ?? saved?.sessionId ?? null });
              applyStitch();
              writePersist(get());
              persist();
              return;
            }
            persist();
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
      let artists = get().artists;
      let song = np.song;
      if (isNew) {
        const plays = formatPlays(parsePlays(np.song.plays) + 1);
        song = { ...np.song, plays };
        artists = artists.map((a) =>
          a.id !== np.artistId
            ? a
            : { ...a, songs: a.songs.map((s) => (s.id === np.song.id ? { ...s, plays } : s)) },
        );
      }
      set({ artists, nowPlaying: { ...np, song }, playing: true });
      if (isNew) persist();
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

    login: (username, password) => {
      const name = username.trim().toLowerCase();
      const pass = password.trim();
      const next = stitchSeed(get().accounts, get().artists, get().deletedArtistIds);
      const seedHit = SEED_ACCOUNTS.find(
        (a) =>
          a.password === pass &&
          (a.username.toLowerCase() === name ||
            a.email.trim().toLowerCase() === name ||
            a.name.trim().toLowerCase() === name),
      );
      let accounts = next.accounts;
      if (seedHit) {
        const i = accounts.findIndex(
          (a) => a.id === seedHit.id || a.username.toLowerCase() === seedHit.username.toLowerCase(),
        );
        accounts =
          i >= 0
            ? accounts.map((a, idx) => (idx === i ? { ...a, ...seedHit, photo: a.photo || seedHit.photo } : a))
            : [...accounts, seedHit];
      }
      set({ ...next, accounts });
      const acc =
        seedHit ||
        accounts.find(
          (a) =>
            a.password === pass &&
            (a.username.toLowerCase() === name ||
              a.email.trim().toLowerCase() === name ||
              a.name.trim().toLowerCase() === name),
        ) ||
        accounts.find(
          (a) =>
            a.username.toLowerCase() === name ||
            a.email.trim().toLowerCase() === name ||
            a.name.trim().toLowerCase() === name,
        );
      if (!acc || acc.password !== pass) return "Username or password is wrong.";
      if (
        get().bannedUserIds.includes(acc.id) ||
        (acc.artistId && get().bannedUserIds.includes(acc.artistId))
      ) {
        return "This account has been removed from Dreamin' Indie.";
      }
      const loc: Locale = acc.locale === "zh" || acc.locale === "en" ? acc.locale : useLocaleStore.getState().locale;
      useLocaleStore.getState().setLocale(loc);
      set({
        sessionId: acc.id,
        meMode: "idle",
        gate: null,
        accounts: get().accounts.map((a) => (a.id === acc.id ? { ...a, locale: loc } : a)),
      });
      persist();
      return null;
    },

    resetPassword: (email, password) => {
      const em = email.trim().toLowerCase();
      if (!validEmail(em)) return "Enter a valid email.";
      if (password.trim().length < 4) return "Password is too short.";
      const acc = get().accounts.find((a) => a.email.trim().toLowerCase() === em);
      if (!acc) return "No account with that email.";
      if (get().bannedUserIds.includes(acc.id) || (acc.artistId && get().bannedUserIds.includes(acc.artistId))) {
        return "This account has been removed from Dreamin' Indie.";
      }
      set({
        accounts: get().accounts.map((a) => (a.id === acc.id ? { ...a, password: password.trim() } : a)),
      });
      persist();
      return null;
    },

    register: (input) => {
      const username = input.username.trim();
      const password = input.password;
      const email = input.email.trim();
      const name = input.name.trim() || username;
      if (!username || !password) return "Username and password are required.";
      if (!validEmail(email)) return "Enter a valid email.";
      if (get().accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
        return "That username is taken.";
      }
      if (get().accounts.some((a) => a.email.trim().toLowerCase() === email.toLowerCase())) {
        return "That email is already registered.";
      }
      if (input.kind === "artist") {
        if (!input.name.trim() || !input.role.trim()) return "Name and role are required.";
        if (!input.trackTitle?.trim()) return "Upload one track so we can review you.";
      }
      const id = uid("acc");
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
              songs: [
                {
                  id: uid("song"),
                  title: input.trackTitle!.trim(),
                  duration: "—",
                  plays: "0",
                  cover: "/media/covers/vinyl.jpg",
                  uploadedAt: new Date().toISOString(),
                  status: "pending",
                },
              ],
              label: wantsISR ? ISR_LABEL : input.label.trim() || "Independent",
              labelApproved: false,
              verified: false,
            }
          : null;
      const account: Account = {
        id,
        username,
        password,
        kind: input.kind,
        name: input.kind === "artist" ? input.name.trim() : name,
        role: input.kind === "artist" ? input.role.trim() : KIND_LABEL[input.kind],
        location: input.location,
        bio: input.bio.trim(),
        photo: artist?.photo ?? "/media/user.jpg",
        email,
        whatsapp: "",
        artistId,
        acceptedUploadTerms: input.kind === "artist" ? true : undefined,
        locale: useLocaleStore.getState().locale,
      };
      const notices = [...get().notices];
      if (artist) {
        notices.unshift({
          id: uid("n"),
          kind: "verify",
          title: `Verify ${artist.name}`,
          body: `${artist.name} registered as ${artist.role} in ${artist.area} and uploaded “${artist.songs[0]?.title}”.`,
          status: "pending",
          refId: artist.id,
          createdAt: new Date().toISOString(),
        });
        notices.unshift({
          id: uid("n"),
          kind: "song",
          title: `Track — ${artist.songs[0]?.title}`,
          body: `${artist.name} uploaded a first track for review.`,
          status: "pending",
          refId: artist.songs[0]!.id,
          createdAt: new Date().toISOString(),
        });
        if (wantsISR) {
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
      }
      set({
        accounts: [...get().accounts, account],
        artists: artist ? [...get().artists, artist] : get().artists,
        notices,
        sessionId: id,
        meMode: "idle",
        gate: null,
        tab: "me",
      });
      persist();
      return null;
    },

    logout: () => {
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
      const wantsISR = claimsISR(patch.label);
      const label = wantsISR ? ISR_LABEL : patch.label.trim() || "Independent";
      const labelApproved = artist.labelApproved && label === artist.label ? artist.labelApproved : false;
      const next: Artist = {
        ...artist,
        name: patch.name.trim() || artist.name,
        role: patch.role.trim() || artist.role,
        area: patch.area,
        city: patch.city,
        genres: patch.genres.length ? patch.genres : artist.genres,
        label,
        labelApproved: wantsISR ? labelApproved : false,
        bio: patch.bio,
        spotify: cleanUrl(patch.spotify) ?? (patch.spotify === "" ? undefined : artist.spotify),
        youtube: cleanUrl(patch.youtube) ?? (patch.youtube === "" ? undefined : artist.youtube),
        photo: patch.photo ?? artist.photo,
      };
      if (patch.spotify !== undefined) next.spotify = cleanUrl(patch.spotify);
      if (patch.youtube !== undefined) next.youtube = cleanUrl(patch.youtube);
      const notices = [...get().notices];
      if (wantsISR && !artist.labelApproved) {
        const already = notices.some(
          (n) => n.kind === "label" && n.refId === artist.id && n.status === "pending",
        );
        if (!already) {
          notices.unshift({
            id: uid("n"),
            kind: "label",
            title: `Inner Soul stamp — ${next.name}`,
            body: `${next.name} asked to be listed under ${ISR_LABEL}.`,
            status: "pending",
            refId: artist.id,
            createdAt: new Date().toISOString(),
          });
        }
      }
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
                email: patch.email !== undefined ? patch.email.trim() : a.email,
                whatsapp: patch.whatsapp !== undefined ? patch.whatsapp.trim() : a.whatsapp,
                photo: patch.photo ?? a.photo,
              }
            : a,
        ),
        notices,
      });
      persist();
    },

    saveAccountProfile: (patch) => {
      const acc = currentAccount(get());
      if (!acc) return;
      set({
        accounts: get().accounts.map((a) =>
          a.id === acc.id
            ? {
                ...a,
                bio: patch.bio,
                location: patch.location,
                email: patch.email !== undefined ? patch.email.trim() : a.email,
                whatsapp: patch.whatsapp !== undefined ? patch.whatsapp.trim() : a.whatsapp,
                name: patch.name?.trim() || a.name,
                photo: patch.photo ?? a.photo,
              }
            : a,
        ),
      });
      persist();
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
    },

    addPendingSong: (title, extra) => {
      const artist = currentArtist(get());
      const acc = currentAccount(get());
      if (!artist) return;
      const live = acc?.kind === "admin";
      const song: Song = {
        id: uid("song"),
        title: title.trim(),
        duration: "—",
        plays: "0",
        cover: extra?.cover ?? "/media/covers/vinyl.jpg",
        uploadedAt: new Date().toISOString(),
        status: live ? "approved" : "pending",
        lyrics: extra?.lyrics?.trim() || undefined,
        spotify: cleanUrl(extra?.spotify),
        youtube: cleanUrl(extra?.youtube),
      };
      set({
        artists: get().artists.map((a) =>
          a.id === artist.id ? { ...a, songs: [song, ...a.songs] } : a,
        ),
        notices: live
          ? get().notices
          : [
              {
                id: uid("n"),
                kind: "song",
                title: `Track — ${song.title}`,
                body: `${artist.name} uploaded “${song.title}” for review.`,
                status: "pending",
                refId: song.id,
                createdAt: new Date().toISOString(),
              },
              ...get().notices,
            ],
      });
      persist();
    },

    updateSongLinks: (songId, extra) => {
      const artist = currentArtist(get());
      if (!artist) return;
      const nextSong = artist.songs.find((s) => s.id === songId);
      const patched = nextSong
        ? {
            ...nextSong,
            spotify: extra.spotify !== undefined ? cleanUrl(extra.spotify) : nextSong.spotify,
            youtube: extra.youtube !== undefined ? cleanUrl(extra.youtube) : nextSong.youtube,
            cover: extra.cover !== undefined ? extra.cover : nextSong.cover,
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
    },

    acceptUploadTerms: () => {
      const acc = currentAccount(get());
      if (!acc || acc.acceptedUploadTerms) return;
      set({
        accounts: get().accounts.map((a) => (a.id === acc.id ? { ...a, acceptedUploadTerms: true } : a)),
      });
      persist();
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
    },

    deletePost: (id) => {
      set({
        deletedPostIds: get().deletedPostIds.includes(id)
          ? get().deletedPostIds
          : [...get().deletedPostIds, id],
        postId: get().postId === id ? null : get().postId,
      });
      persist();
    },

    deleteReply: (postId, replyId) => {
      set({
        posts: get().posts.map((p) =>
          p.id === postId ? { ...p, thread: p.thread.filter((r) => r.id !== replyId) } : p,
        ),
      });
      persist();
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
              }
            : a,
        ),
        artists,
      });
      persist();
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
    },

    deleteEvent: (id) => {
      set({
        events: get().events.filter((e) => e.id !== id),
        eventId: get().eventId === id ? null : get().eventId,
      });
      persist();
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
        status: acc.kind === "admin" ? "approved" : "pending",
        postedBy: acc.id,
      };
      const notices = [...get().notices];
      if (event.status === "pending") {
        notices.unshift({
          id: uid("n"),
          kind: "event",
          title: `Event — ${event.title}`,
          body: `${acc.name} posted ${event.title} at ${event.venue} on ${event.date}.`,
          status: "pending",
          refId: id,
          createdAt: new Date().toISOString(),
        });
      }
      set({ events: [event, ...get().events], notices, eventComposer: false });
      persist();
      return null;
    },

    submitEnquiry: (title, body, fields) => {
      const acc = currentAccount(get());
      if (!acc) {
        set({ gate: "register" });
        return;
      }
      set({
        notices: [
          {
            id: uid("n"),
            kind: "enquiry",
            title,
            body,
            status: "pending",
            createdAt: new Date().toISOString(),
            fields: {
              From: acc.name,
              Account: acc.username,
              ...fields,
            },
          },
          ...get().notices,
        ],
      });
      persist();
    },

    resolveNotice: (id, status) => {
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
    },
  };
});
