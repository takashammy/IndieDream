export type LocationArea = "HK Island" | "Kowloon" | "New Territories";

export type AccountKind = "admin" | "artist" | "explorer" | "business" | "musician";

export type SongStatus = "approved" | "pending" | "declined";

export type Song = {
  id: string;
  title: string;
  duration: string;
  plays: string;
  cover: string;
  uploadedAt: string;
  status: SongStatus;
  lyrics?: string;
  spotify?: string;
  youtube?: string;
  audioUrl?: string;
  genre?: string;
  writers?: string;
  year?: string;
};

export type Artist = {
  id: string;
  name: string;
  role: string;
  city: string;
  area: LocationArea;
  photo: string;
  genres: string[];
  bio: string;
  songs: Song[];
  label: string;
  labelApproved: boolean;
  verified: boolean;
  spotify?: string;
  youtube?: string;
};

export type CueEvent = {
  id: string;
  title: string;
  date: string;
  weekday: string;
  time: string;
  venue: string;
  area: string;
  photo: string;
  artistIds: string[];
  blurb: string;
  isoDate: string;
  status: "approved" | "pending" | "declined";
  postedBy?: string;
};

export type BoardCategory = "seeking" | "gear" | "collab" | "session";

export type BoardReply = {
  id: string;
  author: string;
  authorId?: string;
  role: string;
  body: string;
  createdAt: string;
};

export type BoardPost = {
  id: string;
  author: string;
  authorId?: string;
  role: string;
  category: BoardCategory;
  title: string;
  body: string;
  time: string;
  thread: BoardReply[];
  createdAt: string;
  image?: string;
};

export const APP_NAME = "Dreamin' Indie";
export const ISR_LABEL = "Inner Soul Records";
export const UPLOAD_TERMS =
  "By uploading your song onto the platform, you give Inner Soul Records and Dreamin' Indie the right to promote your songs on the platform and at other venues, and in return you waive all rights to any copyright claims. You may delete your songs from the platform at any time. By continuing to upload, you automatically agree to this agreement.";
export const LOCATIONS: LocationArea[] = ["HK Island", "Kowloon", "New Territories"];
export const GENRE_OPTIONS = [
  "Jazz",
  "Soul",
  "Indie",
  "Folk",
  "Rock",
  "Electronic",
  "Ambient",
  "Hip-hop",
  "R&B",
  "Classical",
  "Contemporary",
  "Cantopop",
  "Pop",
];

export const PUBLISH_PACKAGES = [
  {
    id: "music",
    name: "Publish music only",
    price: "$800",
    note: "Distribution, metadata, and a clean release sheet.",
  },
  {
    id: "art",
    name: "Publish music and cover art",
    price: "$1,500",
    note: "Release plus a designed sleeve.",
  },
  {
    id: "prod",
    name: "Publish music and professional production",
    price: "$8,000",
    note: "Tracking, mix, and a full release on the big platforms.",
  },
] as const;

function sp(q: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(q)}`;
}
function yt(q: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export const ARTISTS: Artist[] = [];

export const EVENTS: CueEvent[] = [];

export const POSTS: BoardPost[] = [];

export const CATEGORY_LABEL: Record<BoardCategory, string> = {
  seeking: "Seeking",
  gear: "Gear",
  collab: "Collab",
  session: "Session",
};

export const KIND_LABEL: Record<AccountKind, string> = {
  admin: "Admin",
  artist: "Artist",
  explorer: "Explorer",
  business: "Business",
  musician: "Musician",
};

export function migrateAccountKind(kind: string | undefined): AccountKind {
  if (kind === "listener") return "explorer";
  if (
    kind === "admin" ||
    kind === "artist" ||
    kind === "explorer" ||
    kind === "business" ||
    kind === "musician"
  ) {
    return kind;
  }
  return "explorer";
}

export function ageLabel(iso: string, now = Date.now()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const ms = Math.max(0, now - then);
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mo`;
}

export function isISR(artist: Artist) {
  return Boolean(artist.labelApproved);
}

