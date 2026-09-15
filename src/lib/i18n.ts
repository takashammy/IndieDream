import { useLocaleStore } from "@/lib/locale";

export type Locale = "en" | "zh";

const EN = {
  tabArtists: "Artists",
  tabDiscover: "Discover",
  tabEvents: "Events",
  tabHome: "Home",
  tabBoard: "Board",
  tabServices: "Services",
  tabMe: "Me",
  tabDesk: "Desk",
  poweredBy: "Powered by",
  tagline: "A platform for musicians chasing dreams",
  installApp: "Add to Home Screen",
  installHint: "Keep {app} on your phone — full screen, like an app.",
  installAction: "Install",
  installHow: "How to add",
  installIosTitle: "Add to Home Screen",
  installIos1: "Tap the Share button in Safari.",
  installIos2: "Scroll and tap Add to Home Screen.",
  installIos3: "Tap Add.",
  installDismiss: "Not now",
  offlineBanner: "You're offline. Catalogue and Me still open from the last visit.",
  language: "Language",
  langEn: "English",
  langZh: "繁體中文",
  guest: "Guest",
  you: "You",
  account: "Account",
  profile: "Profile",
  register: "Register",
  logIn: "Log in",
  logOut: "Log out",
  enter: "Enter",
  forgotPassword: "Forgot password?",
  needAccount: "Need an account? Register",
  alreadyRegistered: "Already registered? Log in",
  resetPassword: "Reset password",
  saveNewPassword: "Save new password",
  backToLogin: "Back to log in",
  passwordUpdated: "Password updated. Log in with your username and the new password.",
  resetHint: "Password changes are handled by an admin. Log in if you still can, or ask an admin.",
  passwordsMismatch: "Passwords do not match.",
  createAccount: "Create account",
  iAmA: "I am a",
  username: "Username",
  password: "Password",
  newPassword: "New password",
  confirmPassword: "Confirm password",
  email: "Email",
  name: "Name",
  role: "Role",
  location: "Location",
  genre: "Genre",
  label: "Label",
  bio: "Bio / About me",
  whatsapp: "WhatsApp number",
  personalInfo: "Personal information",
  saveDetails: "Save details",
  saved: "Saved",
  changePhoto: "Change profile picture",
  guestBrowse: "Guests can browse the catalogue. Listening, the board, events, and services need an account.",
  isrPending: "Profiles, labels, tracks, and events go live after admin review.",
  trackUploadHint: "Track upload — MP3 only, 5 MB max",
  trackTitle: "Track title",
  chooseMp3: "Choose MP3 file",
  rolePlaceholder: "Vocalist, drummer, producer…",
  independent: "Independent",
  kindAdmin: "Admin",
  kindArtist: "Artist",
  kindExplorer: "Explorer",
  kindBusiness: "Business",
  locIsland: "HK Island",
  locKowloon: "Kowloon",
  locNT: "New Territories",
  nowPlaying: "Now playing",
  randomRoster: "Random from the roster",
  nothingLive: "Nothing live yet",
  play: "Play",
  pause: "Pause",
  nextTrack: "Play next random track",
  lyricsFor: "Lyrics for",
  track: "Track",
  noLyrics: "No lyrics yet.",
  plays: "plays",
  listenIn: "Listen in",
  hongKong: "Hong Kong",
  publishing: "Publishing",
  publishSongs: "Publish your songs",
  servicesArrow: "Services →",
  heardAround: "Heard around town",
  shuffledSix: "Shuffled · six",
  justIn: "Just in",
  latestTracks: "Latest tracks",
  comingUp: "Coming up",
  innerSoul: "Inner Soul",
  catalogue: "Catalogue",
  theRoster: "The roster",
  listedCount: "{n} listed",
  isrRosterNote: "The label roster. Assigned, not claimed.",
  indieVerified: "Independent & verified",
  indieVerifiedNote: "Artists with a live track on {app}.",
  backToRoster: "Back to roster",
  notOnRoster: "This artist isn’t on the roster.",
  back: "Back",
  onApp: "On {app}",
  upcoming: "Upcoming",
  deleteProfile: "Delete profile",
  deleteProfileQ: "Delete this profile?",
  removeArtist: "Remove {name} from {app}. This cannot be undone.",
  yes: "Yes",
  cancel: "Cancel",
  close: "Close",
  closeDialog: "Close dialog",
  pleaseConfirm: "Please confirm",
  verifiedArtist: "Verified artist",
  listen: "Listen",
  byGenre: "By genre",
  fromRoster: "From the roster",
  genreOnlyIfPlayed: "A genre only appears here if someone on {app} actually plays it.",
  onRoster: "{n} on roster",
  allGenres: "All genres",
  artistsTagged: "{n} artists tagged {genre}",
  artistTagged: "{n} artist tagged {genre}",
  thisMonth: "This month",
  lineup: "Lineup",
  allEvents: "All events",
  postEvent: "Post event",
  postAnEvent: "Post an event",
  eventApproval: "All events must be approved by an admin.",
  sentForReview: "Sent for review. All events must be approved by an admin.",
  title: "Title",
  date: "Date",
  time: "Time",
  venue: "Venue",
  area: "Area",
  details: "Details",
  tagArtists: "Tag artists",
  none: "None",
  selectedN: "{n} selected",
  submitApproval: "Submit for approval",
  deleteEvent: "Delete event",
  deleteEventQ: "Delete this event?",
  removeEvent: "Remove “{title}” from {app}. This cannot be undone.",
  boardKicker: "Board",
  talkShop: "The board",
  liveN: "{n} live",
  boardIntro: "Calls, gear, and collabs. Music only — anything else comes off.",
  all: "All",
  seeking: "Seeking",
  collab: "Collab",
  gear: "Gear",
  session: "Session",
  open: "Open",
  mine: "Mine",
  latest: "Latest",
  busiest: "Busiest",
  busy: "Busy",
  threads: "threads",
  thread: "thread",
  replies: "replies",
  reply: "reply",
  writeReply: "Write a reply",
  keepMusic: "Keep it about the music.",
  signInReply: "Log in to reply",
  newPost: "New post",
  startThread: "Start a thread",
  boardComposeHint: "Music related only. Musicians, venues, gear, and work — not general chat.",
  post: "Post",
  photo2mb: "Photo · 2 MB max",
  addPhoto: "Add a photo",
  removePhoto: "Remove photo",
  photosGearOnly: "Photos can only be attached to gear posts.",
  noMatch: "Nothing matches that search.",
  everyAnswered: "Every call has an answer.",
  haventPosted: "You haven’t posted yet.",
  noThreads: "No threads in this filter.",
  noReplies: "No replies yet. Be the first.",
  deletePost: "Delete post",
  deleteReply: "Delete reply",
  deleteThis: "Delete this {noun}?",
  removeBoard: "Remove this {noun} from the board. You can also ban {author} and take them off {app}.",
  delete: "Delete",
  banRemove: "Ban and remove {author}",
  previous: "Previous",
  next: "Next",
  searchBoard: "Search the board",
  searchPlaceholder: "Title, musician, venue…",
  services: "Services",
  innerSoulKicker: "Inner Soul",
  servicesNote: "Publishing, venues, shop",
  cardPubKicker: "Artists",
  cardPubTitle: "Music publishing",
  cardPubBody: "We help artists publish songs on all the big platforms. Three packages, one path to a clean release.",
  cardMaasKicker: "Venues",
  cardMaasTitle: "Live music",
  cardMaasBody: "Live music performances for restaurants, hotels, and shops.",
  cardLessonsKicker: "Lessons",
  cardLessonsTitle: "Music lessons",
  cardLessonsBody: "Singing, guitar, or ukulele. Enquiry only, for now.",
  cardCustomKicker: "Workshop",
  cardCustomTitle: "Custom instruments",
  cardCustomBody: "Custom guitars for maximum visual impact.",
  cardShopKicker: "Shop",
  cardShopTitle: "Inner Soul Instruments",
  cardShopBody: "Ukuleles on the floor. Concert, soprano, tenor, baritone — ready to play.",
  bookings: "Bookings",
  adminBookingsNote: "Purchases, bookings, and enquiries land here. Each one includes the sender’s WhatsApp. Open one to read the full brief.",
  noOpenEnquiries: "No open enquiries.",
  purchase: "Purchase",
  booking: "Booking",
  enquiry: "Enquiry",
  distribution: "Distribution",
  publishMusic: "Publish music",
  publishIntro: "We help artists publish songs on all the big platforms. Three packages, one path to a clean release. Leave a WhatsApp number so we can reach you.",
  gotBrief: "We’ve got the brief. We’ll be in touch.",
  package: "Package",
  aboutRelease: "About the release",
  sendEnquiry: "Send enquiry",
  registerToSend: "Register to send this",
  livePerformances: "Live performances",
  maasIntro: "We provide live music performances for restaurants, hotels, and shops. Leave a WhatsApp number so we can quote you.",
  quoteFiled: "Quotation request filed. We’ll be in touch.",
  companyVenue: "Company / venue",
  type: "Type",
  whenLive: "When you need live music",
  whatYouNeed: "What you need",
  requestQuote: "Request a quotation",
  musicLessons: "Music lessons",
  lessonsIntro: "Times and rates will land later. Leave a WhatsApp number so we can write when the diary opens.",
  enquiryReceived: "Enquiry received. We’ll be in touch.",
  instrumentVoice: "Instrument / voice",
  level: "Level",
  message: "Message",
  singing: "Singing",
  guitar: "Guitar",
  ukulele: "Ukulele",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  restaurant: "Restaurant",
  hotel: "Hotel",
  retail: "Retail",
  bar: "Bar",
  other: "Other",
  customGuitars: "Custom guitars for maximum visual impact.",
  buildFiled: "Build request filed. We’ll write on WhatsApp.",
  instrument: "Instrument",
  woodsLook: "Woods / look",
  budget: "Budget",
  whatYouWant: "What you want it to do",
  requestBuild: "Request a build",
  electricGuitar: "Electric guitar",
  acousticGuitar: "Acoustic guitar",
  bassGuitar: "Bass guitar",
  backServices: "← Services",
  theShop: "The shop",
  shopIntro: "Mostly ukuleles. Enquire on one and we’ll hold it.",
  enquirySent: "Enquiry sent.",
  note: "Note",
  enquire: "Enquire",
  registerEnquire: "Register to enquire",
  pkgMusic: "Publish music only",
  pkgMusicNote: "Distribution, metadata, and a clean release sheet.",
  pkgArt: "Publish music and cover art",
  pkgArtNote: "Release plus a designed sleeve.",
  pkgProd: "Publish music and professional production",
  pkgProdNote: "Tracking, mix, master, and a full release on the big platforms.",
  fileOverLimit: "This file is over the limit",
  upload: "Upload",
  mp3Only5: "{app} only takes MP3 files up to 5 MB.",
  chooseAnother: "Choose another file",
  uploadAgreement: "Upload agreement",
  agreeContinue: "Agree and continue",
  agreeUpload: "Agree and upload",
  notNow: "Not now",
  uploadTerms: "By uploading your song onto the platform, you give Inner Soul Records and Dreamin' Indie the right to promote your songs on the platform and at other venues, and in return you waive all rights to any copyright claims. You may delete your songs from the platform at any time. By continuing to upload, you automatically agree to this agreement.",
  errRequired: "Username and password are required.",
  errEmail: "Enter a valid email.",
  errUsernameTaken: "That username is taken.",
  errEmailTaken: "That email is already registered.",
  errNameRole: "Name and role are required.",
  errUploadTrack: "Upload one track so we can review you.",
  errWrong: "Username or password is wrong.",
  errNoAccount: "No account uses that email.",
  errRemoved: "This account has been removed.",
  errShortPass: "Password is too short.",
  errResetAdmin: "Password changes are handled by an admin.",
  errLoginFirst: "Log in first.",
  errNoEmail: "No account with that email.",
  errUploadMp3: "Upload one MP3, 5 MB or under.",
  errNotMp3: "MP3 files only. Export or convert the track to MP3 first.",
  errTooBig: "This file is over 5 MB. The limit is 5 MB.",
  errTooBigSize: "This file is {n} MB. The limit is 5 MB.",
  errChooseMp3: "Choose an MP3 first. MP3 only, 5 MB max.",
  mp3OnlyMax: "MP3 only, 5 MB max.",
  imagesOnly: "Images only.",
  imagesUnder: "Keep images under {n} MB.",
  couldNotRead: "Could not read image.",
  yourMusic: "Your music",
  artist: "Artist",
  verified: "Verified",
  pendingReview: "Pending review",
  uploadSong: "Upload song",
  uploadedSongs: "Uploaded songs",
  hideUploaded: "Hide uploaded songs",
  nothingQueue: "Nothing in the queue yet.",
  newTrack: "New track",
  coverHint: "Cover art sits on your page, Discover, and the player.",
  chooseCover: "Choose cover art",
  writers: "Writers",
  year: "Year",
  lyrics: "Lyrics",
  optional: "Optional",
  phoneMp3Hint: "MP3 only, 5 MB max. On a phone, open Files and pick the track — Voice Memos and Apple Music files need to be exported as MP3 first.",
  sending: "Sending…",
  isrNeedsApproval: "{label} needs admin approval.",
  live: "Live",
  declined: "Declined",
  awaiting: "Awaiting approval",
  saveSongLinks: "Save song links",
  deleteSong: "Delete song",
  deleteSongQ: "Delete this song?",
  removeSong: "Remove “{title}” from {app}. You can upload it again later.",
  spotifyUrl: "Spotify URL",
  youtubeUrl: "YouTube URL",
  spotifySong: "Spotify URL for this song",
  youtubeSong: "YouTube URL for this song",
  gateListenTitle: "Register to listen",
  gateListenBody: "Guests can browse {app}. Playback is for people who have an account.",
  gateBoardTitle: "Register to post",
  gateBoardBody: "The board is for working musicians. Make an account to join the thread.",
  gateEventTitle: "Verified artists only",
  gateEventBody: "Events are posted by verified artists, then approved by an admin. Register as an artist and upload a track to begin.",
  gateVerifyTitle: "Verification required",
  gateVerifyBody: "This is reserved for artists an admin has verified. Upload a track, then wait for approval.",
  gateRegisterTitle: "Register to continue",
  gateRegisterBody: "Listening, posting, and services all need a {app} account.",
  haveAccount: "I already have an account",
  desk: "Desk",
  review: "Review",
  queue: "Queue",
  waiting: "waiting",
  directory: "Directory",
  people: "People",
  onFile: "on file",
  roster: "Roster",
  liveArtists: "live artists",
  calendar: "Calendar",
  pending: "pending",
  posts: "Posts",
  toReview: "to review",
  userType: "User type",
  openArtistPage: "Open artist page",
  banUser: "Ban user",
  adminNoBan: "Admin accounts cannot be banned.",
  tracks: "Tracks",
  genres: "Genres",
  noLonger: "That account is no longer on {app}.",
  noticeArtist: "Artist",
  noticeLabel: "Label",
  noticeEvent: "Event",
  noticeTrack: "Track",
  noticeEnquiry: "Enquiry",
  tickCompleted: "Tick as completed",
  approve: "Approve",
  decline: "Decline",
  gJazz: "Jazz",
  gSoul: "Soul",
  gIndie: "Indie",
  gFolk: "Folk",
  gRock: "Rock",
  gElectronic: "Electronic",
  gAmbient: "Ambient",
  gHipHop: "Hip-hop",
  gRnb: "R&B",
  gClassical: "Classical",
  gContemporary: "Contemporary",
  gCantopop: "Cantopop",
  gPop: "Pop",
  banUserQ: "Ban this user?",
  banUserBody: "Remove {name} from {app}. Their posts, profile, and login will go.",
  deleteDateQ: "Delete this date?",
  attention: "Attention",
  needsDecision: "Needs a decision",
  nextDate: "Next date",
  queueClear: "Queue and bookings are clear.",
  nothingWaiting: "Nothing waiting. The catalogue is clear.",
  inReviewQueue: "{n} in the review queue",
  openBookings: "{n} open bookings",
  stillOffRoster: "{n} still off the live roster",
  pendingUpcoming: "pending + upcoming",
  livePosts: "live posts",
  dates: "Dates",
  searchPeople: "Search people",
  completed: "Completed",
  liveOn: "Live",
  archived: "Archived",
  past: "Past",
  awaitingRoster: "Awaiting",
  changeType: "Change type",
  nOpen: "{n} open",
  admin: "Admin",
  justNow: "just now",
  fldName: "Name",
  fldContact: "Contact",
  fldWhatsApp: "WhatsApp",
  fldPackage: "Package",
  fldPrice: "Price",
  fldCompany: "Company",
  fldType: "Type",
  fldLocation: "Location",
  fldHours: "Hours",
  fldFrom: "From",
  fldInstrument: "Instrument",
  fldKind: "Kind",
  fldWoods: "Woods",
  fldBudget: "Budget",
  fldBuild: "Build",
  fldLevel: "Level",
  fldNote: "Note",
  youPronoun: "You",
  langEnShort: "EN",
  langZhShort: "中",
  wdSun: "Sun",
  wdMon: "Mon",
  wdTue: "Tue",
  wdWed: "Wed",
  wdThu: "Thu",
  wdFri: "Fri",
  wdSat: "Sat",
  moJan: "Jan",
  moFeb: "Feb",
  moMar: "Mar",
  moApr: "Apr",
  moMay: "May",
  moJun: "Jun",
  moJul: "Jul",
  moAug: "Aug",
  moSep: "Sep",
  moOct: "Oct",
  moNov: "Nov",
  moDec: "Dec",
  ageMinutes: "{n}m",
  ageHours: "{n}h",
  ageDays: "{n}d",
  ageMonths: "{n}mo",
  phSeekingTitle: "Bassist for a Saturday residency",
  phSeekingBody: "Venue, dates, pay, and what you actually need.",
  phCollabTitle: "Producer for six cello sketches",
  phCollabBody: "What you’ve got, what you’re looking for, and the kind of player who shouldn’t write.",
  phGearTitle: "Selling a 1966 Ludwig snare",
  phGearBody: "Condition, pickup, and the price. No lowballs from strangers.",
  phSessionTitle: "Horn charts available this month",
  phSessionBody: "When you’re free, what you play, and how to reach you.",
  nothingInFilter: "Nothing in this filter.",
  bookingsBrief: "Purchases, venues, and lessons. WhatsApp is on each brief.",
  nothingCompleted: "Nothing completed yet.",
  noWhatsAppOnFile: "No WhatsApp on file",
  searchPeoplePlaceholder: "Search name, email, username",
  noOneMatches: "No one matches.",
  noWA: "No WA",
  noLiveArtists: "No live artists.",
  everyoneLive: "Everyone listed is live.",
  pendingTracks: "{n} pending tracks",
  pendingTrack: "{n} pending track",
  nLiveSongs: "{n} live",
  noDatesInFilter: "No dates in this filter.",
  archiveNote: "Posts older than 30 days. Admin only.",
  liveBoardNote: "Current board. Delete or ban from here.",
  boardEmpty: "Board is empty.",
  noArchivedPosts: "No archived posts.",
  lessonType: "Lesson",
  maasShort: "MaaS",
  shopType: "Shop",
  customType: "Build",
  labelPending: "{label} (pending)",
  tracksLive: "{n} · {live} live",
  playSong: "Play {title}",
  changeCoverFor: "Change cover art for {title}",
  onRosterAria: "{name} on the roster",
  innerSoulRecords: "Inner Soul Records",
  nWaiting: "{n} waiting",
  nOnFile: "{n} on file",
  nLiveCount: "{n} live",
  nPendingCount: "{n} pending",
  repliesKicker: "Replies · {n}",
  openDot: " · Open",
  busyDot: " · Busy",
  linkedArtist: " · Artist",
  tickComplete: "Tick complete",
  workshop: "Workshop",
  openHint: "open",
} as const;

