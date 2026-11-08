import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking-flow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { getDoctors } from "@/lib/data";
import { ensureSeeded } from "@/lib/seed";

export const metadata: Metadata = { title: "Book Appointment" };
export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ doctor?: string }> }) {
  await ensureSeeded();
  const params = await searchParams;
  const [session, doctors] = await Promise.all([getSession(), getDoctors()]);
  const doctorId = Number(params.doctor);
  return (
    <main className="bg-[#f7faff]">
      <SiteHeader session={session ? { name: session.name, role: session.role } : null} />
      <div className="cw-container">
        <BookingFlow doctors={doctors} initialSession={session} preselectedDoctorId={Number.isInteger(doctorId) && doctorId > 0 ? doctorId : undefined} />
      </div>
      <SiteFooter />
    </main>
  );
}
