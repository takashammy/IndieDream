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
  lyrics?: string;
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
    note: "Tracking, mix, master, and a full release on the big platforms.",
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
        lyrics: "After the last tram goes\nthe harbour still holds the heat\nHollywood Road, a half-sung street\nand I stay past the beat",
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
  {
    id: "kai",
    name: "Kai Rivera",
    role: "Indie guitarist",
    city: "Sham Shui Po",
    area: "Kowloon",
    photo: "/media/artists/kai.jpg",
    genres: ["Indie", "Rock"],
    bio: "Writes songs in the back of a rehearsal warehouse and plays them like the walls might answer. Looking for a rhythm section that actually listens.",
    label: "Independent",
    labelApproved: false,
    verified: true,
    youtube: yt("Kai Rivera indie"),
    songs: [
      {
        id: "kai-1",
        title: "Sham Shui Nights",
        duration: "3:21",
        plays: "15.2k",
        cover: "/media/covers/guitar.jpg",
        uploadedAt: "2026-09-05T16:00:00+08:00",
        status: "approved",
        lyrics: "Leave the lights on in Sham Shui\nI still know every crack in the floor\namp humming like a late minibus\nwaiting for someone to walk through the door",
        spotify: sp("Sham Shui Nights"),
        youtube: yt("Sham Shui Nights"),
      },
      {
        id: "kai-2",
        title: "Leave the Amp On",
        duration: "2:54",
        plays: "9.8k",
        cover: "/media/covers/drums.jpg",
        uploadedAt: "2026-08-18T16:00:00+08:00",
        status: "approved",
      },
      {
        id: "kai-3",
        title: "Brick and Wire",
        duration: "4:07",
        plays: "4.3k",
        cover: "/media/covers/guitar.jpg",
        uploadedAt: "2026-07-30T16:00:00+08:00",
        status: "approved",
      },
    ],
  },
  {
    id: "amina",
    name: "Amina Hassan",
    role: "Electronic producer",
    city: "Kennedy Town",
    area: "HK Island",
    photo: "/media/artists/amina.jpg",
    genres: ["Electronic", "Ambient"],
    bio: "Builds tracks from field recordings and a stubborn analogue synth. Available for film cues, late rooftops, and anyone who still likes a long intro.",
    label: "Independent",
    labelApproved: false,
    verified: true,
    spotify: sp("Amina Hassan electronic"),
    songs: [
      {
        id: "amina-1",
        title: "Patch Bay 04",
        duration: "5:44",
        plays: "21.0k",
        cover: "/media/covers/synth.jpg",
        uploadedAt: "2026-08-02T22:00:00+08:00",
        status: "approved",
        youtube: yt("Patch Bay 04"),
      },
      {
        id: "amina-2",
        title: "West Island Drift",
        duration: "6:18",
        plays: "11.6k",
        cover: "/media/covers/rain.jpg",
        uploadedAt: "2026-08-21T22:00:00+08:00",
        status: "approved",
      },
      {
        id: "amina-3",
        title: "Cyan After Midnight",
        duration: "4:33",
        plays: "7.9k",
        cover: "/media/covers/synth.jpg",
        uploadedAt: "2026-09-01T22:00:00+08:00",
        status: "approved",
        spotify: sp("Cyan After Midnight"),
      },
    ],
  },
  {
    id: "jun",
    name: "Jun Park",
    role: "MC / writer",
    city: "Mong Kok",
    area: "Kowloon",
    photo: "/media/artists/jun.jpg",
    genres: ["Hip-hop", "R&B"],
    bio: "Writes in two languages and performs in one breath. Night-market cadence, studio discipline. Open to features that don’t sand him down.",
    label: "Independent",
    labelApproved: false,
    verified: true,
    spotify: sp("Jun Park hip hop"),
    youtube: yt("Jun Park MC"),
    songs: [
      {
        id: "jun-1",
        title: "Neon Stall",
        duration: "2:48",
        plays: "34.5k",
        cover: "/media/covers/rain.jpg",
        uploadedAt: "2026-09-06T19:00:00+08:00",
        status: "approved",
        lyrics: "Neon stall, two languages\none breath, no translation\nMong Kok keeps the clock\nand I keep the station",
        spotify: sp("Neon Stall Jun Park"),
        youtube: yt("Neon Stall Jun Park"),
      },
      {
        id: "jun-2",
        title: "Second Language",
        duration: "3:16",
        plays: "18.2k",
        cover: "/media/covers/vinyl.jpg",
        uploadedAt: "2026-08-14T19:00:00+08:00",
        status: "approved",
      },
      {
        id: "jun-3",
        title: "After the Last Train",
        duration: "3:02",
        plays: "9.1k",
        cover: "/media/covers/rain.jpg",
        uploadedAt: "2026-07-22T19:00:00+08:00",
        status: "approved",
      },
    ],
  },
  {
    id: "sofia",
    name: "Sofia Berg",
    role: "Cellist",
    city: "Mid-Levels",
    area: "HK Island",
    photo: "/media/artists/sofia.jpg",
    genres: ["Classical", "Contemporary"],
    bio: "Recital hall by afternoon, session work by night. Interested in electronic pairings and scores that leave the cello some air.",
    label: "Independent",
    labelApproved: false,
    verified: true,
    songs: [
      {
        id: "sofia-1",
        title: "Window Study in C",
        duration: "6:05",
        plays: "5.4k",
        cover: "/media/covers/cello.jpg",
        uploadedAt: "2026-08-08T11:00:00+08:00",
        status: "approved",
      },
      {
        id: "sofia-2",
        title: "Dust in the Light",
        duration: "4:41",
        plays: "3.8k",
        cover: "/media/covers/cello.jpg",
        uploadedAt: "2026-08-25T11:00:00+08:00",
        status: "approved",
        youtube: yt("Dust in the Light cello"),
      },
    ],
  },
  {
    id: "leo",
    name: "Leo Tam",
    role: "Cantopop vocalist",
    city: "Tsim Sha Tsui",
    area: "Kowloon",
    photo: "/media/artists/leo.jpg",
    genres: ["Cantopop", "Pop"],
    bio: "Rooftop sessions and tight live bands. Writes in Cantonese first. Looking for players who can hold a chorus without crowding it.",
    label: ISR_LABEL,
    labelApproved: true,
    verified: true,
    spotify: sp("Leo Tam cantopop"),
    youtube: yt("Leo Tam 譚"),
    songs: [
      {
        id: "leo-1",
        title: "Golden Hour, TST",
        duration: "3:37",
        plays: "42.0k",
        cover: "/media/covers/vinyl.jpg",
        uploadedAt: "2026-09-07T20:00:00+08:00",
        status: "approved",
        spotify: sp("Golden Hour TST"),
        youtube: yt("Golden Hour TST Leo Tam"),
      },
      {
        id: "leo-2",
        title: "Leave the Blazer On",
        duration: "3:11",
        plays: "19.7k",
        cover: "/media/covers/silk.jpg",
        uploadedAt: "2026-08-16T20:00:00+08:00",
        status: "approved",
      },
      {
        id: "leo-3",
        title: "Last Ferry",
        duration: "4:00",
        plays: "8.6k",
        cover: "/media/covers/rain.jpg",
        uploadedAt: "2026-07-19T20:00:00+08:00",
        status: "approved",
      },
    ],
  },
  {
    id: "nia",
    name: "Nia Okonkwo",
    role: "Soul singer",
    city: "Wan Chai",
    area: "HK Island",
    photo: "/media/artists/nia.jpg",
    genres: ["Soul", "Jazz"],
    bio: "A voice built for small rooms and long notes. Sundays at The Wanch, weekdays in session. Will not do a click-track ballad unless it earns it.",
    label: ISR_LABEL,
    labelApproved: true,
    verified: true,
    youtube: yt("Nia Okonkwo soul"),
    songs: [
      {
        id: "nia-1",
        title: "Velvet Jacket",
        duration: "4:28",
        plays: "16.3k",
        cover: "/media/covers/silk.jpg",
        uploadedAt: "2026-08-11T17:00:00+08:00",
        status: "approved",
        spotify: sp("Velvet Jacket Nia"),
      },
      {
        id: "nia-2",
        title: "Keep the Lights Low",
        duration: "3:55",
        plays: "10.4k",
        cover: "/media/covers/vinyl.jpg",
        uploadedAt: "2026-09-02T17:00:00+08:00",
        status: "approved",
        youtube: yt("Keep the Lights Low Nia"),
      },
    ],
  },
  {
    id: "ryo",
    name: "Ryo Nakamura",
    role: "Drummer",
    city: "Kwun Tong",
    area: "Kowloon",
    photo: "/media/artists/ryo.jpg",
    genres: ["Rock", "Jazz"],
    bio: "For hire, not for decoration. Pocket first, fills second. Available for residencies, records, and anyone tired of a drum machine.",
    label: "Independent",
    labelApproved: false,
    verified: true,
    songs: [
      {
        id: "ryo-1",
        title: "Warehouse Take 3",
        duration: "3:09",
        plays: "6.2k",
        cover: "/media/covers/drums.jpg",
        uploadedAt: "2026-08-06T15:00:00+08:00",
        status: "approved",
      },
      {
        id: "ryo-2",
        title: "Left Hand Ride",
        duration: "2:41",
        plays: "4.9k",
        cover: "/media/covers/drums.jpg",
        uploadedAt: "2026-08-29T15:00:00+08:00",
        status: "approved",
      },
    ],
  },
  {
    id: "tess",
    name: "Tess Wong",
    role: "Folk songwriter",
    city: "Sai Ying Pun",
    area: "HK Island",
    photo: "/media/covers/silk.jpg",
    genres: ["Indie", "Folk"],
    bio: "Quiet songs about leaving and coming back. Plays open tunings in rooms that still have ceiling fans.",
    label: "Independent",
    labelApproved: false,
    verified: true,
    spotify: sp("Tess Wong folk"),
    youtube: yt("Tess Wong songwriter"),
    songs: [
      {
        id: "tess-1",
        title: "Tin Hau After Rain",
        duration: "3:44",
        plays: "2.1k",
        cover: "/media/covers/rain.jpg",
        uploadedAt: "2026-09-03T19:00:00+08:00",
        status: "approved",
        lyrics: "Tin Hau after rain\nceiling fan, borrowed light\nI left a song on the stairs\nand came back for it at night",
        spotify: sp("Tin Hau After Rain"),
      },
      {
        id: "tess-2",
        title: "Borrowed Light",
        duration: "4:08",
        plays: "1.4k",
        cover: "/media/covers/silk.jpg",
        uploadedAt: "2026-08-20T19:00:00+08:00",
        status: "approved",
      },
    ],
  },
  {
    id: "hassan",
    name: "Hassan Malik",
    role: "Saxophonist",
    city: "Jordan",
    area: "Kowloon",
    photo: "/media/covers/vinyl.jpg",
    genres: ["Jazz", "Soul"],
    bio: "Horns for hire, charts on request. Prefers small rooms and players who leave space.",
    label: "Independent",
    labelApproved: false,
    verified: true,
    youtube: yt("Hassan Malik saxophone"),
    songs: [
      {
        id: "hassan-1",
        title: "Last Set at Hidden Agenda",
        duration: "5:16",
        plays: "3.6k",
        cover: "/media/covers/vinyl.jpg",
        uploadedAt: "2026-08-27T21:00:00+08:00",
        status: "approved",
        youtube: yt("Last Set at Hidden Agenda"),
      },
    ],
  },
  {
    id: "yuki",
    name: "Yuki Cheung",
    role: "DJ / producer",
    city: "Tuen Mun",
    area: "New Territories",
    photo: "/media/covers/synth.jpg",
    genres: ["Electronic", "Hip-hop"],
    bio: "Warehouse edits and late buses home. First upload is sitting with Inner Soul for review.",
    label: "Independent",
    labelApproved: false,
    verified: false,
    songs: [
      {
        id: "yuki-1",
        title: "Warehouse Edit 07",
        duration: "4:22",
        plays: "0",
        cover: "/media/covers/synth.jpg",
        uploadedAt: "2026-09-07T23:10:00+08:00",
        status: "pending",
      },
    ],
  },
  {
    id: "daniel",
    name: "Daniel Ho",
    role: "Beatmaker",
    city: "Sham Shui Po",
    area: "Kowloon",
    photo: "/media/covers/rain.jpg",
    genres: ["Hip-hop", "R&B"],
    bio: "Makes beats in a subdivided flat and names them after minibus routes. Open to Cantonese features.",
    label: "Independent",
    labelApproved: false,
    verified: true,
    spotify: sp("Daniel Ho beats"),
    songs: [
      {
        id: "daniel-1",
        title: "Night Bus 1A",
        duration: "2:37",
        plays: "8.8k",
        cover: "/media/covers/rain.jpg",
        uploadedAt: "2026-09-04T18:00:00+08:00",
        status: "approved",
        spotify: sp("Night Bus 1A"),
        youtube: yt("Night Bus 1A Daniel Ho"),
      },
      {
        id: "daniel-2",
        title: "Mong Kok Grid",
        duration: "3:05",
        plays: "5.2k",
        cover: "/media/covers/synth.jpg",
        uploadedAt: "2026-08-15T18:00:00+08:00",
        status: "approved",
      },
    ],
  },
  {
    id: "clara",
    name: "Clara Ip",
    role: "Violinist",
    city: "Mid-Levels",
    area: "HK Island",
    photo: "/media/covers/cello.jpg",
    genres: ["Classical", "Contemporary"],
    bio: "Session strings, quartet work, and the occasional pop overdub. Will not play over a loop that is already doing her job.",
    label: "Independent",
    labelApproved: false,
    verified: true,
    songs: [
      {
        id: "clara-1",
        title: "Harbour Harmonic",
        duration: "4:51",
        plays: "1.9k",
        cover: "/media/covers/cello.jpg",
        uploadedAt: "2026-08-30T11:00:00+08:00",
        status: "approved",
      },
    ],
  },
  {
    id: "martin",
    name: "Martin Sham",
    role: "Guitarist / producer",
    city: "Wan Chai",
    area: "HK Island",
    photo: "/media/artists/jun.jpg",
    genres: ["Indie", "Soul"],
    bio: "Runs Inner Soul Records and still writes guitar parts after the office lights go off. Looking after the roster and the room.",
    label: ISR_LABEL,
    labelApproved: true,
    verified: true,
    songs: [
      {
        id: "martin-1",
        title: "After the Desk Closes",
        duration: "3:36",
        plays: "1.2k",
        cover: "/media/covers/guitar.jpg",
        uploadedAt: "2026-09-01T21:00:00+08:00",
        status: "approved",
        lyrics: "The desk goes dark\nthe guitar still knows the room\nHarbour Road is quiet\nso I write until the morning comes through",
      },
    ],
  },
  {
    id: "sinlam",
    name: "Sin Lam",
    role: "Vocalist",
    city: "Sham Shui Po",
    area: "Kowloon",
    photo: "/media/artists/nia.jpg",
    genres: ["Soul", "Jazz"],
    bio: "Voice first, paperwork second. Inner Soul on weekdays, small rooms on weekends.",
    label: ISR_LABEL,
    labelApproved: true,
    verified: true,
    songs: [
      {
        id: "sinlam-1",
        title: "Lantern Over Lai Chi Kok",
        duration: "4:02",
        plays: "980",
        cover: "/media/covers/silk.jpg",
        uploadedAt: "2026-09-02T20:00:00+08:00",
        status: "approved",
        lyrics: "Lantern over Lai Chi Kok\nvoice first, paperwork later\nI keep a small room warm\nwhile the city gets greater",
      },
    ],
  },
];


