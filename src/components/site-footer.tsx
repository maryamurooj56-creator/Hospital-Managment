import { Clock3, Mail, MapPin, PhoneCall } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { DEPARTMENTS, EMERGENCY_PHONE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-[#0c2248] text-white">
      <div className="cw-container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="rounded-xl bg-white px-3 py-2.5 w-fit">
            <Logo />
          </div>
          <p className="mt-5 max-w-xs text-sm leading-7 text-blue-100/75">
            Compassionate care, advanced technology and a connected patient experience — all in one place.
          </p>
          <div className="mt-5 flex gap-2 text-xs font-semibold text-blue-100">
            <span className="rounded-full border border-white/20 px-3 py-1.5">HIPAA-minded</span>
            <span className="rounded-full border border-white/20 px-3 py-1.5">24/7 Care</span>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-white">Quick Links</h3>
          <div className="flex flex-col gap-2.5 text-sm text-blue-100/75">
            <Link href="/#about" className="hover:text-white">About CareWell</Link>
            <Link href="/book" className="hover:text-white">Book Appointment</Link>
            <Link href="/#doctors" className="hover:text-white">Find a Doctor</Link>
            <Link href="/login" className="hover:text-white">Patient Sign In</Link>
            <Link href="/docs" className="hover:text-white">API Documentation</Link>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-white">Departments</h3>
          <div className="flex flex-col gap-2.5 text-sm text-blue-100/75">
            {DEPARTMENTS.slice(0, 5).map((department) => (
              <Link key={department} href="/#departments" className="hover:text-white">
                {department}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold uppercase tracking-widest text-white">Get In Touch</h3>
          <div className="flex flex-col gap-3 text-sm text-blue-100/75">
            <span className="flex items-start gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0 text-[#65a0ff]" /> 218 Rosewood Avenue,<br />Los Angeles, CA 90012</span>
            <a href={`tel:${EMERGENCY_PHONE.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2.5 hover:text-white"><PhoneCall size={16} className="text-[#65a0ff]" /> {EMERGENCY_PHONE}</a>
            <a href="mailto:hello@carewell.example" className="flex items-center gap-2.5 hover:text-white"><Mail size={16} className="text-[#65a0ff]" /> hello@carewell.example</a>
            <span className="flex items-center gap-2.5"><Clock3 size={16} className="text-[#65a0ff]" /> Open 24 hours, every day</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="cw-container flex flex-col gap-2 py-5 text-xs text-blue-100/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} CareWell Hospital. All rights reserved.</span>
          <span>Privacy · Terms · Accessibility · Built with Next.js & PostgreSQL</span>
        </div>
      </div>
    </footer>
  );
}
