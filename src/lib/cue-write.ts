import { saveStudio, loadStudio, type StudioSlice } from "@/lib/cue-sync";

/**
 * Single write path used by the client store.
 * Every user-created record (account, song metadata, board post, event)
 * is persisted by merging into the studio snapshot and saving once.
 * Audio bytes go through handleTrackUpload / R2 separately.
 */
export async function writeStudioSlice(slice: StudioSlice): Promise<{ ok: boolean }> {
  try {
    await saveStudio({ data: slice });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function readStudioSlice(): Promise<StudioSlice | null> {
  try {
    return await loadStudio();
  } catch {
    return null;
  }
}
