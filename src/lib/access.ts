import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, medicalFiles, prescriptions } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import { getDoctorProfileByUserId, getPatientProfileByUserId, requireDoctorProfile, requirePatientProfile } from "@/lib/data";
import { ApiError } from "@/lib/errors";

export async function getScopedAppointment(session: SessionUser, id: number) {
  const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  if (!appointment) throw new ApiError(404, "Appointment not found");
  if (session.role === "patient") {
    const profile = await requirePatientProfile(session);
    if (appointment.patientId !== profile.id) throw new ApiError(403, "Not permitted");
  } else if (session.role === "doctor") {
    const profile = await requireDoctorProfile(session);
    if (appointment.doctorId !== profile.id) throw new ApiError(403, "Not permitted");
  }
  return appointment;
}

export async function getScopedPrescription(session: SessionUser, id: number) {
  const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id)).limit(1);
  if (!prescription) throw new ApiError(404, "Prescription not found");
  if (session.role === "patient") {
    const profile = await requirePatientProfile(session);
    if (prescription.patientId !== profile.id) throw new ApiError(403, "Not permitted");
  } else if (session.role === "doctor") {
    const profile = await requireDoctorProfile(session);
    if (prescription.doctorId !== profile.id) throw new ApiError(403, "Not permitted");
  }
  return prescription;
}

export async function getScopedFile(session: SessionUser, id: number) {
  const [file] = await db.select().from(medicalFiles).where(eq(medicalFiles.id, id)).limit(1);
  if (!file) throw new ApiError(404, "File not found");
  if (session.role === "patient") {
    const profile = await getPatientProfileByUserId(session.id);
    if (!profile || file.patientId !== profile.id) throw new ApiError(403, "Not permitted");
  } else if (session.role === "doctor") {
    const doctor = await getDoctorProfileByUserId(session.id);
    if (!doctor) throw new ApiError(403, "Not permitted");
    const [related] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(eq(appointments.patientId, file.patientId), eq(appointments.doctorId, doctor.id)))
      .limit(1);
    if (!related) throw new ApiError(403, "Not permitted");
  }
  return file;
}
