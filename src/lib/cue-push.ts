import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isMartinAccount } from "@/lib/martin";

export { isMartinAccount };

export const getPushPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const sessionMod = await import("@/lib/cue-session.server");
  const sql = await sessionMod.getSqlSafe();
  const push = await import("@/lib/cue-push.server");
  const key = await push.pushPublicKey(sql);
  return { key };
});

export const savePushSubscription = createServerFn({ method: "POST" })
  .validator(
    z.object({
      endpoint: z.string().min(8),
      p256dh: z.string().min(8),
      auth: z.string().min(4),
    }),
  )
  .handler(async ({ data }) => {
    const { assertCueSessionSafeRequest } = await import("@/lib/auth/cue-session-guard.server");
    assertCueSessionSafeRequest();
    const sessionMod = await import("@/lib/cue-session.server");
    const session = await sessionMod.readCueSession();
    if (!session?.account || !isMartinAccount({ ...session.account, id: session.accountId })) {
      return { ok: false as const, error: "Only Martin can turn on these alerts." };
    }
    const sql = await sessionMod.getSqlSafe();
    const push = await import("@/lib/cue-push.server");
    await push.saveMartinSub(sql, String(session.account.id), data);
    return { ok: true as const };
  });
