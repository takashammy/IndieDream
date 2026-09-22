import { useLayoutEffect, useState } from "react";
import { INNER_SOUL_INSTRUMENTS, type ShopInstrument } from "@/lib/instruments";
import { currentAccount, useCue } from "@/lib/store";
import { scrollMainToTop } from "@/lib/scroll-main";
import { Button } from "@/components/ui/button";
import { AreaInput, Field, SelectInput, Sheet, TextInput } from "./chrome";
import { useT } from "@/lib/i18n";

export function InstrumentShop({ onBack }: { onBack?: () => void }) {
  const openService = useCue((s) => s.openService);
  const [picked, setPicked] = useState<ShopInstrument | null>(null);
  const t = useT();
  useLayoutEffect(() => { scrollMainToTop(); }, []);
  return (
    <div className="cue-enter pb-10">
      <div className="px-5 pt-3">
        <button type="button" onClick={() => (onBack ? onBack() : openService(null))} className="-ml-2 flex h-11 items-center gap-1 text-sm text-muted">
          {t("backServices")}
        </button>
        <p className="cue-kicker mt-2 text-xs text-muted">{t("cardShopTitle")}</p>
        <h1 className="cue-name mt-1 font-display text-3xl leading-none">{t("theShop")}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{t("shopIntro")}</p>
      </div>
      {INNER_SOUL_INSTRUMENTS.length === 0 ? (
        <p className="mt-8 px-5 text-sm leading-6 text-muted">{t("shopEmpty")}</p>
      ) : (
      <div className="mt-5 grid grid-cols-2 items-stretch gap-px bg-line">
        {INNER_SOUL_INSTRUMENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPicked(item)}
            className="flex h-full flex-col bg-bg text-left"
          >
            <div className="aspect-[3/4] shrink-0 overflow-hidden bg-surface">
              <img src={item.photo} alt="" className="size-full object-contain" />
            </div>
            <div className="flex min-h-[7.5rem] flex-1 flex-col p-3">
              <p className="cue-kicker line-clamp-1 text-xs text-accent">{item.series ?? item.kind}</p>
              <p className="cue-name mt-1 line-clamp-2 min-h-[2.5rem] font-display text-xl leading-tight">{item.name}</p>
              {item.colours?.length ? (
                <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs leading-4 text-muted">{item.colours.join(" · ")}</p>
              ) : item.woods ? (
                <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs italic leading-4 text-muted">{item.woods}</p>
              ) : (
                <p className="mt-1 min-h-[2rem]" aria-hidden />
              )}
              <p className="mt-auto pt-2 font-display text-lg text-accent">{item.price}</p>
            </div>
          </button>
        ))}
      </div>
      )}
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
  const [colour, setColour] = useState(item.colours?.[0] ?? "");
  const [sent, setSent] = useState(false);
  const t = useT();
  const colours = item.colours ?? [];
  return (
    <Sheet title={item.name} kicker={item.series ?? item.kind} onClose={onClose}>
        <img
          src={item.photo}
          alt=""
          className="mx-auto block max-h-[min(70vh,28rem)] w-full rounded-md object-contain"
        />
        <p className="mt-3 font-display text-2xl text-accent">{item.price}</p>
        {item.series ? <p className="mt-2 text-sm text-muted">{item.series}</p> : null}
        {colours.length ? (
          <p className="mt-1 text-sm text-muted">{t("colours")}: {colours.join(" · ")}</p>
        ) : item.woods ? (
          <p className="mt-2 text-sm text-muted">{item.woods}</p>
        ) : null}
        <p className="mt-2 text-sm leading-6 text-fg">{item.blurb}</p>
        {sent ? (
          <p className="mt-5 text-sm text-muted">{t("enquirySent")}</p>
        ) : session ? (
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submitEnquiry(`Shop — ${item.name}`, note.trim() || item.blurb, {
                Instrument: item.name,
                Kind: item.kind,
                ...(item.series ? { Series: item.series } : {}),
                ...(colour ? { Colour: colour } : {}),
                Price: item.price,
                WhatsApp: whatsapp,
                From: session.name,
              });
              setSent(true);
            }}
          >
            {colours.length ? (
              <Field label={t("colour")}>
                <SelectInput value={colour} onChange={(e) => setColour(e.target.value)} required>
                  {colours.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </SelectInput>
              </Field>
            ) : null}
            <Field label={t("whatsapp")}>
              <TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
            </Field>
            <Field label={t("note")}>
              <AreaInput rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Button type="submit" className="w-full">{t("enquire")}</Button>
          </form>
        ) : (
          <Button className="mt-5 w-full" onClick={() => setGate("register")}>{t("registerEnquire")}</Button>
        )}
        <Button variant="ghost" className="mt-2 w-full" onClick={onClose}>{t("close")}</Button>
    </Sheet>
  );
}
