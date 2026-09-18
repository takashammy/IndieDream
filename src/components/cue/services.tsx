import { useLayoutEffect, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { LOCATIONS, PUBLISH_PACKAGES, type LocationArea } from "@/lib/data";
import { currentAccount, useCue, type ServicePanel } from "@/lib/store";
import { scrollMainToTop } from "@/lib/scroll-main";
import { Button } from "@/components/ui/button";
import { AreaInput, Field, ScreenHead, SelectInput, TextInput } from "./chrome";
import { NoticeSheet } from "./inbox";
import { InstrumentShop } from "./instrument-shop";
import {
  composingLanguageLabel,
  composingProjectLabel,
  composingServiceLabel,
  enquiryTypeLabel,
  guitarKindLabel,
  lessonInstrumentLabel,
  lessonLevelLabel,
  locationLabel,
  packageCopy,
  useLocale,
  useT,
  venueTypeLabel,
  type Msg,
} from "@/lib/i18n";

const CARDS: Array<{
  id: ServicePanel;
  kicker: Msg;
  title: Msg;
  body: Msg;
}> = [
  { id: "publishing", kicker: "cardPubKicker", title: "cardPubTitle", body: "cardPubBody" },
  { id: "maas", kicker: "cardMaasKicker", title: "cardMaasTitle", body: "cardMaasBody" },
  { id: "lessons", kicker: "cardLessonsKicker", title: "cardLessonsTitle", body: "cardLessonsBody" },
  { id: "composing", kicker: "cardComposeKicker", title: "cardComposeTitle", body: "cardComposeBody" },
];

const EXTRA_CARDS: Array<{ id: "custom-instruments" | "shop"; kicker: Msg; title: Msg; body: Msg }> = [
  { id: "custom-instruments", kicker: "cardCustomKicker", title: "cardCustomTitle", body: "cardCustomBody" },
  { id: "shop", kicker: "cardShopKicker", title: "cardShopTitle", body: "cardShopBody" },
];

export function ServicesScreen() {
  return <UserServices />;
}

function UserServices() {
  const panel = useCue((s) => s.servicePanel);
  const openService = useCue((s) => s.openService);
  const [extra, setExtra] = useState<"custom-instruments" | "shop" | null>(null);
  const t = useT();

  if (extra === "custom-instruments") return <CustomInstrumentForm onBack={() => { setExtra(null); scrollMainToTop(); }} />;
  if (extra === "shop") return <InstrumentShop onBack={() => { setExtra(null); scrollMainToTop(); }} />;
  if (panel === "publishing") return <PublishingForm />;
  if (panel === "maas") return <MaasForm />;
  if (panel === "lessons") return <LessonsForm />;
  if (panel === "composing") return <ComposingForm />;

  return (
    <div className="cue-enter">
      <ScreenHead kicker={t("innerSoulKicker")} title={t("services")} note={t("servicesNote")} />
      <ul>
        {CARDS.map((card) => (
          <li key={card.id} className="border-t border-line">
            <button type="button" onClick={() => openService(card.id)} className="w-full px-5 py-5 text-left">
              <p className="cue-kicker text-xs text-accent">{t(card.kicker)}</p>
              <p className="cue-name mt-1 font-display text-2xl leading-none">{t(card.title)}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{t(card.body)}</p>
            </button>
          </li>
        ))}
        {EXTRA_CARDS.map((card) => (
          <li key={card.id} className="border-t border-line">
            <button type="button" onClick={() => { setExtra(card.id); scrollMainToTop(); }} className="w-full px-5 py-5 text-left">
              <p className="cue-kicker text-xs text-accent">{t(card.kicker)}</p>
              <p className="cue-name mt-1 font-display text-2xl leading-none">{t(card.title)}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{t(card.body)}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminServices() {
  const all = useCue((s) => s.notices);
  const noticeId = useCue((s) => s.noticeId);
  const openNotice = useCue((s) => s.openNotice);
  const pending = all.filter((n) => n.kind === "enquiry" && n.status === "pending");
  const selected =
    pending.find((n) => n.id === noticeId) ??
    all.find((n) => n.id === noticeId && n.kind === "enquiry") ??
    null;
  const t = useT();
  const { locale } = useLocale();

  return (
    <div className="cue-enter pb-10">
      <ScreenHead kicker={t("admin")} title={t("bookings")} note={t("nOpen", { n: pending.length })} />
      <p className="px-5 pb-4 text-sm leading-6 text-muted">{t("adminBookingsNote")}</p>
      {pending.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">{t("noOpenEnquiries")}</p>
      ) : (
        <ul>
          {pending.map((n) => (
            <li key={n.id} className="border-t border-line">
              <button
                type="button"
                onClick={() => openNotice(n.id)}
                className="w-full px-5 py-4 text-left"
              >
                <span className="cue-kicker block text-xs text-accent">
                  {enquiryTypeLabel(locale, n.title, n.fields)}
                </span>
                <span className="mt-1 block font-medium leading-snug">{n.title}</span>
                <span className="mt-1 block line-clamp-2 text-sm text-muted">{n.body}</span>
                <span className="mt-1 block text-xs text-subtle">
                  {[n.fields?.From, n.fields?.WhatsApp].filter(Boolean).join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected ? (
        <NoticeSheet enquiry notice={selected} onClose={() => openNotice(null)} />
      ) : null}
    </div>
  );
}

function Back() {
  const openService = useCue((s) => s.openService);
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => openService(null)}
      className="-ml-2 flex h-11 items-center gap-1 text-sm text-muted"
    >
      <ChevronLeft className="size-4" /> {t("services")}
    </button>
  );
}

function NeedAccount({ children }: { children: (ok: boolean) => ReactNode }) {
  const session = useCue((s) => currentAccount(s));
  const setGate = useCue((s) => s.setGate);
  const t = useT();
  if (!session) {
    return (
      <div>
        {children(false)}
        <Button className="mt-5 w-full" onClick={() => setGate("register")}>
          {t("registerToSend")}
        </Button>
      </div>
    );
  }
  return <>{children(true)}</>;
}

function PublishingForm() {
  const session = useCue((s) => currentAccount(s));
  const submitEnquiry = useCue((s) => s.submitEnquiry);
  const [pkg, setPkg] = useState<(typeof PUBLISH_PACKAGES)[number]["id"]>("music");
  const [name, setName] = useState(session?.name ?? "");
  const [contact, setContact] = useState(session?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(session?.whatsapp ?? "");
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);
  const t = useT();
  const { locale } = useLocale();
  useLayoutEffect(() => { scrollMainToTop(); }, []);

  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back />
      <p className="cue-kicker mt-2 text-xs text-muted">{t("distribution")}</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">{t("publishMusic")}</h1>
      <p className="mt-3 text-sm text-muted">{t("publishIntro")}</p>
      {sent ? (
        <p className="mt-5 text-sm leading-6 text-muted">{t("gotBrief")}</p>
      ) : (
        <NeedAccount>
          {(ok) => (
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ok) return;
                const chosen = PUBLISH_PACKAGES.find((p) => p.id === pkg)!;
                submitEnquiry(`Publishing — ${chosen.name}`, notes.trim() || chosen.note, {
                  Name: name,
                  Contact: contact,
                  WhatsApp: whatsapp,
                  Package: chosen.name,
                  Price: chosen.price,
                });
                setSent(true);
              }}
            >
              <fieldset className="space-y-2">
                <legend className="text-xs text-muted">{t("package")}</legend>
                {PUBLISH_PACKAGES.map((p) => {
                  const copy = packageCopy(locale, p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex cursor-pointer gap-3 rounded-md bg-surface p-3"
                    >
                      <input
                        type="radio"
                        name="pkg"
                        className="mt-1"
                        checked={pkg === p.id}
                        onChange={() => setPkg(p.id)}
                      />
                      <span>
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-medium text-fg">{copy.name}</span>
                          <span className="font-display text-lg text-accent">{p.price}</span>
                        </span>
                        <span className="mt-1 block text-sm text-muted">{copy.note}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              <Field label={t("name")}>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label={t("email")}>
                <TextInput
                  type="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </Field>
              <Field label={t("whatsapp")}>
                <TextInput
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+852 5123 4567"
                  required
                />
              </Field>
              <Field label={t("aboutRelease")}>
                <AreaInput rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              {ok ? (
                <Button type="submit" className="w-full">
                  {t("sendEnquiry")}
                </Button>
              ) : null}
            </form>
          )}
        </NeedAccount>
      )}
    </div>
  );
}

function MaasForm() {
  const session = useCue((s) => currentAccount(s));
  const submitEnquiry = useCue((s) => s.submitEnquiry);
  const [company, setCompany] = useState("");
  const [kind, setKind] = useState("Restaurant");
  const [area, setArea] = useState<LocationArea>("HK Island");
  const [hours, setHours] = useState("");
  const [whatsapp, setWhatsapp] = useState(session?.whatsapp ?? "");
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);
  const t = useT();
  const { locale } = useLocale();
  useLayoutEffect(() => { scrollMainToTop(); }, []);

  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back />
      <p className="cue-kicker mt-2 text-xs text-muted">{t("livePerformances")}</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">{t("cardMaasTitle")}</h1>
      <p className="mt-3 text-sm text-muted">{t("maasIntro")}</p>
      {sent ? (
        <p className="mt-5 text-sm leading-6 text-muted">{t("quoteFiled")}</p>
      ) : (
        <NeedAccount>
          {(ok) => (
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ok) return;
                submitEnquiry(`MaaS quotation — ${company}`, notes.trim() || `${kind} in ${area}`, {
                  Company: company,
                  Type: kind,
                  Location: area,
                  Hours: hours,
                  WhatsApp: whatsapp,
                });
                setSent(true);
              }}
            >
              <Field label={t("companyVenue")}>
                <TextInput value={company} onChange={(e) => setCompany(e.target.value)} required />
              </Field>
              <Field label={t("type")}>
                <SelectInput value={kind} onChange={(e) => setKind(e.target.value)}>
                  {["Restaurant", "Hotel", "Retail", "Bar", "Other"].map((k) => (
                    <option key={k} value={k}>{venueTypeLabel(locale, k)}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("location")}>
                <SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>{locationLabel(locale, l)}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("whenLive")}>
                <TextInput value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Thu–Sat, 8pm–11pm" />
              </Field>
              <Field label={t("whatsapp")}>
                <TextInput
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+852 5123 4567"
                  required
                />
              </Field>
              <Field label={t("whatYouNeed")}>
                <AreaInput rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              {ok ? (
                <Button type="submit" className="w-full">
                  {t("requestQuote")}
                </Button>
              ) : null}
            </form>
          )}
        </NeedAccount>
      )}
    </div>
  );
}

function LessonsForm() {
  const session = useCue((s) => currentAccount(s));
  const submitEnquiry = useCue((s) => s.submitEnquiry);
  const [name, setName] = useState(session?.name ?? "");
  const [instrument, setInstrument] = useState("Singing");
  const [level, setLevel] = useState("Beginner");
  const [area, setArea] = useState<LocationArea>(session?.location ?? "HK Island");
  const [whatsapp, setWhatsapp] = useState(session?.whatsapp ?? "");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const t = useT();
  const { locale } = useLocale();
  useLayoutEffect(() => { scrollMainToTop(); }, []);

  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back />
      <p className="cue-kicker mt-2 text-xs text-muted">{t("cardLessonsKicker")}</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">{t("musicLessons")}</h1>
      <p className="mt-3 text-sm italic text-muted">{t("lessonsIntro")}</p>
      {sent ? (
        <p className="mt-5 text-sm leading-6 text-muted">{t("enquiryReceived")}</p>
      ) : (
        <NeedAccount>
          {(ok) => (
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ok) return;
                submitEnquiry(`Lesson enquiry — ${instrument}`, message.trim() || `${level} ${instrument}`, {
                  Name: name,
                  Instrument: instrument,
                  Level: level,
                  Location: area,
                  WhatsApp: whatsapp,
                });
                setSent(true);
              }}
            >
              <Field label={t("name")}>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label={t("instrumentVoice")}>
                <SelectInput value={instrument} onChange={(e) => setInstrument(e.target.value)} required>
                  {["Singing", "Guitar", "Ukulele"].map((k) => (
                    <option key={k} value={k}>{lessonInstrumentLabel(locale, k)}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("level")}>
                <SelectInput value={level} onChange={(e) => setLevel(e.target.value)}>
                  {["Beginner", "Intermediate", "Advanced"].map((l) => (
                    <option key={l} value={l}>{lessonLevelLabel(locale, l)}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("location")}>
                <SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>{locationLabel(locale, l)}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("whatsapp")}>
                <TextInput
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+852 5123 4567"
                  required
                />
              </Field>
              <Field label={t("message")}>
                <AreaInput rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
              </Field>
              {ok ? (
                <Button type="submit" className="w-full">
                  {t("sendEnquiry")}
                </Button>
              ) : null}
            </form>
          )}
        </NeedAccount>
      )}
    </div>
  );
}

function ComposingForm() {
  const session = useCue((s) => currentAccount(s));
  const submitEnquiry = useCue((s) => s.submitEnquiry);
  const [name, setName] = useState(session?.name ?? "");
  const [service, setService] = useState("Composing and lyrics");
  const [project, setProject] = useState("Full song");
  const [language, setLanguage] = useState("Cantonese");
  const [genre, setGenre] = useState("");
  const [area, setArea] = useState<LocationArea>(session?.location ?? "HK Island");
  const [whatsapp, setWhatsapp] = useState(session?.whatsapp ?? "");
  const [brief, setBrief] = useState("");
  const [sent, setSent] = useState(false);
  const t = useT();
  const { locale } = useLocale();
  useLayoutEffect(() => { scrollMainToTop(); }, []);

  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back />
      <p className="cue-kicker mt-2 text-xs text-muted">{t("cardComposeKicker")}</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">{t("composingTitle")}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{t("composingIntro")}</p>
      {sent ? (
        <p className="mt-5 text-sm leading-6 text-muted">{t("enquiryReceived")}</p>
      ) : (
        <NeedAccount>
          {(ok) => (
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ok) return;
                submitEnquiry(
                  `Composing & lyrics — ${service}`,
                  brief.trim() || `${service}. ${project}${genre ? `. ${genre}` : ""}`.trim(),
                  {
                    Name: name,
                    Service: service,
                    Project: project,
                    Language: language,
                    Genre: genre.trim() || "—",
                    Location: area,
                    WhatsApp: whatsapp,
                  },
                );
                setSent(true);
              }}
            >
              <Field label={t("name")}>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label={t("composingService")}>
                <SelectInput value={service} onChange={(e) => setService(e.target.value)} required>
                  {["Composing", "Lyrics", "Composing and lyrics"].map((k) => (
                    <option key={k} value={k}>{composingServiceLabel(locale, k)}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("composingProject")}>
                <SelectInput value={project} onChange={(e) => setProject(e.target.value)} required>
                  {["Full song", "Melody only", "Lyrics only", "Lyrics for your melody"].map((k) => (
                    <option key={k} value={k}>{composingProjectLabel(locale, k)}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("composingLanguage")}>
                <SelectInput value={language} onChange={(e) => setLanguage(e.target.value)} required>
                  {["Cantonese", "English", "Mandarin", "Mixed"].map((k) => (
                    <option key={k} value={k}>{composingLanguageLabel(locale, k)}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("composingGenre")}>
                <TextInput
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder={t("composingGenrePlaceholder")}
                />
              </Field>
              <Field label={t("location")}>
                <SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>{locationLabel(locale, l)}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={t("whatsapp")}>
                <TextInput
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+852 5123 4567"
                  required
                />
              </Field>
              <Field label={t("composingBrief")}>
                <AreaInput rows={4} value={brief} onChange={(e) => setBrief(e.target.value)} />
              </Field>
              {ok ? (
                <Button type="submit" className="w-full">
                  {t("sendEnquiry")}
                </Button>
              ) : null}
            </form>
          )}
        </NeedAccount>
      )}
    </div>
  );
}

function CustomInstrumentForm({ onBack }: { onBack?: () => void }) {
  const session = useCue((s) => currentAccount(s));
  const submitEnquiry = useCue((s) => s.submitEnquiry);
  const [name, setName] = useState(session?.name ?? "");
  const [kind, setKind] = useState("Electric guitar");
  const [woods, setWoods] = useState("");
  const [budget, setBudget] = useState("");
  const [whatsapp, setWhatsapp] = useState(session?.whatsapp ?? "");
  const [brief, setBrief] = useState("");
  const [sent, setSent] = useState(false);
  const t = useT();
  const { locale } = useLocale();
  useLayoutEffect(() => { scrollMainToTop(); }, []);
  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <button type="button" onClick={onBack} className="-ml-2 flex h-11 items-center gap-1 text-sm text-muted">
        {t("backServices")}
      </button>
      <p className="cue-kicker mt-2 text-xs text-muted">{t("workshop")}</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">{t("cardCustomTitle")}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{t("customGuitars")}</p>
      {sent ? <p className="mt-5 text-sm text-muted">{t("buildFiled")}</p> : (
        <NeedAccount>
          {(ok) => (
            <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (!ok) return; submitEnquiry(`Custom instrument — ${kind}`, brief.trim() || `${kind}. ${woods}`.trim(), { Name: name, Build: kind, Woods: woods, Budget: budget, WhatsApp: whatsapp }); setSent(true); }}>
              <Field label={t("name")}><TextInput value={name} onChange={(e) => setName(e.target.value)} required /></Field>
              <Field label={t("instrument")}>
                <SelectInput value={kind} onChange={(e) => setKind(e.target.value)}>
                  {["Electric guitar", "Acoustic guitar", "Bass guitar", "Other"].map((k) => <option key={k} value={k}>{guitarKindLabel(locale, k)}</option>)}
                </SelectInput>
              </Field>
              <Field label={t("woodsLook")}><TextInput value={woods} onChange={(e) => setWoods(e.target.value)} /></Field>
              <Field label={t("budget")}><TextInput value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$2,000–$4,000" /></Field>
              <Field label={t("whatsapp")}><TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required /></Field>
              <Field label={t("whatYouWant")}><AreaInput rows={4} value={brief} onChange={(e) => setBrief(e.target.value)} /></Field>
              {ok ? <Button type="submit" className="w-full">{t("requestBuild")}</Button> : null}
            </form>
          )}
        </NeedAccount>
      )}
    </div>
  );
}
