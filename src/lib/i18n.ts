import { useLocaleStore } from "@/lib/locale";

export type Locale = "en" | "zh";

export { EN, ZH };

const EN = {
  language: "Language",
  langEn: "English",
  langZh: "繁體中文",
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
  resetHint: "Enter the email on the account, then choose a new password.",
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
  nowPlaying: "Now playing",
  randomRoster: "Random from the roster",
  nothingLive: "Nothing live yet",
  play: "Play",
  pause: "Pause",
  nextTrack: "Play next random track",
  lyricsFor: "Lyrics for",
  track: "Track",
  noLyrics: "No lyrics yet.",
  kindArtist: "Artist",
  kindExplorer: "Explorer",
  kindBusiness: "Business",
  kindAdmin: "Admin",
  locIsland: "HK Island",
  locKowloon: "Kowloon",
  locNT: "New Territories",
  independent: "Independent",
  isrPending: "Inner Soul Records is assigned after review.",
  trackUploadHint: "Track upload — MP3 only, 5 MB max",
  trackTitle: "Track title",
  chooseMp3: "Choose MP3 file",
  rolePlaceholder: "Vocalist, drummer, producer…",
  fileOverLimit: "This file is over the limit",
  upload: "Upload",
  mp3Only5: "{app} only takes MP3 files up to 5 MB.",
  chooseAnother: "Choose another file",
  uploadAgreement: "Upload agreement",
  agreeContinue: "Agree and continue",
  notNow: "Not now",
  uploadTerms: "By uploading your song onto the platform, you give Inner Soul Records and Dreamin' Indie the right to promote your songs on the platform and at other venues, and in return you waive all rights to any copyright claims. You may delete your songs from the platform at any time. By continuing to upload, you automatically agree to this agreement.",
  errUploadMp3: "Upload one MP3, 5 MB or under.",
  errNotMp3: "MP3 files only. Export or convert the track to MP3 first.",
  errTooBig: "This file is over 5 MB. The limit is 5 MB.",
  gateListenTitle: "Register to listen",
  gateListenBody: "Guests can browse {app}. Playback is for people who have an account.",
  gateBoardTitle: "Register to post",
  gateBoardBody: "The board is for working musicians. Make an account to join the thread.",
  gateEventTitle: "Verified artists only",
  gateEventBody: "Events are posted by verified artists, then approved by Inner Soul Records. Register as an artist and upload a track to begin.",
  gateVerifyTitle: "Verification required",
  gateVerifyBody: "This is reserved for artists Inner Soul Records has verified. Upload a track, then wait for approval.",
  gateRegisterTitle: "Register to continue",
  gateRegisterBody: "Listening, posting, and services all need a {app} account.",
  haveAccount: "I already have an account",
} as const;

export type Msg = keyof typeof EN;

