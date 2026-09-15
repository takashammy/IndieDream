import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";

export function UploadTermsNote() {
  const t = useT();
  return (
    <div className="space-y-1">
      <p className="text-[11px] leading-4 text-muted">{t("uploadTerms")}</p>
      <Link to="/terms" className="block text-[11px] leading-4 text-muted underline decoration-1 underline-offset-2">
        {t("legalLink")}
      </Link>
    </div>
  );
}
