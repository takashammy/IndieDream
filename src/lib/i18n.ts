import { useLocaleStore } from "@/lib/locale";
import { EN } from "@/lib/i18n-en";
import { ZH } from "@/lib/i18n-zh";

export type Locale = "en" | "zh";

export type Msg = keyof typeof EN;

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