export type Msg = keyof typeof EN;

const ZH: Record<string, string> = {
  tabArtists: "音樂人",
  tabDiscover: "探索",
  tabEvents: "活動",
  tabHome: "主頁",
  tabBoard: "留言板",
  tabServices: "服務",
  tabMe: "我",
  tabDesk: "後台",
  poweredBy: "技術提供",
  tagline: "為追夢音樂人而設的平台",
  logIn: "登入",
  logOut: "登出",
  register: "註冊",
  talkShop: "留言板",
  signInReply: "登入後方可回覆",
  resetHint: "密碼變更由管理員處理。若仍可登入，請登入帳戶；否則請聯絡管理員。",
  isrPending: "個人檔案、廠牌、歌曲及活動須經管理員審批後方可上架。",
  eventApproval: "所有活動須經管理員審批。",
  sentForReview: "已送出審批。所有活動須經管理員批准。",
  boardComposeHint: "僅限音樂相關內容。場地、樂手、裝備及工作——請勿當作一般閒聊。",
  searchPlaceholder: "標題、樂手、場地……",
  servicesNote: "發行、演出、店舖",
  cardMaasKicker: "場地",
  cardMaasTitle: "現場演出",
  cardLessonsKicker: "課程",
  gateEventBody: "活動由已認證音樂人發佈，並經管理員審批。請以音樂人身份註冊並上載一首歌曲開始。",
  gateVerifyBody: "此功能僅限管理員已認證的音樂人。請上載歌曲，然後等待審批。",
  isrNeedsApproval: "{label} 需要管理員審批。",
  errResetAdmin: "密碼變更由管理員處理。",
  errLoginFirst: "請先登入。",
  errRemoved: "此帳戶已被移除。",
  pendingReview: "等待審批",
  awaiting: "等待審批",
  phSeekingBody: "場地、日期、薪酬，以及你實際需要什麼。",
  bookingsBrief: "購買、場地及課程。每則簡介均附 WhatsApp。",
};

