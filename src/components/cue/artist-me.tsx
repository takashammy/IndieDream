import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { GENRE_OPTIONS, LOCATIONS, APP_NAME, type LocationArea, type Song } from "@/lib/data";
import { currentAccount, currentArtist, useCue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AreaInput, Confirm, Field, PhotoPick, ScreenHead, SelectInput, Sheet, TextInput, VerifiedMark } from "./chrome";
import { AUDIO_PICK_ACCEPT, inspectAudioFile } from "@/lib/audio-limits";
import { coverImage, putTrackFile, r2KeyFromCover, withR2Cover } from "@/lib/r2";
import { LanguageToggle } from "./language-toggle";
import { ensureOwnArtist } from "@/lib/ensure-artist";
import { saveMySong } from "@/lib/cue-profile";
import { SongPreview } from "./r2-audio";
import {
  audioReason,
  genreLabel,
  locationLabel,
  songStatusLabel,
  useLocale,
  useT,
} from "@/lib/i18n";

function AudioLimitWarn({ reasons, onClose }: { reasons: string[]; onClose: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  return (
    <Sheet title={t("fileOverLimit")} kicker={t("upload")} onClose={onClose}>
      <p className="text-sm leading-6 text-muted">{t("mp3Only5", { app: APP_NAME })}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-fg">{reasons.map((r) => <li key={r}>{audioReason(locale, r)}</li>)}</ul>
      <button type="button" className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-accent text-sm text-accent-fg" onClick={onClose}>{t("chooseAnother")}</button>
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
  const deleteSong = useCue((s) => s.deleteSong);
  const acceptUploadTerms = useCue((s) => s.acceptUploadTerms);
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
  const [trackDuration, setTrackDuration] = useState("—");
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [limitWarn, setLimitWarn] = useState<string[] | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [dropSong, setDropSong] = useState<Song | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const trackFileRef = useRef<File | null>(null);
  const t = useT();
  const { locale } = useLocale();
  const pendingSongs = (artist?.songs ?? []).filter((s) => s.status !== "approved").length;
  const awaitingAdmin = Boolean(artist && (!artist.verified || pendingSongs > 0));

  function pickedFile() {
    return trackFileRef.current || trackFile || fileRef.current?.files?.[0] || null;
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    ensureOwnArtist();
    saveArtistProfile({
      name,
      role,
      area,
      city: area,
      genres: [genre],
      label: label.trim(),
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
    if (!file) return;
    const check = await inspectAudioFile(file);
    if (!check.ok) {
      e.target.value = "";
      setFileName(null);
      setTrackFile(null);
      trackFileRef.current = null;
      setTrackDuration("—");
      setLimitWarn(check.reasons);
      return;
    }
    setLimitWarn(null);
    setFileError(null);
    setFileName(file.name);
    setTrackFile(file);
    trackFileRef.current = file;
    setTrackDuration(check.duration || "—");
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  }

  async function finishUpload() {
    const picked = pickedFile();
    const own = ensureOwnArtist();
    const artistId = own?.id || artist?.id || acc.artistId;
    const nameOf = title.trim() || fileName?.replace(/\.[^.]+$/, "") || picked?.name.replace(/\.[^.]+$/, "") || "";
    if (!picked) {
      setFileError(t("errChooseMp3"));
      return;
    }
    if (!nameOf) {
      setFileError(t("errChooseMp3"));
      return;
    }
    if (!artistId) {
      setFileError(t("errLoginFirst"));
      return;
    }
    setBusy(true);
    setFileError(null);
    const put = await putTrackFile(picked, artistId);
    if (!put.ok) {
      setBusy(false);
      setFileError(put.error);
      return;
    }
    const cover = withR2Cover(trackCover ?? undefined, put.key);
    const songId = `song-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      await saveMySong({
        data: {
          id: songId,
          title: nameOf,
          cover,
          spotify: trackSpotify,
          youtube: trackYoutube,
          lyrics,
          audioUrl: `r2:${put.key}`,
          duration: trackDuration,
        },
      });
    } catch {
      /* addPendingSong still writes the track */
    }
    await Promise.resolve(
      addPendingSong(nameOf, {
        id: songId,
        spotify: trackSpotify,
        youtube: trackYoutube,
        cover,
        lyrics,
        audioUrl: `r2:${put.key}`,
        duration: trackDuration,
      }),
    );
    setBusy(false);
    setTitle("");
    setTrackGenre(GENRE_OPTIONS[0]);
    setWriters("");
    setYear("");
    setLyrics("");
    setTrackSpotify("");
    setTrackYoutube("");
    setTrackCover(null);
    setFileName(null);
    setTrackFile(null);
    trackFileRef.current = null;
    setTrackDuration("—");
    setOpenUpload(false);
    setOpenSongs(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    const picked = pickedFile();
    const own = ensureOwnArtist();
    const artistId = own?.id || artist?.id || acc.artistId;
    const nameOf = title.trim() || fileName?.replace(/\.[^.]+$/, "") || picked?.name.replace(/\.[^.]+$/, "") || "";
    if (!nameOf) return;
    if (!picked) {
      setFileError(t("errChooseMp3"));
      return;
    }
    if (!artistId) {
      setFileError(t("errLoginFirst"));
      return;
    }
    if (!acc.acceptedUploadTerms) {
      setTermsOpen(true);
      return;
    }
    await finishUpload();
  }

  const songs = artist?.songs ?? [];

  return (
    <div className={embedded ? "border-t border-line pb-4 pt-2" : "cue-enter pb-12"}>
      <ScreenHead kicker={embedded ? t("artist") : t("you")} title={embedded ? t("yourMusic") : t("profile")} note={artist?.verified ? t("verified") : t("pendingReview")} />
      {awaitingAdmin ? (
        <p className="mx-5 mb-4 rounded-md bg-elevated px-3 py-2 text-sm leading-6 text-accent">
          {t("gateVerifyBody")}
        </p>
      ) : null}
      <div className="flex items-end gap-4 px-5">
        <PhotoPick src={artist?.photo ?? acc.photo} label={t("changePhoto")} className="size-20 shrink-0" onChange={setProfilePhoto} />
        <div className="min-w-0">
          <p className="cue-name flex items-center gap-1.5 font-display text-2xl leading-tight">{artist?.name ?? acc.name}{artist?.verified ? <VerifiedMark /> : null}</p>
          <p className="text-sm text-muted">{artist?.role} · {artist?.area ? locationLabel(locale, artist.area) : ""}</p>
        </div>
      </div>
      <div className="mt-6 space-y-2 px-5">
        <Button type="button" variant="outline" className="w-full" onClick={() => setOpenDetails(true)}>{t("personalInfo")}</Button>
        <Button type="button" className="w-full" onClick={() => setOpenUpload(true)}>{t("uploadSong")}</Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => setOpenSongs((v) => !v)}>{openSongs ? t("hideUploaded") : t("uploadedSongs")}</Button>
      </div>
      {openDetails ? (
        <Sheet title={t("personalInfo")} kicker={t("profile")} onClose={() => setOpenDetails(false)}>
          <form onSubmit={onSave} className="space-y-3">
            <Field label={t("name")}><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label={t("role")}><TextInput value={role} onChange={(e) => setRole(e.target.value)} /></Field>
            <Field label={t("location")}>
              <SelectInput value={area} onChange={(e) => setArea(e.target.value as LocationArea)}>
                {LOCATIONS.map((l) => <option key={l} value={l}>{locationLabel(locale, l)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t("genre")}>
              <SelectInput value={genre} onChange={(e) => setGenre(e.target.value)}>
                {GENRE_OPTIONS.map((g) => <option key={g} value={g}>{genreLabel(locale, g)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t("label")}><TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("optional")} /></Field>
            {artist?.labelApproved ? <p className="text-sm italic text-accent">{t("innerSoulRecords")}</p> : null}
            <Field label={t("bio")}><AreaInput rows={4} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
            <Field label={t("email")}><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label={t("whatsapp")}><TextInput type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
            <Field label={t("spotifyUrl")}><TextInput type="url" value={spotify} onChange={(e) => setSpotify(e.target.value)} /></Field>
            <Field label={t("youtubeUrl")}><TextInput type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)} /></Field>
            <Button type="submit" className="w-full">{saved ? t("saved") : t("saveDetails")}</Button>
          </form>
        </Sheet>
      ) : null}
      {openSongs ? (
        <section className="mt-4 px-5">
          <p className="text-sm text-muted">{t("mp3OnlyMax")}</p>
          {songs.length === 0 ? <p className="mt-3 text-sm text-subtle">{t("nothingQueue")}</p> : (
            <ul className="mt-3 divide-y divide-line border-y border-line">{songs.map((song) => <SongLinksRow key={song.id} song={song} onSave={(extra) => updateSongLinks(song.id, extra)} onDelete={() => setDropSong(song)} />)}</ul>
          )}
        </section>
      ) : null}
      {embedded ? null : (
        <div className="px-5 pt-8">
          <LanguageToggle className="px-0 pt-0" />
          <Button variant="ghost" className="mt-4 w-full" onClick={logout}>{t("logOut")}</Button>
        </div>
      )}
      {openUpload ? (
        <Sheet title={t("uploadSong")} kicker={t("newTrack")} onClose={() => setOpenUpload(false)}>
          <form onSubmit={onUpload} className="space-y-3">
            <div className="flex items-start gap-3">
              <PhotoPick src={trackCover ?? "/media/covers/vinyl.jpg"} label={t("chooseCover")} className="size-16 shrink-0" onChange={setTrackCover} />
              <p className="pt-1 text-xs leading-5 text-subtle">{t("coverHint")}</p>
            </div>
            <Field label={t("trackTitle")}><TextInput value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
            <Field label={t("genre")}>
              <SelectInput value={trackGenre} onChange={(e) => setTrackGenre(e.target.value)}>
                {GENRE_OPTIONS.map((g) => <option key={g} value={g}>{genreLabel(locale, g)}</option>)}
              </SelectInput>
            </Field>
            <Field label={t("writers")}><TextInput value={writers} onChange={(e) => setWriters(e.target.value)} /></Field>
            <Field label={t("year")}><TextInput value={year} onChange={(e) => setYear(e.target.value)} /></Field>
            <Field label={t("lyrics")}><AreaInput rows={6} value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder={t("optional")} /></Field>
            <p className="text-xs leading-5 text-subtle">{t("phoneMp3Hint")}</p>
            <label className="relative mt-1 flex h-11 w-full items-center justify-center overflow-hidden rounded-md bg-elevated px-3 text-sm">
              <span className="pointer-events-none truncate">{fileName ?? t("chooseMp3")}</span>
              <input
                ref={fileRef}
                type="file"
                accept={AUDIO_PICK_ACCEPT}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={onFile}
              />
            </label>
            {fileError ? <p className="text-sm text-accent">{fileError}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? t("sending") : t("submitApproval")}</Button>
          </form>
        </Sheet>
      ) : null}
      {limitWarn ? <AudioLimitWarn reasons={limitWarn} onClose={() => setLimitWarn(null)} /> : null}
      {termsOpen ? (
        <Confirm
          title={t("uploadAgreement")}
          body={t("uploadTerms")}
          confirmLabel={t("agreeUpload")}
          cancelLabel={t("notNow")}
          onConfirm={() => {
            acceptUploadTerms();
            void finishUpload();
          }}
          onClose={() => setTermsOpen(false)}
        />
      ) : null}
      {dropSong ? (
        <Confirm
          title={t("deleteSongQ")}
          body={t("removeSong", { title: dropSong.title, app: APP_NAME })}
          confirmLabel={t("deleteSong")}
          onConfirm={() => deleteSong(dropSong.id)}
          onClose={() => setDropSong(null)}
        />
      ) : null}
    </div>
  );
}

function SongLinksRow({ song, onSave, onDelete }: { song: Song; onSave: (extra: { spotify?: string; youtube?: string; cover?: string }) => void; onDelete: () => void }) {
  const [sp, setSp] = useState(song.spotify ?? "");
  const [yt, setYt] = useState(song.youtube ?? "");
  const dirty = sp !== (song.spotify ?? "") || yt !== (song.youtube ?? "");
  const t = useT();
  const { locale } = useLocale();
  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <PhotoPick src={coverImage(song.cover)} label={t("changeCoverFor", { title: song.title })} className="size-12 shrink-0" onChange={(cover) => { const key = r2KeyFromCover(song.cover); onSave({ spotify: sp, youtube: yt, cover: key ? withR2Cover(cover, key) : cover }); }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{song.title}</p>
          <p className="text-xs text-muted">{songStatusLabel(locale, song.status)}</p>
        </div>
      </div>
      <SongPreview song={song} />
      {song.lyrics?.trim() ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{song.lyrics}</p>
      ) : null}
      <div className="mt-2 space-y-2">
        <TextInput type="url" value={sp} onChange={(e) => setSp(e.target.value)} placeholder={t("spotifySong")} />
        <TextInput type="url" value={yt} onChange={(e) => setYt(e.target.value)} placeholder={t("youtubeSong")} />
        {dirty ? <Button type="button" variant="subtle" size="sm" className="w-full" onClick={() => onSave({ spotify: sp, youtube: yt })}>{t("saveSongLinks")}</Button> : null}
        <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onDelete}>{t("deleteSong")}</Button>
      </div>
    </li>
  );
}
