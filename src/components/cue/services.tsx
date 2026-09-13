import { useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { LOCATIONS, PUBLISH_PACKAGES, type LocationArea } from "@/lib/data";
import { INNER_SOUL_INSTRUMENTS, type ShopInstrument } from "@/lib/instruments";
import { currentAccount, useCue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AreaInput, Field, ScreenHead, SelectInput, TextInput } from "./chrome";
import { NoticeSheet } from "./inbox";

const CARDS: Array<{
  id: "publishing" | "maas" | "lessons" | "custom-instruments" | "shop";
  kicker: string;
  title: string;
  body: string;
}> = [
  { id: "publishing", kicker: "Artists", title: "Music publishing", body: "Release through Inner Soul Records. Three packages, one path to a clean release." },
  { id: "maas", kicker: "Rooms & houses", title: "Music as a Service", body: "Playlists and live programming for restaurants, hotels, and shops." },
  { id: "lessons", kicker: "Players", title: "Music lessons", body: "Book time with Inner Soul Records. Enquiry only, for now." },
  { id: "custom-instruments", kicker: "Workshop", title: "Custom instruments", body: "Commission a uke or small-body instrument built to your spec." },
  { id: "shop", kicker: "Shop", title: "Inner Soul Instruments", body: "Ukuleles on the floor. Concert, soprano, tenor, baritone \u2014 ready to play." },
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
  if (extra === "custom-instruments") return <CustomInstrumentForm onBack={() => setExtra(null)} />;
  if (extra === "shop") return <InstrumentShop onBack={() => setExtra(null)} />;
  if (panel === "publishing") return <PublishingForm />;
  if (panel === "maas") return <MaasForm />;
  if (panel === "lessons") return <LessonsForm />;
  return (
    <div className="cue-enter">
      <ScreenHead kicker="Inner Soul" title="Services" note="Publishing, rooms, shop" />
      <ul>
        {CARDS.map((card) => (
          <li key={card.id} className="border-t border-line">
            <button
              type="button"
              onClick={() => {
                if (card.id === "custom-instruments" || card.id === "shop") setExtra(card.id);
                else openService(card.id);
              }}
              className="w-full px-5 py-5 text-left"
            >
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
  const selected = pending.find((n) => n.id === noticeId) ?? all.find((n) => n.id === noticeId && n.kind === "enquiry") ?? null;
  return (
    <div className="cue-enter pb-10">
      <ScreenHead kicker="Admin" title="Bookings" note={`${pending.length} open`} />
      <p className="px-5 pb-4 text-sm leading-6 text-muted">Purchases, bookings, and enquiries land here.</p>
      {pending.length === 0 ? (
        <p className="px-5 text-sm italic text-muted">No open enquiries.</p>
      ) : (
        <ul>
          {pending.map((n) => (
            <li key={n.id} className="border-t border-line">
              <button type="button" onClick={() => openNotice(n.id)} className="w-full px-5 py-4 text-left">
                <span className="mt-1 block font-medium leading-snug">{n.title}</span>
                <span className="mt-1 block line-clamp-2 text-sm text-muted">{n.body}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected ? <NoticeSheet enquiry notice={selected} onClose={() => openNotice(null)} /> : null}
    </div>
  );
}

function Back({ onBack }: { onBack?: () => void }) {
  const openService = useCue((s) => s.openService);
  return (
    <button type="button" onClick={() => (onBack ? onBack() : openService(null))} className="-ml-2 flex h-11 items-center gap-1 text-sm text-muted">
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
        <Button className="mt-5 w-full" onClick={() => setGate("register")}>Register to send this</Button>
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
  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back />
      <p className="cue-kicker mt-2 text-xs text-muted">Inner Soul Records</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">Publish music</h1>
      {sent ? <p className="mt-5 text-sm text-muted">Inner Soul Records has the brief.</p> : (
        <NeedAccount>
          {(ok) => (
            <form className="mt-5 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              if (!ok) return;
              const chosen = PUBLISH_PACKAGES.find((p) => p.id === pkg)!;
              submitEnquiry(`Publishing \u2014 ${chosen.name}`, notes.trim() || chosen.note, { Name: name, Contact: contact, WhatsApp: whatsapp, Package: chosen.name, Price: chosen.price });
              setSent(true);
            }}>
              <fieldset className="space-y-2">
                <legend className="text-xs text-muted">Package</legend>
                {PUBLISH_PACKAGES.map((p) => (
                  <label key={p.id} className="flex cursor-pointer gap-3 rounded-md bg-surface p-3">
                    <input type="radio" name="pkg" className="mt-1" checked={pkg === p.id} onChange={() => setPkg(p.id)} />
                    <span><span className="font-medium text-fg">{p.name}</span> <span className="text-accent">{p.price}</span><span className="mt-1 block text-sm text-muted">{p.note}</span></span>
                  </label>
                ))}
              </fieldset>
              <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} required /></Field>
              <Field label="Email"><TextInput type="email" value={contact} onChange={(e) => setContact(e.target.value)} required /></Field>
              <Field label="WhatsApp number"><TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required /></Field>
              <Field label="About the release"><AreaInput rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
              {ok ? <Button type="submit" className="w-full">Send enquiry</Button> : null}
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
  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back />
      <p className="cue-kicker mt-2 text-xs text-muted">For rooms that need a sound</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">Music as a Service</h1>
      {sent ? <p className="mt-5 text-sm text-muted">Quotation request filed.</p> : (
        <NeedAccount>
          {(ok) => (
            <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (!ok) return; submitEnquiry(`MaaS quotation \u2014 ${company}`, notes.trim() || `${kind} in ${area}`, { Company: company, Type: kind, Location: area, Hours: hours, WhatsApp: whatsapp }); setSent(true); }}>
              <Field label="Company / venue"><TextInput value={company} onChange={(e) => setCompany(e.target.value)} required /></Field>
              <Field label="Type"><SelectInput value={kind} onChange={(e) => setKind(e.target.value)}>{["Restaurant", "Hotel", "Retail", "Bar", "Other"].map((k) => <option key={k}>{k}</option>)}</SelectInput></Field>
              <Field label="Location"><SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</SelectInput></Field>
              <Field label="Hours / days"><TextInput value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
              <Field label="WhatsApp number"><TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required /></Field>
              <Field label="What you need"><AreaInput rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
              {ok ? <Button type="submit" className="w-full">Request a quotation</Button> : null}
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
  const [instrument, setInstrument] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [area, setArea] = useState<LocationArea>(session?.location ?? "HK Island");
  const [whatsapp, setWhatsapp] = useState(session?.whatsapp ?? "");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back />
      <p className="cue-kicker mt-2 text-xs text-muted">Inner Soul studio</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">Music lessons</h1>
      {sent ? <p className="mt-5 text-sm text-muted">Enquiry received.</p> : (
        <NeedAccount>
          {(ok) => (
            <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (!ok) return; submitEnquiry(`Lesson enquiry \u2014 ${instrument}`, message.trim() || `${level} ${instrument}`, { Name: name, Instrument: instrument, Level: level, Location: area, WhatsApp: whatsapp }); setSent(true); }}>
              <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} required /></Field>
              <Field label="Instrument / voice"><TextInput value={instrument} onChange={(e) => setInstrument(e.target.value)} required /></Field>
              <Field label="Level"><SelectInput value={level} onChange={(e) => setLevel(e.target.value)}>{["Beginner", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}</SelectInput></Field>
              <Field label="Location"><SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</SelectInput></Field>
              <Field label="WhatsApp number"><TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required /></Field>
              <Field label="Message"><AreaInput rows={4} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
              {ok ? <Button type="submit" className="w-full">Send enquiry</Button> : null}
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
  const [kind, setKind] = useState("Concert ukulele");
  const [woods, setWoods] = useState("");
  const [budget, setBudget] = useState("");
  const [whatsapp, setWhatsapp] = useState(session?.whatsapp ?? "");
  const [brief, setBrief] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="cue-enter px-5 pb-10 pt-3">
      <Back onBack={onBack} />
      <p className="cue-kicker mt-2 text-xs text-muted">Workshop</p>
      <h1 className="cue-name mt-1 font-display text-3xl leading-none">Custom instruments</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Inner Soul builds small-body instruments to order \u2014 mostly ukuleles.</p>
      {sent ? <p className="mt-5 text-sm text-muted">Build request filed. We\u2019ll write on WhatsApp.</p> : (
        <NeedAccount>
          {(ok) => (
            <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); if (!ok) return; submitEnquiry(`Custom instrument \u2014 ${kind}`, brief.trim() || `${kind}. ${woods}`.trim(), { Name: name, Build: kind, Woods: woods, Budget: budget, WhatsApp: whatsapp }); setSent(true); }}>
              <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} required /></Field>
              <Field label="Instrument"><SelectInput value={kind} onChange={(e) => setKind(e.target.value)}>{["Soprano ukulele", "Concert ukulele", "Tenor ukulele", "Baritone ukulele", "Parlor guitar", "Other"].map((k) => <option key={k}>{k}</option>)}</SelectInput></Field>
              <Field label="Woods / look"><TextInput value={woods} onChange={(e) => setWoods(e.target.value)} /></Field>
              <Field label="Budget"><TextInput value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$2,000\u2013$4,000" /></Field>
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

function InstrumentShop({ onBack }: { onBack?: () => void }) {
  const [picked, setPicked] = useState<ShopInstrument | null>(null);
  return (
    <div className="cue-enter pb-10 pt-3">
      <div className="px-5">
        <Back onBack={onBack} />
        <p className="cue-kicker mt-2 text-xs text-muted">Inner Soul Instruments</p>
        <h1 className="cue-name mt-1 font-display text-3xl leading-none">The shop</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Mostly ukuleles. Enquire on one and we\u2019ll hold it.</p>
      </div>
      <ul className="mt-5">
        {INNER_SOUL_INSTRUMENTS.map((item) => (
          <li key={item.id} className="border-t border-line">
            <button type="button" onClick={() => setPicked(item)} className="flex w-full gap-3 px-5 py-4 text-left">
              <img src={item.photo} alt="" className="size-16 shrink-0 rounded-md object-cover" />
              <span className="min-w-0 flex-1">
                <span className="cue-kicker block text-xs text-accent">{item.kind}</span>
                <span className="mt-1 block font-medium">{item.name}</span>
                <span className="mt-1 block text-sm text-muted">{item.woods}</span>
              </span>
              <span className="shrink-0 font-display text-lg text-accent">{item.price}</span>
            </button>
          </li>
        ))}
      </ul>
      {picked ? <ShopEnquire item={picked} onClose={() => setPicked(null)} /> : null}
    </div>
  );
}

function ShopEnquire({ item, onClose }: { item: ShopInstrument; onClose: () => void }) {
  const session = useCue((s) => currentAccount(s));
  const submitEnquiry = useCue((s) => s.submitEnquiry);
  const setGate = useCue((s) => s.setGate);
  const [whatsapp, setWhatsapp] = useState(session?.whatsapp ?? "");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-24 sm:items-center">
      <button type="button" className="absolute inset-0 bg-ink/45" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-y-auto bg-bg px-5 pb-8 pt-5">
        <p className="cue-kicker text-xs text-muted">{item.kind}</p>
        <h2 className="cue-name mt-1 font-display text-3xl leading-none">{item.name}</h2>
        <img src={item.photo} alt="" className="mt-4 h-40 w-full rounded-md object-cover" />
        <p className="mt-3 font-display text-2xl text-accent">{item.price}</p>
        <p className="mt-2 text-sm text-muted">{item.woods}</p>
        <p className="mt-2 text-sm leading-6 text-fg">{item.blurb}</p>
        {sent ? <p className="mt-5 text-sm text-muted">Enquiry sent.</p> : session ? (
          <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); submitEnquiry(`Shop \u2014 ${item.name}`, note.trim() || item.blurb, { Instrument: item.name, Kind: item.kind, Price: item.price, WhatsApp: whatsapp, From: session.name }); setSent(true); }}>
            <Field label="WhatsApp number"><TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required /></Field>
            <Field label="Note"><AreaInput rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <Button type="submit" className="w-full">Enquire</Button>
          </form>
        ) : (
          <Button className="mt-5 w-full" onClick={() => setGate("register")}>Register to enquire</Button>
        )}
        <Button variant="ghost" className="mt-2 w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
