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
      <button type="button" className="mt-3 w-full text-center text-sm text-muted" onClick={() => setMeMode("register")}>
        Need an account? Register
      </button>
      <p className="mt-8 text-xs leading-5 text-subtle">
        Preview — admin / inner-soul. Verified artist — mei / melody. Explorer — patrice / patrice.
      </p>
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
    <form
      className="cue-enter px-5 pb-10 pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== confirm) {
          setError("Passwords do not match.");
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
      <p className="cue-kicker text-xs text-muted">Account</p>
      <h1 className="cue-name mt-1 font-display text-4xl leading-none">Reset password</h1>
      {done ? (
        <div className="mt-6">
          <p className="text-sm leading-6 text-muted">
            Password updated. Log in with your username and the new password.
          </p>
          <Button type="button" className="mt-5 w-full" onClick={() => setMeMode("login")}>
            Back to log in
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-muted">
            Enter the email on the account, then choose a new password.
          </p>
          <div className="mt-6 space-y-3">
            <Field label="Email">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </Field>
            <Field label="New password">
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            </Field>
            <Field label="Confirm password">
              <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
            </Field>
          </div>
          {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
          <Button type="submit" className="mt-5 w-full">
            Save new password
          </Button>
          <button type="button" className="mt-4 w-full text-center text-sm text-muted" onClick={() => setMeMode("login")}>
            Back to log in
          </button>
        </>
      )}
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
    if (!check.ok) {
      setFileName(null);
      setLimitWarn(check.reasons);
      return;
    }
    setLimitWarn(null);
    setError(null);
    setFileName(file.name);
    if (!trackTitle.trim()) {
      setTrackTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    }
  }

  return (
    <form
      className="cue-enter px-5 pb-12 pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (kind === "artist" && !fileName) {
          setError("Upload one track at 128 kbps or under 5 MB.");
          return;
        }
        const err = register({
          username,
          password,
          email,
          kind,
          name,
          role,
          location,
          genre,
          label,
          bio,
          trackTitle: kind === "artist" ? trackTitle : undefined,
        });
        setError(err);
      }}
    >
      <p className="cue-kicker text-xs text-muted">Account</p>
      <h1 className="cue-name mt-1 font-display text-4xl leading-none">Register</h1>
      <div className="mt-6 space-y-4">
        <Field label="Username">
          <TextInput value={username} onChange={(e) => setUsername(e.target.value)} required />
        </Field>
        <Field label="Password">
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="I am a">
          <SelectInput value={kind} onChange={(e) => setKind(e.target.value as "artist" | "explorer" | "business")}>
            <option value="artist">Artist</option>
            <option value="explorer">Explorer</option>
            <option value="business">Business</option>
          </SelectInput>
        </Field>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        {kind === "artist" ? (
          <Field label="Role">
            <TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="Vocalist, drummer, producer…" required />
          </Field>
        ) : null}
        <Field label="Location">
          <SelectInput value={location} onChange={(e) => setLocation(e.target.value as LocationArea)}>
            {LOCATIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </SelectInput>
        </Field>
        {kind === "artist" ? (
          <>
            <Field label="Genre">
              <SelectInput value={genre} onChange={(e) => setGenre(e.target.value)}>
                {GENRE_OPTIONS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Label">
              <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Independent" />
            </Field>
            {claimsISR(label) ? (
              <p className="text-sm italic text-accent">
                Inner Soul Records is assigned after review. This request will be sent to admin.
              </p>
            ) : null}
          </>
        ) : null}
        <Field label="Bio / About me">
          <AreaInput rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        {kind === "artist" ? (
          <div>
            <p className="text-xs text-muted">Track upload — audio only</p>
            <TextInput className="mt-2" value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)} placeholder="Track title" />
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onFile} />
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 flex h-11 w-full items-center justify-center truncate rounded-md bg-elevated px-3 text-sm">
              {fileName ?? "Choose audio file"}
            </button>
            <p className="mt-2 text-xs italic text-subtle">
              One track is required before Inner Soul Records can verify you. {audioLimitCopy()}
            </p>
          </div>
        ) : null}
        {limitWarn ? <AudioLimitWarn reasons={limitWarn} onClose={() => setLimitWarn(null)} /> : null}
      </div>
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
      <Button type="submit" className="mt-5 w-full">
        Create account
      </Button>
      <button type="button" className="mt-4 w-full text-center text-sm text-muted" onClick={() => setMeMode("login")}>
        Already registered? Log in
      </button>
    </form>
  );
}

