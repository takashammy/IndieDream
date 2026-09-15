import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/data";
import { useCue } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const HOLD_MS = 1800;
const FADE_MS = 450;

export function Splash() {
  const t = useT();
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const goHome = () => useCue.getState().setTab("home");
    goHome();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduce ? 1200 : HOLD_MS;
    const fade = reduce ? 1 : FADE_MS;
    const out = window.setTimeout(() => setPhase("out"), hold);
    const gone = window.setTimeout(() => {
      goHome();
      setPhase("gone");
    }, hold + fade);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      role="dialog"
      aria-label={APP_NAME}
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-[80] flex flex-col items-center justify-center bg-ink px-8 text-bg transition-opacity duration-500 ease-out",
        phase === "out" && "pointer-events-none opacity-0",
      )}
    >
      <p className="cue-name splash-line font-display text-5xl leading-none tracking-tight sm:text-6xl">
        {APP_NAME}
      </p>
      <div className="splash-line splash-line-2 mt-12 flex flex-col items-center">
        <p className="cue-kicker text-xs text-bg/55">{t("poweredBy")}</p>
        <img
          src="/media/inner-soul-logo.png"
          alt="Inner Soul Records"
          width={1047}
          height={789}
          className="brand-mark mt-5 w-full max-w-72"
        />
      </div>
    </div>
  );
}