export const EVENTS: CueEvent[] = [
  {
    id: "wanch-mei",
    title: "Late Set with Mei Ling Chan",
    date: "12 Sep",
    weekday: "Sat",
    time: "22:30",
    venue: "The Wanch",
    area: "Wan Chai",
    photo: "/media/events/jazz.jpg",
    artistIds: ["mei", "nia"],
    blurb: "Two voices, one room, no interval. Doors at ten, first note when the bar goes quiet.",
    isoDate: "2026-09-12",
    status: "approved",
  },
  {
    id: "pmq-amina",
    title: "West Island Drift — rooftop",
    date: "19 Sep",
    weekday: "Sat",
    time: "21:00",
    venue: "PMQ Roof",
    area: "Central",
    photo: "/media/events/rooftop.jpg",
    artistIds: ["amina"],
    blurb: "Amina Hassan plays the long versions. Skyline, analogue synth, no encore speeches.",
    isoDate: "2026-09-19",
    status: "approved",
  },
  {
    id: "kt-kai",
    title: "Brick and Wire",
    date: "26 Sep",
    weekday: "Sat",
    time: "20:00",
    venue: "Unit 12, Kwun Tong",
    area: "Kwun Tong",
    photo: "/media/events/warehouse.jpg",
    artistIds: ["kai", "ryo"],
    blurb: "Warehouse floor, fairy lights, a four-piece that still faces the drummer. Bring earplugs you actually like.",
    isoDate: "2026-09-26",
    status: "approved",
  },
  {
    id: "cityhall-sofia",
    title: "Window Studies",
    date: "4 Oct",
    weekday: "Sun",
    time: "15:00",
    venue: "City Hall Recital Hall",
    area: "Central",
    photo: "/media/events/recital.jpg",
    artistIds: ["sofia"],
    blurb: "Afternoon light, a cello, and two new works written for this room.",
    isoDate: "2026-10-04",
    status: "approved",
  },
  {
    id: "ssp-open",
    title: "Warehouse open mic",
    date: "20 Sep",
    weekday: "Sun",
    time: "19:00",
    venue: "Unit 12, Kwun Tong",
    area: "Kwun Tong",
    photo: "/media/events/warehouse.jpg",
    artistIds: ["kai", "ryo"],
    blurb: "An extra night if Inner Soul clears it. Same floor, shorter set, no encore speeches.",
    isoDate: "2026-09-20",
    status: "pending",
    postedBy: "kai",
  },
];

