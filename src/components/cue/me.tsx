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
