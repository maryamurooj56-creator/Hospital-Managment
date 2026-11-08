"use client";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileUp,
  Search,
  ShieldCheck,
  Stethoscope,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LogoutButton } from "@/components/logout-button";
import { DEPARTMENTS, TIME_SLOTS } from "@/lib/constants";
import type { DoctorView } from "@/lib/data";
import { initials, roleHome } from "@/lib/format";
import type { SessionUser } from "@/lib/auth";

type BookingFlowProps = {
  doctors: DoctorView[];
  initialSession: SessionUser | null;
  preselectedDoctorId?: number;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}

export function BookingFlow({ doctors, initialSession, preselectedDoctorId }: BookingFlowProps) {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(initialSession);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [department, setDepartment] = useState("all");
  const [query, setQuery] = useState("");
  const [minDate, setMinDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmation, setConfirmation] = useState<{ id: number; doctor: string; date: string; time: string } | null>(null);
  const [auth, setAuth] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [booking, setBooking] = useState({
    doctorId: preselectedDoctorId ? String(preselectedDoctorId) : "",
    appointmentDate: "",
    timeSlot: "",
    reason: "",
  });

  useEffect(() => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    setMinDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
  }, []);

  const filteredDoctors = useMemo(() => {
    const search = query.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesDepartment = department === "all" || doctor.department === department;
      const matchesSearch = !search || `${doctor.fullName} ${doctor.specialty} ${doctor.department}`.toLowerCase().includes(search);
      return matchesDepartment && matchesSearch && doctor.isAvailable;
    });
  }, [doctors, department, query]);

  const selectedDoctor = doctors.find((doctor) => doctor.id === Number(booking.doctorId));

  function updateBooking(key: keyof typeof booking, value: string) {
    setBooking((current) => ({ ...current, [key]: value }));
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (authMode === "register" && auth.password !== auth.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const payload = authMode === "login"
        ? { email: auth.email, password: auth.password }
        : { fullName: auth.fullName, email: auth.email, phone: auth.phone, password: auth.password, dateOfBirth: "", gender: "" };
      const data = await requestJson<{ user: { id: number; fullName: string; email: string; role: "admin" | "doctor" | "patient" }; redirectTo: string }>(
        `/api/auth/${authMode}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      );
      if (data.user.role !== "patient") {
        setSession({ id: data.user.id, email: data.user.email, name: data.user.fullName, role: data.user.role });
        setError("That account is not a patient account. Please sign out and use a patient account to book.");
        return;
      }
      setSession({ id: data.user.id, email: data.user.email, name: data.user.fullName, role: "patient" });
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!session) {
      setError("Please sign in or create an account first");
      return;
    }
    if (!booking.doctorId || !booking.appointmentDate || !booking.timeSlot || booking.reason.trim().length < 5) {
      setError("Please complete every booking field");
      return;
    }
    setBusy(true);
    try {
      const data = await requestJson<{ appointment: { id: number } }>("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: Number(booking.doctorId),
          appointmentDate: booking.appointmentDate,
          timeSlot: booking.timeSlot,
          reason: booking.reason,
        }),
      });

      if (file) {
        const upload = new FormData();
        upload.append("file", file);
        upload.append("appointmentId", String(data.appointment.id));
        try {
          await requestJson("/api/uploads", { method: "POST", body: upload });
        } catch {
          setNotice("Your appointment was booked, but the optional document could not be uploaded. You can add it from your dashboard.");
        }
      }

      setConfirmation({
        id: data.appointment.id,
        doctor: selectedDoctor?.fullName ?? "Your specialist",
        date: booking.appointmentDate,
        time: booking.timeSlot,
      });
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to book appointment");
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-2xl py-14 text-center fade-in">
        <div className="cw-card p-8 sm:p-12">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-50 text-green-600"><CheckCircle2 size={34} /></span>
          <span className="eyebrow mt-6 block">Appointment requested</span>
          <h1 className="mt-2 text-3xl font-extrabold text-[var(--navy)]">You&apos;re all set, {session?.name.split(" ")[0]}!</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Your request has been received. The care team will confirm it shortly, and you can track its status in your dashboard.</p>
          <div className="mt-7 grid gap-3 rounded-xl bg-[#f5f8fd] p-5 text-left text-sm sm:grid-cols-2">
            <div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Reference</span><span className="font-extrabold text-[var(--navy)]">#CW-{String(confirmation.id).padStart(5, "0")}</span></div>
            <div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Doctor</span><span className="font-extrabold text-[var(--navy)]">{confirmation.doctor}</span></div>
            <div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Date</span><span className="font-extrabold text-[var(--navy)]">{confirmation.date}</span></div>
            <div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Time</span><span className="font-extrabold text-[var(--navy)]">{confirmation.time}</span></div>
          </div>
          {notice && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">{notice}</p>}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/patient" className="cw-btn">Go to my dashboard</Link>
            <Link href="/" className="cw-btn-outline"><ArrowLeft size={16} /> Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (session && session.role !== "patient") {
    return (
      <div className="mx-auto max-w-xl py-16">
        <div className="cw-card p-8 text-center">
          <Stethoscope className="mx-auto text-[var(--brand)]" size={38} />
          <h1 className="mt-4 text-2xl font-extrabold text-[var(--navy)]">Patient account required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">You are signed in as a {session.role}. Please sign out and use a patient account to book an appointment, or continue to your workspace.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={roleHome(session.role)} className="cw-btn">Open {session.role} dashboard</Link>
            <LogoutButton className="border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:py-14">
      <div>
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--brand)]"><ArrowLeft size={15} /> Back to home</Link>
        <span className="eyebrow">Book an appointment</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--navy)] sm:text-4xl">Let&apos;s find the right care for you</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Choose a specialist, select a convenient time and tell us about your visit. No phone queue required.</p>

        {!session && (
          <section className="cw-card mt-7 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[var(--navy)]">Step 1 · Your account</h2>
                <p className="text-xs text-slate-500">Create a patient account or sign in to secure your booking.</p>
              </div>
              <ShieldCheck size={22} className="text-[var(--brand)]" />
            </div>
            <div className="mb-4 flex rounded-lg bg-slate-100 p-1">
              {(["register", "login"] as const).map((value) => (
                <button key={value} type="button" onClick={() => { setAuthMode(value); setError(""); }} className={`flex-1 rounded-md py-2 text-xs font-bold ${authMode === value ? "bg-white text-[var(--brand)] shadow-sm" : "text-slate-500"}`}>
                  {value === "register" ? "New patient" : "Already registered"}
                </button>
              ))}
            </div>
            <form onSubmit={submitAuth} className="grid gap-3 sm:grid-cols-2">
              {authMode === "register" && (
                <label className="sm:col-span-2"><span className="cw-label">Full name *</span><input className="cw-input" required value={auth.fullName} onChange={(event) => setAuth({ ...auth, fullName: event.target.value })} placeholder="Your full name" /></label>
              )}
              <label className={authMode === "login" ? "sm:col-span-2" : ""}><span className="cw-label">Email *</span><input className="cw-input" type="email" required value={auth.email} onChange={(event) => setAuth({ ...auth, email: event.target.value })} placeholder="you@example.com" /></label>
              {authMode === "register" && <label><span className="cw-label">Phone</span><input className="cw-input" value={auth.phone} onChange={(event) => setAuth({ ...auth, phone: event.target.value })} placeholder="+1 323 555 0100" /></label>}
              <label><span className="cw-label">Password *</span><input className="cw-input" type="password" required minLength={8} value={auth.password} onChange={(event) => setAuth({ ...auth, password: event.target.value })} placeholder="At least 8 characters" /></label>
              {authMode === "register" && <label><span className="cw-label">Confirm password *</span><input className="cw-input" type="password" required minLength={8} value={auth.confirmPassword} onChange={(event) => setAuth({ ...auth, confirmPassword: event.target.value })} placeholder="Repeat password" /></label>}
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className="cw-btn">{busy ? "Please wait..." : authMode === "login" ? "Sign in & continue" : "Create account & continue"}</button>
                {authMode === "login" && (
                  <button type="button" onClick={() => setAuth({ ...auth, email: "patient@carewell.test", password: "CareWell@123" })} className="text-xs font-bold text-[var(--brand)] underline underline-offset-4">Use demo patient</button>
                )}
              </div>
            </form>
          </section>
        )}

        <form onSubmit={submitBooking} className={`cw-card mt-7 p-5 sm:p-6 ${!session ? "opacity-70" : ""}`}>
          <fieldset disabled={!session || busy} className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-[var(--navy)]">Step 2 · Choose your specialist</h2>
              <p className="text-xs text-slate-500">Filter by department or search by name and specialty.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px]">
                <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="cw-input !pl-9" placeholder="Search doctors..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
                <select className="cw-input" value={department} onChange={(event) => setDepartment(event.target.value)}>
                  <option value="all">All departments</option>
                  {DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="mt-4 grid max-h-[330px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {filteredDoctors.map((doctor) => {
                  const active = booking.doctorId === String(doctor.id);
                  return (
                    <button key={doctor.id} type="button" onClick={() => updateBooking("doctorId", String(doctor.id))} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-[var(--brand)] bg-blue-50/70 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300"}`}>
                      {doctor.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={doctor.photoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-100 text-sm font-extrabold text-[var(--brand)]">{initials(doctor.fullName)}</span>
                      )}
                      <span className="min-w-0"><span className="block truncate text-sm font-extrabold text-[var(--navy)]">{doctor.fullName}</span><span className="block truncate text-xs font-semibold text-[var(--brand)]">{doctor.specialty}</span><span className="block text-[11px] text-slate-400">${doctor.consultationFee} · {doctor.experienceYears} yrs</span></span>
                    </button>
                  );
                })}
                {filteredDoctors.length === 0 && <p className="col-span-full rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">No available specialists match those filters.</p>}
              </div>
            </div>

            <div className="grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <label><span className="cw-label"><CalendarDays size={14} className="mr-1 inline" /> Preferred date *</span><input className="cw-input" type="date" required min={minDate} value={booking.appointmentDate} onChange={(event) => updateBooking("appointmentDate", event.target.value)} /></label>
              <div><span className="cw-label">Visit reason *</span><textarea className="cw-input !min-h-[46px]" rows={2} required minLength={5} value={booking.reason} onChange={(event) => updateBooking("reason", event.target.value)} placeholder="Briefly describe your symptoms or reason for visit" /></div>
            </div>

            <div>
              <span className="cw-label"><Clock3 size={14} className="mr-1 inline" /> Available time slots *</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {TIME_SLOTS.map((slot) => (
                  <button key={slot} type="button" onClick={() => updateBooking("timeSlot", slot)} className={`rounded-lg border px-2 py-2.5 text-xs font-bold transition ${booking.timeSlot === slot ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>{slot}</button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-[#f7faff] p-4">
              <UploadCloud size={22} className="shrink-0 text-[var(--brand)]" />
              <span className="min-w-0"><span className="block text-sm font-bold text-[var(--navy)]">Attach a report or referral (optional)</span><span className="block truncate text-xs text-slate-500">{file ? file.name : "PDF, Word, text or image · max 3 MB"}</span></span>
              <input type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              <FileUp size={17} className="ml-auto text-slate-400" />
            </label>

            {error && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}</div>}
            {!session && <p className="text-xs font-semibold text-slate-500">Complete Step 1 to enable appointment confirmation.</p>}

            <button type="submit" disabled={!session || busy} className="cw-btn w-full sm:w-auto">
              <CalendarDays size={17} /> {busy ? "Confirming..." : "Confirm Appointment"}
            </button>
          </fieldset>
        </form>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <div className="cw-card overflow-hidden">
          <div className="bg-gradient-to-br from-[#123b85] to-[#1657e5] p-5 text-white">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Your selection</span>
            <h3 className="mt-2 text-xl font-extrabold">Appointment summary</h3>
          </div>
          <div className="space-y-4 p-5 text-sm">
            <div className="flex justify-between gap-3"><span className="text-slate-500">Specialist</span><strong className="text-right text-[var(--navy)]">{selectedDoctor?.fullName ?? "Not selected"}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Department</span><strong className="text-right text-[var(--navy)]">{selectedDoctor?.department ?? "—"}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Date</span><strong className="text-right text-[var(--navy)]">{booking.appointmentDate || "—"}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Time</span><strong className="text-right text-[var(--navy)]">{booking.timeSlot || "—"}</strong></div>
            <div className="flex justify-between gap-3 border-t border-slate-100 pt-4"><span className="text-slate-500">Consultation</span><strong className="text-right text-lg text-[var(--brand)]">{selectedDoctor ? `$${selectedDoctor.consultationFee}` : "—"}</strong></div>
          </div>
        </div>
        <div className="rounded-2xl bg-[#eef4ff] p-5">
          <ShieldCheck className="text-[var(--brand)]" size={22} />
          <h3 className="mt-3 text-sm font-extrabold text-[var(--navy)]">Your privacy matters</h3>
          <p className="mt-2 text-xs leading-5 text-slate-600">Records are protected by account roles, validated inputs and HTTP-only JWT sessions. Only you and your care team can see your information.</p>
        </div>
      </aside>
    </div>
  );
}