export const POSTS: BoardPost[] = [
  {
    id: "p7",
    author: "Tess Wong",
    authorId: "tess",
    role: "Folk songwriter",
    category: "seeking",
    title: "Double bass for a Tuesday residency",
    body: "Sai Ying Pun wine bar, six Tuesdays, original folk with a little jazz in the corners. Acoustic, no amp wars. Paid, dinner included, charts on Sunday.",
    time: "45m ago",
    thread: [
      {
        id: "p7-r1",
        author: "Hassan Malik",
        authorId: "hassan",
        role: "Saxophone",
        body: "I know a bassist in Jordan who prefers acoustic rooms. I’ll send her this.",
        createdAt: "2026-09-13T06:55:00+08:00",
      },
    ],
    createdAt: "2026-09-13T06:40:00+08:00",
  },
  {
    id: "p8",
    author: "Marlowe House",
    authorId: "acc-marlowe",
    role: "Business",
    category: "seeking",
    title: "House trio, Thursday to Saturday",
    body: "Bar in Sai Ying Pun. Need a piano / bass / drums three nights a week, 8pm–11pm. Standards and quiet originals. We feed you and we don’t talk over the ballads.",
    time: "3h ago",
    thread: [
      {
        id: "p8-r1",
        author: "Hassan Malik",
        authorId: "hassan",
        role: "Saxophone",
        body: "I can do Thursday if you want a horn instead of piano one night. Or I can bring a pianist.",
        createdAt: "2026-09-13T05:20:00+08:00",
      },
    ],
    createdAt: "2026-09-13T04:10:00+08:00",
  },
  {
    id: "p9",
    author: "Daniel Ho",
    authorId: "daniel",
    role: "Beatmaker",
    category: "collab",
    title: "Cantonese feature on a night-bus beat",
    body: "Track is done, needs a verse that actually lives in the city. Not looking for English-for-export. Send four bars if you’ve got them.",
    time: "6h ago",
    thread: [
      {
        id: "p9-r1",
        author: "Jun Park",
        authorId: "jun",
        role: "MC / writer",
        body: "Send the beat. If the pocket’s honest I’ll write tonight.",
        createdAt: "2026-09-13T02:40:00+08:00",
      },
    ],
    createdAt: "2026-09-13T01:00:00+08:00",
  },
  {
    id: "p10",
    author: "Hassan Malik",
    authorId: "hassan",
    role: "Saxophone",
    category: "session",
    title: "Horn charts available this month",
    body: "Two weeks free in September. Jazz, soul, the odd Cantopop overdub. I bring the horn and I write the parts. Jordan pickup or I come to you.",
    time: "8h ago",
    thread: [],
    createdAt: "2026-09-12T22:00:00+08:00",
  },
  {
    id: "p11",
    author: "Clara Ip",
    authorId: "clara",
    role: "Violin",
    category: "gear",
    title: "Carbon fibre bow, Mid-Levels pickup",
    body: "Arcus M6, barely used, kept in the case. Selling because I went back to pernambuco. Not shipping, not meeting in a mall.",
    time: "1d ago",
    thread: [],
    createdAt: "2026-09-12T14:00:00+08:00",
  },
  {
    id: "p12",
    author: "Bee Chan",
    authorId: "acc-bee",
    role: "Explorer",
    category: "collab",
    title: "Have a lyric, need a songwriter",
    body: "A poem about the last ferry from Central. I’m not a singer. If you write folk or quiet pop and want words that already exist, write me.",
    time: "2d ago",
    thread: [
      {
        id: "p12-r1",
        author: "Tess Wong",
        authorId: "tess",
        role: "Folk songwriter",
        body: "Send the poem. If it sits in an open tuning I’ll sketch something this week.",
        createdAt: "2026-09-11T21:10:00+08:00",
      },
    ],
    createdAt: "2026-09-11T18:00:00+08:00",
  },
  {
    id: "p1",
    author: "Kai Rivera",
    authorId: "kai",
    role: "Guitar",
    category: "seeking",
    title: "Bassist for a Saturday residency",
    body: "Four-week run in Kwun Tong, original material, indie/rock pocket. Must be able to learn ten songs in a week and not fill every bar. Paid, not famous.",
    time: "2h ago",
    thread: [
      {
        id: "p1-r1",
        author: "Ryo Nakamura",
        authorId: "ryo",
        role: "Drums",
        body: "I know a bassist in Kwun Tong who can learn ten songs. I’ll pass your post on.",
        createdAt: "2026-09-13T01:10:00+08:00",
      },
      {
        id: "p1-r2",
        author: "Leo Tam",
        authorId: "leo",
        role: "Vocal",
        body: "If they can sing a little, even better. Ping me if you still need a voice.",
        createdAt: "2026-09-13T02:00:00+08:00",
      },
      {
        id: "p1-r3",
        author: "Owen Lam",
        authorId: "acc-owen",
        role: "Explorer",
        body: "I don’t play, but I know a bassist from PolyU who sits in on Tuesdays. I can introduce you.",
        createdAt: "2026-09-13T07:05:00+08:00",
      },
    ],
    createdAt: "2026-09-13T00:40:00+08:00",
  },
  {
    id: "p2",
    author: "Sofia Berg",
    authorId: "sofia",
    role: "Cello",
    category: "collab",
    title: "Electronic producer for a cello record",
    body: "I have six sketches that want space, not a beat dropped on top. If you work with field recordings or analogue synth, write me.",
    time: "5h ago",
    thread: [
      {
        id: "p2-r1",
        author: "Amina Hassan",
        authorId: "amina",
        role: "Production",
        body: "I work with field recordings. Send me a sketch and I’ll try a pass this week.",
        createdAt: "2026-09-13T00:10:00+08:00",
      },
    ],
    createdAt: "2026-09-12T23:20:00+08:00",
  },
  {
    id: "p3",
    author: "Ryo Nakamura",
    authorId: "ryo",
    role: "Drums",
    category: "gear",
    title: "Selling a 1966 Ludwig snare",
    body: "Chrome over brass, kept dry, no pits. Kwun Tong pickup. Not in a hurry, not negotiating with strangers who open with a lowball.",
    time: "1d ago",
    thread: [],
    createdAt: "2026-09-12T10:00:00+08:00",
  },
  {
    id: "p4",
    author: "Leo Tam",
    authorId: "leo",
    role: "Vocal",
    category: "seeking",
    title: "Harmony vocalist, Cantonese leads",
    body: "Need a second voice for a rooftop session next month. Blend over belt. Chart provided, dinner included.",
    time: "1d ago",
    thread: [
      {
        id: "p4-r1",
        author: "Mei Ling Chan",
        authorId: "mei",
        role: "Vocal",
        body: "I can blend on Cantonese leads. Send the chart.",
        createdAt: "2026-09-12T12:00:00+08:00",
      },
    ],
    createdAt: "2026-09-12T09:00:00+08:00",
  },
  {
    id: "p5",
    author: "Amina Hassan",
    authorId: "amina",
    role: "Production",
    category: "session",
    title: "Looking for a live drummer who can play quietly",
    body: "Studio in Kennedy Town. Two days, click optional, brushes welcome. I’ll feed you and I won’t make you trigger samples.",
    time: "3d ago",
    thread: [],
    createdAt: "2026-09-10T14:00:00+08:00",
  },
  {
    id: "p6",
    author: "Nia Okonkwo",
    authorId: "nia",
    role: "Vocal",
    category: "gear",
    title: "Need a SM7B for a week",
    body: "Mine is in the shop. Short-term borrow or cheap rental, Wan Chai. I’ll return it cleaner than you handed it over.",
    time: "4d ago",
    thread: [],
    createdAt: "2026-09-09T11:00:00+08:00",
  },
  {
    id: "p-old",
    author: "Kai Rivera",
    authorId: "kai",
    role: "Guitar",
    category: "seeking",
    title: "July drummer wanted (closed)",
    body: "This posting has aged out of the live board.",
    time: "45d ago",
    thread: [],
    createdAt: "2026-07-20T12:00:00+08:00",
  },
];

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
};

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

export function isISR(artist: Artist) {
  return artist.labelApproved && artist.label.trim().toLowerCase() === ISR_LABEL.toLowerCase();
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

export function eventsForArtist(artistId: string, events: CueEvent[] = EVENTS) {
  return events.filter((e) => e.status === "approved" && e.artistIds.includes(artistId));
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

export function upcomingEvents(events: CueEvent[], n = 3, now = new Date()) {
  const today = todayISO(now);
  return events
    .filter((e) => e.status === "approved" && e.isoDate >= today)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
    .slice(0, n);
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
