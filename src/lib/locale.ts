import { create } from "zustand";

export type Locale = "en" | "zh";

const KEY = "indie-dream-locale";

function readLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(KEY) === "zh" ? "zh" : "en";
}

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: readLocale(),
  setLocale: (locale) => {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, locale);
    set({ locale });
  },
}));
