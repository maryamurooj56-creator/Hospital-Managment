"use client";

import { ArrowRight, CalendarCheck2, Eye, EyeOff, LockKeyhole, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const DEMO_PASSWORD = "CareWell@123";
const DEMO_ACCOUNTS = [
  { role: "Patient", email: "patient@carewell.test", home: "/patient" },
  { role: "Doctor", email: "doctor@carewell.test", home: "/doctor" },
  { role: "Admin", email: "admin@carewell.test", home: "/admin" },
];

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<"login" | "register">(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    gender: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (activeMode === "register" && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const payload =
        activeMode === "login"
          ? { email: form.email, password: form.password }
          : {
              fullName: form.fullName,
              email: form.email,
              phone: form.phone,
              password: form.password,
              dateOfBirth: form.dateOfBirth,
              gender: form.gender,
            };
      const response = await fetch(`/api/auth/${activeMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to continue");
      router.push(next || data.redirectTo || "/patient");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to continue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cw-container grid gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
      <div className="mx-auto w-full max-w-[520px]">
        <div className="mb-8 flex rounded-xl bg-slate-100 p-1">
          <button type="button" onClick={() => { setActiveMode("login"); setError(""); }} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${activeMode === "login" ? "bg-white text-[var(--brand)] shadow-sm" : "text-slate-500"}`}>Sign In</button>
          <button type="button" onClick={() => { setActiveMode("register"); setError(""); }} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${activeMode === "register" ? "bg-white text-[var(--brand)] shadow-sm" : "text-slate-500"}`}>Create Account</button>
        </div>

        <span className="eyebrow">{activeMode === "login" ? "Welcome back" : "Patient registration"}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--navy)] sm:text-4xl">
          {activeMode === "login" ? "Sign in to your care portal" : "Create your patient account"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {activeMode === "login"
            ? "Access appointments, prescriptions and your secure health records."
            : "Book visits, track care plans and keep everything in one protected place."}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          {activeMode === "register" && (
            <label>
              <span className="cw-label">Full name *</span>
              <input className="cw-input" required value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Jordan Ellis" />
            </label>
          )}
          <label>
            <span className="cw-label">Email address *</span>
            <input className="cw-input" type="email" required value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" />
          </label>
          {activeMode === "register" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="cw-label">Phone</span>
                <input className="cw-input" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+1 323 555 0100" />
              </label>
              <label>
                <span className="cw-label">Date of birth</span>
                <input className="cw-input" type="date" value={form.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} />
              </label>
            </div>
          )}
          {activeMode === "register" && (
            <label>
              <span className="cw-label">Gender</span>
              <select className="cw-input" value={form.gender} onChange={(event) => update("gender", event.target.value)}>
                <option value="">Prefer not to say</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Other</option>
              </select>
            </label>
          )}
          <label>
            <span className="cw-label">Password *</span>
            <span className="relative block">
              <input className="cw-input !pr-11" type={showPassword ? "text" : "password"} required minLength={8} value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {activeMode === "register" && (
            <label>
              <span className="cw-label">Confirm password *</span>
              <input className="cw-input" type="password" required minLength={8} value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} placeholder="Repeat your password" />
            </label>
          )}

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">{error}</div>}

          <button type="submit" disabled={busy} className="cw-btn w-full">
            {busy ? "Please wait..." : activeMode === "login" ? "Sign In" : "Create Account"} <ArrowRight size={17} />
          </button>
        </form>

        <div className="mt-7 rounded-xl border border-blue-100 bg-[#f3f7ff] p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--brand)]"><ShieldCheck size={15} /> Demo accounts</div>
          <p className="mt-1.5 text-xs text-slate-500">Password for every demo account: <strong className="text-slate-700">{DEMO_PASSWORD}</strong></p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => { setActiveMode("login"); setError(""); setForm((current) => ({ ...current, email: account.email, password: DEMO_PASSWORD })); }}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-[var(--brand)] hover:bg-blue-50"
              >
                {account.role}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative hidden min-h-[620px] overflow-hidden rounded-[28px] bg-[#0b2d6b] lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hospital-hero.png" alt="CareWell Hospital entrance" className="absolute inset-0 h-full w-full object-cover object-right opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071c44] via-[#0b2d6b]/70 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-10 text-white">
          <span className="mb-4 flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur"><LockKeyhole size={14} /> Secure patient portal</span>
          <h2 className="text-3xl font-extrabold leading-tight">Your health information, always within reach.</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100/85">One connected platform for appointments, clinical notes, digital prescriptions and medical documents.</p>
          <div className="mt-7 space-y-3">
            {[
              { icon: CalendarCheck2, text: "Book and manage appointments instantly" },
              { icon: Stethoscope, text: "Review care plans from your specialists" },
              { icon: ShieldCheck, text: "Role-protected, HTTP-only JWT sessions" },
            ].map((item) => {
              const Icon = item.icon;
              return <div key={item.text} className="flex items-center gap-3 text-sm font-semibold text-blue-50"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15"><Icon size={16} /></span>{item.text}</div>;
            })}
          </div>
          <Link href="/docs" className="mt-8 text-xs font-bold text-blue-200 underline underline-offset-4">Explore API documentation →</Link>
        </div>
      </div>
    </div>
  );
}
