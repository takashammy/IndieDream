import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { dismissInstall, installDismissed, isIosSafari, isStandalone } from "@/lib/pwa";
import { Sheet } from "./chrome";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function OfflineBanner() {
  const t = useT();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;
  return (
    <div className="border-b border-line bg-elevated px-5 py-2 text-center text-sm text-muted">
      {t("offlineBanner")}
    </div>
  );
}

export function InstallBanner() {
  const t = useT();
  const [ready, setReady] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosOpen, setIosOpen] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone() || installDismissed()) {
      setHidden(true);
      return;
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const wait = window.setTimeout(() => setReady(true), 2400);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.clearTimeout(wait);
    };
  }, []);

  useEffect(() => {
    if (!ready || isStandalone() || installDismissed()) {
      setHidden(true);
      return;
    }
    setHidden(!(promptEvent || isIosSafari()));
  }, [ready, promptEvent]);

  function closeBanner() {
    dismissInstall();
    setHidden(true);
    setIosOpen(false);
  }

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") closeBanner();
      setPromptEvent(null);
      return;
    }
    setIosOpen(true);
  }

  return (
    <>
      {hidden ? null : (
        <div className="border-t border-line bg-bg px-5 py-3">
          <p className="cue-name font-display text-xl leading-tight">{t("installApp")}</p>
          <p className="mt-1 text-sm leading-5 text-muted">{t("installHint", { app: APP_NAME })}</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" className="flex-1" onClick={() => void install()}>
              {promptEvent ? t("installAction") : t("installHow")}
            </Button>
            <Button type="button" variant="ghost" className="flex-1" onClick={closeBanner}>
              {t("installDismiss")}
            </Button>
          </div>
        </div>
      )}
      {iosOpen ? (
        <Sheet title={t("installIosTitle")} kicker={APP_NAME} onClose={() => setIosOpen(false)}>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-fg">
            <li>{t("installIos1")}</li>
            <li>{t("installIos2")}</li>
            <li>{t("installIos3")}</li>
          </ol>
          <Button type="button" className="mt-6 w-full" onClick={() => setIosOpen(false)}>
            {t("close")}
          </Button>
        </Sheet>
      ) : null}
    </>
  );
}
