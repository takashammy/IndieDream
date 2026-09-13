import { useState } from "react";
import { INNER_SOUL_INSTRUMENTS, type ShopInstrument } from "@/lib/instruments";
import { currentAccount, useCue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AreaInput, Field, TextInput } from "./chrome";

export function InstrumentShop({ onBack }: { onBack?: () => void }) {
  const openService = useCue((s) => s.openService);
  const [picked, setPicked] = useState<ShopInstrument | null>(null);
  return (
    <div className="cue-enter pb-10 pt-3">
      <div className="px-5">
        <button type="button" onClick={() => (onBack ? onBack() : openService(null))} className="-ml-2 flex h-11 items-center gap-1 text-sm text-muted">
          ← Services
        </button>
        <p className="cue-kicker mt-2 text-xs text-muted">Inner Soul Instruments</p>
        <h1 className="cue-name mt-1 font-display text-3xl leading-none">The shop</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Mostly ukuleles. Enquire on one and we’ll hold it.</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-px bg-line">
        {INNER_SOUL_INSTRUMENTS.map((item) => (
          <button key={item.id} type="button" onClick={() => setPicked(item)} className="bg-bg p-3 text-left">
            <div className="aspect-[3/4] overflow-hidden">
              <img src={item.photo} alt="" className="size-full object-cover" />
            </div>
            <p className="mt-3 cue-kicker text-xs text-accent">{item.kind}</p>
            <p className="cue-name mt-1 font-display text-xl leading-tight">{item.name}</p>
            <p className="mt-1 text-xs italic text-muted">{item.woods}</p>
            <p className="mt-2 font-display text-lg text-accent">{item.price}</p>
          </button>
        ))}
      </div>
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
        {sent ? (
          <p className="mt-5 text-sm text-muted">Enquiry sent.</p>
        ) : session ? (
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submitEnquiry(`Shop — ${item.name}`, note.trim() || item.blurb, {
                Instrument: item.name,
                Kind: item.kind,
                Price: item.price,
                WhatsApp: whatsapp,
                From: session.name,
              });
              setSent(true);
            }}
          >
            <Field label="WhatsApp number">
              <TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
            </Field>
            <Field label="Note">
              <AreaInput rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
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
