import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "API Documentation" };
export const dynamic = "force-dynamic";

const ENDPOINTS = [
  { method: "GET", path: "/api/health", roles: "Public", description: "Database and service health check." },
  { method: "POST", path: "/api/auth/register", roles: "Public", description: "Create a patient account and HTTP-only JWT session." },
  { method: "POST", path: "/api/auth/login", roles: "Public", description: "Authenticate with email/password; returns role-specific redirect." },
  { method: "POST", path: "/api/auth/logout", roles: "Any", description: "Clear the signed session cookie and log the event." },
  { method: "GET", path: "/api/auth/session", roles: "Public", description: "Return the current JWT session or null." },
  { method: "GET", path: "/api/doctors", roles: "Public", description: "List doctors with q and department filters." },
  { method: "POST", path: "/api/doctors", roles: "Admin", description: "Create a doctor login and clinical profile." },
  { method: "PATCH", path: "/api/doctors/:id", roles: "Admin", description: "Update specialty, fee, availability and other profile fields." },
  { method: "DELETE", path: "/api/doctors/:id", roles: "Admin", description: "Delete a doctor account and cascading profile." },
  { method: "GET", path: "/api/patients", roles: "Admin, Doctor", description: "List patients; doctors see only patients in their care." },
  { method: "POST", path: "/api/patients", roles: "Admin", description: "Create a patient account and profile." },
  { method: "GET", path: "/api/patients/:id", roles: "Scoped", description: "Read a patient record with ownership/care-team checks." },
  { method: "PATCH", path: "/api/patients/:id", roles: "Admin, Owner", description: "Update contact and health-profile fields." },
  { method: "DELETE", path: "/api/patients/:id", roles: "Admin", description: "Delete a patient account and cascading records." },
  { method: "GET", path: "/api/appointments", roles: "Scoped", description: "Search appointments by status, q, from, to and doctorId." },
  { method: "POST", path: "/api/appointments", roles: "Patient, Admin", description: "Book an appointment with slot-conflict validation." },
  { method: "GET", path: "/api/appointments/:id", roles: "Scoped", description: "Read one appointment." },
  { method: "PATCH", path: "/api/appointments/:id", roles: "Scoped", description: "Reschedule, add notes or update status; patients may only cancel." },
  { method: "DELETE", path: "/api/appointments/:id", roles: "Admin", description: "Delete an appointment." },
  { method: "GET", path: "/api/prescriptions", roles: "Scoped", description: "Search prescriptions by q and status." },
  { method: "POST", path: "/api/prescriptions", roles: "Doctor, Admin", description: "Issue an e-prescription." },
  { method: "GET", path: "/api/prescriptions/:id", roles: "Scoped", description: "Read one prescription." },
  { method: "PATCH", path: "/api/prescriptions/:id", roles: "Doctor, Admin", description: "Edit diagnosis, medications, notes or status." },
  { method: "DELETE", path: "/api/prescriptions/:id", roles: "Admin", description: "Delete a prescription." },
  { method: "GET", path: "/api/uploads", roles: "Any", description: "List medical files visible to the current role." },
  { method: "POST", path: "/api/uploads", roles: "Any scoped", description: "Upload PDF/Word/image/text up to 3 MB as multipart/form-data." },
  { method: "GET", path: "/api/uploads/:id", roles: "Scoped", description: "Download a file with an attachment header." },
  { method: "DELETE", path: "/api/uploads/:id", roles: "Admin, Uploader", description: "Remove a file." },
  { method: "GET", path: "/api/admin/stats", roles: "Admin", description: "Counts, appointment status totals and recent audit logs." },
];

