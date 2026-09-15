const DISMISS_KEY = "indie-dream-install-dismissed";

const LEGACY_STUDIO_KEYS = [
  "indie-dream-v1",
  "indie-dream-v2",
  "indie-dream-v3",
  "indie-dream-v4",
  "indie-dream-v5",
  "indie-dream-v6",
];

export function dropLegacyStudioCache() {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_STUDIO_KEYS) window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || ios;
}

export function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const notOther = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return ios && webkit && notOther;
}

export function installDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissInstall() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;
  void navigator.serviceWorker.register("/sw.js");
}
