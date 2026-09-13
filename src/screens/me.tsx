import { useState } from "react";
import { KIND_LABEL, type AccountKind } from "../lib/data";
import { useDream } from "../lib/store";
import { Button, Face, PhotoPick, ScreenHead, TextInput } from "../lib/ui";
import AdminMe from "./admin";

export default function MeScreen() {
  const { session } = useDream();
  const me = session();
  if (!me) return <Gate />;
  if (me.kind === "admin") return <AdminMe />;
  return <PlainMe />;
}

function Gate() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  return (
    <div className="pb-24">
      <ScreenHead kicker="Me" title={mode === "register" ? "Join the room" : mode === "forgot" ? "Reset" : "Sign in"} sub="Email only. The desk does not publish a house WhatsApp." />
      {mode === "login" && <LoginForm onForgot={() => setMode("forgot")} onRegister={() => setMode("register")} />}
      {mode === "register" && <RegisterForm onLogin={() => setMode("login")} />}
      {mode === "forgot" && <ForgotForm onBack={() => setMode("login")} />}
    </div>
  );
}

function LoginForm({ onForgot, onRegister }: { onForgot: () => void; onRegister: () => void }) {
  const { login } = useDream();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(login(email, password));
      }}
    >
      <TextInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@studio.hk" />
      <TextInput label="Password" type="password" value={password} onChange={setPassword} />
      {err && <p className="font-serif text-[14px] text-accent">{err}</p>}
      <Button type="submit">Enter</Button>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="text-[13px] font-semibold text-accent" onClick={onForgot}>
          Forgot password?
        </button>
        <button type="button" className="text-[13px] font-semibold text-muted" onClick={onRegister}>
          Create an account
        </button>
      </div>
      <p className="pt-4 font-serif text-[13px] text-muted">
        Preview desk: admin@indiedream.hk / inner-soul · artist Tess: tess@indiedream.hk / cello · explorer: iris@explore.hk / listen
      </p>
    </form>
  );
}

function RegisterForm({ onLogin }: { onLogin: () => void }) {
  const { register } = useDream();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("Hong Kong");
  const [kind, setKind] = useState<AccountKind>("explorer");
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(register({ name, email, password, kind, city }));
      }}
    >
      <TextInput label="Name" value={name} onChange={setName} />
      <TextInput label="Email" type="email" value={email} onChange={setEmail} />
      <TextInput label="Password" type="password" value={password} onChange={setPassword} />
      <TextInput label="City" value={city} onChange={setCity} />
      <div>
        <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Role</p>
        <div className="flex flex-wrap gap-1.5">
          {(["explorer", "artist", "business"] as AccountKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold ${kind === k ? "bg-accent text-[#faf6ee]" : "border border-line bg-elevated"}`}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
      {err && <p className="font-serif text-[14px] text-accent">{err}</p>}
      <Button type="submit" disabled={!name.trim() || !email.trim() || !password}>
        Create account
      </Button>
      <button type="button" className="block text-[13px] font-semibold text-muted" onClick={onLogin}>
        Already on the books
      </button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { requestReset } = useDream();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(requestReset(email));
      }}
    >
      <TextInput label="Email" type="email" value={email} onChange={setEmail} />
      {msg && <p className="font-serif text-[14px] text-muted">{msg}</p>}
      <Button type="submit">Ask the desk</Button>
      <button type="button" className="block text-[13px] font-semibold text-muted" onClick={onBack}>
        Back to sign in
      </button>
    </form>
  );
}

function PlainMe() {
  const { session, logout, artistByAccount, updateArtistMedia, updateSongCover, addSong } = useDream();
  const me = session()!;
  const artist = artistByAccount(me.id);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  return (
    <div className="pb-24">
      <ScreenHead kicker="Me" title={me.name} sub={`${KIND_LABEL[me.kind]} · ${me.city}`} />
      <div className="mb-5 flex items-center gap-3">
        <Face name={me.name} photo={artist?.photo} size={64} />
        {artist && <PhotoPick label="Profile picture" onPick={(d) => updateArtistMedia(artist.id, d)} />}
      </div>
      <p className="font-serif text-[15px] text-muted">{me.email}</p>
      {me.whatsapp && <p className="font-serif text-[15px] text-muted">WhatsApp on file</p>}
      {artist && (
        <div className="mt-6">
          <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {artist.verified ? "Live on the roster" : "Awaiting desk review"}
          </p>
          <p className="font-serif text-[15px]">{artist.bio || "Add songs and a picture. The desk reviews new roster names."}</p>
          <div className="mt-4 space-y-2">
            {artist.songs.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-line bg-elevated p-3">
                <span className="h-12 w-12 overflow-hidden rounded-lg bg-paper shadow-border">
                  {s.cover ? <img src={s.cover} alt="" className="h-full w-full object-cover" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-semibold">{s.title}</p>
                  <p className="font-serif text-[13px] text-muted">{s.year}</p>
                </div>
                <PhotoPick label="Cover" onPick={(d) => updateSongCover(artist.id, s.id, d)} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <div className="flex-1">
              <TextInput label="New song" value={title} onChange={setTitle} />
            </div>
            <div className="w-24">
              <TextInput label="Year" value={year} onChange={setYear} />
            </div>
          </div>
          <div className="mt-2">
            <Button
              disabled={!title.trim()}
              onClick={() => {
                addSong(artist.id, title.trim(), Number(year) || new Date().getFullYear());
                setTitle("");
              }}
            >
              Add song
            </Button>
          </div>
        </div>
      )}
      <div className="mt-8">
        <Button kind="line" onClick={logout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
