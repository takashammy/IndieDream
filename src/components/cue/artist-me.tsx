import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { GENRE_OPTIONS, ISR_LABEL, LOCATIONS, APP_NAME, claimsISR, type LocationArea, type Song } from "@/lib/data";
import { currentAccount, currentArtist, useCue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AreaInput, Field, PhotoPick, ScreenHead, SelectInput, Sheet, TextInput, VerifiedMark } from "./chrome";
import { audioLimitCopy, AUDIO_PICK_ACCEPT, inspectAudioFile } from "@/lib/audio-limits";
import { coverImage, putTrackFile, r2KeyFromCover, withR2Cover } from "@/lib/r2";

function AudioLimitWarn({ reasons, onClose }: { reasons: string[]; onClose: () => void }) {
  return (
    <Sheet title="This file is over the limit" kicker="Upload" onClose={onClose}>
      <p className="text-sm leading-6 text-muted">{APP_NAME} only takes MP3 files up to 5 MB.</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-fg">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      <button type="button" className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-accent text-sm text-accent-fg" onClick={onClose}>Choose another file</button>
    </Sheet>
  );
}

export function ArtistMe({ embedded = false }: { embedded?: boolean }) {
  const acc = useCue((s) => currentAccount(s))!;
  const artist = useCue((s) => currentArtist(s));
  const saveArtistProfile = useCue((s) => s.saveArtistProfile);
  const setProfilePhoto = useCue((s) => s.setProfilePhoto);
  const addPendingSong = useCue((s) => s.addPendingSong);
  const updateSongLinks = useCue((s) => s.updateSongLinks);
  const logout = useCue((s) => s.logout);
  const [openDetails, setOpenDetails] = useState(false);
  const [openSongs, setOpenSongs] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
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
  const [trackGenre, setTrackGenre] = useState(GENRE_OPTIONS[0]);
  const [writers, setWriters] = useState("");
  const [year, setYear] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [trackSpotify, setTrackSpotify] = useState("");
  const [trackYoutube, setTrackYoutube] = useState("");
  const [trackCover, setTrackCover] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [limitWarn, setLimitWarn] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onSave(e: FormEvent) {
    e.preventDefault();
    saveArtistProfile({ name, role, area, city: area, genres: [genre], label: label.trim() || "Independent", bio, spotify, youtube, email, whatsapp });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = await inspectAudioFile(file);
    if (!check.ok) { e.target.value = ""; setFileName(null); setTrackFile(null); setLimitWarn(check.reasons); return; }
    setLimitWarn(null); setFileError(null); setFileName(file.name); setTrackFile(file);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  }

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    const nameOf = title.trim() || fileName?.replace(/\.[^.]+$/, "") || "";
    if (!nameOf) return;
    if (!trackFile || !artist?.id) { setFileError("Choose an MP3 first. " + audioLimitCopy()); return; }
    setBusy(true); setFileError(null);
    const put = await putTrackFile(trackFile, artist.id);
    setBusy(false);
    if (!put.ok) { setFileError(put.error); return; }
    addPendingSong(nameOf, { spotify: trackSpotify, youtube: trackYoutube, cover: withR2Cover(trackCover ?? undefined, put.key), lyrics });
    setTitle(""); setTrackGenre(GENRE_OPTIONS[0]); setWriters(""); setYear(""); setLyrics(""); setTrackSpotify(""); setTrackYoutube(""); setTrackCover(null); setFileName(null); setTrackFile(null); setOpenUpload(false); setOpenSongs(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  const pending = artist?.songs.filter((s) => s.status === "pending") ?? [];
  const live = artist?.songs.filter((s) => s.status === "approved") ?? [];

  return (
    <div className={embedded ? "border-t border-line pb-4 pt-2" : "cue-enter pb-12"}>
      <ScreenHead kicker={embedded ? "Artist" : "You"} title={embedded ? "Your music" : "Profile"} note={artist?.verified ? "Verified" : "Pending review"} />
      <div className="flex items-end gap-4 px-5">
        <PhotoPick src={artist?.photo ?? acc.photo} label="Change profile picture" className="size-20 shrink-0" onChange={setProfilePhoto} />
        <div className="min-w-0">
          <p className="cue-name flex items-center gap-1.5 font-display text-2xl leading-tight">{artist?.name ?? acc.name}{artist?.verified ? <VerifiedMark /> : null}</p>
          <p className="text-sm text-muted">{artist?.role} · {artist?.area}</p>
        </div>
      </div>
      <div className="mt-6 space-y-2 px-5">
        <Button type="button" variant="outline" className="w-full" onClick={() => setOpenDetails(true)}>Personal information</Button>
        <Button type="button" className="w-full" onClick={() => setOpenUpload(true)}>Upload song</Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => setOpenSongs((v) => !v)}>{openSongs ? "Hide uploaded songs" : "Uploaded songs"}</Button>
      </div>
      {openDetails ? (
        <Sheet title="Personal information" kicker="Profile" onClose={() => setOpenDetails(false)}>
          <form onSubmit={onSave} className="space-y-3">
            <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Role"><TextInput value={role} onChange={(e) => setRole(e.target.value)} /></Field>
            <Field label="Location"><SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</SelectInput></Field>
            <Field label="Genre"><SelectInput value={genre} onChange={(e) => setGenre(e.target.value)}>{GENRE_OPTIONS.map((g) => <option key={g}>{g}</option>)}</SelectInput></Field>
            <Field label="Label"><TextInput value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
            {claimsISR(label) && !artist?.labelApproved ? <p className="text-sm italic text-accent">{ISR_LABEL} needs Inner Soul approval.</p> : null}
            <Field label="Bio / About me"><AreaInput rows={4} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
            <Field label="Email"><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label="WhatsApp number"><TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
            <Field label="Spotify URL"><TextInput type="url" value={spotify} onChange={(e) => setSpotify(e.target.value)} /></Field>
            <Field label="YouTube URL"><TextInput type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} /></Field>
            <Button type="submit" className="w-full">{saved ? "Saved" : "Save details"}</Button>
          </form>
        </Sheet>
      ) : null}
      {openSongs ? (
        <section className="mt-4 px-5">
          <p className="text-sm text-muted">{audioLimitCopy()}</p>
          {pending.length + live.length === 0 ? <p className="mt-3 text-sm text-subtle">Nothing in the queue yet.</p> : (
            <ul className="mt-3 divide-y divide-line border-y border-line">{[...pending, ...live].map((song) => <SongLinksRow key={song.id} song={song} onSave={(extra) => updateSongLinks(song.id, extra)} />)}</ul>
          )}
        </section>
      ) : null}
      {embedded ? null : (
        <div className="px-5 pt-8"><Button variant="ghost" className="w-full" onClick={logout}>Log out</Button></div>
      )}
      {openUpload ? (
        <Sheet title="Upload song" kicker="New track" onClose={() => setOpenUpload(false)}>
          <form onSubmit={onUpload} className="space-y-3">
            <div className="flex items-start gap-3">
              <PhotoPick src={trackCover ?? "/media/covers/vinyl.jpg"} label="Choose cover art" className="size-16 shrink-0" onChange={setTrackCover} />
              <p className="pt-1 text-xs leading-5 text-subtle">Cover art sits on your page, Discover, and the player.</p>
            </div>
            <Field label="Track title"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
            <Field label="Genre"><SelectInput value={trackGenre} onChange={(e) => setTrackGenre(e.target.value)}>{GENRE_OPTIONS.map((g) => <option key={g}>{g}</option>)}</SelectInput></Field>
            <Field label="Writers"><TextInput value={writers} onChange={(e) => setWriters(e.target.value)} /></Field>
            <Field label="Year"><TextInput value={year} onChange={(e) => setYear(e.target.value)} /></Field>
            <Field label="Lyrics"><AreaInput rows={6} value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Optional" /></Field>
            <p className="text-xs leading-5 text-subtle">MP3 only, 5 MB max. On a phone, open Files and pick the track — Voice Memos and Apple Music files need to be exported as MP3 first.</p>
            <label className="relative mt-1 flex h-11 w-full items-center justify-center overflow-hidden rounded-md bg-elevated px-3 text-sm">
              <span className="pointer-events-none truncate">{fileName ?? "Choose MP3 file"}</span>
              <input
                ref={fileRef}
                type="file"
                accept={AUDIO_PICK_ACCEPT}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={onFile}
              />
            </label>
            {fileError ? <p className="text-sm text-accent">{fileError}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Submit for approval"}</Button>
          </form>
        </Sheet>
      ) : null}
      {limitWarn ? <AudioLimitWarn reasons={limitWarn} onClose={() => setLimitWarn(null)} /> : null}
    </div>
  );
}

