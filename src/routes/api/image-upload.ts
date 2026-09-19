import { createFileRoute } from "@tanstack/react-router";
import { handleImageUpload } from "@/lib/image-upload.server";

export const Route = createFileRoute("/api/image-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => handleImageUpload(request),
    },
  },
});