export default async function DocsPage() {
  const session = await getSession();
  return (
    <main className="bg-[#f7faff]">
      <SiteHeader session={session ? { name: session.name, role: session.role } : null} />
      <div className="cw-container py-12 md:py-16">
        <div className="max-w-3xl">
          <span className="eyebrow">Developer reference</span>
          <h1 className="section-heading mt-3">CareWell REST API</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">All endpoints live inside the Next.js App Router under <code className="rounded bg-slate-200 px-1.5 py-0.5">/api</code>. Requests and responses use JSON except multipart uploads and binary downloads. Every protected route verifies the HTTP-only <code className="rounded bg-slate-200 px-1.5 py-0.5">carewell_session</code> JWT cookie.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: LockKeyhole, title: "JWT authentication", text: "HS256 tokens, 7-day expiry, HTTP-only SameSite=Lax cookies." },
            { icon: ShieldCheck, title: "Role-based access", text: "Admin, doctor and patient scopes enforced server-side on every request." },
            { icon: CheckCircle2, title: "Zod validation", text: "Typed schemas validate bodies, IDs, dates and enum values." },
          ].map((item) => { const Icon = item.icon; return <div key={item.title} className="cw-card p-5"><Icon size={20} className="text-[var(--brand)]" /><h2 className="mt-3 text-sm font-extrabold text-[var(--navy)]">{item.title}</h2><p className="mt-1.5 text-xs leading-5 text-slate-500">{item.text}</p></div>; })}
        </div>

        <section className="mt-10 cw-card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-base font-extrabold text-[var(--navy)]">Endpoint reference</h2><p className="text-xs text-slate-500">Scoped: the API derives visible records from the authenticated role and ownership.</p></div>
          <div className="cw-table-wrap !rounded-none !border-0">
            <table className="cw-table"><thead><tr><th>Method</th><th>Endpoint</th><th>Access</th><th>Description</th></tr></thead><tbody>
              {ENDPOINTS.map((endpoint) => <tr key={`${endpoint.method}-${endpoint.path}`}><td><span className={`cw-badge ${endpoint.method === "GET" ? "badge-blue" : endpoint.method === "POST" ? "badge-green" : endpoint.method === "PATCH" ? "badge-amber" : "badge-red"}`}>{endpoint.method}</span></td><td><code className="whitespace-nowrap text-xs font-bold text-[var(--navy)]">{endpoint.path}</code></td><td className="text-xs font-semibold">{endpoint.roles}</td><td className="min-w-[250px] text-xs">{endpoint.description}</td></tr>)}
            </tbody></table>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="cw-card p-6">
            <h2 className="text-base font-extrabold text-[var(--navy)]">Example: sign in</h2>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-[#0c2248] p-4 text-xs leading-6 text-blue-50">{`curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"patient@carewell.test","password":"CareWell@123"}' \\
  -c cookies.txt`}</pre>
            <p className="mt-4 text-xs leading-6 text-slate-500">Demo accounts: <strong>patient@carewell.test</strong>, <strong>doctor@carewell.test</strong>, <strong>admin@carewell.test</strong>. All use <strong>CareWell@123</strong>.</p>
          </section>
          <section className="cw-card p-6">
            <h2 className="text-base font-extrabold text-[var(--navy)]">Response contract</h2>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-[#0c2248] p-4 text-xs leading-6 text-blue-50">{`// success
{ "appointment": { "id": 12, "status": "pending" } }

// validation / auth / conflict error
{ "error": "Validation failed", "details": [...] }
// HTTP 400 · 401 · 403 · 404 · 409 · 500`}</pre>
            <p className="mt-4 text-xs leading-6 text-slate-500">Unhandled exceptions are logged server-side and returned with a generic 500 message so internals are never exposed.</p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl bg-[#0e347d] p-6 text-white">
          <div className="flex-1"><h2 className="text-lg font-extrabold">Need the system design?</h2><p className="mt-1 text-xs text-blue-100/80">Review the architecture diagram, schema and deployment topology.</p></div>
          <Link href="/architecture" className="cw-btn !bg-white !text-[var(--brand)]">View architecture <ArrowRight size={16} /></Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
