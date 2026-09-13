import { useRef, useState, type ChangeEvent } from "react";
import { GENRE_OPTIONS, KIND_LABEL, LOCATIONS, claimsISR, type LocationArea } from "@/lib/data";
import { currentAccount, useCue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AreaInput, Field, PhotoPick, ScreenHead, SelectInput, Sheet, TextInput } from "./chrome";
import { AdminMe } from "./admin";
import { audioLimitCopy, inspectAudioFile } from "@/lib/audio-limits";
import { ArtistMe } from "./artist-me";

function AudioLimitWarn({ reasons, onClose }: { reasons: string[]; onClose: () => void }) {
  return (
    <Sheet title="This file is over the limit" kicker="Upload" onClose={onClose}>
      <p className="text-sm leading-6 text-muted">Indie Dream only takes streaming copies — 128 kbps or 5 MB, whichever comes first.</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-fg">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      <button type="button" className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-accent text-sm text-accent-fg" onClick={onClose}>Choose another file</button>
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
          <p className="text-sm leading-6 text-muted">Guests can browse the catalogue. Listening, the board, events, and services need an account.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button className="w-full" onClick={() => setMeMode("register")}>Register</Button>
            <Button variant="ghost" className="w-full" onClick={() => setMeMode("login")}>Log in</Button>
            <Button variant="ghost" className="w-full" onClick={() => setMeMode("reset")}>Forgot password?</Button>
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
    <form className="cue-enter px-5 pb-10 pt-5" onSubmit={(e) => { e.preventDefault(); setError(login(username, password)); }}>
      <p className="cue-kicker text-xs text-muted">Account</p>
      <h1 className="cue-name mt-1 font-display text-4xl leading-none">Log in</h1>
      <div className="mt-6 space-y-3">
        <Field label="Username"><TextInput value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></Field>
        <Field label="Password"><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
      </div>
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
      <Button type="submit" className="mt-5 w-full">Enter</Button>
      <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setMeMode("reset")}>Forgot password?</Button>
      <button type="button" className="mt-3 w-full text-center text-sm text-muted" onClick={() => setMeMode("register")}>Need an account? Register</button>
      <p className="mt-8 text-xs leading-5 text-subtle">Preview — admin / inner-soul. Verified artist — mei / melody. Explorer — patrice / patrice.</p>
    </form>
  );
}

