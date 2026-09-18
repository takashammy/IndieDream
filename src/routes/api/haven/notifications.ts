import { createFileRoute } from "@tanstack/react-router";
import { buildHavenDashboardPayload, havenDashboardAuthorized } from "@/lib/haven-dashboard.server";

export const Route = createFileRoute("/api/haven/notifications")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!havenDashboardAuthorized(request)) {
          return Response.json({ ok: false, error: "Forbidden." }, { status: 403 });
        }
        const payload = await buildHavenDashboardPayload(request);
        if ("error" in payload) {
          return Response.json({ ok: false, error: payload.error }, { status: 500 });
        }
        return Response.json(payload);
      },
    },
  },
});