function fill(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export function t(locale: Locale, key: Msg, vars?: Record<string, string | number>) {
  const table = locale === "zh" ? ZH : EN;
  const raw = table[key] ?? EN[key] ?? String(key);
  return fill(raw, vars);
}

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return (key: Msg, vars?: Record<string, string | number>) => t(locale, key, vars);
}

export function useLocale() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const hydrateLocale = useLocaleStore((s) => s.hydrateLocale);
  return { locale, setLocale, hydrateLocale };
}

const GENRE_KEY: Record<string, Msg> = {
  Jazz: "gJazz", Soul: "gSoul", Indie: "gIndie", Folk: "gFolk", Rock: "gRock",
  Electronic: "gElectronic", Ambient: "gAmbient", "Hip-hop": "gHipHop", "R&B": "gRnb",
  Classical: "gClassical", Contemporary: "gContemporary", Cantopop: "gCantopop", Pop: "gPop",
};

export function genreLabel(locale: Locale, genre: string) {
  const key = GENRE_KEY[genre];
  return key ? t(locale, key) : genre;
}

export function locationLabel(locale: Locale, loc: string) {
  if (loc === "HK Island") return t(locale, "locIsland");
  if (loc === "Kowloon") return t(locale, "locKowloon");
  if (loc === "New Territories") return t(locale, "locNT");
  return loc;
}

