import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AccountKind, LocationArea } from "@/lib/data";
import { passwordTooWeak } from "@/lib/pass";

export type AuthAccount = {
  id: string;
  username: string;
  kind: AccountKind;
  name: string;
  role: string;
  location: LocationArea;
  bio: string;
  photo: string;
  email: string;
  whatsapp: string;
  artistId?: string;
  acceptedUploadTerms?: boolean;
  locale?: "en" | "zh";
};

function asAccount(row: Record<string, unknown>): AuthAccount {
  return {
    id: String(row.id ?? ""),
    username: String(row.username ?? ""),
    kind: (row.kind as AccountKind) || "explorer",
    name: String(row.name ?? ""),
    role: String(row.role ?? ""),
    location: (row.location as LocationArea) || "HK Island",
    bio: String(row.bio ?? ""),
    photo: String(row.photo ?? ""),
    email: String(row.email ?? ""),
    whatsapp: String(row.whatsapp ?? ""),
    artistId: row.artistId ? String(row.artistId) : undefined,
    acceptedUploadTerms: Boolean(row.acceptedUploadTerms) || undefined,
    locale: row.locale === "zh" || row.locale === "en" ? row.locale : undefined,
  };
}

export const getAuthState = createServerFn({ method: "GET" }).handler(async () => {
  const sessionMod = await import("@/lib/cue-session.server");
  const sql = await sessionMod.getSqlSafe();
  const session = await sessionMod.readCueSession();
  const admins = await sessionMod.adminCount(sql);
  return {
    needsFirstAdmin: admins === 0,
    setupReady: sessionMod.setupSecretConfigured(),
    session: session ? asAccount(session.account as unknown as Record<string, unknown>) : null,
  };
});

