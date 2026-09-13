import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  GENRE_OPTIONS,
  ISR_LABEL,
  KIND_LABEL,
  LOCATIONS,
  claimsISR,
  type LocationArea,
  type Song,
} from "@/lib/data";
import { currentAccount, currentArtist, useCue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AreaInput, Field, PhotoPick, ScreenHead, SelectInput, Sheet, TextInput, VerifiedMark } from "./chrome";
import { AdminMe } from "./admin";
import { audioLimitCopy, inspectAudioFile } from "@/lib/audio-limits";

function AudioLimitWarn({
  reasons,
  onClose,
}: {
  reasons: string[];
  onClose: () => void;
}) {
  return (
    <Sheet title="This file is over the limit" kicker="Upload" onClose={onClose}>
      <p className="text-sm leading-6 text-muted">
        Indie Dream only takes streaming copies — 128 kbps or 5 MB, whichever comes first.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-fg">
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-6 text-muted">
        Export an MP3 at 128 kbps and try again. Keep the master for yourself.
      </p>
      <button
        type="button"
        className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-accent text-sm text-accent-fg"
        onClick={onClose}
      >
        Choose another file
      </button>
    </Sheet>
  );
}

export function MeScreen() {
  const session = useCue((s) => currentAccount(s));
  const meMode = useCue((s) => s.meMode);
  const setMeMode = useCue((s) => s.setMeMode);

  if (!session) {
    if (meMode === "register") return <RegisterForm />;
    if (meMode === "login") return <LoginForm />;
    if (meMode === "reset") return <ResetForm />;
    return (
      <div className="cue-enter pb-10">
        <ScreenHead kicker="You" title="Account" note="Guest" />
        <div className="px-5">
          <p className="text-sm leading-6 text-muted">
            Guests can browse the catalogue. Listening, the board, events, and services need an account.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button className="w-full" onClick={() => setMeMode("register")}>
              Register
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setMeMode("login")}>
              Log in
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setMeMode("reset")}>
              Forgot password?
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (session.kind === "admin") return <AdminMe />;
  if (session.kind === "artist") return <ArtistMe />;
  return <PlainMe />;
}

function LoginForm() {
  const login = useCue((s) => s.login);
  const setMeMode = useCue((s) => s.setMeMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="cue-enter px-5 pb-10 pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(login(username, password));
      }}
    >
      <p className="cue-kicker text-xs text-muted">Account</p>
      <h1 className="cue-name mt-1 font-display text-4xl leading-none">Log in</h1>
      <div className="mt-6 space-y-3">
        <Field label="Username">
          <TextInput value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
      </div>
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
      <Button type="submit" className="mt-5 w-full">
        Enter
      </Button>
      <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setMeMode("reset")}>
        Forgot password?
      </Button>
      <button
        type="button"
        className="mt-3 w-full text-center text-sm text-muted"
        onClick={() => setMeMode("register")}
      >
        Need an account? Register
      </button>
      <p className="mt-8 text-xs leading-5 text-subtle">
        Preview — admin / inner-soul. Verified artist — mei / melody. Explorer — patrice / patrice.
      </p>
    </form>
  );
}
