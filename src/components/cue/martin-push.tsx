import { useEffect, useState } from "react";
import { currentAccount, useCue } from "@/lib/store";
import { isMartinAccount } from "@/lib/martin";
import { armMartinPush } from "@/lib/pwa";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function MartinPushCard() {
  const acc = useCue((s) => currentAccount(s));
  const t = useT();
  const [status, setStatus] = useState<"idle" | "on" | "denied" | "unsupported" | "need-install" | "error">("idle");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isMartinAccount(acc)) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      void armMartinPush().then((next) => {
        if (next === "on") setStatus("on");
      });
    }
  }, [acc]);

  if (!isMartinAccount(acc)) return null;

  async function on() {
    setBusy(true);
    const next = await armMartinPush();
    setStatus(next);
    setBusy(false);
  }

  const note =
    status === "on"
      ? t("alertsOn")
      : status === "denied"
        ? t("alertsDenied")
        : status === "need-install"
          ? t("alertsNeedInstall")
          : status === "unsupported"
            ? t("alertsUnsupported")
            : status === "error"
              ? t("alertsError")
              : t("signupAlerts");

  return (
    <div className="mx-5 mt-6 rounded-md border border-line bg-elevated px-4 py-3">
      <p className="text-sm leading-6 text-muted">{note}</p>
      {status === "on" ? null : (
        <Button type="button" className="mt-3 w-full" disabled={busy} onClick={() => void on()}>
          {busy ? t("saving") : t("turnOnAlerts")}
        </Button>
      )}
    </div>
  );
}
