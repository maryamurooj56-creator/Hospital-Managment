import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { DoctorDashboard } from "@/components/doctor-dashboard";
import { getSession } from "@/lib/auth";
import { listAppointments, listMedicalFiles, listPatients, listPrescriptions } from "@/lib/data";
import { roleHome } from "@/lib/format";
import { ensureSeeded } from "@/lib/seed";

export const metadata: Metadata = { title: "Doctor Workspace" };
export const dynamic = "force-dynamic";

export default async function DoctorPage() {
  await ensureSeeded();
  const session = await getSession();
  if (!session) redirect("/login?next=/doctor");
  if (session.role !== "doctor") redirect(roleHome(session.role));

  const [appointments, prescriptions, patients, files] = await Promise.all([
    listAppointments(session),
    listPrescriptions(session),
    listPatients(session),
    listMedicalFiles(session),
  ]);

  return (
    <DashboardShell session={session} title="Doctor Workspace" subtitle="Manage your schedule, patients and digital prescriptions">
      <DoctorDashboard session={session} appointments={appointments} prescriptions={prescriptions} patients={patients} files={files} />
    </DashboardShell>
  );
}
