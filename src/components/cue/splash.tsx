import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const HOLD_MS = 1800;
const FADE_MS = 450;
const SEEN_KEY = "cue-splash-seen";

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function Splash() {
  const t = useT();
  const [phase, setPhase] = useState<"in" | "out" | "gone">(() => (alreadySeen() ? "gone" : "in"));

  useEffect(() => {
    if (alreadySeen()) {
      setPhase("gone");
      return;
    }
    markSeen();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduce ? 400 : HOLD_MS;
    const fade = reduce ? 1 : FADE_MS;
    const out = window.setTimeout(() => setPhase("out"), hold);
    const gone = window.setTimeout(() => setPhase("gone"), hold + fade);
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
        "fixed inset-0 z-[80] flex flex-col items-center justify-center px-8 text-[#f3eadb] transition-opacity duration-500 ease-out",
        phase === "out" && "pointer-events-none opacity-0",
      )}
      style={{ backgroundColor: "#1c1612" }}
    >
      <p className="cue-name splash-line font-display text-5xl leading-none tracking-tight sm:text-6xl">
        {APP_NAME}
      </p>
      <div className="splash-line splash-line-2 mt-12 flex flex-col items-center">
        <p className="cue-kicker text-xs text-[#f3eadb]/55">{t("poweredBy")}</p>
        <img
          src="/media/inner-soul-logo.png"
          alt="Inner Soul Records"
          width={1047}
          height={789}
          className="brand-mark mt-5 w-full max-w-52"
        />
      </div>
    </div>
  );
}
