import { createFileRoute } from "@tanstack/react-router";
import { handleTrackUpload } from "@/lib/track-upload.server";

export const Route = createFileRoute("/api/track-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => handleTrackUpload(request),
    },
  },
});
