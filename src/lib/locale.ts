import { create } from "zustand";

export type Locale = "en" | "zh";

const KEY = "indie-dream-locale";

export function readLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(KEY) === "zh" ? "zh" : "en";
}

function writeLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, locale);
}

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  hydrateLocale: () => void;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "en",
  setLocale: (locale) => {
    writeLocale(locale);
    set({ locale });
  },
  hydrateLocale: () => {
    set({ locale: readLocale() });
  },
}));
