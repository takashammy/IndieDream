import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { GENRE_OPTIONS, LOCATIONS, APP_NAME, type LocationArea, type Song } from "@/lib/data";
import { currentAccount, currentArtist, useCue } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { AreaInput, Confirm, Field, PhotoPick, ScreenHead, SelectInput, Sheet, TextInput, VerifiedMark } from "./chrome";
import { AUDIO_PICK_ACCEPT, inspectAudioFile } from "@/lib/audio-limits";
import { putTrackFile, r2KeyFromCover, withR2Cover } from "@/lib/r2";
import { LanguageToggle } from "./language-toggle";
import { ensureOwnArtist } from "@/lib/ensure-artist";
import { saveMySong } from "@/lib/cue-profile";
import {
  audioReason,
  genreLabel,
  locationLabel,
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

type TrackDraft = {
  title: string;
  genre: string;
  writers: string;
  year: string;
  lyrics: string;
  cover: string | null;
  file: File | null;
  fileName: string | null;
  duration: string;
};

function emptyDraft(): TrackDraft {
  return {
    title: "",
    genre: GENRE_OPTIONS[0],
    writers: "",
    year: "",
    lyrics: "",
    cover: null,
    file: null,
    fileName: null,
    duration: "—",
  };
}

function draftFromSong(song: Song): TrackDraft {
  return {
    title: song.title,
    genre: song.genre && GENRE_OPTIONS.includes(song.genre) ? song.genre : GENRE_OPTIONS[0],
    writers: song.writers ?? "",
    year: song.year ?? "",
    lyrics: song.lyrics ?? "",
    cover: song.cover ?? null,
    file: null,
    fileName: null,
    duration: song.duration && song.duration !== "—" ? song.duration : "—",
  };
}

function TrackForm({
  editing,
  busy,
  error,
  submitLabel,
  onSubmit,
  onFileReject,
  extra,
}: {
  editing?: Song;
  busy: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (draft: TrackDraft) => void;
  onFileReject: (reasons: string[]) => void;
  extra?: ReactNode;
}) {
  const [draft, setDraft] = useState<TrackDraft>(() => (editing ? draftFromSong(editing) : emptyDraft()));
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const { locale } = useLocale();

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = await inspectAudioFile(file);
    if (!check.ok) {
      e.target.value = "";
      setDraft((d) => ({ ...d, file: null, fileName: null }));
      onFileReject(check.reasons);
      return;
    }
    setDraft((d) => ({
      ...d,
      file,
      fileName: file.name,
      duration: check.duration || d.duration,
      title: d.title.trim() ? d.title : file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
    }));
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit(draft);
      }}
    >
      <div className="flex items-start gap-3">
        <PhotoPick src={draft.cover ?? "/media/covers/vinyl.jpg"} label={t("chooseCover")} className="size-16 shrink-0" onChange={(cover) => setDraft((d) => ({ ...d, cover }))} />
        <p className="pt-1 text-xs leading-5 text-subtle">{t("coverHint")}</p>
      </div>
      <Field label={t("trackTitle")}><TextInput value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} required /></Field>
      <Field label={t("genre")}>
        <SelectInput value={draft.genre} onChange={(e) => setDraft((d) => ({ ...d, genre: e.target.value }))}>
          {GENRE_OPTIONS.map((g) => <option key={g} value={g}>{genreLabel(locale, g)}</option>)}
        </SelectInput>
      </Field>
      <Field label={t("writers")}><TextInput value={draft.writers} onChange={(e) => setDraft((d) => ({ ...d, writers: e.target.value }))} /></Field>
      <Field label={t("year")}><TextInput value={draft.year} onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))} /></Field>
      <Field label={t("lyrics")}><AreaInput rows={6} value={draft.lyrics} onChange={(e) => setDraft((d) => ({ ...d, lyrics: e.target.value }))} placeholder={t("optional")} /></Field>
      <p className="text-xs leading-5 text-subtle">{editing ? t("keepCurrentFile") : t("phoneMp3Hint")}</p>
      <label className="relative mt-1 flex h-11 w-full items-center justify-center overflow-hidden rounded-md bg-elevated px-3 text-sm">
        <span className="pointer-events-none truncate">{draft.fileName ?? (editing ? t("replaceMp3") : t("chooseMp3"))}</span>
        <input
          ref={fileRef}
          type="file"
          accept={AUDIO_PICK_ACCEPT}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={onFile}
        />
      </label>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? t("sending") : submitLabel}</Button>
      {extra}
    </form>
  );
}

