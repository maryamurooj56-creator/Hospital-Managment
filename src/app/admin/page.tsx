import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSession } from "@/lib/auth";
import { getAdminSnapshot, getDoctors, listAppointments, listPatients, listPrescriptions } from "@/lib/data";
import { roleHome } from "@/lib/format";
import { ensureSeeded } from "@/lib/seed";

export const metadata: Metadata = { title: "Admin Console" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await ensureSeeded();
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin") redirect(roleHome(session.role));

  const [snapshot, doctors, patients, appointments, prescriptions] = await Promise.all([
    getAdminSnapshot(),
    getDoctors(),
    listPatients(session),
    listAppointments(session, {}, false),
    listPrescriptions(session, {}, false),
  ]);

  return (
    <DashboardShell session={session} title="Admin Console" subtitle="Hospital operations, records and activity at a glance">
      <AdminDashboard session={session} snapshot={snapshot} doctors={doctors} patients={patients} appointments={appointments} prescriptions={prescriptions} />
    </DashboardShell>
  );
}
