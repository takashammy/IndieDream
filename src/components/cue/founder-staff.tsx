import { useState } from "react";
import { installFounderStaff } from "@/lib/cue-founders";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "./chrome";
import { useT } from "@/lib/i18n";

export function FounderStaffForm() {
  const t = useT();
  const [martinEmail, setMartinEmail] = useState("");
  const [martinPassword, setMartinPassword] = useState("");
  const [sinlamEmail, setSinlamEmail] = useState("");
  const [sinlamPassword, setSinlamPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (done) {
    return (
      <section className="mt-8 px-5">
        <p className="cue-kicker text-xs text-muted">{t("staff")}</p>
        <h2 className="cue-name font-display text-2xl leading-none">{t("staffReady")}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{t("staffReadyBody")}</p>
      </section>
    );
  }

  return (
    <section className="mt-8 px-5">
      <p className="cue-kicker text-xs text-muted">{t("staff")}</p>
      <h2 className="cue-name font-display text-2xl leading-none">{t("addMartinSin")}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{t("addMartinSinBody")}</p>
      <form
        className="mt-5 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const res = await installFounderStaff({
              data: { martinEmail, martinPassword, sinlamEmail, sinlamPassword },
            });
            if (!res.ok) {
              setError(res.error);
              setBusy(false);
              return;
            }
            setDone(true);
          } catch {
            setError(t("couldNotReach"));
          }
          setBusy(false);
        }}
      >
        <div className="rounded-lg bg-surface p-4">
          <p className="font-medium">Martin Sham · @martin</p>
          <div className="mt-3 space-y-3">
            <Field label={t("email")}>
              <TextInput type="email" value={martinEmail} onChange={(e) => setMartinEmail(e.target.value)} required />
            </Field>
            <Field label={t("password8")}>
              <TextInput type="password" value={martinPassword} onChange={(e) => setMartinPassword(e.target.value)} autoComplete="new-password" required />
            </Field>
          </div>
        </div>
        <div className="rounded-lg bg-surface p-4">
          <p className="font-medium">Sin Lam · @sinlam</p>
          <div className="mt-3 space-y-3">
            <Field label={t("email")}>
              <TextInput type="email" value={sinlamEmail} onChange={(e) => setSinlamEmail(e.target.value)} required />
            </Field>
            <Field label={t("password8")}>
              <TextInput type="password" value={sinlamPassword} onChange={(e) => setSinlamPassword(e.target.value)} autoComplete="new-password" required />
            </Field>
          </div>
        </div>
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t("saving") : t("createBothStaff")}
        </Button>
      </form>
    </section>
  );
}
