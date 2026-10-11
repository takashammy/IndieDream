import { timingSafeEqual } from "node:crypto";
import type { Artist, CueEvent } from "@/lib/data";
import { env, havenDashboardSecret, isWorkspacePreview } from "@/lib/env.server";
import {
  APP_NAME,
  computeHavenStats,
  mapHavenNotifications,
  parseHavenNotice,
  PROJECT_ID,
  type HavenDashboardPayload,
} from "@/lib/haven-dashboard.shared";

const STUDIO_ID = "indie-dream";

export type {
  HavenDashboardNotification,
  HavenDashboardPayload,
  HavenDashboardStats,
} from "@/lib/haven-dashboard.shared";
export { computeHavenStats, mapHavenNotifications, noticeDeepLink } from "@/lib/haven-dashboard.shared";

function tokenOk(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isProductionDeploy() {
  return Boolean(
    env("DATABASE_URL") || env("GROK_PROJECT_ID") || process.env.NODE_ENV === "production",
  );
}

export function havenDashboardAuthorized(request: Request) {
  const expected = havenDashboardSecret() || "";
  const header = request.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (expected) return tokenOk(token, expected);
  if (isProductionDeploy()) return false;
  return isWorkspacePreview();
}

export function resolveHavenAdminBase(request: Request): string {
  const explicit =
    env("SITE_URL") || env("BETTER_AUTH_URL") || env("VERCEL_URL") || env("INDIEDREAM_SITE_URL");
  if (explicit) {
    const trimmed = explicit.replace(/\/$/, "");
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  }
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function asArray<T>(value: unknown): T[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

export async function buildHavenDashboardPayload(request: Request): Promise<HavenDashboardPayload | { error: string }> {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{
      artists: unknown;
      events: unknown;
      notices: unknown;
    }>(
      `select artists, events, notices from cue_studio where id = $1`,
      [STUDIO_ID],
    );
    const row = rows[0];
    if (!row) return { error: "Studio not found." };

    const adminBase = resolveHavenAdminBase(request);
    const notices = asArray<Record<string, unknown>>(row.notices).map(parseHavenNotice);
    const artists = asArray<Artist>(row.artists);
    const events = asArray<CueEvent>(row.events);

    return {
      project: PROJECT_ID,
      projectName: APP_NAME,
      adminUrl: `${adminBase.replace(/\/$/, "")}/desk`,
      stats: computeHavenStats({ notices, artists, events }),
      notifications: mapHavenNotifications(notices, adminBase),
    };
  } catch {
    return { error: "Could not load studio data." };
  }
}
