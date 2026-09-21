import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Briefcase, Calendar, Compass, House, LayoutDashboard, MessageSquare, UserRound, Users } from "lucide-react";
import { currentAccount, useCue, type TabId } from "@/lib/store";
import { cn } from "@/lib/utils";
import { setMainScroller, scrollMainToTop } from "@/lib/scroll-main";
import { useT, useLocale, type Msg } from "@/lib/i18n";
import { ArtistsScreen } from "./artists";
import { ArtistProfile } from "./artist-profile";
import { DiscoverScreen } from "./discover";
import { EventsFab, EventsScreen } from "./events";
import { BoardFab, BoardScreen } from "./board";
import { MeScreen } from "./me";
import { HomeScreen } from "./home";
import { ServicesScreen } from "./services";
import { Player } from "./player";
import { Gate } from "./gate";
import { Splash } from "./splash";
import { InstallBanner, OfflineBanner } from "./pwa-chrome";
import { dropLegacyStudioCache, registerServiceWorker } from "@/lib/pwa";

function consumeHardwareBack() {
  const s = useCue.getState();
  if (s.gate) {
    s.setGate(null);
    return true;
  }
  if (s.eventComposer) {
    s.setEventComposer(false);
    return true;
  }
  if (s.noticeId) {
    s.openNotice(null);
    return true;
  }
  if (s.artistId) {
    s.closeArtist();
    return true;
  }
  if (s.eventId) {
    s.openEvent(null);
    return true;
  }
  if (s.postId) {
    s.openPost(null);
    return true;
  }
  if (s.genre) {
    s.openGenre(null);
    return true;
  }
  if (s.servicePanel) {
    s.openService(null);
    return true;
  }
  if (s.meMode !== "idle") {
    s.setMeMode("idle");
    return true;
  }
  if (s.tab !== "home") {
    s.setTab("home");
    return true;
  }
  return false;
}

const TABS: Array<{ id: TabId; label: Msg; icon: typeof Users }> = [
  { id: "artists", label: "tabArtists", icon: Users },
  { id: "discover", label: "tabDiscover", icon: Compass },
  { id: "events", label: "tabEvents", icon: Calendar },
  { id: "home", label: "tabHome", icon: House },
  { id: "board", label: "tabBoard", icon: MessageSquare },
  { id: "services", label: "tabServices", icon: Briefcase },
  { id: "me", label: "tabMe", icon: UserRound },
];

