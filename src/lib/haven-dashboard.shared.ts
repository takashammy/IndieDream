import { APP_NAME, isListedArtist, type Artist, type CueEvent } from "./data.ts";
import type { Notice, NoticeKind, NoticeStatus } from "./store.ts";

const PROJECT_ID = "indiedream";

const NOTICE_KIND_LABEL: Record<NoticeKind, string> = {
  verify: "Artist verification",
  label: "Label request",
  event: "Event",
  song: "Track review",
  enquiry: "Enquiry",
};

const NOTICE_STATUS_LABEL: Record<NoticeStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  completed: "Completed",
};

export type HavenDashboardStats = {
  pendingQueue: number;
  pendingBookings: number;
  completedBookings: number;
  pendingDates: number;
  awaitingArtists: number;
  liveRoster: number;
};

export type HavenDashboardNotification = {
  id: string;
  kind: NoticeKind;
  kindLabel: string;
  title: string;
  body: string;
  status: NoticeStatus;
  statusLabel: string;
  refId?: string;
  createdAt: string;
  fields?: Record<string, string>;
  deepLink: string;
};

export type HavenDashboardPayload = {
  project: typeof PROJECT_ID;
  projectName: typeof APP_NAME;
  adminUrl: string;
  stats: HavenDashboardStats;
  notifications: HavenDashboardNotification[];
};

export function noticeDeepLink(adminBase: string, noticeId: string) {
  return `${adminBase.replace(/\/$/, "")}/desk?notice=${encodeURIComponent(noticeId)}`;
}

export function computeHavenStats(input: {
  notices: Notice[];
  artists: Artist[];
  events: CueEvent[];
}): HavenDashboardStats {
  const pendingQueue = input.notices.filter((n) => n.status === "pending" && n.kind !== "enquiry").length;
  const pendingBookings = input.notices.filter((n) => n.kind === "enquiry" && n.status === "pending").length;
  const completedBookings = input.notices.filter((n) => n.kind === "enquiry" && n.status === "completed").length;
  const pendingDates = input.events.filter((e) => e.status === "pending").length;
  const awaitingArtists = input.artists.filter((a) => !isListedArtist(a)).length;
  const liveRoster = input.artists.filter((a) => isListedArtist(a)).length;
  return {
    pendingQueue,
    pendingBookings,
    completedBookings,
    pendingDates,
    awaitingArtists,
    liveRoster,
  };
}

export function mapHavenNotifications(notices: Notice[], adminBase: string): HavenDashboardNotification[] {
  return [...notices]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((notice) => ({
      id: notice.id,
      kind: notice.kind,
      kindLabel: NOTICE_KIND_LABEL[notice.kind] ?? notice.kind,
      title: notice.title,
      body: notice.body,
      status: notice.status,
      statusLabel: NOTICE_STATUS_LABEL[notice.status] ?? notice.status,
      refId: notice.refId,
      createdAt: notice.createdAt,
      fields: notice.fields,
      deepLink: noticeDeepLink(adminBase, notice.id),
    }));
}

export function parseHavenNotice(raw: Record<string, unknown>): Notice {
  const kind = String(raw.kind ?? "enquiry") as NoticeKind;
  const status = String(raw.status ?? "pending") as NoticeStatus;
  return {
    id: String(raw.id ?? ""),
    kind,
    title: String(raw.title ?? ""),
    body: String(raw.body ?? ""),
    status,
    refId: raw.refId != null ? String(raw.refId) : undefined,
    createdAt: String(raw.createdAt ?? new Date(0).toISOString()),
    fields:
      raw.fields && typeof raw.fields === "object"
        ? Object.fromEntries(
            Object.entries(raw.fields as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]),
          )
        : undefined,
  };
}

export { APP_NAME, PROJECT_ID };
