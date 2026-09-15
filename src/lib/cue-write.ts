import { loadStudio, type StudioSlice } from "@/lib/cue-sync";

export async function writeStudioSlice(_slice: StudioSlice): Promise<{ ok: boolean }> {
  return { ok: true };
}

export async function readStudioSlice(): Promise<StudioSlice | null> {
  try {
    return await loadStudio();
  } catch {
    return null;
  }
}