export const loginAccount = createServerFn({ method: "POST" })
  .validator(z.object({ username: z.string().min(1), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { assertCueSessionSafeRequest } = await import("@/lib/auth/cue-session-guard.server");
    assertCueSessionSafeRequest();
    const sessionMod = await import("@/lib/cue-session.server");
    const rate = await import("@/lib/auth-rate-limit.server");
    const sql = await sessionMod.getSqlSafe();
    const name = data.username.trim().toLowerCase();
    const limited = await rate.checkAuthRateLimit(sql, "login", name);
    if (!limited.ok) return limited;
    const accounts = await sessionMod.readStudioAccounts(sql);
    const acc = accounts.find(
      (a) =>
        a.username.toLowerCase() === name ||
        a.email.trim().toLowerCase() === name,
    );
    if (!acc || !(await sessionMod.verifyPassword(acc.password, data.password))) {
      const blocked = await rate.recordAuthFailure(sql, "login", name);
      if (blocked) return blocked;
      return { ok: false as const, error: "Username or password is wrong." };
    }
    await rate.clearAuthRateLimit(sql, "login", name);
    await sessionMod.createSession(sql, acc.id);
    return { ok: true as const, account: asAccount(acc as unknown as Record<string, unknown>) };
  });

export const registerAccount = createServerFn({ method: "POST" })
  .validator(
    z.object({
      username: z.string().min(1),
      password: z.string().min(1),
      email: z.string().min(3),
      kind: z.enum(["artist", "explorer", "business"]),
      name: z.string(),
      role: z.string(),
      location: z.enum(["HK Island", "Kowloon", "New Territories"]),
      bio: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { assertCueSessionSafeRequest } = await import("@/lib/auth/cue-session-guard.server");
    assertCueSessionSafeRequest();
    if (passwordTooWeak(data.password)) {
      return { ok: false as const, error: "Password must be at least 8 characters." };
    }
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false as const, error: "Enter a valid email." };
    }
    const sessionMod = await import("@/lib/cue-session.server");
    const rate = await import("@/lib/auth-rate-limit.server");
    const sql = await sessionMod.getSqlSafe();
    const limited = await rate.checkAuthRateLimit(sql, "register");
    if (!limited.ok) return limited;
    const accounts = await sessionMod.readStudioAccounts(sql);
    const username = data.username.trim();
    if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
      const blocked = await rate.recordAuthFailure(sql, "register");
      if (blocked) return blocked;
      return { ok: false as const, error: "That username is taken." };
    }
    if (accounts.some((a) => a.email.trim().toLowerCase() === email)) {
      const blocked = await rate.recordAuthFailure(sql, "register");
      if (blocked) return blocked;
      return { ok: false as const, error: "That email is already registered." };
    }
    const id = `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const account = {
      id,
      username,
      password: await sessionMod.hashPassword(data.password),
      kind: data.kind,
      name: data.name.trim() || username,
      role: data.role.trim(),
      location: data.location,
      bio: data.bio.trim(),
      photo: "/media/user.jpg",
      email,
      whatsapp: "",
    };
    await sessionMod.writeStudioAccounts(sql, [...accounts, account]);
    await rate.clearAuthRateLimit(sql, "register");
    await sessionMod.createSession(sql, id);
    try {
      const push = await import("@/lib/cue-push.server");
      await push.notifyMartinOfSignup(sql, { name: account.name, kind: account.kind });
    } catch {
      /* signup still succeeds if the alert cannot send */
    }
    return { ok: true as const, account: asAccount(account) };
  });

export const logoutAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { assertCueSessionSafeRequest } = await import("@/lib/auth/cue-session-guard.server");
  assertCueSessionSafeRequest();
  const sessionMod = await import("@/lib/cue-session.server");
  const sql = await sessionMod.getSqlSafe().catch(() => null);
  await sessionMod.clearSession(sql ?? undefined);
  return { ok: true as const };
});

export const createFirstAdmin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      secret: z.string().min(1),
      username: z.string().min(1),
      password: z.string().min(1),
      name: z.string().min(1),
      email: z.string().min(3),
    }),
  )
  .handler(async ({ data }) => {
    const { assertCueSessionSafeRequest } = await import("@/lib/auth/cue-session-guard.server");
    assertCueSessionSafeRequest();
    const sessionMod = await import("@/lib/cue-session.server");
    const rate = await import("@/lib/auth-rate-limit.server");
    const { withStudioTx } = await import("@/lib/db");
    if (!sessionMod.setupSecretOk(data.secret)) {
      const sql = await sessionMod.getSqlSafe();
      const blocked = await rate.recordAuthFailure(sql, "createFirstAdmin");
      if (blocked) return blocked;
      return { ok: false as const, error: "Setup key is wrong." };
    }
    if (passwordTooWeak(data.password)) {
      return { ok: false as const, error: "Password must be at least 8 characters." };
    }
    const limited = await rate.checkAuthRateLimit(await sessionMod.getSqlSafe(), "createFirstAdmin");
    if (!limited.ok) return limited;

    return withStudioTx(async (tx) => {
      if ((await sessionMod.adminCount(tx)) > 0) {
        return { ok: false as const, error: "An admin already exists. Log in instead." };
      }
      const accounts = await sessionMod.readStudioAccounts(tx);
      const username = data.username.trim();
      if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
        return { ok: false as const, error: "That username is taken." };
      }
      const id = `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const account = {
        id,
        username,
        password: await sessionMod.hashPassword(data.password),
        kind: "admin" as const,
        name: data.name.trim(),
        role: "Admin",
        location: "HK Island" as const,
        bio: "Inner Soul Records.",
        photo: "/media/covers/vinyl.jpg",
        email: data.email.trim(),
        whatsapp: "",
      };
      await sessionMod.writeStudioAccounts(tx, [...accounts, account]);
      await rate.clearAuthRateLimit(tx, "createFirstAdmin");
      await sessionMod.createSession(tx, id);
      return { ok: true as const, account: asAccount(account) };
    });
  });
