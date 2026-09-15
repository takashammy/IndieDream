import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { APP_NAME, GENRE_OPTIONS, LOCATIONS, type LocationArea } from "@/lib/data";
import { currentAccount, useCue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AreaInput, Confirm, Field, PhotoPick, ScreenHead, SelectInput, Sheet, TextInput } from "./chrome";
import { AdminMe } from "./admin";
import { AUDIO_PICK_ACCEPT, inspectAudioFile } from "@/lib/audio-limits";
import { ArtistMe } from "./artist-me";
import { LanguageToggle } from "./language-toggle";
import {
  audioReason,
  genreLabel,
  kindLabel,
  locationLabel,
  storeErr,
  useLocale,
  useT,
} from "@/lib/i18n";

function AudioLimitWarn({ reasons, onClose }: { reasons: string[]; onClose: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  return (
    <Sheet title={t("fileOverLimit")} kicker={t("upload")} onClose={onClose}>
      <p className="text-sm leading-6 text-muted">{t("mp3Only5", { app: APP_NAME })}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-fg">
        {reasons.map((r) => (
          <li key={r}>{audioReason(locale, r)}</li>
        ))}
      </ul>
      <button type="button" className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-accent text-sm text-accent-fg" onClick={onClose}>
        {t("chooseAnother")}
      </button>
    </Sheet>
  );
}

export function MeScreen() {
  const session = useCue((s) => currentAccount(s));
  const meMode = useCue((s) => s.meMode);
  const setMeMode = useCue((s) => s.setMeMode);
  const t = useT();

  let body: ReactNode;
  if (!session) {
    if (meMode === "register") body = <RegisterForm />;
    else if (meMode === "login") body = <LoginForm />;
    else if (meMode === "reset") body = <ResetForm />;
    else {
      body = (
        <div className="cue-enter pb-10">
          <ScreenHead kicker={t("you")} title={t("account")} note={t("guest")} />
          <div className="px-5">
            <p className="text-sm leading-6 text-muted">{t("guestBrowse")}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Button className="w-full" onClick={() => setMeMode("register")}>{t("register")}</Button>
              <Button variant="ghost" className="w-full" onClick={() => setMeMode("login")}>{t("logIn")}</Button>
              <Button variant="ghost" className="w-full" onClick={() => setMeMode("reset")}>{t("forgotPassword")}</Button>
            </div>
            <LanguageToggle className="mt-8 px-0 pt-0" />
          </div>
        </div>
      );
    }
  } else if (session.kind === "admin") {
    body = <AdminMe artistPanel={session.artistId ? <ArtistMe embedded /> : null} />;
  } else if (session.kind === "artist") {
    body = <ArtistMe />;
  } else {
    body = <PlainMe />;
  }

  return body;
}

function LoginForm() {
  const login = useCue((s) => s.login);
  const setMeMode = useCue((s) => s.setMeMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  const { locale } = useLocale();
  return (
    <form className="cue-enter px-5 pb-10 pt-5" onSubmit={(e) => { e.preventDefault(); setError(login(username, password)); }}>
      <p className="cue-kicker text-xs text-muted">{t("account")}</p>
      <h1 className="cue-name mt-1 font-display text-4xl leading-none">{t("logIn")}</h1>
      <div className="mt-6 space-y-3">
        <Field label={t("username")}><TextInput value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></Field>
        <Field label={t("password")}><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
      </div>
      {error ? <p className="mt-3 text-sm text-accent">{storeErr(locale, error)}</p> : null}
      <Button type="submit" className="mt-5 w-full">{t("enter")}</Button>
      <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setMeMode("reset")}>{t("forgotPassword")}</Button>
      <button type="button" className="mt-3 w-full text-center text-sm text-muted" onClick={() => setMeMode("register")}>{t("needAccount")}</button>
      <LanguageToggle className="mt-8 px-0 pt-0" />
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
  const t = useT();
  const { locale } = useLocale();
  return (
    <form
      className="cue-enter px-5 pb-10 pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== confirm) {
          setError("mismatch");
          return;
        }
        const err = resetPassword(email, password);
        if (err) {
          setError(err);
          return;
        }
        setError(null);
        setDone(true);
      }}
    >
      <p className="cue-kicker text-xs text-muted">{t("account")}</p>
      <h1 className="cue-name mt-1 font-display text-4xl leading-none">{t("resetPassword")}</h1>
      {done ? (
        <div className="mt-6">
          <p className="text-sm leading-6 text-muted">{t("passwordUpdated")}</p>
          <Button type="button" className="mt-5 w-full" onClick={() => setMeMode("login")}>{t("backToLogin")}</Button>
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-muted">{t("resetHint")}</p>
          <div className="mt-6 space-y-3">
            <Field label={t("email")}><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
            <Field label={t("newPassword")}><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /></Field>
            <Field label={t("confirmPassword")}><TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></Field>
          </div>
          {error ? <p className="mt-3 text-sm text-accent">{error === "mismatch" ? t("passwordsMismatch") : storeErr(locale, error)}</p> : null}
          <Button type="submit" className="mt-5 w-full">{t("saveNewPassword")}</Button>
          <button type="button" className="mt-4 w-full text-center text-sm text-muted" onClick={() => setMeMode("login")}>{t("backToLogin")}</button>
        </>
      )}
      <LanguageToggle className="mt-8 px-0 pt-0" />
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
  const [termsOpen, setTermsOpen] = useState(false);
  const t = useT();
  const { locale } = useLocale();
  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const check = await inspectAudioFile(file);
    if (!check.ok) { setFileName(null); setLimitWarn(check.reasons); return; }
    setLimitWarn(null); setError(null); setFileName(file.name);
    if (!trackTitle.trim()) setTrackTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  }
  function submitRegister() {
    if (kind === "artist" && !fileName) {
      setError("upload-mp3");
      return;
    }
    setError(register({ username, password, email, kind, name, role, location, genre, label, bio, trackTitle: kind === "artist" ? trackTitle : undefined }));
  }
  return (
    <form className="cue-enter px-5 pb-12 pt-5" onSubmit={(e) => { e.preventDefault(); if (kind === "artist") { if (!fileName) { setError("upload-mp3"); return; } setTermsOpen(true); return; } submitRegister(); }}>
      <p className="cue-kicker text-xs text-muted">{t("account")}</p>
      <h1 className="cue-name mt-1 font-display text-4xl leading-none">{t("register")}</h1>
      <div className="mt-6 space-y-4">
        <Field label={t("username")}><TextInput value={username} onChange={(e) => setUsername(e.target.value)} required /></Field>
        <Field label={t("password")}><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
        <Field label={t("email")}><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label={t("iAmA")}>
          <SelectInput value={kind} onChange={(e) => setKind(e.target.value as "artist" | "explorer" | "business")}>
            <option value="artist">{t("kindArtist")}</option>
            <option value="explorer">{t("kindExplorer")}</option>
            <option value="business">{t("kindBusiness")}</option>
          </SelectInput>
        </Field>
        <Field label={t("name")}><TextInput value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        {kind === "artist" ? <Field label={t("role")}><TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder={t("rolePlaceholder")} required /></Field> : null}
        <Field label={t("location")}>
          <SelectInput value={location} onChange={(e) => setLocation(e.target.value as LocationArea)}>
            {LOCATIONS.map((l) => <option key={l} value={l}>{locationLabel(locale, l)}</option>)}
          </SelectInput>
        </Field>
        {kind === "artist" ? (
          <>
            <Field label={t("genre")}>
              <SelectInput value={genre} onChange={(e) => setGenre(e.target.value)}>
                {GENRE_OPTIONS.map((g) => <option key={g} value={g}>{genreLabel(locale, g)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t("label")}><TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("independent")} /></Field>
            {label.trim().toLowerCase() === "inner soul records" ? <p className="text-sm italic text-accent">{t("isrPending")}</p> : null}
          </>
        ) : null}
        <Field label={t("bio")}><AreaInput rows={4} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
        {kind === "artist" ? (
          <div>
            <p className="text-xs text-muted">{t("trackUploadHint")}</p>
            <TextInput className="mt-2" value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)} placeholder={t("trackTitle")} />
            <label className="relative mt-2 flex h-11 w-full items-center justify-center overflow-hidden rounded-md bg-elevated px-3 text-sm">
              <span className="pointer-events-none truncate">{fileName ?? t("chooseMp3")}</span>
              <input ref={fileRef} type="file" accept={AUDIO_PICK_ACCEPT} className="absolute inset-0 cursor-pointer opacity-0" onChange={onFile} />
            </label>
          </div>
        ) : null}
        {limitWarn ? <AudioLimitWarn reasons={limitWarn} onClose={() => setLimitWarn(null)} /> : null}
      </div>
      {error ? <p className="mt-3 text-sm text-accent">{error === "upload-mp3" ? t("errUploadMp3") : storeErr(locale, error)}</p> : null}
      <Button type="submit" className="mt-5 w-full">{t("createAccount")}</Button>
      <button type="button" className="mt-4 w-full text-center text-sm text-muted" onClick={() => setMeMode("login")}>{t("alreadyRegistered")}</button>
      <LanguageToggle className="mt-8 px-0 pt-0" />
      {termsOpen ? (
        <Confirm
          title={t("uploadAgreement")}
          body={t("uploadTerms")}
          confirmLabel={t("agreeContinue")}
          cancelLabel={t("notNow")}
          onConfirm={submitRegister}
          onClose={() => setTermsOpen(false)}
        />
      ) : null}
    </form>
  );
}

