import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PatientDashboard } from "@/components/patient-dashboard";
import { DashboardShell } from "@/components/dashboard-shell";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getPatientProfileByUserId, listAppointments, listMedicalFiles, listPrescriptions } from "@/lib/data";
import { roleHome } from "@/lib/format";
import { ensureSeeded } from "@/lib/seed";

export const metadata: Metadata = { title: "Patient Portal" };
export const dynamic = "force-dynamic";

export default async function PatientPage() {
  await ensureSeeded();
  const session = await getSession();
  if (!session) redirect("/login?next=/patient");
  if (session.role !== "patient") redirect(roleHome(session.role));

  const [profile, userRows, appointments, prescriptions, files] = await Promise.all([
    getPatientProfileByUserId(session.id),
    db.select().from(users).where(eq(users.id, session.id)).limit(1),
    listAppointments(session),
    listPrescriptions(session),
    listMedicalFiles(session),
  ]);
  if (!profile || !userRows[0]) redirect("/login?next=/patient");

  return (
    <DashboardShell session={session} title="Patient Portal" subtitle="Appointments, prescriptions and health records in one place">
      <PatientDashboard
        session={session}
        profile={profile}
        user={{ phone: userRows[0].phone, email: userRows[0].email, fullName: userRows[0].fullName }}
        appointments={appointments}
        prescriptions={prescriptions}
        files={files}
      />
    </DashboardShell>
  );
}
