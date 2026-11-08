import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { statusBadge } from "@/lib/format";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "blue",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "blue" | "green" | "amber" | "violet";
}) {
  const tones = {
    blue: "bg-blue-50 text-[#1657e5]",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="cw-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}><Icon size={21} /></span>
        <span className="text-right"><span className="block text-2xl font-extrabold leading-tight text-[var(--navy)]">{value}</span><span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span></span>
      </div>
      {hint && <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Panel({
  id,
  title,
  subtitle,
  actions,
  children,
  padded = true,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section id={id} className="cw-card scroll-mt-24 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-base font-extrabold text-[var(--navy)]">{title}</h2>{subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}</div>
        {actions}
      </div>
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon size={25} /></span>
      <h3 className="mt-4 text-sm font-extrabold text-[var(--navy)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <span className={statusBadge(status)}>{status}</span>;
}

export function Message({ kind, text }: { kind: "success" | "error"; text: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
      {text}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <input className="cw-input sm:w-[280px]" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
  );
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`tab-button ${active === tab.id ? "tab-button-active" : ""}`}>{tab.label}</button>
      ))}
    </div>
  );
}
