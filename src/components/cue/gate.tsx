import { Button } from "@/components/ui/button";
import { useCue, type GateKind } from "@/lib/store";
import { Sheet } from "./chrome";

const COPY: Record<Exclude<GateKind, null>, { title: string; body: string }> = {
  listen: {
    title: "Register to listen",
    body: "Guests can browse Indie Dream. Playback is for people who have an account.",
  },
  board: {
    title: "Register to post",
    body: "The board is for working musicians. Make an account to join the thread.",
  },
  event: {
    title: "Verified artists only",
    body: "Events are posted by verified artists, then approved by Inner Soul Records. Register as an artist and upload a track to begin.",
  },
  verify: {
    title: "Verification required",
    body: "This is reserved for artists Inner Soul Records has verified. Upload a track, then wait for approval.",
  },
  register: {
    title: "Register to continue",
    body: "Listening, posting, and services all need an Indie Dream account.",
  },
};

export function Gate() {
  const gate = useCue((s) => s.gate);
  const setGate = useCue((s) => s.setGate);
  const setMeMode = useCue((s) => s.setMeMode);
  if (!gate) return null;
  const copy = COPY[gate];
  return (
    <Sheet title={copy.title} kicker="Indie Dream" onClose={() => setGate(null)}>
      <p className="text-sm leading-6 text-muted">{copy.body}</p>
      <div className="mt-5 flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={() => {
            setGate(null);
            setMeMode("register");
          }}
        >
          Register
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setGate(null);
            setMeMode("login");
          }}
        >
          I already have an account
        </Button>
      </div>
    </Sheet>
  );
}
