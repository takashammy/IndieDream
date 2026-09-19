import { createFileRoute } from "@tanstack/react-router";
import { handleR2ImageGet } from "@/lib/image-upload.server";

export const Route = createFileRoute("/api/r2-image")({
  server: {
    handlers: {
      GET: async ({ request }) => handleR2ImageGet(request),
    },
  },
});
