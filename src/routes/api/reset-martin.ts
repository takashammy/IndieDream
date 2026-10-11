import { createFileRoute } from "@tanstack/react-router";
import { handleResetMartin } from "@/lib/reset-martin.server";

export const Route = createFileRoute("/api/reset-martin")({
  server: {
    handlers: {
      GET: async ({ request }) => handleResetMartin(request),
      POST: async ({ request }) => handleResetMartin(request),
    },
  },
});
