import { Link } from "@tanstack/react-router";
import { legalCopy } from "@/lib/legal";
import { useLocale } from "@/lib/i18n";

export function TermsPage() {
  const { locale } = useLocale();
  const copy = legalCopy(locale);
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-bg px-5 pb-16 pt-8 text-fg">
      <p className="cue-kicker text-xs text-muted">{copy.kicker}</p>
      <h1 className="cue-name mt-1 font-display text-4xl leading-none">{copy.title}</h1>
      <div className="mt-8 space-y-6">
        {copy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-sm font-medium">{section.heading}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{section.body}</p>
          </section>
        ))}
      </div>
      <Link to="/" className="mt-10 block text-center text-sm text-muted underline decoration-1 underline-offset-4">
        {copy.back}
      </Link>
    </div>
  );
}
