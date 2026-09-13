const memory = new Map<string, string>();
const DB = "indie-dream-audio";
const STORE = "tracks";

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read audio."));
    reader.readAsDataURL(file);
  });
}

export async function stashAudio(id: string, dataUrl: string) {
  if (!id || !dataUrl) return;
  memory.set(id, dataUrl);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function recallAudio(id: string): Promise<string | null> {
  if (memory.has(id)) return memory.get(id) ?? null;
  const db = await openDb();
  if (!db) return null;
  const stored = await new Promise<string | null>((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(typeof req.result === "string" ? req.result : null);
    req.onerror = () => resolve(null);
  });
  if (stored) memory.set(id, stored);
  return stored;
}

export async function attachStoredAudio<T extends { id: string; audioUrl?: string }>(songs: T[]): Promise<T[]> {
  const next: T[] = [];
  for (const song of songs) {
    if (song.audioUrl) {
      next.push(song);
      continue;
    }
    const stored = await recallAudio(song.id);
    next.push(stored ? { ...song, audioUrl: stored } : song);
  }
  return next;
}

export function stripHeavyAudio<T extends { songs?: Array<{ audioUrl?: string }> }>(artists: T[]): T[] {
  return artists.map((artist) => ({
    ...artist,
    songs: (artist.songs ?? []).map((song) => {
      if (song.audioUrl?.startsWith("data:")) {
        const { audioUrl: _drop, ...rest } = song;
        return rest;
      }
      return song;
    }),
  }));
}
