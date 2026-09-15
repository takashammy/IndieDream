import { createFileRoute } from "@tanstack/react-router";
import { backupAuthorized, takeStudioBackup } from "@/lib/cue-backup.server";

async function handle(request: Request) {
  const sessionMod = await import("@/lib/cue-session.server");
  const session = await sessionMod.readCueSession().catch(() => null);
  const allowed = backupAuthorized(request) || session?.kind === "admin";
  if (!allowed) {
    return Response.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }
  const result = await takeStudioBackup(session?.kind === "admin" ? "desk" : "cron");
  return Response.json(result, { status: result.ok ? 200 : 500 });
}

export const Route = createFileRoute("/api/backup")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