function PlainMe() {
  const acc = useCue((s) => currentAccount(s))!;
  const saveAccountProfile = useCue((s) => s.saveAccountProfile);
  const setProfilePhoto = useCue((s) => s.setProfilePhoto);
  const logout = useCue((s) => s.logout);
  const [openDetails, setOpenDetails] = useState(false);
  const [bio, setBio] = useState(acc.bio);
  const [location, setLocation] = useState<LocationArea>(acc.location);
  const [email, setEmail] = useState(acc.email);
  const [whatsapp, setWhatsapp] = useState(acc.whatsapp);
  const [saved, setSaved] = useState(false);
  const t = useT();
  const { locale } = useLocale();
  return (
    <div className="cue-enter pb-12">
      <ScreenHead kicker={t("you")} title={t("profile")} note={kindLabel(locale, acc.kind)} />
      <div className="flex items-end gap-4 px-5">
        <PhotoPick src={acc.photo} label={t("changePhoto")} className="size-20 shrink-0" onChange={setProfilePhoto} />
        <div className="min-w-0"><p className="cue-name font-display text-2xl leading-tight">{acc.name}</p><p className="text-sm text-muted">@{acc.username}</p></div>
      </div>
      <div className="mt-6 space-y-2 px-5">
        <Button type="button" variant="outline" className="w-full" onClick={() => setOpenDetails(true)}>{t("personalInfo")}</Button>
      </div>
      {openDetails ? (
        <Sheet title={t("personalInfo")} kicker={t("profile")} onClose={() => setOpenDetails(false)}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveAccountProfile({ bio, location, email, whatsapp }); setSaved(true); window.setTimeout(() => setSaved(false), 1600); }}>
            <Field label={t("location")}>
              <SelectInput value={location} onChange={(e) => setLocation(e.target.value as LocationArea)}>
                {LOCATIONS.map((l) => <option key={l} value={l}>{locationLabel(locale, l)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t("bio")}><AreaInput rows={4} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
            <Field label={t("email")}><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label={t("whatsapp")}><TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
            <Button type="submit" className="w-full">{saved ? t("saved") : t("saveDetails")}</Button>
          </form>
        </Sheet>
      ) : null}
      <div className="px-5 pt-8">
        <LanguageToggle className="px-0 pt-0" />
        <Button variant="ghost" className="mt-4 w-full" onClick={logout}>{t("logOut")}</Button>
      </div>
    </div>
  );
}
