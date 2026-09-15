import { APP_NAME } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useCue, type GateKind } from "@/lib/store";
import { Sheet } from "./chrome";
import { useT, type Msg } from "@/lib/i18n";

const COPY: Record<Exclude<GateKind, null>, { title: Msg; body: Msg }> = {
  listen: { title: "gateListenTitle", body: "gateListenBody" },
  board: { title: "gateBoardTitle", body: "gateBoardBody" },
  event: { title: "gateEventTitle", body: "gateEventBody" },
  verify: { title: "gateVerifyTitle", body: "gateVerifyBody" },
  register: { title: "gateRegisterTitle", body: "gateRegisterBody" },
};

export function Gate() {
  const gate = useCue((s) => s.gate);
  const setGate = useCue((s) => s.setGate);
  const setMeMode = useCue((s) => s.setMeMode);
  const t = useT();
  if (!gate) return null;
  const copy = COPY[gate];
  return (
    <Sheet title={t(copy.title)} kicker={APP_NAME} onClose={() => setGate(null)}>
      <p className="text-sm leading-6 text-muted">{t(copy.body, { app: APP_NAME })}</p>
      <div className="mt-5 flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={() => {
            setGate(null);
            setMeMode("register");
          }}
        >
          {t("register")}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setGate(null);
            setMeMode("login");
          }}
        >
          {t("haveAccount")}
        </Button>
      </div>
    </Sheet>
  );
}
