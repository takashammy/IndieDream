import { useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ImagePlus, Music2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Song } from "@/lib/data";
import { useCue } from "@/lib/store";
import { imageReason, useLocale, useT } from "@/lib/i18n";

export function BackRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-ml-2 flex h-11 items-center gap-1 px-5 text-sm text-muted"
    >
      <ChevronLeft className="size-4" /> {label}
    </button>
  );
}

export function ScreenHead({
  kicker,
  title,
  note,
}: {
  kicker: string;
  title: string;
  note?: string;
}) {
  return (
    <header className="px-5 pb-4 pt-5">
      <p className="cue-kicker text-xs text-muted">{kicker}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <h1 className="cue-name font-display text-4xl leading-none sm:text-5xl">{title}</h1>
        {note ? <p className="pb-1 text-xs italic text-subtle">{note}</p> : null}
      </div>
    </header>
  );
}

export function VerifiedMark({ className }: { className?: string }) {
  const t = useT();
  return (
    <Music2
      className={cn("inline-block size-4 shrink-0 text-accent", className)}
      strokeWidth={2.2}
      aria-label={t("verifiedArtist")}
    />
  );
}

export function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.72.48-1.08.24-2.88-1.74-6.48-2.16-10.74-1.2-.42.12-.84-.18-.96-.6-.12-.42.18-.84.6-.96 4.62-1.02 8.64-.54 11.82 1.38.42.18.54.72.36 1.14zm1.56-3.3c-.3.42-.84.6-1.26.3-3.3-2.04-8.34-2.64-12.24-1.44-.48.12-1.02-.12-1.14-.66-.12-.48.12-1.02.66-1.14 4.44-1.32 9.96-.66 13.74 1.62.42.24.6.84.24 1.32zm.12-3.36C15.18 8.7 8.82 8.46 5.1 9.6c-.6.18-1.26-.18-1.44-.78-.18-.6.18-1.26.78-1.44 4.26-1.32 11.46-1.08 16.02 1.62.54.3.72 1.02.36 1.56-.3.48-1.02.66-1.56.36z"
      />
    </svg>
  );
}

export function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.5V8.5L15.8 12 9.6 15.5z"
      />
    </svg>
  );
}

export function hrefOf(raw?: string) {
  const v = raw?.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  return `https://${v}`;
}

export function SocialPair({
  spotify,
  youtube,
  compact,
}: {
  spotify?: string;
  youtube?: string;
  compact?: boolean;
}) {
  const sp = hrefOf(spotify);
  const yt = hrefOf(youtube);
  if (!sp && !yt) return null;
  const box = compact
    ? "relative z-20 flex size-8 items-center justify-center rounded-md bg-bg/80 text-fg backdrop-blur-sm"
    : "relative z-20 flex size-10 items-center justify-center rounded-md bg-bg/80 text-fg backdrop-blur-sm";
  return (
    <div className="relative z-20 flex gap-1">
      {sp ? (
        <a
          href={sp}
          target="_blank"
          rel="noopener noreferrer"
          className={box}
          aria-label="Spotify"
          onClick={(e) => e.stopPropagation()}
        >
          <SpotifyIcon className="size-4" />
        </a>
      ) : null}
      {yt ? (
        <a
          href={yt}
          target="_blank"
          rel="noopener noreferrer"
          className={box}
          aria-label="YouTube"
          onClick={(e) => e.stopPropagation()}
        >
          <YoutubeIcon className="size-4" />
        </a>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs text-muted">
      {label}
      {children}
    </label>
  );
}

export async function readLocalImage(file: File, maxEdge = 900, maxBytes = 8 * 1024 * 1024): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Images only.");
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    throw new Error(`Keep images under ${mb} MB.`);
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not read image.");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoPick({
  src,
  label,
  onChange,
  className,
}: {
  src: string;
  label: string;
  onChange: (dataUrl: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useLocale();

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn("relative block overflow-hidden rounded-lg bg-elevated", className)}
        aria-label={label}
      >
        <img src={src} alt="" className="size-full object-cover" />
        <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-md bg-bg/80 text-fg">
          <ImagePlus className="size-3.5" />
        </span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          readLocalImage(file)
            .then((url) => {
              setError(null);
              onChange(url);
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? imageReason(locale, err.message) : imageReason(locale, ""));
            });
        }}
      />
      {error ? <p className="mt-1 text-xs text-accent">{error}</p> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "mt-1 h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg outline-none",
        props.className,
      )}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "mt-1 h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg",
        props.className,
      )}
    />
  );
}

export function AreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "mt-1 w-full rounded-md bg-elevated px-3 py-2 text-sm text-fg outline-none",
        props.className,
      )}
    />
  );
}

export function Sheet({
  title,
  kicker,
  onClose,
  children,
}: {
  title: ReactNode;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useT();
  const frame = (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <button
        type="button"
        className="fixed inset-0 bg-ink/45"
        aria-label={t("close")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 mt-0 w-full max-w-lg bg-bg px-5 pb-8 pt-5"
      >
        {kicker ? <p className="cue-kicker text-xs text-muted">{kicker}</p> : null}
        <div className="mt-1 flex items-start justify-between gap-3">
          <h2 className="cue-name font-display text-3xl leading-none">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 shrink-0 items-center justify-center text-muted"
            aria-label={t("closeDialog")}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
  if (typeof document === "undefined") return frame;
  return createPortal(frame, document.body);
}

export function Confirm({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  extra,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  extra?: { label: string; onClick: () => void };
}) {
  const t = useT();
  return (
    <Sheet title={title} kicker={t("pleaseConfirm")} onClose={onClose}>
      <p className="text-sm leading-6 text-muted">{body}</p>
      <div className="mt-6 flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel ?? t("yes")}
        </Button>
        {extra ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              extra.onClick();
              onClose();
            }}
          >
            {extra.label}
          </Button>
        ) : null}
        <Button variant="ghost" className="w-full" onClick={onClose}>
          {cancelLabel ?? t("cancel")}
        </Button>
      </div>
    </Sheet>
  );
}

export function TrackSheet({
  artistName,
  artistId,
  song,
  onClose,
}: {
  artistName: string;
  artistId?: string;
  song: Song;
  onClose: () => void;
}) {
  const openArtist = useCue((s) => s.openArtist);
  const t = useT();
  const liveSong = useCue((s) => {
    if (!artistId) return song;
    const artist = s.artists.find((a) => a.id === artistId);
    return artist?.songs.find((item) => item.id === song.id) ?? song;
  });
  const lyrics = (liveSong.lyrics ?? song.lyrics)?.trim();
  const title = artistId ? (
    <button
      type="button"
      className="text-left underline decoration-1 underline-offset-4"
      onClick={() => {
        onClose();
        openArtist(artistId);
      }}
    >
      {artistName}
    </button>
  ) : (
    artistName
  );
  return (
    <Sheet title={title} kicker={t("track")} onClose={onClose}>
      <p className="text-base font-medium leading-snug">{song.title}</p>
      {lyrics ? (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{lyrics}</p>
      ) : (
        <p className="mt-4 text-sm italic text-subtle">{t("noLyrics")}</p>
      )}
    </Sheet>
  );
}