function ResetForm() {
  const resetPassword = useCue((s) => s.resetPassword);
  const setMeMode = useCue((s) => s.setMeMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  return (
    <form className="cue-enter px-5 pb-10 pt-5" onSubmit={(e) => { e.preventDefault(); if (password !== confirm) { setError("Passwords do not match."); return; } const err = resetPassword(email, password); if (err) { setError(err); return; } setError(null); setDone(true); }}>
      <p className="cue-kicker text-xs text-muted">Account</p>
      <h1 className="cue-name mt-1 font-display text-4xl leading-none">Reset password</h1>
      {done ? (<div className="mt-6"><p className="text-sm leading-6 text-muted">Password updated. Log in with your username and the new password.</p><Button type="button" className="mt-5 w-full" onClick={() => setMeMode("login")}>Back to log in</Button></div>) : (<><p className="mt-3 text-sm leading-6 text-muted">Enter the email on the account, then choose a new password.</p><div className="mt-6 space-y-3"><Field label="Email"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field><Field label="New password"><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /></Field><Field label="Confirm password"><TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></Field></div>{error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}<Button type="submit" className="mt-5 w-full">Save new password</Button><button type="button" className="mt-4 w-full text-center text-sm text-muted" onClick={() => setMeMode("login")}>Back to log in</button></>)}
    </form>
  );
}

function RegisterForm() {
  const register = useCue((s) => s.register);
  const setMeMode = useCue((s) => s.setMeMode);
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<"artist" | "explorer" | "business">("explorer");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState<LocationArea>("HK Island");
  const [genre, setGenre] = useState(GENRE_OPTIONS[0]);
  const [label, setLabel] = useState("");
  const [bio, setBio] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitWarn, setLimitWarn] = useState<string[] | null>(null);
  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const check = await inspectAudioFile(file);
    if (!check.ok) { setFileName(null); setLimitWarn(check.reasons); return; }
    setLimitWarn(null); setError(null); setFileName(file.name);
    if (!trackTitle.trim()) setTrackTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  }
  return (
    <form className="cue-enter px-5 pb-12 pt-5" onSubmit={(e) => { e.preventDefault(); if (kind === "artist" && !fileName) { setError("Upload one track at 128 kbps or under 5 MB."); return; } setError(register({ username, password, email, kind, name, role, location, genre, label, bio, trackTitle: kind === "artist" ? trackTitle : undefined })); }}>
      <p className="cue-kicker text-xs text-muted">Account</p>
      <h1 className="cue-name mt-1 font-display text-4xl leading-none">Register</h1>
      <div className="mt-6 space-y-4">
        <Field label="Username"><TextInput value={username} onChange={(e) => setUsername(e.target.value)} required /></Field>
        <Field label="Password"><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
        <Field label="Email"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="I am a"><SelectInput value={kind} onChange={(e) => setKind(e.target.value as "artist" | "explorer" | "business")}><option value="artist">Artist</option><option value="explorer">Explorer</option><option value="business">Business</option></SelectInput></Field>
        <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        {kind === "artist" ? <Field label="Role"><TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="Vocalist, drummer, producer…" required /></Field> : null}
        <Field label="Location"><SelectInput value={location} onChange={(e) => setLocation(e.target.value as LocationArea)}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</SelectInput></Field>
        {kind === "artist" ? (<><Field label="Genre"><SelectInput value={genre} onChange={(e) => setGenre(e.target.value)}>{GENRE_OPTIONS.map((g) => <option key={g}>{g}</option>)}</SelectInput></Field><Field label="Label"><TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Independent" /></Field>{claimsISR(label) ? <p className="text-sm italic text-accent">Inner Soul Records is assigned after review.</p> : null}</>) : null}
        <Field label="Bio / About me"><AreaInput rows={4} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
        {kind === "artist" ? (<div><p className="text-xs text-muted">Track upload — audio only</p><TextInput className="mt-2" value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)} placeholder="Track title" /><input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onFile} /><button type="button" onClick={() => fileRef.current?.click()} className="mt-2 flex h-11 w-full items-center justify-center truncate rounded-md bg-elevated px-3 text-sm">{fileName ?? "Choose audio file"}</button></div>) : null}
        {limitWarn ? <AudioLimitWarn reasons={limitWarn} onClose={() => setLimitWarn(null)} /> : null}
      </div>
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
      <Button type="submit" className="mt-5 w-full">Create account</Button>
      <button type="button" className="mt-4 w-full text-center text-sm text-muted" onClick={() => setMeMode("login")}>Already registered? Log in</button>
    </form>
  );
}

function PlainMe() {
  const acc = useCue((s) => currentAccount(s))!;
  const saveAccountProfile = useCue((s) => s.saveAccountProfile);
  const setProfilePhoto = useCue((s) => s.setProfilePhoto);
  const logout = useCue((s) => s.logout);
  const [bio, setBio] = useState(acc.bio);
  const [location, setLocation] = useState<LocationArea>(acc.location);
  const [email, setEmail] = useState(acc.email);
  const [whatsapp, setWhatsapp] = useState(acc.whatsapp);
  const [saved, setSaved] = useState(false);
  return (
    <div className="cue-enter pb-12">
      <ScreenHead kicker="You" title="Profile" note={acc.kind === "business" ? KIND_LABEL.business : KIND_LABEL.explorer} />
      <div className="flex items-end gap-4 px-5">
        <PhotoPick src={acc.photo} label="Change profile picture" className="size-20 shrink-0" onChange={setProfilePhoto} />
        <div className="min-w-0"><p className="cue-name font-display text-2xl leading-tight">{acc.name}</p><p className="text-sm text-muted">@{acc.username}</p></div>
      </div>
      <form className="mt-6 space-y-3 px-5" onSubmit={(e) => { e.preventDefault(); saveAccountProfile({ bio, location, email, whatsapp }); setSaved(true); window.setTimeout(() => setSaved(false), 1600); }}>
        <Field label="Location"><SelectInput value={location} onChange={(e) => setLocation(e.target.value as LocationArea)}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</SelectInput></Field>
        <Field label="Bio / About me"><AreaInput rows={4} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
        <Field label="Email"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="WhatsApp number"><TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
        <Button type="submit" className="w-full">{saved ? "Saved" : "Save details"}</Button>
      </form>
      <div className="px-5 pt-8"><Button variant="ghost" className="w-full" onClick={logout}>Log out</Button></div>
    </div>
  );
}
