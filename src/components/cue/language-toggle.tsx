import { currentAccount, useCue } from "@/lib/store";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const saveLocale = useCue((s) => s.saveLocale);
  const session = useCue((s) => currentAccount(s));
  const t = useT();

  function pick(next: "en" | "zh") {
    setLocale(next);
    if (session) saveLocale(next);
  }

  return (
    <div className={cn("px-5 pt-5", className)}>
      <p className="text-xs text-muted">{t("language")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => pick("en")}
          className={cn(
            "flex h-11 items-center justify-center rounded-md text-sm",
            locale === "en" ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
          )}
        >
          {t("langEn")}
        </button>
        <button
          type="button"
          onClick={() => pick("zh")}
          className={cn(
            "flex h-11 items-center justify-center rounded-md text-sm",
            locale === "zh" ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
          )}
        >
          {t("langZh")}
        </button>
      </div>
    </div>
  );
}
