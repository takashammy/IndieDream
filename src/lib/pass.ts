/** Client-side password mark. Not a substitute for server auth. */
export function hashPass(value: string) {
  const str = `indie-dream::${value}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h1:${(h >>> 0).toString(16).padStart(8, "0")}`;
}

export function passOk(stored: string, plain: string) {
  if (!stored || !plain) return false;
  if (stored.startsWith("h1:")) return stored === hashPass(plain);
  return false;
}

export const DESK_PASS = "Desk2026!";
export const PERSIST_KEY = "indie-dream-v4";
