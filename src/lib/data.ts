export type LocationArea = "HK Island" | "Kowloon" | "New Territories";

export type AccountKind = "admin" | "artist" | "explorer" | "business";

export type SongStatus = "approved" | "pending" | "declined";

export type Song = {
  id: string;
  title: string;
  duration: string;
  plays: string;
  cover: string;
  uploadedAt: string;
  status: SongStatus;
  spotify?: string;
  youtube?: string;
  audioUrl?: string;
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
};

export const ISR_LABEL = "Inner Soul Records";
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
    note: "Release plus a designed sleeve from Inner Soul Records.",
  },
  {
    id: "prod",
    name: "Publish music and professional production",
    price: "$8,000",
    note: "Tracking, mix, master, and a full Inner Soul release.",
  },
] as const;

function sp(q: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(q)}`;
}
function yt(q: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export const ARTISTS: Artist[] = [
  {
    id: "mei",
    name: "Mei Ling Chan",
    role: "Jazz vocalist",
    city: "Sheung Wan",
    area: "HK Island",
    photo: "/media/artists/mei.jpg",
    genres: ["Jazz", "Soul"],
    bio: "Sings standards like they still owe her something. Residencies at small rooms off Hollywood Road, a voice that sits just behind the beat.",
    label: ISR_LABEL,
    labelApproved: true,
    verified: true,
    spotify: sp("Mei Ling Chan jazz"),
    youtube: yt("Mei Ling Chan jazz vocal"),
    songs: [
      {
        id: "mei-1",
        title: "After Hours on Hollywood Road",
        duration: "4:12",
        plays: "8.4k",
        cover: "/media/covers/silk.jpg",
        uploadedAt: "2026-08-12T20:00:00+08:00",
        status: "approved",
        spotify: sp("After Hours on Hollywood Road"),
        youtube: yt("After Hours on Hollywood Road"),
      },
      {
        id: "mei-2",
        title: "Smoke Over the Harbour",
        duration: "3:48",
        plays: "12.1k",
        cover: "/media/covers/vinyl.jpg",
        uploadedAt: "2026-08-28T18:00:00+08:00",
        status: "approved",
        spotify: sp("Smoke Over the Harbour"),
      },
      {
        id: "mei-3",
        title: "Last Call in Sheung Wan",
        duration: "5:02",
        plays: "6.7k",
        cover: "/media/covers/silk.jpg",
        uploadedAt: "2026-09-04T21:00:00+08:00",
        status: "approved",
      },
    ],
  },
];