export function claimsISR(label: string) {
  return label.trim().toLowerCase() === ISR_LABEL.toLowerCase();
}

export function isListedArtist(artist: Artist) {
  return artist.verified && artist.songs.some((s) => s.status === "approved");
}

export function catalogVisible(artist: Artist, accounts: { artistId?: string; kind: string }[]) {
  if (!isListedArtist(artist)) return false;
  const acc = accounts.find((a) => a.artistId === artist.id);
  if (!acc) return true;
  return acc.kind === "artist" || acc.kind === "admin";
}

export function parsePlays(value: string) {
  const raw = (value || "").trim().toLowerCase().replace(/,/g, "");
  if (!raw) return 0;
  if (raw.endsWith("k")) {
    const n = parseFloat(raw);
    return Number.isFinite(n) ? Math.round(n * 1000) : 0;
  }
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

export function formatPlays(n: number) {
  if (n < 1000) return String(Math.max(0, n));
  if (n < 10000) return n.toLocaleString("en-US");
  const k = n / 1000;
  const t = k >= 10 ? k.toFixed(0) : k.toFixed(1);
  return `${t.replace(/\.0$/, "")}k`;
}

export function liveSongs(artist: Artist) {
  return artist.songs.filter((s) => s.status === "approved");
}

export function artistById(id: string, list: Artist[] = ARTISTS) {
  return list.find((a) => a.id === id);
}

export function genresFromCatalog(list: Artist[] = ARTISTS) {
  const set = new Set<string>();
  for (const artist of list) {
    if (!isListedArtist(artist)) continue;
    for (const genre of artist.genres) set.add(genre);
  }
  return [...set].sort();
}

export function artistsByGenre(genre: string, list: Artist[] = ARTISTS) {
  return list.filter((a) => isListedArtist(a) && a.genres.includes(genre));
}

export function eventsForArtist(artistId: string, events: CueEvent[] = EVENTS, now = new Date()) {
  return liveEvents(events, now).filter((e) => e.artistIds.includes(artistId));
}

export function shufflePick<T>(items: T[], n: number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function formatEventDate(iso: string) {
  const d = new Date(`${iso}T12:00:00+08:00`);
  const weekday = d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Asia/Hong_Kong" });
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Hong_Kong" });
  return { weekday, date };
}

export function todayISO(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
}

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function isPostExpired(post: BoardPost, now = Date.now()) {
  return now - new Date(post.createdAt).getTime() > THIRTY_DAYS_MS;
}

export type TrackHit = {
  song: Song;
  artist: Artist;
};

export function recentTracks(list: Artist[], n = 3): TrackHit[] {
  const hits: TrackHit[] = [];
  for (const artist of list) {
    if (!isListedArtist(artist)) continue;
    for (const song of liveSongs(artist)) hits.push({ song, artist });
  }
  hits.sort((a, b) => +new Date(b.song.uploadedAt) - +new Date(a.song.uploadedAt));
  return hits.slice(0, n);
}

export function randomLiveTrack(list: Artist[]): TrackHit | null {
  const hits: TrackHit[] = [];
  for (const artist of list) {
    if (!isListedArtist(artist)) continue;
    for (const song of liveSongs(artist)) hits.push({ song, artist });
  }
  if (hits.length === 0) return null;
  return hits[Math.floor(Math.random() * hits.length)] ?? null;
}

/** Approved events still on or after Hong Kong today — public listing. */
export function liveEvents(events: CueEvent[], now = new Date()) {
  const today = todayISO(now);
  return events
    .filter((e) => e.status === "approved" && e.isoDate >= today)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
}

/** Approved events before Hong Kong today — Desk archive, not deleted. */
export function pastEvents(events: CueEvent[], now = new Date()) {
  const today = todayISO(now);
  return events
    .filter((e) => e.status === "approved" && e.isoDate < today)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));
}

export function upcomingEvents(events: CueEvent[], n = 3, now = new Date()) {
  return liveEvents(events, now).slice(0, n);
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validWhatsapp(value: string) {
  return value.replace(/\D/g, "").length >= 8;
}

export function whatsappHref(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
}