function SongLinksRow({ song, onSave }: { song: Song; onSave: (extra: { spotify?: string; youtube?: string; cover?: string }) => void }) {
  const [sp, setSp] = useState(song.spotify ?? "");
  const [yt, setYt] = useState(song.youtube ?? "");
  const dirty = sp !== (song.spotify ?? "") || yt !== (song.youtube ?? "");
  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <PhotoPick src={coverImage(song.cover)} label={`Change cover art for ${song.title}`} className="size-12 shrink-0" onChange={(cover) => { const key = r2KeyFromCover(song.cover); onSave({ spotify: sp, youtube: yt, cover: key ? withR2Cover(cover, key) : cover }); }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{song.title}</p>
          <p className="text-xs text-muted">{song.status === "approved" ? "Live" : "Awaiting approval"}</p>
        </div>
      </div>
      <div className="mt-2 space-y-2">
        <TextInput type="url" value={sp} onChange={(e) => setSp(e.target.value)} placeholder="Spotify URL for this song" />
        <TextInput type="url" value={yt} onChange={(e) => setYt(e.target.value)} placeholder="YouTube URL for this song" />
        {dirty ? <Button type="button" variant="subtle" size="sm" className="w-full" onClick={() => onSave({ spotify: sp, youtube: yt })}>Save song links</Button> : null}
      </div>
    </li>
  );
}
