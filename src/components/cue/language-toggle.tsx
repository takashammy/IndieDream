import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const t = useT();
  return (
    <div className={cn("px-5 pt-6", className)}>
      <p className="text-xs text-muted">{t("language")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={cn(
            "flex h-11 items-center justify-center rounded-md text-sm",
            locale === "en" ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
          )}
        >
          {t("langEn")}
        </button>
        <button
          type="button"
          onClick={() => setLocale("zh")}
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
