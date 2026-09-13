export type LocationArea = "HK Island" | "Kowloon" | "New Territories";
export type AccountKind = "admin" | "artist" | "explorer" | "business";
export type SongStatus = "approved" | "pending" | "declined";
export type Song = { id: string; title: string; duration: string; plays: string; cover: string; uploadedAt: string; status: SongStatus; spotify?: string; youtube?: string; audioUrl?: string; };
export type Artist = { id: string; name: string; role: string; city: string; area: LocationArea; photo: string; genres: string[]; bio: string; songs: Song[]; label: string; labelApproved: boolean; verified: boolean; spotify?: string; youtube?: string; };
export type CueEvent = { id: string; title: string; date: string; weekday: string; time: string; venue: string; area: string; photo: string; artistIds: string[]; blurb: string; isoDate: string; status: "approved" | "pending" | "declined"; postedBy?: string; };
export type BoardCategory = "seeking" | "gear" | "collab" | "session";
export type BoardReply = { id: string; author: string; authorId?: string; role: string; body: string; createdAt: string; };
export type BoardPost = { id: string; author: string; authorId?: string; role: string; category: BoardCategory; title: string; body: string; time: string; thread: BoardReply[]; createdAt: string; };
export const ISR_LABEL = "Inner Soul Records";
export const LOCATIONS: LocationArea[] = ["HK Island", "Kowloon", "New Territories"];
export const GENRE_OPTIONS = ["Jazz","Soul","Indie","Folk","Rock","Electronic","Ambient","Hip-hop","R&B","Classical","Contemporary","Cantopop","Pop"];
export const PUBLISH_PACKAGES = [
  { id: "music", name: "Publish music only", price: "$800", note: "Distribution, metadata, and a clean release sheet." },
  { id: "art", name: "Publish music and cover art", price: "$1,500", note: "Release plus a designed sleeve from Inner Soul Records." },
  { id: "prod", name: "Publish music and professional production", price: "$8,000", note: "Tracking, mix, master, and a full Inner Soul release." },
] as const;
function sp(q: string) { return `https://open.spotify.com/search/${encodeURIComponent(q)}`; }
function yt(q: string) { return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`; }
export const ARTISTS: Artist[] = [
  { id: "mei", name: "Mei Ling Chan", role: "Jazz vocalist", city: "Sheung Wan", area: "HK Island", photo: "/media/artists/mei.jpg", genres: ["Jazz", "Soul"], bio: "Sings standards like they still owe her something. Residencies at small rooms off Hollywood Road, a voice that sits just behind the beat.", label: ISR_LABEL, labelApproved: true, verified: true, spotify: sp("Mei Ling Chan jazz"), youtube: yt("Mei Ling Chan jazz vocal"), songs: [{ id: "mei-1", title: "After Hours on Hollywood Road", duration: "4:12", plays: "8.4k", cover: "/media/covers/silk.jpg", uploadedAt: "2026-08-12T20:00:00+08:00", status: "approved", spotify: sp("After Hours on Hollywood Road"), youtube: yt("After Hours on Hollywood Road") }, { id: "mei-2", title: "Smoke Over the Harbour", duration: "3:48", plays: "12.1k", cover: "/media/covers/vinyl.jpg", uploadedAt: "2026-08-28T18:00:00+08:00", status: "approved", spotify: sp("Smoke Over the Harbour") }, { id: "mei-3", title: "Last Call in Sheung Wan", duration: "5:02", plays: "6.7k", cover: "/media/covers/silk.jpg", uploadedAt: "2026-09-04T21:00:00+08:00", status: "approved" }] },
  { id: "kai", name: "Kai Rivera", role: "Indie guitarist", city: "Sham Shui Po", area: "Kowloon", photo: "/media/artists/kai.jpg", genres: ["Indie", "Rock"], bio: "Writes songs in the back of a rehearsal warehouse and plays them like the walls might answer. Looking for a rhythm section that actually listens.", label: "Independent", labelApproved: false, verified: true, youtube: yt("Kai Rivera indie"), songs: [{ id: "kai-1", title: "Sham Shui Nights", duration: "3:21", plays: "15.2k", cover: "/media/covers/guitar.jpg", uploadedAt: "2026-09-05T16:00:00+08:00", status: "approved", spotify: sp("Sham Shui Nights"), youtube: yt("Sham Shui Nights") }, { id: "kai-2", title: "Leave the Amp On", duration: "2:54", plays: "9.8k", cover: "/media/covers/drums.jpg", uploadedAt: "2026-08-18T16:00:00+08:00", status: "approved" }, { id: "kai-3", title: "Brick and Wire", duration: "4:07", plays: "4.3k", cover: "/media/covers/guitar.jpg", uploadedAt: "2026-07-30T16:00:00+08:00", status: "approved" }] },
  { id: "amina", name: "Amina Hassan", role: "Electronic producer", city: "Kennedy Town", area: "HK Island", photo: "/media/artists/amina.jpg", genres: ["Electronic", "Ambient"], bio: "Builds tracks from field recordings and a stubborn analogue synth. Available for film cues, late rooftops, and anyone who still likes a long intro.", label: "Independent", labelApproved: false, verified: true, spotify: sp("Amina Hassan electronic"), songs: [{ id: "amina-1", title: "Patch Bay 04", duration: "5:44", plays: "21.0k", cover: "/media/covers/synth.jpg", uploadedAt: "2026-08-02T22:00:00+08:00", status: "approved", youtube: yt("Patch Bay 04") }, { id: "amina-2", title: "West Island Drift", duration: "6:18", plays: "11.6k", cover: "/media/covers/rain.jpg", uploadedAt: "2026-08-21T22:00:00+08:00", status: "approved" }, { id: "amina-3", title: "Cyan After Midnight", duration: "4:33", plays: "7.9k", cover: "/media/covers/synth.jpg", uploadedAt: "2026-09-01T22:00:00+08:00", status: "approved", spotify: sp("Cyan After Midnight") }] },
  { id: "jun", name: "Jun Park", role: "MC / writer", city: "Mong Kok", area: "Kowloon", photo: "/media/artists/jun.jpg", genres: ["Hip-hop", "R&B"], bio: "Writes in two languages and performs in one breath. Night-market cadence, studio discipline. Open to features that don\u2019t sand him down.", label: "Independent", labelApproved: false, verified: true, spotify: sp("Jun Park hip hop"), youtube: yt("Jun Park MC"), songs: [{ id: "jun-1", title: "Neon Stall", duration: "2:48", plays: "34.5k", cover: "/media/covers/rain.jpg", uploadedAt: "2026-09-06T19:00:00+08:00", status: "approved", spotify: sp("Neon Stall Jun Park"), youtube: yt("Neon Stall Jun Park") }, { id: "jun-2", title: "Second Language", duration: "3:16", plays: "18.2k", cover: "/media/covers/vinyl.jpg", uploadedAt: "2026-08-14T19:00:00+08:00", status: "approved" }, { id: "jun-3", title: "After the Last Train", duration: "3:02", plays: "9.1k", cover: "/media/covers/rain.jpg", uploadedAt: "2026-07-22T19:00:00+08:00", status: "approved" }] },
  { id: "sofia", name: "Sofia Berg", role: "Cellist", city: "Mid-Levels", area: "HK Island", photo: "/media/artists/sofia.jpg", genres: ["Classical", "Contemporary"], bio: "Recital hall by afternoon, session work by night. Interested in electronic pairings and scores that leave the cello some air.", label: "Independent", labelApproved: false, verified: true, songs: [{ id: "sofia-1", title: "Window Study in C", duration: "6:05", plays: "5.4k", cover: "/media/covers/cello.jpg", uploadedAt: "2026-08-08T11:00:00+08:00", status: "approved" }, { id: "sofia-2", title: "Dust in the Light", duration: "4:41", plays: "3.8k", cover: "/media/covers/cello.jpg", uploadedAt: "2026-08-25T11:00:00+08:00", status: "approved", youtube: yt("Dust in the Light cello") }] },
  { id: "leo", name: "Leo Tam", role: "Cantopop vocalist", city: "Tsim Sha Tsui", area: "Kowloon", photo: "/media/artists/leo.jpg", genres: ["Cantopop", "Pop"], bio: "Rooftop sessions and tight live bands. Writes in Cantonese first. Looking for players who can hold a chorus without crowding it.", label: ISR_LABEL, labelApproved: true, verified: true, spotify: sp("Leo Tam cantopop"), youtube: yt("Leo Tam"), songs: [{ id: "leo-1", title: "Golden Hour, TST", duration: "3:37", plays: "42.0k", cover: "/media/covers/vinyl.jpg", uploadedAt: "2026-09-07T20:00:00+08:00", status: "approved", spotify: sp("Golden Hour TST"), youtube: yt("Golden Hour TST Leo Tam") }, { id: "leo-2", title: "Leave the Blazer On", duration: "3:11", plays: "19.7k", cover: "/media/covers/silk.jpg", uploadedAt: "2026-08-16T20:00:00+08:00", status: "approved" }, { id: "leo-3", title: "Last Ferry", duration: "4:00", plays: "8.6k", cover: "/media/covers/rain.jpg", uploadedAt: "2026-07-19T20:00:00+08:00", status: "approved" }] },
  { id: "nia", name: "Nia Okonkwo", role: "Soul singer", city: "Wan Chai", area: "HK Island", photo: "/media/artists/nia.jpg", genres: ["Soul", "Jazz"], bio: "A voice built for small rooms and long notes. Sundays at The Wanch, weekdays in session. Will not do a click-track ballad unless it earns it.", label: ISR_LABEL, labelApproved: true, verified: true, youtube: yt("Nia Okonkwo soul"), songs: [{ id: "nia-1", title: "Velvet Jacket", duration: "4:28", plays: "16.3k", cover: "/media/covers/silk.jpg", uploadedAt: "2026-08-11T17:00:00+08:00", status: "approved", spotify: sp("Velvet Jacket Nia") }, { id: "nia-2", title: "Keep the Lights Low", duration: "3:55", plays: "10.4k", cover: "/media/covers/vinyl.jpg", uploadedAt: "2026-09-02T17:00:00+08:00", status: "approved", youtube: yt("Keep the Lights Low Nia") }] },
  { id: "ryo", name: "Ryo Nakamura", role: "Drummer", city: "Kwun Tong", area: "Kowloon", photo: "/media/artists/ryo.jpg", genres: ["Rock", "Jazz"], bio: "For hire, not for decoration. Pocket first, fills second. Available for residencies, records, and anyone tired of a drum machine.", label: "Independent", labelApproved: false, verified: true, songs: [{ id: "ryo-1", title: "Warehouse Take 3", duration: "3:09", plays: "6.2k", cover: "/media/covers/drums.jpg", uploadedAt: "2026-08-06T15:00:00+08:00", status: "approved" }, { id: "ryo-2", title: "Left Hand Ride", duration: "2:41", plays: "4.9k", cover: "/media/covers/drums.jpg", uploadedAt: "2026-08-29T15:00:00+08:00", status: "approved" }] },
  { id: "tess", name: "Tess Wong", role: "Folk songwriter", city: "Sai Ying Pun", area: "HK Island", photo: "/media/covers/silk.jpg", genres: ["Indie", "Folk"], bio: "Quiet songs about leaving and coming back. Plays open tunings in rooms that still have ceiling fans.", label: "Independent", labelApproved: false, verified: true, spotify: sp("Tess Wong folk"), youtube: yt("Tess Wong songwriter"), songs: [{ id: "tess-1", title: "Tin Hau After Rain", duration: "3:44", plays: "2.1k", cover: "/media/covers/rain.jpg", uploadedAt: "2026-09-03T19:00:00+08:00", status: "approved", spotify: sp("Tin Hau After Rain") }, { id: "tess-2", title: "Borrowed Light", duration: "4:08", plays: "1.4k", cover: "/media/covers/silk.jpg", uploadedAt: "2026-08-20T19:00:00+08:00", status: "approved" }] },
  { id: "hassan", name: "Hassan Malik", role: "Saxophonist", city: "Jordan", area: "Kowloon", photo: "/media/covers/vinyl.jpg", genres: ["Jazz", "Soul"], bio: "Horns for hire, charts on request. Prefers small rooms and players who leave space.", label: "Independent", labelApproved: false, verified: true, youtube: yt("Hassan Malik saxophone"), songs: [{ id: "hassan-1", title: "Last Set at Hidden Agenda", duration: "5:16", plays: "3.6k", cover: "/media/covers/vinyl.jpg", uploadedAt: "2026-08-27T21:00:00+08:00", status: "approved", youtube: yt("Last Set at Hidden Agenda") }] },
  { id: "yuki", name: "Yuki Cheung", role: "DJ / producer", city: "Tuen Mun", area: "New Territories", photo: "/media/covers/synth.jpg", genres: ["Electronic", "Hip-hop"], bio: "Warehouse edits and late buses home. First upload is sitting with Inner Soul for review.", label: "Independent", labelApproved: false, verified: false, songs: [{ id: "yuki-1", title: "Warehouse Edit 07", duration: "4:22", plays: "0", cover: "/media/covers/synth.jpg", uploadedAt: "2026-09-07T23:10:00+08:00", status: "pending" }] },
  { id: "daniel", name: "Daniel Ho", role: "Beatmaker", city: "Sham Shui Po", area: "Kowloon", photo: "/media/covers/rain.jpg", genres: ["Hip-hop", "R&B"], bio: "Makes beats in a subdivided flat and names them after minibus routes. Open to Cantonese features.", label: "Independent", labelApproved: false, verified: true, spotify: sp("Daniel Ho beats"), songs: [{ id: "daniel-1", title: "Night Bus 1A", duration: "2:37", plays: "8.8k", cover: "/media/covers/rain.jpg", uploadedAt: "2026-09-04T18:00:00+08:00", status: "approved", spotify: sp("Night Bus 1A"), youtube: yt("Night Bus 1A Daniel Ho") }, { id: "daniel-2", title: "Mong Kok Grid", duration: "3:05", plays: "5.2k", cover: "/media/covers/synth.jpg", uploadedAt: "2026-08-15T18:00:00+08:00", status: "approved" }] },
  { id: "clara", name: "Clara Ip", role: "Violinist", city: "Mid-Levels", area: "HK Island", photo: "/media/covers/cello.jpg", genres: ["Classical", "Contemporary"], bio: "Session strings, quartet work, and the occasional pop overdub. Will not play over a loop that is already doing her job.", label: "Independent", labelApproved: false, verified: true, songs: [{ id: "clara-1", title: "Harbour Harmonic", duration: "4:51", plays: "1.9k", cover: "/media/covers/cello.jpg", uploadedAt: "2026-08-30T11:00:00+08:00", status: "approved" }] },
];
export const EVENTS: CueEvent[] = [
  { id: "wanch-mei", title: "Late Set with Mei Ling Chan", date: "12 Sep", weekday: "Sat", time: "22:30", venue: "The Wanch", area: "Wan Chai", photo: "/media/events/jazz.jpg", artistIds: ["mei", "nia"], blurb: "Two voices, one room, no interval. Doors at ten, first note when the bar goes quiet.", isoDate: "2026-09-12", status: "approved" },
  { id: "pmq-amina", title: "West Island Drift \u2014 rooftop", date: "19 Sep", weekday: "Sat", time: "21:00", venue: "PMQ Roof", area: "Central", photo: "/media/events/rooftop.jpg", artistIds: ["amina"], blurb: "Amina Hassan plays the long versions. Skyline, analogue synth, no encore speeches.", isoDate: "2026-09-19", status: "approved" },
  { id: "kt-kai", title: "Brick and Wire", date: "26 Sep", weekday: "Sat", time: "20:00", venue: "Unit 12, Kwun Tong", area: "Kwun Tong", photo: "/media/events/warehouse.jpg", artistIds: ["kai", "ryo"], blurb: "Warehouse floor, fairy lights, a four-piece that still faces the drummer. Bring earplugs you actually like.", isoDate: "2026-09-26", status: "approved" },
  { id: "cityhall-sofia", title: "Window Studies", date: "4 Oct", weekday: "Sun", time: "15:00", venue: "City Hall Recital Hall", area: "Central", photo: "/media/events/recital.jpg", artistIds: ["sofia"], blurb: "Afternoon light, a cello, and two new works written for this room.", isoDate: "2026-10-04", status: "approved" },
  { id: "ssp-open", title: "Warehouse open mic", date: "20 Sep", weekday: "Sun", time: "19:00", venue: "Unit 12, Kwun Tong", area: "Kwun Tong", photo: "/media/events/warehouse.jpg", artistIds: ["kai", "ryo"], blurb: "An extra night if Inner Soul clears it. Same floor, shorter set, no encore speeches.", isoDate: "2026-09-20", status: "pending", postedBy: "kai" },
];
export const POSTS: BoardPost[] = [
  { id: "p7", author: "Tess Wong", authorId: "tess", role: "Folk songwriter", category: "seeking", title: "Double bass for a Tuesday residency", body: "Sai Ying Pun wine bar, six Tuesdays, original folk with a little jazz in the corners. Acoustic, no amp wars. Paid, dinner included, charts on Sunday.", time: "45m ago", thread: [{ id: "p7-r1", author: "Hassan Malik", authorId: "hassan", role: "Saxophone", body: "I know a bassist in Jordan who prefers acoustic rooms. I\u2019ll send her this.", createdAt: "2026-09-13T06:55:00+08:00" }], createdAt: "2026-09-13T06:40:00+08:00" },
  { id: "p1", author: "Kai Rivera", authorId: "kai", role: "Guitar", category: "seeking", title: "Bassist for a Saturday residency", body: "Four-week run in Kwun Tong, original material, indie/rock pocket. Must be able to learn ten songs in a week and not fill every bar. Paid, not famous.", time: "2h ago", thread: [], createdAt: "2026-09-13T00:40:00+08:00" },
  { id: "p2", author: "Sofia Berg", authorId: "sofia", role: "Cello", category: "collab", title: "Electronic producer for a cello record", body: "I have six sketches that want space, not a beat dropped on top. If you work with field recordings or analogue synth, write me.", time: "5h ago", thread: [], createdAt: "2026-09-12T23:20:00+08:00" },
];
export const CATEGORY_LABEL: Record<BoardCategory, string> = { seeking: "Seeking", gear: "Gear", collab: "Collab", session: "Session" };
export const KIND_LABEL: Record<AccountKind, string> = { admin: "Admin", artist: "Artist", explorer: "Explorer", business: "Business" };
export function migrateAccountKind(kind: string | undefined): AccountKind {
  if (kind === "listener") return "explorer";
  if (kind === "admin" || kind === "artist" || kind === "explorer" || kind === "business") return kind;
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
export function isISR(artist: Artist) { return artist.labelApproved && artist.label.trim().toLowerCase() === ISR_LABEL.toLowerCase(); }
export function claimsISR(label: string) { return label.trim().toLowerCase() === ISR_LABEL.toLowerCase(); }
export function isListedArtist(artist: Artist) { return artist.verified && artist.songs.some((s) => s.status === "approved"); }
export function liveSongs(artist: Artist) { return artist.songs.filter((s) => s.status === "approved"); }
export function artistById(id: string, list: Artist[] = ARTISTS) { return list.find((a) => a.id === id); }
export function genresFromCatalog(list: Artist[] = ARTISTS) {
  const set = new Set<string>();
  for (const artist of list) { if (!isListedArtist(artist)) continue; for (const genre of artist.genres) set.add(genre); }
  return [...set].sort();
}
export function artistsByGenre(genre: string, list: Artist[] = ARTISTS) { return list.filter((a) => isListedArtist(a) && a.genres.includes(genre)); }
export function eventsForArtist(artistId: string, events: CueEvent[] = EVENTS) { return events.filter((e) => e.status === "approved" && e.artistIds.includes(artistId)); }
export function shufflePick<T>(items: T[], n: number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy.slice(0, n);
}
export function formatEventDate(iso: string) {
  const d = new Date(`${iso}T12:00:00+08:00`);
  const weekday = d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Asia/Hong_Kong" });
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Hong_Kong" });
  return { weekday, date };
}
export function todayISO(now = new Date()) { return now.toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" }); }
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export function isPostExpired(post: BoardPost, now = Date.now()) { return now - new Date(post.createdAt).getTime() > THIRTY_DAYS_MS; }
export type TrackHit = { song: Song; artist: Artist };
export function recentTracks(list: Artist[], n = 3): TrackHit[] {
  const hits: TrackHit[] = [];
  for (const artist of list) { if (!isListedArtist(artist)) continue; for (const song of liveSongs(artist)) hits.push({ song, artist }); }
  hits.sort((a, b) => +new Date(b.song.uploadedAt) - +new Date(a.song.uploadedAt));
  return hits.slice(0, n);
}
export function randomLiveTrack(list: Artist[]): TrackHit | null {
  const hits: TrackHit[] = [];
  for (const artist of list) { if (!isListedArtist(artist)) continue; for (const song of liveSongs(artist)) hits.push({ song, artist }); }
  if (hits.length === 0) return null;
  return hits[Math.floor(Math.random() * hits.length)] ?? null;
}
export function upcomingEvents(events: CueEvent[], n = 3, now = new Date()) {
  const today = todayISO(now);
  return events.filter((e) => e.status === "approved" && e.isoDate >= today).sort((a, b) => a.isoDate.localeCompare(b.isoDate)).slice(0, n);
}
export function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
export function validWhatsapp(value: string) { return value.replace(/\D/g, "").length >= 8; }
export function whatsappHref(value: string) { const digits = value.replace(/\D/g, ""); return digits ? `https://wa.me/${digits}` : undefined; }
