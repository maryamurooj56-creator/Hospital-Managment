import {
  Activity,
  ArrowRight,
  Award,
  Baby,
  Bone,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  HandHeart,
  HeartPulse,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { DoctorDirectory } from "@/components/doctor-directory";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WatchVideoButton } from "@/components/watch-video-button";
import { getDoctors } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { DEPARTMENTS, EMERGENCY_PHONE } from "@/lib/constants";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: Stethoscope, title: "Expert Doctors", text: "Experienced specialists providing the best care." },
  { icon: HeartPulse, title: "Advanced Care", text: "State-of-the-art technology for accurate diagnosis." },
  { icon: Clock3, title: "24/7 Services", text: "Round-the-clock care whenever you need it." },
  { icon: HandHeart, title: "Patient First", text: "Compassionate care focused on you." },
];

const SERVICES = [
  { icon: CalendarDays, title: "Online Appointments", text: "Choose a specialist, preferred date and time in under two minutes.", tint: "bg-blue-50 text-[#1657e5]" },
  { icon: FileText, title: "Digital Prescriptions", text: "Access diagnosis, medicines and clinician notes securely after your visit.", tint: "bg-emerald-50 text-emerald-600" },
  { icon: Stethoscope, title: "Specialist Care", text: "Six leading departments with experienced, board-certified consultants.", tint: "bg-violet-50 text-violet-600" },
  { icon: ShieldCheck, title: "Secure Records", text: "Upload reports and keep your care history organised in one protected place.", tint: "bg-amber-50 text-amber-600" },
];

const DEPARTMENT_DETAILS = [
  { name: "Cardiology", icon: HeartPulse, count: "12 specialists" },
  { name: "Neurology", icon: Brain, count: "8 specialists" },
  { name: "Pediatrics", icon: Baby, count: "10 specialists" },
  { name: "Orthopedics", icon: Bone, count: "9 specialists" },
  { name: "Dermatology", icon: Sparkles, count: "7 specialists" },
  { name: "General Medicine", icon: Activity, count: "15 specialists" },
];