function ArtistMe() {
  const acc = useCue((s) => currentAccount(s))!;
  const artist = useCue((s) => currentArtist(s));
  const saveArtistProfile = useCue((s) => s.saveArtistProfile);
  const setProfilePhoto = useCue((s) => s.setProfilePhoto);
  const addPendingSong = useCue((s) => s.addPendingSong);
  const updateSongLinks = useCue((s) => s.updateSongLinks);
  const logout = useCue((s) => s.logout);
  const [name, setName] = useState(artist?.name ?? acc.name);
  const [role, setRole] = useState(artist?.role ?? acc.role);
  const [area, setArea] = useState<LocationArea>(artist?.area ?? acc.location);
  const [genre, setGenre] = useState(artist?.genres[0] ?? GENRE_OPTIONS[0]);
  const [label, setLabel] = useState(artist?.label ?? "");
  const [bio, setBio] = useState(artist?.bio ?? acc.bio);
  const [spotify, setSpotify] = useState(artist?.spotify ?? "");
  const [youtube, setYoutube] = useState(artist?.youtube ?? "");
  const [email, setEmail] = useState(acc.email);
  const [whatsapp, setWhatsapp] = useState(acc.whatsapp);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState("");
  const [trackSpotify, setTrackSpotify] = useState("");
  const [trackYoutube, setTrackYoutube] = useState("");
  const [trackCover, setTrackCover] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [limitWarn, setLimitWarn] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onSave(e: FormEvent) {
    e.preventDefault();
    saveArtistProfile({
      name,
      role,
      area,
      city: area,
      genres: [genre],
      label: label.trim() || "Independent",
      bio,
      spotify,
      youtube,
      email,
      whatsapp,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const check = await inspectAudioFile(file);
    if (!check.ok) {
      setFileName(null);
      setFileError(null);
      setLimitWarn(check.reasons);
      return;
    }
    setLimitWarn(null);
    setFileError(null);
    setFileName(file.name);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  }

  function onUpload(e: FormEvent) {
    e.preventDefault();
    const nameOf = title.trim() || fileName?.replace(/\.[^.]+$/, "") || "";
    if (!nameOf) return;
    if (!fileName) {
      setFileError("Choose an audio file first. " + audioLimitCopy());
      return;
    }
    addPendingSong(nameOf, { spotify: trackSpotify, youtube: trackYoutube, cover: trackCover ?? undefined });
    setTitle("");
    setTrackSpotify("");
    setTrackYoutube("");
    setTrackCover(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const pending = artist?.songs.filter((s) => s.status === "pending") ?? [];
  const live = artist?.songs.filter((s) => s.status === "approved") ?? [];

  return (
    <div className="cue-enter pb-12">
      <ScreenHead kicker="You" title="Profile" note={artist?.verified ? "Verified" : "Pending review"} />
      <div className="flex items-end gap-4 px-5">
        <PhotoPick src={artist?.photo ?? acc.photo} label="Change profile picture" className="size-20 shrink-0" onChange={setProfilePhoto} />
        <div className="min-w-0">
          <p className="cue-name flex items-center gap-1.5 font-display text-2xl leading-tight">
            {artist?.name ?? acc.name}
            {artist?.verified ? <VerifiedMark /> : null}
          </p>
          <p className="text-sm text-muted">
            {artist?.role} · {artist?.area}
          </p>
        </div>
      </div>

      <form onSubmit={onSave} className="mt-6 space-y-3 px-5">
        <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Role"><TextInput value={role} onChange={(e) => setRole(e.target.value)} /></Field>
        <Field label="Location">
          <SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>
            {LOCATIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Genre">
          <SelectInput value={genre} onChange={(e) => setGenre(e.target.value)}>
            {GENRE_OPTIONS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Label"><TextInput value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
        {claimsISR(label) && !artist?.labelApproved ? (
          <p className="text-sm italic text-accent">
            {ISR_LABEL} needs Inner Soul approval. New accounts cannot take the stamp themselves.
          </p>
        ) : null}
        <Field label="Bio / About me"><AreaInput rows={4} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
        <Field label="Email"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="WhatsApp number">
          <TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+852 5123 4567" />
        </Field>
        <Field label="Spotify URL">
          <TextInput type="url" value={spotify} onChange={(e) => setSpotify(e.target.value)} placeholder="https://open.spotify.com/…" />
        </Field>
        <Field label="YouTube URL">
          <TextInput type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/…" />
        </Field>
        <Button type="submit" className="w-full">{saved ? "Saved" : "Save details"}</Button>
      </form>

      <section className="mt-8 px-5">
        <h2 className="cue-kicker text-xs text-muted">Tracks</h2>
        <p className="mt-2 text-sm text-muted">
          Uploads wait for approval before they go live. {audioLimitCopy()} Cover art optional.
        </p>
        <form onSubmit={onUpload} className="mt-3 space-y-2">
          <div className="flex items-start gap-3">
            <PhotoPick src={trackCover ?? "/media/covers/vinyl.jpg"} label="Choose cover art" className="size-16 shrink-0" onChange={setTrackCover} />
            <p className="pt-1 text-xs leading-5 text-subtle">Cover art sits on your artist page, Discover, and the player.</p>
          </div>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Track title" aria-label="Track title" />
          <TextInput type="url" value={trackSpotify} onChange={(e) => setTrackSpotify(e.target.value)} placeholder="Spotify URL (optional)" />
          <TextInput type="url" value={trackYoutube} onChange={(e) => setTrackYoutube(e.target.value)} placeholder="YouTube URL (optional)" />
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onFile} />
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="flex h-11 flex-1 items-center justify-center truncate rounded-md bg-elevated px-3 text-sm">
              {fileName ?? "Choose audio file"}
            </button>
            <Button type="submit" size="md">Upload</Button>
          </div>
          {fileError ? <p className="text-sm text-accent">{fileError}</p> : null}
        </form>
        {limitWarn ? <AudioLimitWarn reasons={limitWarn} onClose={() => setLimitWarn(null)} /> : null}
        {pending.length + live.length === 0 ? (
          <p className="mt-4 text-sm text-subtle">Nothing in the queue yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {[...pending, ...live].map((song) => (
              <SongLinksRow key={song.id} song={song} onSave={(extra) => updateSongLinks(song.id, extra)} />
            ))}
          </ul>
        )}
      </section>

      <div className="px-5 pt-8">
        <Button variant="ghost" className="w-full" onClick={logout}>Log out</Button>
      </div>
    </div>
  );
}

function SongLinksRow({
  song,
  onSave,
}: {
  song: Song;
  onSave: (extra: { spotify?: string; youtube?: string; cover?: string }) => void;
}) {
  const [sp, setSp] = useState(song.spotify ?? "");
  const [yt, setYt] = useState(song.youtube ?? "");
  const dirty = sp !== (song.spotify ?? "") || yt !== (song.youtube ?? "");
  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <PhotoPick src={song.cover} label={`Change cover art for ${song.title}`} className="size-12 shrink-0" onChange={(cover) => onSave({ spotify: sp, youtube: yt, cover })} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{song.title}</p>
          <p className="text-xs text-muted">{song.status === "approved" ? "Live" : "Awaiting approval"}</p>
        </div>
        <span className="rounded-md bg-elevated px-2 py-1 text-xs uppercase tracking-wide text-muted">{song.status}</span>
      </div>
      <div className="mt-2 space-y-2">
        <TextInput type="url" value={sp} onChange={(e) => setSp(e.target.value)} placeholder="Spotify URL for this song" />
        <TextInput type="url" value={yt} onChange={(e) => setYt(e.target.value)} placeholder="YouTube URL for this song" />
        {dirty ? (
          <Button type="button" variant="subtle" size="sm" className="w-full" onClick={() => onSave({ spotify: sp, youtube: yt })}>
            Save song links
          </Button>
        ) : null}
      </div>
    </li>
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
        <div className="min-w-0">
          <p className="cue-name font-display text-2xl leading-tight">{acc.name}</p>
          <p className="text-sm text-muted">@{acc.username}</p>
        </div>
      </div>
      <form
        className="mt-6 space-y-3 px-5"
        onSubmit={(e) => {
          e.preventDefault();
          saveAccountProfile({ bio, location, email, whatsapp });
          setSaved(true);
          window.setTimeout(() => setSaved(false), 1600);
        }}
      >
        <Field label="Location">
          <SelectInput value={location} onChange={(e) => setLocation(e.target.value as LocationArea)}>
            {LOCATIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Bio / About me"><AreaInput rows={4} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
        <Field label="Email"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="WhatsApp number">
          <TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+852 5123 4567" />
        </Field>
        <Button type="submit" className="w-full">{saved ? "Saved" : "Save details"}</Button>
      </form>
      {acc.kind === "business" ? (
        <p className="mt-6 px-5 text-sm italic text-muted">Venue and company bookings live under Services.</p>
      ) : null}
      <div className="px-5 pt-8">
        <Button variant="ghost" className="w-full" onClick={logout}>Log out</Button>
      </div>
    </div>
  );
}