export function kindLabel(locale: Locale, kind: string) {
  if (kind === "admin") return t(locale, "kindAdmin");
  if (kind === "artist") return t(locale, "kindArtist");
  if (kind === "explorer") return t(locale, "kindExplorer");
  if (kind === "business") return t(locale, "kindBusiness");
  return kind;
}

export function categoryLabel(locale: Locale, cat: string) {
  if (cat === "seeking") return t(locale, "seeking");
  if (cat === "collab") return t(locale, "collab");
  if (cat === "gear") return t(locale, "gear");
  if (cat === "session") return t(locale, "session");
  return cat;
}

const FIELD_KEY: Record<string, Msg> = {
  Name: "fldName", Contact: "fldContact", WhatsApp: "fldWhatsApp", Package: "fldPackage",
  Price: "fldPrice", Company: "fldCompany", Type: "fldType", Location: "fldLocation",
  Hours: "fldHours", From: "fldFrom", Instrument: "fldInstrument", Kind: "fldKind",
  Woods: "fldWoods", Budget: "fldBudget", Build: "fldBuild", Level: "fldLevel", Note: "fldNote",
};

export function fieldLabel(locale: Locale, key: string) {
  const msg = FIELD_KEY[key];
  return msg ? t(locale, msg) : key;
}

export function audioReason(locale: Locale, raw: string) {
  if (raw.startsWith("MP3 files only")) return t(locale, "errNotMp3");
  const m = raw.match(/This file is (.+) MB/);
  if (m) return t(locale, "errTooBigSize", { n: m[1] });
  return raw;
}

