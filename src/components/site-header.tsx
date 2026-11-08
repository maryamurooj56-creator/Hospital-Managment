"use client";

import { CalendarDays, ChevronDown, Menu, PhoneCall, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { EMERGENCY_PHONE } from "@/lib/constants";
import { roleHome } from "@/lib/format";
import type { UserRole } from "@/db/schema";

type HeaderSession = { name: string; role: UserRole } | null;

const NAV = [
  { label: "Home", href: "/#home" },
  { label: "About Us", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Doctors", href: "/#doctors" },
  { label: "Departments", href: "/#departments" },
  { label: "Contact Us", href: "/#contact" },
];

export function SiteHeader({ session }: { session?: HeaderSession }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="cw-container flex h-[74px] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[13px] font-semibold text-[#40506c] transition hover:text-[var(--brand)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 xl:flex">
          <a href={`tel:${EMERGENCY_PHONE.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-[var(--brand)]">
              <PhoneCall size={16} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c8aa1]">24/7 Emergency</span>
              <span className="text-[12px] font-extrabold text-[#17376f]">{EMERGENCY_PHONE}</span>
            </span>
          </a>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {session ? (
            <>
              <Link href={roleHome(session.role)} className="cw-btn-outline !min-h-10 !px-3.5 !text-[13px]">
                Dashboard <ChevronDown size={14} />
              </Link>
              <LogoutButton className="!px-2" />
            </>
          ) : (
            <Link href="/login" className="hidden text-[13px] font-bold text-[#40506c] hover:text-[var(--brand)] xl:block">
              Sign in
            </Link>
          )}
          <Link href="/book" className="cw-btn !min-h-10 !px-4 !text-[13px]">
            <CalendarDays size={16} /> Book Appointment
          </Link>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-[var(--navy)] lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#40506c] hover:bg-blue-50"
              >
                {item.label}
              </Link>
            ))}
            {session && (
              <Link href={roleHome(session.role)} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--brand)] hover:bg-blue-50">
                My dashboard
              </Link>
            )}
            {!session && (
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#40506c] hover:bg-blue-50">
                Sign in
              </Link>
            )}
            <Link href="/book" onClick={() => setOpen(false)} className="cw-btn mt-2">
              <CalendarDays size={16} /> Book Appointment
            </Link>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-[var(--brand)]">
              <PhoneCall size={16} /> 24/7 Emergency · {EMERGENCY_PHONE}
            </div>
            {session && <LogoutButton className="mt-2 justify-start" />}
          </nav>
        </div>
      )}
    </header>
  );
}