export function AppShell() {
  const tab = useCue((s) => s.tab);
  const artistId = useCue((s) => s.artistId);
  const eventId = useCue((s) => s.eventId);
  const postId = useCue((s) => s.postId);
  const genre = useCue((s) => s.genre);
  const servicePanel = useCue((s) => s.servicePanel);
  const noticeId = useCue((s) => s.noticeId);
  const meMode = useCue((s) => s.meMode);
  const eventComposer = useCue((s) => s.eventComposer);
  const setTab = useCue((s) => s.setTab);
  const hydrate = useCue((s) => s.hydrate);
  const session = useCue((s) => currentAccount(s));
  const inboxPending = useCue((s) => s.notices.reduce((n, x) => n + (x.status === "pending" && x.kind !== "enquiry" ? 1 : 0), 0));
  const enquiryPending = useCue((s) => s.notices.reduce((n, x) => n + (x.status === "pending" && x.kind === "enquiry" ? 1 : 0), 0));
  const admin = session?.kind === "admin";
  const masthead = tab === "home";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const { locale, hydrateLocale } = useLocale();
  const [leaveHint, setLeaveHint] = useState(false);
  const leaveArmed = useRef(0);

  useEffect(() => {
    dropLegacyStudioCache();
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    hydrateLocale();
  }, [hydrateLocale]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-Hant" : "en";
  }, [locale]);

  useEffect(() => {
    setMainScroller(scrollerRef.current);
    return () => setMainScroller(null);
  }, []);

  useLayoutEffect(() => {
    scrollMainToTop();
  }, [tab, artistId, eventId, postId, genre, servicePanel, noticeId, meMode, eventComposer]);

  useEffect(() => {
    const pushGuard = () => {
      try {
        window.history.pushState({ cueGuard: 1 }, "", window.location.href);
      } catch {
        /* ignore */
      }
    };
    pushGuard();
    const onPop = () => {
      if (consumeHardwareBack()) {
        pushGuard();
        return;
      }
      const now = Date.now();
      if (now - leaveArmed.current < 2000) {
        leaveArmed.current = 0;
        setLeaveHint(false);
        window.history.back();
        return;
      }
      leaveArmed.current = now;
      pushGuard();
      setLeaveHint(true);
      window.setTimeout(() => setLeaveHint(false), 2000);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg text-fg pt-[env(safe-area-inset-top)]">
      {masthead ? (
        <header className="z-30 shrink-0 bg-bg/95 px-5 pt-3 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-2xl leading-none tracking-tight">Dreamin' Indie</p>
            <PoweredBy />
          </div>
          <div className="mx-auto max-w-lg">
            <p className="mt-2 text-center text-sm italic text-muted">{t("tagline")}</p>
            <div className="rule-double mt-3" />
          </div>
        </header>
      ) : (
        <header className="z-30 shrink-0 border-b border-line bg-bg/95 px-5 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <button type="button" className="font-display text-xl leading-none tracking-tight" onClick={() => setTab("home")}>
              Dreamin' Indie
            </button>
            <PoweredBy />
          </div>
        </header>
      )}
      <div className="z-40 shrink-0">
        <Player />
      </div>
      <OfflineBanner />

      <main className="relative mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden">
        <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
          {tab === "home" ? <HomeScreen /> : null}
          {tab === "artists" && artistId ? <ArtistProfile id={artistId} /> : null}
          {tab === "artists" && !artistId ? <ArtistsScreen /> : null}
          {tab === "discover" ? <DiscoverScreen /> : null}
          {tab === "events" ? <EventsScreen /> : null}
          {tab === "board" ? <BoardScreen /> : null}
          {tab === "services" ? <ServicesScreen /> : null}
          {tab === "me" || tab === "inbox" ? <MeScreen /> : null}
        </div>

        {tab === "events" && !eventId ? <EventsFab /> : null}
        {tab === "board" && !postId ? <BoardFab /> : null}

        <InstallBanner />
        {leaveHint ? (
          <p
            role="status"
            className="pointer-events-none absolute inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-50 mx-auto w-[min(20rem,calc(100%-2rem))] rounded-md bg-ink px-4 py-2.5 text-center text-sm text-bg"
          >
            {t("leaveAppHint")}
          </p>
        ) : null}

        <nav
          className="z-40 shrink-0 border-t border-line bg-bg/95 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md"
          aria-label="Primary"
          style={{ display: "grid", gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}
        >
          {TABS.map((item) => {
            const Icon = item.id === "me" && admin ? LayoutDashboard : item.icon;
            const label = item.id === "me" && admin ? t("tabDesk") : t(item.label);
            const active = tab === item.id || (tab === "inbox" && item.id === "me");
            const isHome = item.id === "home";
            const badge = admin && item.id === "me" ? inboxPending : admin && item.id === "services" ? enquiryPending : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-muted",
                  active && "text-accent",
                  isHome && "text-fg",
                  isHome && active && "text-accent",
                )}
              >
                <Icon className={cn("size-5", isHome && "size-6")} strokeWidth={active || isHome ? 2.2 : 1.7} />
                <span className="indie-nav-label">{label}</span>
                {badge > 0 ? (
                  <span className="absolute right-1 top-0 flex size-4 items-center justify-center rounded-full bg-accent text-xs text-accent-fg">{badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </main>
      <Gate />
      <Splash />
    </div>
  );
}

function PoweredBy() {
  const t = useT();
  return (
    <a
      href="https://www.instagram.com/haven.innersoulrecords"
      target="_blank"
      rel="noopener noreferrer"
      className="text-right text-xs leading-4 text-muted"
    >
      <span className="cue-kicker block text-subtle">{t("poweredBy")}</span>
      Inner Soul Records
    </a>
  );
}
