import type { ReactNode } from "react";
import { initials } from "./data";

export function ScreenHead({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <header className="mb-5">
      {kicker && (
        <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{kicker}</p>
      )}
      <h1 className="font-display text-[1.7rem] font-semibold leading-tight text-ink">{title}</h1>
      {sub && <p className="mt-1 font-serif text-[15px] leading-snug text-muted">{sub}</p>}
    </header>
  );
}

export function BackRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 text-left font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-accent"
    >
      ← {label}
    </button>
  );
}

export function Button({
  children,
  onClick,
  kind = "solid",
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "solid" | "ghost" | "line";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-[13px] font-semibold tracking-wide disabled:opacity-40";
  const skin =
    kind === "solid"
      ? "bg-accent text-[#faf6ee] hover:bg-accent-dark"
      : kind === "line"
        ? "border border-line bg-elevated text-ink"
        : "text-accent";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${skin} ${className}`}>
      {children}
    </button>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
}) {
  const cls =
    "w-full rounded-xl border border-line bg-elevated px-3 py-2 text-[15px] text-ink outline-none focus:border-accent";
  return (
    <label className="block">
      <span className="mb-1 block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      {textarea ? (
        <textarea className={`${cls} min-h-[96px] resize-y font-serif`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function FilterChips({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex w-full flex-nowrap gap-1.5 overflow-x-auto pb-1">
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold ${
              on ? "bg-accent text-[#faf6ee]" : "border border-line bg-elevated text-muted"
            }`}
          >
            {it.label}
            {typeof it.count === "number" && <span className="ml-1 tabular opacity-80">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Face({ name, photo, size = 36 }: { name: string; photo?: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper font-display text-[11px] font-semibold text-accent shadow-border"
      style={{ width: size, height: size }}
    >
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}

export function Card({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  const cls = `rounded-2xl border border-line bg-elevated p-4 ${onClick ? "cursor-pointer" : ""} ${className}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} w-full text-left`}>
        {children}
      </button>
    );
  }
  return <div className={cls}>{children}</div>;
}

export function PhotoPick({ label, onPick }: { label: string; onPick: (dataUrl: string) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center rounded-full border border-line bg-elevated px-3 py-1.5 text-[12px] font-semibold text-ink">
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const { readLocalImage } = await import("./store");
          onPick(await readLocalImage(file));
          e.target.value = "";
        }}
      />
    </label>
  );
}
