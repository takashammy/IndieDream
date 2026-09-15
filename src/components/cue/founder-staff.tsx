import { useState } from "react";
import { installFounderStaff } from "@/lib/cue-founders";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "./chrome";

export function FounderStaffForm() {
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
        <p className="cue-kicker text-xs text-muted">Staff</p>
        <h2 className="cue-name font-display text-2xl leading-none">Martin and Sin Lam are ready</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Log out, then sign in as <span className="text-fg">martin</span> or <span className="text-fg">sinlam</span>.
          Each login is Desk admin and a live artist.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 px-5">
      <p className="cue-kicker text-xs text-muted">Staff</p>
      <h2 className="cue-name font-display text-2xl leading-none">Add Martin and Sin Lam</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Creates two Desk admins who also have live artist pages. Usernames are fixed:
        martin and sinlam. Choose emails and passwords here — they are not stored in the repo.
      </p>
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
            setError("Could not reach the server.");
          }
          setBusy(false);
        }}
      >
        <div className="rounded-lg bg-surface p-4">
          <p className="font-medium">Martin Sham · @martin</p>
          <div className="mt-3 space-y-3">
            <Field label="Email">
              <TextInput type="email" value={martinEmail} onChange={(e) => setMartinEmail(e.target.value)} required />
            </Field>
            <Field label="Password (8+)">
              <TextInput type="password" value={martinPassword} onChange={(e) => setMartinPassword(e.target.value)} autoComplete="new-password" required />
            </Field>
          </div>
        </div>
        <div className="rounded-lg bg-surface p-4">
          <p className="font-medium">Sin Lam · @sinlam</p>
          <div className="mt-3 space-y-3">
            <Field label="Email">
              <TextInput type="email" value={sinlamEmail} onChange={(e) => setSinlamEmail(e.target.value)} required />
            </Field>
            <Field label="Password (8+)">
              <TextInput type="password" value={sinlamPassword} onChange={(e) => setSinlamPassword(e.target.value)} autoComplete="new-password" required />
            </Field>
          </div>
        </div>
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Create both staff artists"}
        </Button>
      </form>
    </section>
  );
}
