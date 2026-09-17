const DISMISS_KEY = "indie-dream-install-dismissed";
const WIPE_FLAG = "indie-dream-cache-wipe-9";

const LEGACY_STUDIO_KEYS = [
  "indie-dream-v1",
  "indie-dream-v2",
  "indie-dream-v3",
  "indie-dream-v4",
  "indie-dream-v5",
  "indie-dream-v6",
  "indie-dream-v7",
];

export function dropLegacyStudioCache() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(WIPE_FLAG) === "1") return;
    for (const key of LEGACY_STUDIO_KEYS) window.localStorage.removeItem(key);
    window.localStorage.setItem(WIPE_FLAG, "1");
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

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const padded = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function armMartinPush(): Promise<"on" | "denied" | "unsupported" | "need-install" | "error"> {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  const ios = isIosSafari();
  if (ios && !isStandalone()) return "need-install";
  if (import.meta.env.DEV) return "need-install";
  try {
    const { getPushPublicKey, savePushSubscription } = await import("@/lib/cue-push");
    const { key } = await getPushPublicKey();
    if (!key) return "error";
    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    const json = sub.toJSON();
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;
    if (!json.endpoint || !p256dh || !auth) return "error";
    const saved = await savePushSubscription({ data: { endpoint: json.endpoint, p256dh, auth } });
    return saved.ok ? "on" : "error";
  } catch {
    return "error";
  }
}

