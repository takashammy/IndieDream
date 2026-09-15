import { useLayoutEffect, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { LOCATIONS, PUBLISH_PACKAGES, type LocationArea } from "@/lib/data";
import { currentAccount, useCue, type ServicePanel } from "@/lib/store";
import { scrollMainToTop } from "@/lib/scroll-main";
import { Button } from "@/components/ui/button";
import { AreaInput, Field, ScreenHead, SelectInput, TextInput } from "./chrome";
import { NoticeSheet } from "./inbox";
import { InstrumentShop } from "./instrument-shop";

const CARDS: Array<{
  id: ServicePanel;
  kicker: string;
  title: string;
  body: string;
}> = [
  {
    id: "publishing",
    kicker: "Artists",
    title: "Music publishing",
    body: "We help artists publish songs on all the big platforms. Three packages, one path to a clean release.",
  },
  {
    id: "maas",
    kicker: "Rooms & houses",
    title: "Music as a Service",
    body: "Live music performances for restaurants, hotels, and shops.",
  },
  {
    id: "lessons",
    kicker: "Players",
    title: "Music lessons",
    body: "Singing, guitar, or ukulele. Enquiry only, for now.",
  },
];

const EXTRA_CARDS: Array<{ id: "custom-instruments" | "shop"; kicker: string; title: string; body: string }> = [
  { id: "custom-instruments", kicker: "Workshop", title: "Custom instruments", body: "Custom guitars for maximum visual impact." },
  { id: "shop", kicker: "Shop", title: "Inner Soul Instruments", body: "Ukuleles on the floor. Concert, soprano, tenor, baritone — ready to play." },
];

export function ServicesScreen() {
  const session = useCue((s) => currentAccount(s));
  if (session?.kind === "admin") return <AdminServices />;
  return <UserServices />;
}

function UserServices() {
  const panel = useCue((s) => s.servicePanel);
  const openService = useCue((s) => s.openService);
  const [extra, setExtra] = useState<"custom-instruments" | "shop" | null>(null);

  if (extra === "custom-instruments") return <CustomInstrumentForm onBack={() => { setExtra(null); scrollMainToTop(); }} />;
  if (extra === "shop") return <InstrumentShop onBack={() => { setExtra(null); scrollMainToTop(); }} />;
  if (panel === "publishing") return <PublishingForm />;
  if (panel === "maas") return <MaasForm />;
  if (panel === "lessons") return <LessonsForm />;

  return (
    <div className="cue-enter">
      <ScreenHead kicker="Inner Soul" title="Services" note="Publishing, rooms, shop" />
      <ul>
        {CARDS.map((card) => (
          <li key={card.id} className="border-t border-line">
            <button type="button" onClick={() => openService(card.id)} className="w-full px-5 py-5 text-left">
              <p className="cue-kicker text-xs text-accent">{card.kicker}</p>
              <p className="cue-name mt-1 font-display text-2xl leading-none">{card.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{card.body}</p>
            </button>
          </li>
        ))}
        {EXTRA_CARDS.map((card) => (
          <li key={card.id} className="border-t border-line">
            <button type="button" onClick={() => { setExtra(card.id); scrollMainToTop(); }} className="w-full px-5 py-5 text-left">
              <p className="cue-kicker text-xs text-accent">{card.kicker}</p>
              <p className="cue-name mt-1 font-display text-2xl leading-none">{card.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{card.body}</p>
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

  return (
    <div className="cue-enter pb-10">
      <ScreenHead kicker="Admin" title="Bookings" note={`${pending.length} open`} />
      <p className="px-5 pb-4 text-sm leading-6 text-muted">
        Purchases, bookings, and enquiries land here. Each one includes the sender’s WhatsApp. Open one to read the full brief.
      </p>
      {pending.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">No open enquiries.</p>
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
                  {n.fields?.Package ? "Purchase" : n.title.startsWith("Lesson") ? "Booking" : "Enquiry"}
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
  return (
    <button
      type="button"
      onClick={() => openService(null)}
      className="-ml-2 flex h-11 items-center gap-1 text-sm text-muted"
    >
      <ChevronLeft className="size-4" /> Services
    </button>
  );
}

function NeedAccount({ children }: { children: (ok: boolean) => ReactNode }) {
  const session = useCue((s) => currentAccount(s));
  const setGate = useCue((s) => s.setGate);
  if (!session) {
    return (
      <div>
        {children(false)}
        <Button className="mt-5 w-full" onClick={() => setGate("register")}>
          Register to send this
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
  useLayoutEffect(() => { scrollMainToTop(); }, []);

  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back />
      <p className="cue-kicker mt-2 text-xs text-muted">Distribution</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">Publish music</h1>
      <p className="mt-3 text-sm text-muted">
        We help artists publish songs on all the big platforms. Three packages, one path to a clean release. Leave a WhatsApp number so we can reach you.
      </p>
      {sent ? (
        <p className="mt-5 text-sm leading-6 text-muted">
          We’ve got the brief. We’ll be in touch.
        </p>
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
                <legend className="text-xs text-muted">Package</legend>
                {PUBLISH_PACKAGES.map((p) => (
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
                        <span className="font-medium text-fg">{p.name}</span>
                        <span className="font-display text-lg text-accent">{p.price}</span>
                      </span>
                      <span className="mt-1 block text-sm text-muted">{p.note}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <Field label="Name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Email">
                <TextInput
                  type="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </Field>
              <Field label="WhatsApp number">
                <TextInput
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+852 5123 4567"
                  required
                />
              </Field>
              <Field label="About the release">
                <AreaInput rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              {ok ? (
                <Button type="submit" className="w-full">
                  Send enquiry
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
  useLayoutEffect(() => { scrollMainToTop(); }, []);

  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back />
      <p className="cue-kicker mt-2 text-xs text-muted">Live performances</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">Music as a Service</h1>
      <p className="mt-3 text-sm text-muted">
        We provide live music performances for restaurants, hotels, and shops. Leave a WhatsApp number so we can quote you.
      </p>
      {sent ? (
        <p className="mt-5 text-sm leading-6 text-muted">
          Quotation request filed. We’ll be in touch.
        </p>
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
              <Field label="Company / venue">
                <TextInput value={company} onChange={(e) => setCompany(e.target.value)} required />
              </Field>
              <Field label="Type">
                <SelectInput value={kind} onChange={(e) => setKind(e.target.value)}>
                  {["Restaurant", "Hotel", "Retail", "Bar", "Other"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Location">
                <SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>
                  {LOCATIONS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="When you need live music">
                <TextInput value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Thu–Sat, 8pm–11pm" />
              </Field>
              <Field label="WhatsApp number">
                <TextInput
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+852 5123 4567"
                  required
                />
              </Field>
              <Field label="What you need">
                <AreaInput rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              {ok ? (
                <Button type="submit" className="w-full">
                  Request a quotation
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
  useLayoutEffect(() => { scrollMainToTop(); }, []);

  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back />
      <p className="cue-kicker mt-2 text-xs text-muted">Players</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">Music lessons</h1>
      <p className="mt-3 text-sm italic text-muted">
        Times and rates will land later. Leave a WhatsApp number so we can write when the diary opens.
      </p>
      {sent ? (
        <p className="mt-5 text-sm leading-6 text-muted">Enquiry received. We’ll be in touch.</p>
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
              <Field label="Name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Instrument / voice">
                <SelectInput value={instrument} onChange={(e) => setInstrument(e.target.value)} required>
                  {["Singing", "Guitar", "Ukulele"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Level">
                <SelectInput value={level} onChange={(e) => setLevel(e.target.value)}>
                  {["Beginner", "Intermediate", "Advanced"].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Location">
                <SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>
                  {LOCATIONS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="WhatsApp number">
                <TextInput
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+852 5123 4567"
                  required
                />
              </Field>
              <Field label="Message">
                <AreaInput rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
              </Field>
              {ok ? (
                <Button type="submit" className="w-full">
                  Send enquiry
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
  useLayoutEffect(() => { scrollMainToTop(); }, []);
  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <button type="button" onClick={onBack} className="-ml-2 flex h-11 items-center gap-1 text-sm text-muted">
        ← Services
      </button>
      <p className="cue-kicker mt-2 text-xs text-muted">Workshop</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">Custom instruments</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Custom guitars for maximum visual impact.</p>
      {sent ? <p className="mt-5 text-sm text-muted">Build request filed. We’ll write on WhatsApp.</p> : (
        <NeedAccount>
          {(ok) => (
            <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (!ok) return; submitEnquiry(`Custom instrument — ${kind}`, brief.trim() || `${kind}. ${woods}`.trim(), { Name: name, Build: kind, Woods: woods, Budget: budget, WhatsApp: whatsapp }); setSent(true); }}>
              <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} required /></Field>
              <Field label="Instrument"><SelectInput value={kind} onChange={(e) => setKind(e.target.value)}>{["Electric guitar", "Acoustic guitar", "Bass guitar", "Other"].map((k) => <option key={k}>{k}</option>)}</SelectInput></Field>
              <Field label="Woods / look"><TextInput value={woods} onChange={(e) => setWoods(e.target.value)} /></Field>
              <Field label="Budget"><TextInput value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$2,000–$4,000" /></Field>
              <Field label="WhatsApp number"><TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required /></Field>
              <Field label="What you want it to do"><AreaInput rows={4} value={brief} onChange={(e) => setBrief(e.target.value)} /></Field>
              {ok ? <Button type="submit" className="w-full">Request a build</Button> : null}
            </form>
          )}
        </NeedAccount>
      )}
    </div>
  );
}