export default async function HomePage() {
  await ensureSeeded();
  const [session, doctors] = await Promise.all([getSession(), getDoctors()]);
  const headerSession = session ? { name: session.name, role: session.role } : null;

  return (
    <main id="home" className="overflow-hidden bg-white">
      <SiteHeader session={headerSession} />

      <section className="relative isolate min-h-[620px] bg-[#eaf4ff] md:min-h-[590px]">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hospital-hero.png" alt="CareWell Hospital main entrance" className="h-full w-full object-cover object-[68%_center] md:object-center" />
          <div className="absolute inset-0 bg-white/75 md:bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.95)_26%,rgba(255,255,255,0.56)_43%,rgba(255,255,255,0.05)_62%,rgba(255,255,255,0)_100%)]" />
        </div>

        <div className="cw-container relative flex min-h-[620px] items-center py-16 md:min-h-[590px] md:py-10">
          <div className="max-w-[560px]">
            <h1 className="hero-title">Your Health,<br />Our Priority</h1>
            <p className="mt-6 max-w-[430px] text-[15px] font-medium leading-7 text-[#53647e] md:text-base">
              Compassionate care. Advanced technology.<br className="hidden sm:block" /> Better health for a better tomorrow.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/book" className="cw-btn !px-5"><CalendarDays size={18} /> Book Appointment</Link>
              <WatchVideoButton />
            </div>
            <div className="mt-10 flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="flex -space-x-2">
                {doctors.slice(0, 4).map((doctor) =>
                  doctor.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={doctor.id} src={doctor.photoUrl} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover" />
                  ) : null,
                )}
              </span>
              <span className="flex items-center gap-1 text-[#e3a100]"><Star size={13} fill="currentColor" /> 4.9/5</span>
              <span>from 12,000+ patients</span>
            </div>
          </div>
        </div>
      </section>

      <div className="cw-container relative z-10 -mt-12 md:-mt-[62px]">
        <div className="cw-card grid grid-cols-2 gap-y-6 px-5 py-6 lg:grid-cols-4 lg:px-8 lg:py-7">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className={`flex items-start gap-3 px-2 ${index > 0 ? "lg:border-l lg:border-slate-100 lg:pl-8" : ""}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eaf1ff] text-[var(--brand)]"><Icon size={22} strokeWidth={1.8} /></span>
                <span><span className="block text-sm font-extrabold text-[var(--navy)]">{feature.title}</span><span className="mt-1 block text-[11px] leading-4 text-slate-500">{feature.text}</span></span>
              </div>
            );
          })}
        </div>
      </div>

      <section id="about" className="cw-container scroll-mt-24 py-20 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="absolute -left-5 -top-5 h-28 w-28 rounded-full bg-blue-100/60 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0f3f95] to-[#1765e8] p-8 text-white shadow-[0_25px_60px_rgba(15,63,149,0.22)]">
              <span className="eyebrow !text-blue-200">Why CareWell</span>
              <h3 className="mt-3 text-2xl font-extrabold leading-tight">Healthcare that feels human, powered by technology.</h3>
              <p className="mt-4 text-sm leading-7 text-blue-100/85">From the first appointment to follow-up prescriptions, every step is connected, secure and designed around the patient.</p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { value: "25+", label: "Years of care" },
                  { value: "60+", label: "Specialists" },
                  { value: "12k", label: "Happy patients" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white/10 p-3 text-center backdrop-blur">
                    <div className="text-xl font-extrabold">{stat.value}</div>
                    <div className="mt-1 text-[10px] font-semibold text-blue-100/80">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -right-2 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:flex">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-green-600"><Award size={22} /></span>
              <span><span className="block text-xs font-extrabold text-[var(--navy)]">Accredited quality care</span><span className="block text-[11px] text-slate-500"> Recognised clinical excellence</span></span>
            </div>
          </div>

          <div>
            <span className="eyebrow">About our hospital</span>
            <h2 className="section-heading mt-3">A better way to manage your health journey</h2>
            <p className="mt-5 text-sm leading-7 text-slate-600">CareWell brings experienced clinicians, modern facilities and a simple digital platform together. Book a visit, share documents ahead of time and access your care plan from any device.</p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Users, title: "Dedicated care teams", text: "Specialists collaborate around your needs." },
                { icon: ClipboardList, title: "Connected records", text: "No repeating your history at every visit." },
                { icon: Clock3, title: "Less waiting", text: "Plan ahead with real-time appointment slots." },
                { icon: ShieldCheck, title: "Privacy by design", text: "Role-based access protects every record." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-slate-200 p-4">
                    <Icon size={20} className="text-[var(--brand)]" />
                    <h4 className="mt-3 text-sm font-extrabold text-[var(--navy)]">{item.title}</h4>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">{item.text}</p>
                  </div>
                );
              })}
            </div>
            <Link href="/book" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand)]">Book your first visit <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 bg-[#f6f9fe] py-20">
        <div className="cw-container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Our services</span>
            <h2 className="section-heading mt-3">Everything you need, in one connected place</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Thoughtful digital tools support every stage of care, from booking to recovery.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.title} className="cw-card p-6 transition hover:-translate-y-1">
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${service.tint}`}><Icon size={23} /></span>
                  <h3 className="mt-5 text-base font-extrabold text-[var(--navy)]">{service.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{service.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="doctors" className="cw-container scroll-mt-24 py-20 md:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="eyebrow">Meet our doctors</span>
            <h2 className="section-heading mt-3">Trusted specialists, ready to help</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Search by specialty or department and choose the clinician that feels right for you.</p>
          </div>
          <Link href="/book" className="cw-btn-outline w-fit"><CalendarDays size={16} /> Book an appointment</Link>
        </div>
        <DoctorDirectory doctors={doctors} />
      </section>

      <section id="departments" className="scroll-mt-24 bg-[#f6f9fe] py-20">
        <div className="cw-container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Departments</span>
            <h2 className="section-heading mt-3">Comprehensive care across specialties</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DEPARTMENT_DETAILS.map((department) => {
              const Icon = department.icon;
              return (
                <Link key={department.name} href={`/book?department=${encodeURIComponent(department.name)}`} className="cw-card group flex items-center gap-4 p-5 transition hover:-translate-y-1 hover:border-blue-200">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#eaf1ff] text-[var(--brand)]"><Icon size={22} /></span>
                  <span className="min-w-0"><span className="block text-sm font-extrabold text-[var(--navy)]">{department.name}</span><span className="mt-1 block text-xs text-slate-500">{department.count} · advanced diagnostics</span></span>
                  <ArrowRight size={17} className="ml-auto text-slate-300 transition group-hover:translate-x-1 group-hover:text-[var(--brand)]" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cw-container py-20">
        <div className="grid gap-8 rounded-[28px] bg-[#0e347d] px-6 py-10 text-white sm:px-10 lg:grid-cols-[1fr_auto] lg:items-center lg:px-14">
          <div>
            <span className="eyebrow !text-blue-200">How it works</span>
            <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">Your appointment is only three steps away</h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-3">
              {[
                { n: "01", title: "Choose a doctor", text: "Browse specialists by department." },
                { n: "02", title: "Pick a slot", text: "Select a date and available time." },
                { n: "03", title: "Track your care", text: "See notes and prescriptions online." },
              ].map((step) => (
                <div key={step.n} className="rounded-xl bg-white/10 p-4">
                  <span className="text-xs font-extrabold text-blue-200">{step.n}</span>
                  <h3 className="mt-2 text-sm font-extrabold">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-blue-100/75">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/book" className="cw-btn !bg-white !text-[var(--brand)] hover:!bg-blue-50"><CalendarDays size={17} /> Book Appointment</Link>
            <a href={`tel:${EMERGENCY_PHONE.replace(/[^+\d]/g, "")}`} className="cw-btn-outline !border-white/30 !bg-transparent !text-white"><PhoneCall size={16} /> Call 24/7 Emergency</a>
          </div>
        </div>
      </section>

      <section className="cw-container pb-20">
        <div className="grid gap-6 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3 md:p-8">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[var(--brand)]"><MapPin size={19} /></span><span><span className="block text-sm font-extrabold text-[var(--navy)]">Visit us</span><span className="mt-1 block text-xs leading-5 text-slate-500">218 Rosewood Avenue, Los Angeles, CA</span></span></div>
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[var(--brand)]"><PhoneCall size={19} /></span><span><span className="block text-sm font-extrabold text-[var(--navy)]">Call anytime</span><span className="mt-1 block text-xs leading-5 text-slate-500">{EMERGENCY_PHONE} · 24/7 emergency line</span></span></div>
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[var(--brand)]"><CheckCircle2 size={19} /></span><span><span className="block text-sm font-extrabold text-[var(--navy)]">Patient promise</span><span className="mt-1 block text-xs leading-5 text-slate-500">Clear communication and compassionate care, always.</span></span></div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
