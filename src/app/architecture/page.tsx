import type { Metadata } from "next";
import { ArrowDown, ArrowRight, Database, FileLock2, Layers3, ServerCog, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Architecture" };
export const dynamic = "force-dynamic";

const LAYERS = [
  { icon: Layers3, title: "React presentation", detail: "Next.js App Router, server components, responsive Tailwind UI, client dashboards." },
  { icon: ServerCog, title: "Route handlers", detail: "REST endpoints under /api with shared JWT guards and Zod validation." },
  { icon: ShieldCheck, title: "Security & domain", detail: "Scrypt password hashes, HS256 JWT, role checks, ownership scoping, audit logs." },
  { icon: Database, title: "Data persistence", detail: "Drizzle ORM over PostgreSQL with relational tables and indexed lookups." },
];

export default async function ArchitecturePage() {
  const session = await getSession();
  return (
    <main className="bg-[#f7faff]">
      <SiteHeader session={session ? { name: session.name, role: session.role } : null} />
      <div className="cw-container py-12 md:py-16">
        <span className="eyebrow">System design</span>
        <h1 className="section-heading mt-3">Architecture overview</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">CareWell is a single deployable fullstack Next.js application. Server components read data directly through Drizzle, while React client workspaces call the same domain rules through typed REST route handlers. PostgreSQL is the system of record.</p>

        <section className="cw-card mt-10 p-6 md:p-10">
          <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            {LAYERS.map((layer, index) => {
              const Icon = layer.icon;
              return (
                <div key={layer.title} className="contents">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#eaf1ff] text-[var(--brand)]"><Icon size={22} /></span>
                    <h2 className="mt-4 text-sm font-extrabold text-[var(--navy)]">{layer.title}</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{layer.detail}</p>
                  </div>
                  {index < LAYERS.length - 1 && <div className="grid place-items-center text-[var(--brand)]"><ArrowRight className="hidden lg:block" size={20} /><ArrowDown className="lg:hidden" size={20} /></div>}
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-xl bg-[#f2f6ff] p-4 text-xs font-semibold text-slate-600">
            <FileLock2 size={16} className="text-[var(--brand)]" /> Medical files are stored as validated base64 content in PostgreSQL and streamed only through scope-checked download routes.
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="cw-card p-6">
            <h2 className="text-base font-extrabold text-[var(--navy)]">Database schema</h2>
            <div className="mt-4 space-y-3">
              {[
                ["users", "id, full_name, email, password_hash, role, is_active"],
                ["patient_profiles", "user_id, date_of_birth, blood_group, allergies, medical_history"],
                ["doctor_profiles", "user_id, specialty, department, fee, availability, rating"],
                ["appointments", "patient_id, doctor_id, date, time_slot, reason, status, notes"],
                ["prescriptions", "patient_id, doctor_id, diagnosis, medications, status"],
                ["medical_files", "patient_id, appointment_id, mime_type, size_bytes, content"],
                ["activity_logs", "actor, action, entity, detail, level, created_at"],
              ].map(([table, columns]) => <div key={table} className="rounded-xl border border-slate-200 p-3"><code className="text-xs font-extrabold text-[var(--brand)]">{table}</code><p className="mt-1 text-xs text-slate-500">{columns}</p></div>)}
            </div>
          </div>
          <div className="space-y-6">
            <div className="cw-card p-6"><h2 className="text-base font-extrabold text-[var(--navy)]">Security controls</h2><ul className="mt-4 space-y-3 text-xs leading-6 text-slate-600">{["HTTP-only, SameSite=Lax, Secure-in-production JWT cookies", "Scrypt salted password hashing with timing-safe comparison", "Zod validation and numeric ID parsing on all writes", "Server-side RBAC and record ownership checks", "MIME/size-limited uploads and private no-store downloads", "Centralised error handler and database audit logging"].map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />{item}</li>)}</ul></div>
            <div className="cw-card p-6"><h2 className="text-base font-extrabold text-[var(--navy)]">Performance & reliability</h2><ul className="mt-4 space-y-3 text-xs leading-6 text-slate-600">{["Indexed foreign keys for appointments, prescriptions and files", "Bounded result sets and server-side SQL filtering", "Connection pooling through node-postgres", "Idempotent seed data with unique email constraints", "Force-dynamic data pages so builds do not require a live database", "Unit tests plus type generation, TypeScript and production build in CI"].map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{item}</li>)}</ul></div>
          </div>
        </section>

        <div className="mt-10 rounded-2xl bg-[#0e347d] p-6 text-white">
          <h2 className="text-lg font-extrabold">Deployment topology</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-blue-100/85">Deploy the Next.js frontend and backend together to Vercel. Provision managed PostgreSQL on Render, Neon or Supabase, set <code className="rounded bg-white/10 px-1.5">DATABASE_URL</code> and a strong <code className="rounded bg-white/10 px-1.5">JWT_SECRET</code>, then run <code className="rounded bg-white/10 px-1.5">npx drizzle-kit push</code> and the seed script once. CI validates tests, types and the production build on every push.</p>
          <Link href="/docs" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-200 underline underline-offset-4">Back to API documentation →</Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