export const STORE_ERR: Record<string, Msg> = {
  "Username and password are required.": "errRequired",
  "Enter a valid email.": "errEmail",
  "That username is taken.": "errUsernameTaken",
  "That email is already registered.": "errEmailTaken",
  "Name and role are required.": "errNameRole",
  "Upload one track so we can review you.": "errUploadTrack",
  "Username or password is wrong.": "errWrong",
  "No account uses that email.": "errNoAccount",
  "No account with that email.": "errNoEmail",
  "This account has been removed.": "errRemoved",
  "This account has been removed from Dreamin' Indie.": "errRemoved",
  "Password is too short.": "errShortPass",
  "reset-admin": "errResetAdmin",
  "Log in first.": "errLoginFirst",
  "Sign in first.": "errLoginFirst",
};

export function storeErr(locale: Locale, raw: string | null) {
  if (!raw) return null;
  const key = STORE_ERR[raw];
  return key ? t(locale, key) : raw;
}

const WEEKDAY_KEY: Record<string, Msg> = {
  Sun: "wdSun", Mon: "wdMon", Tue: "wdTue", Wed: "wdWed", Thu: "wdThu", Fri: "wdFri", Sat: "wdSat",
};
const MONTH_KEY: Record<string, Msg> = {
  Jan: "moJan", Feb: "moFeb", Mar: "moMar", Apr: "moApr", May: "moMay", Jun: "moJun",
  Jul: "moJul", Aug: "moAug", Sep: "moSep", Oct: "moOct", Nov: "moNov", Dec: "moDec",
};