const ZH: Record<Msg, string> = {
  language: "語言",
  langEn: "English",
  langZh: "繁體中文",
  tabArtists: "音樂人",
  tabDiscover: "探索",
  tabEvents: "活動",
  tabHome: "主頁",
  tabBoard: "留言板",
  tabServices: "服務",
  tabMe: "我",
  tabDesk: "後台",
  poweredBy: "技術提供",
  tagline: "係追夢音樂人用嘅平台",
  guest: "訪客",
  you: "你",
  account: "帳戶",
  profile: "個人檔案",
  register: "註冊",
  logIn: "登入",
  logOut: "登出",
  enter: "進入",
  forgotPassword: "忘記密碼？",
  needAccount: "未有帳戶？去註冊",
  alreadyRegistered: "已經註冊？去登入",
  resetPassword: "重設密碼",
  saveNewPassword: "儲存新密碼",
  backToLogin: "返回登入",
  passwordUpdated: "密碼已更新。請用用戶名稱同新密碼登入。",
  resetHint: "輸入帳戶電郵，然後設定新密碼。",
  passwordsMismatch: "兩次輸入嘅密碼唔一致。",
  createAccount: "建立帳戶",
  iAmA: "我係",
  username: "用戶名稱",
  password: "密碼",
  newPassword: "新密碼",
  confirmPassword: "確認密碼",
  email: "電郵",
  name: "名稱",
  role: "崗位",
  location: "地區",
  genre: "曲風",
  label: "廠牌",
  bio: "簡介 / 關於我",
  whatsapp: "WhatsApp 號碼",
  personalInfo: "個人資料",
  saveDetails: "儲存資料",
  saved: "已儲存",
  changePhoto: "更換頭像",
  guestBrowse: "訪客可以瀏覽目錄。聽歌、留言板、活動同服務需要帳戶。",
  nowPlaying: "正在播放",
  randomRoster: "名單隨機播放",
  nothingLive: "暫時未有上架歌曲",
  play: "播放",
  pause: "暫停",
  nextTrack: "下一首隨機歌曲",
  lyricsFor: "歌詞：",
  track: "歌曲",
  noLyrics: "暫時未有歌詞。",
  kindArtist: "音樂人",
  kindExplorer: "探索者",
  kindBusiness: "商戶",
  kindAdmin: "管理員",
  locIsland: "港島",
  locKowloon: "九龍",
  locNT: "新界",
  independent: "獨立",
  isrPending: "Inner Soul Records 要通過審批先會掛上。",
  trackUploadHint: "上載歌曲 — 只限 MP3，最多 5 MB",
  trackTitle: "歌曲名稱",
  chooseMp3: "選擇 MP3 檔案",
  rolePlaceholder: "主音、鼓手、製作人……",
  fileOverLimit: "檔案超出上限",
  upload: "上載",
  mp3Only5: "{app} 只接受 5 MB 或以下嘅 MP3。",
  chooseAnother: "另選檔案",
  uploadAgreement: "上載協議",
  agreeContinue: "同意並繼續",
  notNow: "暫時唔好",
  uploadTerms: "將歌曲上載到平台，即代表你授權 Inner Soul Records 同 Dreamin' Indie 喺平台及其他場地推廣你嘅歌曲，同時放棄一切版權申索。你可以隨時從平台刪除歌曲。繼續上載即視為自動同意本協議。",
  errUploadMp3: "請上載一首 5 MB 或以下嘅 MP3。",
  errNotMp3: "只接受 MP3。請先匯出或轉成 MP3。",
  errTooBig: "檔案超過 5 MB。上限係 5 MB。",
  gateListenTitle: "註冊後先可以聽",
  gateListenBody: "訪客可以瀏覽 {app}。播放只限已有帳戶嘅人。",
  gateBoardTitle: "註冊後先可以發帖",
  gateBoardBody: "留言板係係在職音樂人用。開帳戶先可以參與討論。",
  gateEventTitle: "只限已認證音樂人",
  gateEventBody: "活動由已認證音樂人發佈，再經 Inner Soul Records 審批。請以音樂人身份註冊並上載一首歌開始。",
  gateVerifyTitle: "需要認證",
  gateVerifyBody: "呢個功能只限 Inner Soul Records 已認證嘅音樂人。請上載歌曲，然後等待審批。",
  gateRegisterTitle: "註冊後繼續",
  gateRegisterBody: "聽歌、發帖同服務都需要 {app} 帳戶。",
  haveAccount: "我已經有帳戶",
};

function fill(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export function t(locale: Locale, key: Msg, vars?: Record<string, string | number>) {
  const table = locale === "zh" ? ZH : EN;
  return fill(table[key] ?? EN[key], vars);
}

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return (key: Msg, vars?: Record<string, string | number>) => t(locale, key, vars);
}

export function useLocale() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  return { locale, setLocale };
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

export function genreLabel(_locale: Locale, genre: string) {
  return genre;
}

const STORE_ERR: Record<string, Msg> = {};

export function storeErr(locale: Locale, raw: string | null) {
  if (!raw) return null;
  return raw;
}
