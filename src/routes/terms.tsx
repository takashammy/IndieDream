import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/components/cue/terms-page";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});