export function weekdayLabel(locale: Locale, wd: string) {
  const key = WEEKDAY_KEY[wd];
  return key ? t(locale, key) : wd;
}

export function eventDateParts(locale: Locale, date: string) {
  const m = date.match(/^(\d+)\s+(\w+)$/);
  if (!m) return { day: date, month: "" };
  const monthKey = MONTH_KEY[m[2].slice(0, 3)];
  return { day: m[1], month: monthKey ? t(locale, monthKey) : m[2] };
}

export function eventDateLabel(locale: Locale, date: string) {
  const { day, month } = eventDateParts(locale, date);
  if (!month) return date;
  if (locale === "zh") return `${month}${day}日`;
  return `${day} ${month}`;
}

export function ageText(locale: Locale, iso: string, now = Date.now()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const ms = Math.max(0, now - then);
  const m = Math.floor(ms / 60000);
  if (m < 1) return t(locale, "justNow");
  if (m < 60) return t(locale, "ageMinutes", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t(locale, "ageHours", { n: h });
  const d = Math.floor(h / 24);
  if (d < 30) return t(locale, "ageDays", { n: d });
  return t(locale, "ageMonths", { n: Math.floor(d / 30) });
}

export function venueTypeLabel(locale: Locale, kind: string) {
  if (kind === "Restaurant") return t(locale, "restaurant");
  if (kind === "Hotel") return t(locale, "hotel");
  if (kind === "Retail") return t(locale, "retail");
  if (kind === "Bar") return t(locale, "bar");
  if (kind === "Other") return t(locale, "other");
  return kind;
}

export function lessonInstrumentLabel(locale: Locale, name: string) {
  if (name === "Singing") return t(locale, "singing");
  if (name === "Guitar") return t(locale, "guitar");
  if (name === "Ukulele") return t(locale, "ukulele");
  return name;
}

export function lessonLevelLabel(locale: Locale, level: string) {
  if (level === "Beginner") return t(locale, "beginner");
  if (level === "Intermediate") return t(locale, "intermediate");
  if (level === "Advanced") return t(locale, "advanced");
  return level;
}

export function guitarKindLabel(locale: Locale, kind: string) {
  if (kind === "Electric guitar") return t(locale, "electricGuitar");
  if (kind === "Acoustic guitar") return t(locale, "acousticGuitar");
  if (kind === "Bass guitar") return t(locale, "bassGuitar");
  if (kind === "Other") return t(locale, "other");
  return kind;
}

export function packageNameLabel(locale: Locale, name: string) {
  if (name === "Publish music only") return t(locale, "pkgMusic");
  if (name === "Publish music and cover art") return t(locale, "pkgArt");
  if (name === "Publish music and professional production") return t(locale, "pkgProd");
  return name;
}

export function packageCopy(locale: Locale, id: string) {
  if (id === "music") return { name: t(locale, "pkgMusic"), note: t(locale, "pkgMusicNote") };
  if (id === "art") return { name: t(locale, "pkgArt"), note: t(locale, "pkgArtNote") };
  if (id === "prod") return { name: t(locale, "pkgProd"), note: t(locale, "pkgProdNote") };
  return { name: id, note: "" };
}

export function noticeKindLabel(locale: Locale, kind: string) {
  if (kind === "verify") return t(locale, "noticeArtist");
  if (kind === "label") return t(locale, "noticeLabel");
  if (kind === "event") return t(locale, "noticeEvent");
  if (kind === "song") return t(locale, "noticeTrack");
  return t(locale, "noticeEnquiry");
}

export function enquiryTypeLabel(locale: Locale, title: string, fields?: Record<string, string> | null) {
  if (fields?.Package) return t(locale, "purchase");
  if (title.startsWith("Lesson")) return t(locale, "lessonType");
  if (title.startsWith("MaaS")) return t(locale, "maasShort");
  if (title.startsWith("Shop")) return t(locale, "shopType");
  if (title.startsWith("Custom")) return t(locale, "customType");
  return t(locale, "enquiry");
}

export function fieldValue(locale: Locale, key: string, value: string) {
  if (key === "Location") return locationLabel(locale, value);
  if (key === "Package") return packageNameLabel(locale, value);
  if (key === "Type") return venueTypeLabel(locale, value);
  if (key === "Level") return lessonLevelLabel(locale, value);
  if (key === "Build") return guitarKindLabel(locale, value);
  if (key === "Instrument") return lessonInstrumentLabel(locale, value);
  if (key === "Kind") return guitarKindLabel(locale, value) !== value ? guitarKindLabel(locale, value) : value;
  return value;
}

export function imageReason(locale: Locale, raw: string) {
  if (raw === "Images only.") return t(locale, "imagesOnly");
  const m = raw.match(/Keep images under (\d+) MB/);
  if (m) return t(locale, "imagesUnder", { n: m[1] });
  return t(locale, "couldNotRead");
}

export function songStatusLabel(locale: Locale, status: string) {
  if (status === "approved") return t(locale, "live");
  if (status === "declined") return t(locale, "declined");
  return t(locale, "awaiting");
}

const BOARD_PLACEHOLDER: Record<string, { title: Msg; body: Msg }> = {
  seeking: { title: "phSeekingTitle", body: "phSeekingBody" },
  collab: { title: "phCollabTitle", body: "phCollabBody" },
  gear: { title: "phGearTitle", body: "phGearBody" },
  session: { title: "phSessionTitle", body: "phSessionBody" },
};

export function boardPlaceholder(locale: Locale, cat: string) {
  const keys = BOARD_PLACEHOLDER[cat];
  if (!keys) return { title: "", body: "" };
  return { title: t(locale, keys.title), body: t(locale, keys.body) };
}
