import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeHavenStats, mapHavenNotifications, noticeDeepLink } from "./haven-dashboard.shared.ts";
import type { Notice } from "./store.ts";

describe("computeHavenStats", () => {
  it("counts queue, bookings, and roster stats", () => {
    const notices: Notice[] = [
      {
        id: "n1",
        kind: "verify",
        title: "Verify artist",
        body: "",
        status: "pending",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "n2",
        kind: "enquiry",
        title: "Lesson",
        body: "",
        status: "pending",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "n3",
        kind: "enquiry",
        title: "Done",
        body: "",
        status: "completed",
        createdAt: "2026-01-03T00:00:00.000Z",
      },
    ];
    const stats = computeHavenStats({
      notices,
      artists: [
        {
          id: "art-1",
          name: "Live Artist",
          role: "Vocalist",
          city: "HK Island",
          area: "HK Island",
          photo: "",
          genres: [],
          bio: "",
          songs: [
            {
              id: "song-1",
              title: "Demo",
              duration: "3:00",
              plays: "0",
              cover: "",
              uploadedAt: "2026-01-01T00:00:00.000Z",
              status: "approved",
            },
          ],
          label: "Independent",
          labelApproved: false,
          verified: true,
        },
      ],
      events: [
        {
          id: "e1",
          title: "Gig",
          date: "Jan 1",
          weekday: "Thu",
          time: "8pm",
          venue: "Venue",
          area: "HK Island",
          photo: "",
          artistIds: [],
          blurb: "",
          isoDate: "2026-01-01",
          status: "pending",
        },
      ],
    });
    assert.equal(stats.pendingQueue, 1);
    assert.equal(stats.pendingBookings, 1);
    assert.equal(stats.completedBookings, 1);
    assert.equal(stats.pendingDates, 1);
    assert.equal(stats.liveRoster, 1);
  });
});

describe("mapHavenNotifications", () => {
  it("maps notice labels and deep links", () => {
    const notices: Notice[] = [
      {
        id: "n-abc",
        kind: "song",
        title: "Track — Demo",
        body: "Review me",
        status: "pending",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const mapped = mapHavenNotifications(notices, "https://dreamin.example.com");
    assert.equal(mapped[0]?.kindLabel, "Track review");
    assert.equal(mapped[0]?.statusLabel, "Pending");
    assert.equal(noticeDeepLink("https://dreamin.example.com", "n-abc"), mapped[0]?.deepLink);
  });
});
