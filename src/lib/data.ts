export type AccountKind = "admin" | "artist" | "explorer" | "business";
export type TabId = "home" | "artists" | "discover" | "events" | "board" | "services" | "me";
export type PostCategory = "seeking" | "collab" | "gear" | "session";
export type EventStatus = "pending" | "live" | "past";
export type NoticeKind = "register" | "artist" | "event" | "post" | "booking" | "reset";
export type BookingStatus = "open" | "completed";
export type ServiceKind = "mix" | "photo" | "rehearsal" | "press";

export const KIND_LABEL: Record<AccountKind, string> = {
  admin: "Admin",
  artist: "Artist",
  explorer: "Explorer",
  business: "Business",
};

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  seeking: "Seeking",
  collab: "Collab",
  gear: "Gear",
  session: "Session",
};

export function todayISO(tz = "Asia/Hong_Kong"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function ageLabel(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.max(0, Math.round((now - then) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 14) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function migrateAccountKind(kind: string | undefined): AccountKind {
  if (kind === "listener") return "explorer";
  if (kind === "admin" || kind === "artist" || kind === "explorer" || kind === "business") return kind;
  return "explorer";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export type Account = {
  id: string;
  name: string;
  email: string;
  password: string;
  kind: AccountKind;
  city: string;
  whatsapp?: string;
  banned?: boolean;
  artistId?: string;
  createdAt: string;
};

export type Song = {
  id: string;
  title: string;
  year: number;
  cover?: string;
};

export type Artist = {
  id: string;
  accountId: string;
  name: string;
  city: string;
  instruments: string[];
  bio: string;
  photo?: string;
  verified: boolean;
  songs: Song[];
};

export type Reply = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type Post = {
  id: string;
  authorId: string;
  category: PostCategory;
  title: string;
  body: string;
  createdAt: string;
  archived?: boolean;
  replies: Reply[];
};

export type Gig = {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  city: string;
  hostId: string;
  status: EventStatus;
  blurb: string;
};

export type ServiceOffer = {
  id: string;
  kind: ServiceKind;
  title: string;
  providerId: string;
  price: string;
  detail: string;
};

export type Booking = {
  id: string;
  serviceId: string;
  fromId: string;
  whatsapp: string;
  note: string;
  status: BookingStatus;
  createdAt: string;
};

export type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  refId?: string;
  createdAt: string;
  resolved?: boolean;
};

const T = "2026-09-13T01:00:00+08:00";

export const SEED_ACCOUNTS: Account[] = [
  { id: "u-admin", name: "Maya Chen", email: "admin@indiedream.hk", password: "inner-soul", kind: "admin", city: "Hong Kong", createdAt: "2026-06-01T10:00:00+08:00" },
  { id: "u-tess", name: "Tess Lau", email: "tess@indiedream.hk", password: "cello", kind: "artist", city: "Hong Kong", whatsapp: "85290001111", artistId: "a-tess", createdAt: "2026-07-12T10:00:00+08:00" },
  { id: "u-kai", name: "Kai Wong", email: "kai@indiedream.hk", password: "strings", kind: "artist", city: "Kowloon", whatsapp: "85290002222", artistId: "a-kai", createdAt: "2026-07-18T10:00:00+08:00" },
  { id: "u-yuki", name: "Yuki Nakamura", email: "yuki@indiedream.hk", password: "voice", kind: "artist", city: "Wan Chai", whatsapp: "85290003333", artistId: "a-yuki", createdAt: "2026-07-22T10:00:00+08:00" },
  { id: "u-owen", name: "Owen Ng", email: "owen@indiedream.hk", password: "drums", kind: "artist", city: "Sham Shui Po", artistId: "a-owen", createdAt: "2026-08-01T10:00:00+08:00" },
  { id: "u-bee", name: "Bee Tran", email: "bee@indiedream.hk", password: "keys", kind: "artist", city: "Tai Po", whatsapp: "85290004444", artistId: "a-bee", createdAt: "2026-08-04T10:00:00+08:00" },
  { id: "u-rina", name: "Rina Ho", email: "rina@indiedream.hk", password: "bass", kind: "artist", city: "Jordan", artistId: "a-rina", createdAt: "2026-08-08T10:00:00+08:00" },
  { id: "u-leo", name: "Leo Park", email: "leo@indiedream.hk", password: "mix", kind: "artist", city: "Kwun Tong", whatsapp: "85290005555", artistId: "a-leo", createdAt: "2026-08-11T10:00:00+08:00" },
  { id: "u-sora", name: "Sora Chan", email: "sora@indiedream.hk", password: "folk", kind: "artist", city: "Sai Ying Pun", artistId: "a-sora", createdAt: "2026-08-14T10:00:00+08:00" },
  { id: "u-mina", name: "Mina Cruz", email: "mina@indiedream.hk", password: "indie", kind: "artist", city: "Mong Kok", whatsapp: "85290006666", artistId: "a-mina", createdAt: "2026-08-16T10:00:00+08:00" },
  { id: "u-jun", name: "Jun Wei", email: "jun@indiedream.hk", password: "tape", kind: "artist", city: "Tsuen Wan", artistId: "a-jun", createdAt: "2026-08-20T10:00:00+08:00" },
  { id: "u-ada", name: "Ada Ferreira", email: "ada@indiedream.hk", password: "stage", kind: "artist", city: "Central", whatsapp: "85290007777", artistId: "a-ada", createdAt: "2026-08-24T10:00:00+08:00" },
  { id: "u-iris", name: "Iris Mak", email: "iris@explore.hk", password: "listen", kind: "explorer", city: "Causeway Bay", createdAt: "2026-08-26T10:00:00+08:00" },
  { id: "u-tom", name: "Tom Ellis", email: "tom@explore.hk", password: "listen", kind: "explorer", city: "Sheung Wan", createdAt: "2026-08-28T10:00:00+08:00" },
  { id: "u-priya", name: "Priya Shah", email: "priya@explore.hk", password: "listen", kind: "explorer", city: "Kennedy Town", whatsapp: "85290008888", createdAt: "2026-09-01T10:00:00+08:00" },
  { id: "u-haven", name: "Haven Rooms", email: "bookings@haven.hk", password: "venue", kind: "business", city: "Wan Chai", whatsapp: "85290009999", createdAt: "2026-07-02T10:00:00+08:00" },
  { id: "u-press", name: "South Island Press", email: "desk@southpress.hk", password: "ink", kind: "business", city: "Aberdeen", createdAt: "2026-07-09T10:00:00+08:00" },
];

export const SEED_ARTISTS: Artist[] = [
  { id: "a-tess", accountId: "u-tess", name: "Tess Lau", city: "Hong Kong", instruments: ["Cello", "Voice"], bio: "Chamber-pop cellist writing for small rooms and late ferries.", verified: true, songs: [{ id: "s-tess-1", title: "Harbour Wire", year: 2025 }, { id: "s-tess-2", title: "Second Sitting", year: 2026 }] },
  { id: "a-kai", accountId: "u-kai", name: "Kai Wong", city: "Kowloon", instruments: ["Guitar", "Pedals"], bio: "Textural guitar, tape loops, and one reliable delay.", verified: true, songs: [{ id: "s-kai-1", title: "Sodium Light", year: 2025 }] },
  { id: "a-yuki", accountId: "u-yuki", name: "Yuki Nakamura", city: "Wan Chai", instruments: ["Voice", "Synth"], bio: "Night-shift vocals over spare electronics.", verified: true, songs: [{ id: "s-yuki-1", title: "Last Train East", year: 2026 }] },
  { id: "a-owen", accountId: "u-owen", name: "Owen Ng", city: "Sham Shui Po", instruments: ["Drums"], bio: "Keeps time for rooms that refuse a click.", verified: false, songs: [{ id: "s-owen-1", title: "Tin Roof", year: 2024 }] },
  { id: "a-bee", accountId: "u-bee", name: "Bee Tran", city: "Tai Po", instruments: ["Keys", "Rhodes"], bio: "Warm keys, church-hall decay, patient voicings.", verified: true, songs: [{ id: "s-bee-1", title: "Green Line", year: 2025 }] },
  { id: "a-rina", accountId: "u-rina", name: "Rina Ho", city: "Jordan", instruments: ["Bass"], bio: "Low-end for live bands who still look at each other.", verified: false, songs: [{ id: "s-rina-1", title: "Underpass", year: 2026 }] },
  { id: "a-leo", accountId: "u-leo", name: "Leo Park", city: "Kwun Tong", instruments: ["Mix", "Guitar"], bio: "Mixes in a converted unit above a print shop.", verified: true, songs: [{ id: "s-leo-1", title: "Proof Copy", year: 2025 }] },
  { id: "a-sora", accountId: "u-sora", name: "Sora Chan", city: "Sai Ying Pun", instruments: ["Acoustic", "Voice"], bio: "Folk songs that refuse to be busked.", verified: false, songs: [{ id: "s-sora-1", title: "Western Street", year: 2026 }] },
  { id: "a-mina", accountId: "u-mina", name: "Mina Cruz", city: "Mong Kok", instruments: ["Voice", "Guitar"], bio: "Sharp hooks, thrifted jackets, no chorus wasted.", verified: true, songs: [{ id: "s-mina-1", title: "Neon Alter", year: 2025 }] },
  { id: "a-jun", accountId: "u-jun", name: "Jun Wei", city: "Tsuen Wan", instruments: ["Field recording", "Tape"], bio: "Collects rooms more than notes.", verified: false, songs: [{ id: "s-jun-1", title: "Platform 5", year: 2024 }] },
  { id: "a-ada", accountId: "u-ada", name: "Ada Ferreira", city: "Central", instruments: ["Voice", "Piano"], bio: "Art-song leaning into club hours.", verified: true, songs: [{ id: "s-ada-1", title: "Ledger", year: 2026 }] },
];

export const SEED_POSTS: Post[] = [
  { id: "p1", authorId: "u-tess", category: "seeking", title: "Cellist for a quiet Saturday bill", body: "Looking for a singer or guitar who can sit still. Two songs, no click, Wan Chai room.", createdAt: "2026-09-12T20:10:00+08:00", replies: [{ id: "r1", authorId: "u-yuki", body: "I can do late. Send the keys.", createdAt: "2026-09-12T21:02:00+08:00" }] },
  { id: "p2", authorId: "u-kai", category: "collab", title: "Need a second guitar for Sodium Light live", body: "One night at Haven. Bring a volume knob and patience.", createdAt: "2026-09-12T16:40:00+08:00", replies: [] },
  { id: "p3", authorId: "u-bee", category: "session", title: "Rhodes + room, Tuesday mornings", body: "Tai Po. Tea included. No metal through the floor.", createdAt: "2026-09-11T09:15:00+08:00", replies: [{ id: "r2", authorId: "u-owen", body: "Drums in cases only. Interested.", createdAt: "2026-09-11T11:00:00+08:00" }, { id: "r3", authorId: "u-iris", body: "Can I sit in and record atmosphere?", createdAt: "2026-09-11T12:22:00+08:00" }] },
  { id: "p4", authorId: "u-owen", category: "gear", title: "Lending a spare snare this month", body: "Maple, no dents that matter. Collect in Sham Shui Po.", createdAt: "2026-09-10T18:00:00+08:00", replies: [] },
  { id: "p5", authorId: "u-mina", category: "seeking", title: "Bass for a four-song EP", body: "Mong Kok nights. Bring a quiet amp.", createdAt: "2026-09-10T14:30:00+08:00", replies: [] },
  { id: "p6", authorId: "u-sora", category: "collab", title: "Harmony on Western Street", body: "Need one high voice that does not decorate too much.", createdAt: "2026-09-09T19:45:00+08:00", replies: [{ id: "r4", authorId: "u-ada", body: "Send a worktape.", createdAt: "2026-09-09T20:10:00+08:00" }] },
  { id: "p7", authorId: "u-leo", category: "session", title: "Mix notes while you wait", body: "Kwun Tong unit. Bring stems labelled like adults.", createdAt: "2026-09-08T11:00:00+08:00", replies: [] },
  { id: "p8", authorId: "u-jun", category: "gear", title: "Broken Walkman, working motor", body: "Free to a tape person. Pickup Tsuen Wan.", createdAt: "2026-09-07T15:20:00+08:00", replies: [] },
  { id: "p9", authorId: "u-rina", category: "seeking", title: "Band that still counts off out loud", body: "Tired of backing tracks. Jordan rehearsals.", createdAt: "2026-09-13T07:10:00+08:00", replies: [] },
  { id: "p10", authorId: "u-tom", category: "collab", title: "Zine page for October shows", body: "Explorer putting ink on cheap paper. Send one photo, one sentence.", createdAt: "2026-09-12T08:00:00+08:00", replies: [{ id: "r5", authorId: "u-mina", body: "Photo tomorrow.", createdAt: "2026-09-12T09:40:00+08:00" }, { id: "r6", authorId: "u-kai", body: "Sentence: delay until it hurts.", createdAt: "2026-09-12T10:05:00+08:00" }] },
];

export const SEED_EVENTS: Gig[] = [
  { id: "e1", title: "Harbour Wire evening", venue: "Haven Rooms", date: "2026-09-20", time: "20:00", city: "Wan Chai", hostId: "u-tess", status: "live", blurb: "Cello, voice, no chatter between songs." },
  { id: "e2", title: "Sodium Light duo", venue: "Backstair", date: "2026-09-27", time: "21:30", city: "Jordan", hostId: "u-kai", status: "live", blurb: "Two guitars and a borrowed PA." },
  { id: "e3", title: "Warehouse open mic", venue: "Unit 19", date: "2026-09-18", time: "19:00", city: "Kwun Tong", hostId: "u-leo", status: "pending", blurb: "Sign-up list on the door. Twelve minutes each." },
  { id: "e4", title: "Ledger preview", venue: "South Island Press", date: "2026-10-04", time: "18:00", city: "Aberdeen", hostId: "u-ada", status: "live", blurb: "Piano, voice, newsprint on the chairs." },
  { id: "e5", title: "Green Line listening", venue: "Tai Po hall", date: "2026-09-05", time: "16:00", city: "Tai Po", hostId: "u-bee", status: "past", blurb: "Afternoon keys. Already happened." },
];

export const SEED_SERVICES: ServiceOffer[] = [
  { id: "sv1", kind: "mix", title: "Stem mix, two revisions", providerId: "u-leo", price: "HK$1,800", detail: "Stereo mix from labelled stems. No mastering." },
  { id: "sv2", kind: "photo", title: "Studio stills, half day", providerId: "u-press", price: "HK$2,200", detail: "Three looks, edited set of twelve." },
  { id: "sv3", kind: "rehearsal", title: "Haven evening lockout", providerId: "u-haven", price: "HK$600", detail: "19:00–23:00. Backline listed on request." },
  { id: "sv4", kind: "press", title: "One-sheet + quote", providerId: "u-press", price: "HK$900", detail: "400 words, one pull quote, print-ready." },
];

export const SEED_BOOKINGS: Booking[] = [
  { id: "b1", serviceId: "sv3", fromId: "u-mina", whatsapp: "85290006666", note: "Need a quiet Thursday if the calendar allows.", status: "open", createdAt: "2026-09-11T13:00:00+08:00" },
  { id: "b2", serviceId: "sv1", fromId: "u-tess", whatsapp: "85290001111", note: "Cello + voice stems ready.", status: "open", createdAt: "2026-09-12T09:20:00+08:00" },
  { id: "b3", serviceId: "sv2", fromId: "u-yuki", whatsapp: "85290003333", note: "Black shirt, no flash if possible.", status: "completed", createdAt: "2026-09-01T16:00:00+08:00" },
];

export const SEED_NOTICES: Notice[] = [
  { id: "n1", kind: "artist", title: "Roster review — Owen Ng", body: "Drums. No WhatsApp on file.", refId: "a-owen", createdAt: "2026-09-12T10:00:00+08:00" },
  { id: "n2", kind: "artist", title: "Roster review — Rina Ho", body: "Bass. Awaiting first live date.", refId: "a-rina", createdAt: "2026-09-12T10:05:00+08:00" },
  { id: "n3", kind: "event", title: "Date pending — Warehouse open mic", body: "Unit 19, 18 Sep.", refId: "e3", createdAt: "2026-09-10T08:00:00+08:00" },
  { id: "n4", kind: "booking", title: "Lockout request — Mina Cruz", body: "Haven evening.", refId: "b1", createdAt: "2026-09-11T13:01:00+08:00" },
];

export const TAGLINE = "A platform for musicians chasing dreams.";

export function accountFromArtist(artist: Artist, existing?: Account): Account {
  return (
    existing ?? {
      id: artist.accountId,
      name: artist.name,
      email: `${artist.id.replace("a-", "")}@indiedream.hk`,
      password: "preview",
      kind: "artist",
      city: artist.city,
      artistId: artist.id,
      createdAt: T,
    }
  );
}
