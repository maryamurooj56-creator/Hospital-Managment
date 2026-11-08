import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import type { SessionUser } from "@/lib/auth";
import { initials } from "@/lib/format";

const NAV_BY_ROLE = {
  patient: [
    { label: "Overview", href: "/patient", icon: LayoutDashboard },
    { label: "Book a visit", href: "/book", icon: CalendarDays },
    { label: "My records", href: "/patient#records", icon: FileText },
  ],
  doctor: [
    { label: "Overview", href: "/doctor", icon: LayoutDashboard },
    { label: "Appointments", href: "/doctor#appointments", icon: CalendarDays },
    { label: "Prescriptions", href: "/doctor#prescriptions", icon: ClipboardList },
    { label: "Patients", href: "/doctor#patients", icon: Users },
  ],
  admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Appointments", href: "/admin#appointments", icon: CalendarDays },
    { label: "Doctors", href: "/admin#doctors", icon: Stethoscope },
    { label: "Patients", href: "/admin#patients", icon: Users },
    { label: "System logs", href: "/admin#logs", icon: Activity },
  ],
} as const;

export function DashboardShell({
  session,
  title,
  subtitle,
  children,
}: {
  session: SessionUser;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const nav = NAV_BY_ROLE[session.role];
  const RoleIcon = session.role === "admin" ? ShieldCheck : session.role === "doctor" ? Stethoscope : UserRound;

  return (
    <div className="dashboard-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <div className="px-2"><Logo /></div>
        <div className="mt-8 px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Workspace</div>
        <nav className="mt-3 flex flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-[var(--brand)]">
                <Icon size={17} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-[#f1f5ff] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--brand)]"><ShieldCheck size={15} /> Secure session</div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Your records are protected by role-based access and an HTTP-only JWT cookie.</p>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden"><Logo compact /></div>
            <div className="hidden lg:block">
              <h1 className="text-lg font-extrabold text-[var(--navy)]">{title}</h1>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="hidden text-xs font-bold text-slate-500 hover:text-[var(--brand)] sm:block">View website</Link>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand)] text-xs font-extrabold text-white">{initials(session.name)}</span>
                <span className="hidden sm:block">
                  <span className="block text-xs font-bold leading-tight text-[var(--navy)]">{session.name}</span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{session.role}</span>
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-2">
          <nav className="flex gap-2 overflow-x-auto">
            {nav.map((item) => (
              <Link key={item.label} href={item.href} className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <main className="px-4 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 lg:hidden">
            <h1 className="text-2xl font-extrabold text-[var(--navy)]">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="mx-auto max-w-[1240px]">{children}</div>
        </main>
      </div>
      <div className="sr-only"><RoleIcon /></div>
    </div>
  );
}
