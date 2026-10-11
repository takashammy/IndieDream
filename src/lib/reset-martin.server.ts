/**
 * One-shot founder password recovery for username `martin`.
 *
 * Vercel-only: set MARTIN_PASSWORD_RESET_SECRET + MARTIN_TEMP_PASSWORD on
 * Production, open /api/reset-martin once (secret in query or header), then
 * REMOVE both env vars and redeploy. Do not leave this configured.
 *
 * Prefer POST; GET with ?secret= is allowed so Martin can open one URL in a
 * browser with no Terminal.
 */
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env.server";

const TARGET_USERNAME = "martin";

function resetSecretConfigured() {
  return Boolean(env("MARTIN_PASSWORD_RESET_SECRET") && env("MARTIN_TEMP_PASSWORD"));
}

function expectedSecret() {
  return env("MARTIN_PASSWORD_RESET_SECRET") ?? "";
}

function tempPassword() {
  return env("MARTIN_TEMP_PASSWORD") ?? "";
}

function secretOk(given: string) {
  const expected = expectedSecret();
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function secretFromRequest(request: Request): string {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("secret")?.trim() || "";
  if (fromQuery) return fromQuery;
  const fromHeader = request.headers.get("x-martin-reset-secret")?.trim() || "";
  if (fromHeader) return fromHeader;
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return "";
}

function jsonError(status: number, error: string) {
  return Response.json({ ok: false, error }, { status });
}

export async function handleResetMartin(request: Request): Promise<Response> {
  // Security: remove MARTIN_PASSWORD_RESET_SECRET and MARTIN_TEMP_PASSWORD from
  // Vercel after a successful reset. This endpoint is one-shot recovery only.
  try {
    if (!resetSecretConfigured()) {
      return jsonError(503, "Reset not configured.");
    }

    const plain = tempPassword();
    if (plain.length < 8) {
      return jsonError(503, "Reset not configured.");
    }

    const sessionMod = await import("@/lib/cue-session.server");
    const rate = await import("@/lib/auth-rate-limit.server");
    const sql = await sessionMod.getSqlSafe();

    // Pass `request` so Nitro mirrors (no TanStack ALS) still rate-limit by IP.
    const limited = await rate.checkAuthRateLimit(sql, "resetMartin", undefined, request);
    if (!limited.ok) {
      return jsonError(429, limited.error);
    }

    const given = secretFromRequest(request);
    if (!secretOk(given)) {
      const blocked = await rate.recordAuthFailure(sql, "resetMartin", undefined, request);
      if (blocked) {
        return jsonError(429, blocked.error);
      }
      return jsonError(403, "Forbidden.");
    }

    const { withStudioTx } = await import("@/lib/db");
    const result = await withStudioTx(async (tx) => {
      const accounts = await sessionMod.readStudioAccounts(tx);
      const idx = accounts.findIndex(
        (a) => a && String(a.username ?? "").toLowerCase() === TARGET_USERNAME,
      );
      if (idx < 0) {
        return { ok: false as const, error: "Could not complete reset.", status: 404 };
      }
      const hashed = await sessionMod.hashPassword(plain);
      const next = accounts.map((a, i) => (i === idx ? { ...a, password: hashed } : a));
      await sessionMod.writeStudioAccounts(tx, next);
      await rate.clearAuthRateLimit(tx, "resetMartin", undefined, request);
      return {
        ok: true as const,
        username: accounts[idx].username,
        message:
          "Password updated for martin. Log in with the temporary password, change it from Me, then remove MARTIN_PASSWORD_RESET_SECRET and MARTIN_TEMP_PASSWORD from Vercel.",
      };
    });

    if (!result.ok) {
      return jsonError(result.status, result.error);
    }
    return Response.json({
      ok: true,
      username: result.username,
      message: result.message,
    });
  } catch {
    return jsonError(500, "Could not complete reset.");
  }
}
