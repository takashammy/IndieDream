import {
  CalendarDays,
  Compass,
  House,
  LayoutDashboard,
  MessageSquareText,
  Music2,
  UserRound,
  Wrench,
} from "lucide-react";
import { useDream } from "./lib/store";
import BoardScreen from "./screens/board";
import MeScreen from "./screens/me";
import { ArtistsScreen, DiscoverScreen, EventsScreen, HomeScreen, ServicesScreen } from "./screens/public";

const TABS = [
  { id: "artists" as const, label: "Artists", icon: Music2 },
  { id: "discover" as const, label: "Discover", icon: Compass },
  { id: "events" as const, label: "Events", icon: CalendarDays },
  { id: "home" as const, label: "Home", icon: House },
  { id: "board" as const, label: "Board", icon: MessageSquareText },
  { id: "services" as const, label: "Services", icon: Wrench },
  { id: "me" as const, label: "Me", icon: UserRound },
];

export default function App() {
  const { tab, setTab, session, notices, bookings } = useDream();
  const me = session();
  const deskBadge =
    me?.kind === "admin" ? notices.filter((n) => !n.resolved).length + bookings.filter((b) => b.status === "open").length : 0;

  return (
    <div className="mx-auto min-h-dvh max-w-[430px] bg-bg px-4 pb-8 pt-6">
      <main>
        {tab === "home" && <HomeScreen />}
        {tab === "artists" && <ArtistsScreen />}
        {tab === "discover" && <DiscoverScreen />}
        {tab === "events" && <EventsScreen />}
        {tab === "board" && <BoardScreen />}
        {tab === "services" && <ServicesScreen />}
        {tab === "me" && <MeScreen />}
      </main>
      <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[430px] -translate-x-1/2 justify-between border-t border-line bg-elevated/95 px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur">
        {TABS.map((t) => {
          const on = tab === t.id;
          const adminDesk = t.id === "me" && me?.kind === "admin";
          const Icon = adminDesk ? LayoutDashboard : t.icon;
          const label = adminDesk ? "Desk" : t.label;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-semibold ${
                on ? "text-accent" : "text-muted"
              }`}
            >
              <Icon size={18} strokeWidth={on ? 2.4 : 1.8} />
              {label}
              {adminDesk && deskBadge > 0 && (
                <span className="absolute right-2 top-0 rounded-full bg-accent px-1 text-[9px] text-[#faf6ee] tabular">
                  {deskBadge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