export function ArtistMe({ embedded = false }: { embedded?: boolean }) {
  const acc = useCue((s) => currentAccount(s))!;
  const artist = useCue((s) => currentArtist(s));
  const saveArtistProfile = useCue((s) => s.saveArtistProfile);
  const setProfilePhoto = useCue((s) => s.setProfilePhoto);
  const addPendingSong = useCue((s) => s.addPendingSong);
  const saveSong = useCue((s) => s.saveSong);
  const deleteSong = useCue((s) => s.deleteSong);
  const acceptUploadTerms = useCue((s) => s.acceptUploadTerms);
  const logout = useCue((s) => s.logout);
  const [openDetails, setOpenDetails] = useState(false);
  const [openSongs, setOpenSongs] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [editSong, setEditSong] = useState<Song | null>(null);
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
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [limitWarn, setLimitWarn] = useState<string[] | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [dropSong, setDropSong] = useState<Song | null>(null);
  const pendingDraft = useRef<TrackDraft | null>(null);
  const t = useT();
  const { locale } = useLocale();
  const pendingSongs = (artist?.songs ?? []).filter((s) => s.status !== "approved").length;
  const awaitingAdmin = Boolean(artist && (!artist.verified || pendingSongs > 0));

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

  async function writeNewTrack(draft: TrackDraft) {
    const picked = draft.file;
    const own = ensureOwnArtist();
    const artistId = own?.id || artist?.id || acc.artistId;
    const nameOf = draft.title.trim() || draft.fileName?.replace(/\.[^.]+$/, "") || picked?.name.replace(/\.[^.]+$/, "") || "";
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
    const cover = withR2Cover(draft.cover ?? undefined, put.key);
    const songId = `song-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const payload = {
      id: songId,
      cover,
      lyrics: draft.lyrics,
      audioUrl: `r2:${put.key}` as const,
      duration: draft.duration,
      genre: draft.genre,
      writers: draft.writers,
      year: draft.year,
    };
    try {
      await saveMySong({
        data: {
          id: songId,
          title: nameOf,
          cover,
          lyrics: draft.lyrics,
          audioUrl: `r2:${put.key}`,
          duration: draft.duration,
          genre: draft.genre,
          writers: draft.writers,
          year: draft.year,
        },
      });
    } catch {
      /* addPendingSong still writes the track */
    }
    await Promise.resolve(addPendingSong(nameOf, payload));
    setBusy(false);
    pendingDraft.current = null;
    setOpenUpload(false);
    setOpenSongs(true);
  }

  async function onCreate(draft: TrackDraft) {
    pendingDraft.current = draft;
    if (!acc.acceptedUploadTerms) {
      setTermsOpen(true);
      return;
    }
    await writeNewTrack(draft);
  }

  async function onEdit(song: Song, draft: TrackDraft) {
    const nameOf = draft.title.trim();
    if (!nameOf) {
      setFileError(t("errChooseMp3"));
      return;
    }
    const own = ensureOwnArtist();
    const artistId = own?.id || artist?.id || acc.artistId;
    setBusy(true);
    setFileError(null);
    let audioUrl = song.audioUrl;
    let cover = draft.cover ?? song.cover;
    let duration = draft.duration;
    if (draft.file) {
      if (!artistId) {
        setBusy(false);
        setFileError(t("errLoginFirst"));
        return;
      }
      const put = await putTrackFile(draft.file, artistId);
      if (!put.ok) {
        setBusy(false);
        setFileError(put.error);
        return;
      }
      audioUrl = `r2:${put.key}`;
      cover = withR2Cover(cover, put.key);
    }
    saveSong(song.id, {
      title: nameOf,
      cover,
      lyrics: draft.lyrics,
      audioUrl,
      duration,
      genre: draft.genre,
      writers: draft.writers,
      year: draft.year,
    });
    setBusy(false);
    setEditSong(null);
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
        <Button type="button" className="w-full" onClick={() => { setFileError(null); setOpenUpload(true); }}>{t("uploadSong")}</Button>
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
          {songs.length === 0 ? <p className="mt-3 text-sm text-subtle">{t("nothingQueue")}</p> : (
            <ul className="mt-1 divide-y divide-line border-y border-line">
              {songs.map((song) => (
                <li key={song.id}>
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center px-0 py-3 text-left text-sm font-medium"
                    onClick={() => { setFileError(null); setEditSong(song); }}
                  >
                    <span className="truncate">{song.title}</span>
                  </button>
                </li>
              ))}
            </ul>
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
          <TrackForm
            busy={busy}
            error={fileError}
            submitLabel={t("submitApproval")}
            onFileReject={setLimitWarn}
            onSubmit={(draft) => void onCreate(draft)}
          />
        </Sheet>
      ) : null}
      {editSong ? (
        <Sheet title={editSong.title} kicker={t("uploadedSongs")} onClose={() => setEditSong(null)}>
          <TrackForm
            key={editSong.id}
            editing={editSong}
            busy={busy}
            error={fileError}
            submitLabel={t("saveTrack")}
            onFileReject={setLimitWarn}
            onSubmit={(draft) => void onEdit(editSong, draft)}
            extra={
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setDropSong(editSong); }}>
                {t("deleteSong")}
              </Button>
            }
          />
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
            const draft = pendingDraft.current;
            setTermsOpen(false);
            if (draft) void writeNewTrack(draft);
          }}
          onClose={() => setTermsOpen(false)}
        />
      ) : null}
      {dropSong ? (
        <Confirm
          title={t("deleteSongQ")}
          body={t("removeSong", { title: dropSong.title, app: APP_NAME })}
          confirmLabel={t("deleteSong")}
          onConfirm={() => {
            deleteSong(dropSong.id);
            setEditSong(null);
          }}
          onClose={() => setDropSong(null)}
        />
      ) : null}
    </div>
  );
}
