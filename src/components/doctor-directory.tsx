"use client";

import { CalendarDays, MapPin, Search, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DEPARTMENTS } from "@/lib/constants";
import type { DoctorView } from "@/lib/data";
import { initials } from "@/lib/format";

export function DoctorDirectory({ doctors }: { doctors: DoctorView[] }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesDepartment = department === "all" || doctor.department === department;
      const matchesSearch =
        !search ||
        [doctor.fullName, doctor.specialty, doctor.department, doctor.qualification]
          .join(" ")
          .toLowerCase()
          .includes(search);
      return matchesDepartment && matchesSearch;
    });
  }, [doctors, query, department]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
        <label className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search doctor, specialty or qualification..."
            className="cw-input !pl-10"
            aria-label="Search doctors"
          />
        </label>
        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="cw-input sm:w-[240px]"
          aria-label="Filter by department"
        >
          <option value="all">All departments</option>
          {DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <p className="mb-4 text-sm font-semibold text-slate-500">
        Showing {filtered.length} of {doctors.length} specialists
      </p>

      {filtered.length === 0 ? (
        <div className="cw-card p-10 text-center text-slate-500">No doctors match your search. Try another specialty or department.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doctor) => (
            <article key={doctor.id} className="cw-card group overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(20,45,90,0.12)]">
              <div className="relative h-[220px] overflow-hidden bg-gradient-to-br from-[#dce9ff] to-[#f3f7ff]">
                {doctor.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doctor.photoUrl} alt={doctor.fullName} loading="lazy" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.04]" />
                ) : (
                  <div className="grid h-full place-items-center text-5xl font-extrabold text-[var(--brand)]">{initials(doctor.fullName)}</div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-[var(--brand)] shadow-sm">{doctor.department}</span>
                <span className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-extrabold text-[#d49300] shadow-sm">
                  <Star size={13} fill="currentColor" /> {(doctor.ratingX10 / 10).toFixed(1)}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-extrabold text-[var(--navy)]">{doctor.fullName}</h3>
                <p className="mt-1 text-sm font-semibold text-[var(--brand)]">{doctor.specialty}</p>
                <p className="mt-3 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500">{doctor.bio ?? doctor.qualification}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><MapPin size={14} /> {doctor.room ?? "CareWell Clinic"}</span>
                  <span>{doctor.experienceYears} yrs exp.</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-extrabold text-[var(--navy)]">${doctor.consultationFee}<span className="text-xs font-medium text-slate-400"> / visit</span></span>
                  <Link href={`/book?doctor=${doctor.id}`} className="cw-btn !min-h-9 !px-3 !text-xs">
                    <CalendarDays size={14} /> Book Now
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
