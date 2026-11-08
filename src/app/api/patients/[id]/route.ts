import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, patientProfiles, users } from "@/db/schema";
import { assertSession, getSession } from "@/lib/auth";
import { getDoctorProfileByUserId } from "@/lib/data";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseId, parseJson } from "@/lib/http";
import { logActivity } from "@/lib/logging";
import { profileUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function findPatient(id: number) {
  const [patient] = await db.select().from(patientProfiles).where(eq(patientProfiles.id, id)).limit(1);
  if (!patient) throw new ApiError(404, "Patient not found");
  const [user] = await db.select().from(users).where(eq(users.id, patient.userId)).limit(1);
  return { patient, user };
}

export async function GET(_request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    const id = parseId((await context.params).id);
    const { patient, user } = await findPatient(id);
    if (session.role === "patient" && patient.userId !== session.id) throw new ApiError(403, "Not permitted");
    if (session.role === "doctor") {
      const doctor = await getDoctorProfileByUserId(session.id);
      const [related] = doctor
        ? await db
            .select({ id: appointments.id })
            .from(appointments)
            .where(and(eq(appointments.patientId, id), eq(appointments.doctorId, doctor.id)))
            .limit(1)
        : [];
      if (!related) throw new ApiError(403, "This patient is not in your care");
    }
    return ok({ patient, user: user ? { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, isActive: user.isActive } : null });
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    const id = parseId((await context.params).id);
    const { patient } = await findPatient(id);
    const isOwner = session.role === "patient" && patient.userId === session.id;
    if (session.role !== "admin" && !isOwner) throw new ApiError(403, "Not permitted");

    const body = await parseJson(request, profileUpdateSchema);
    const userPatch: Partial<typeof users.$inferInsert> = {};
    if (body.fullName !== undefined) userPatch.fullName = body.fullName;
    if (body.phone !== undefined) userPatch.phone = body.phone || null;
    if (Object.keys(userPatch).length > 0) {
      await db.update(users).set(userPatch).where(eq(users.id, patient.userId));
    }

    const profilePatch: Partial<typeof patientProfiles.$inferInsert> = {};
    if (body.dateOfBirth !== undefined) profilePatch.dateOfBirth = body.dateOfBirth || null;
    if (body.gender !== undefined) profilePatch.gender = body.gender || null;
    if (body.bloodGroup !== undefined) profilePatch.bloodGroup = body.bloodGroup || null;
    if (body.address !== undefined) profilePatch.address = body.address || null;
    if (body.emergencyContact !== undefined) profilePatch.emergencyContact = body.emergencyContact || null;
    if (body.allergies !== undefined) profilePatch.allergies = body.allergies || null;
    if (body.medicalHistory !== undefined) profilePatch.medicalHistory = body.medicalHistory || null;
    if (Object.keys(profilePatch).length > 0) {
      await db.update(patientProfiles).set(profilePatch).where(eq(patientProfiles.id, id));
    }

    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "UPDATE_PATIENT",
      entity: "patient",
      entityId: id,
      detail: `Updated ${Object.keys(body).join(", ")}`,
    });
    return ok({ success: true });
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    if (session.role !== "admin") throw new ApiError(403, "Only administrators can delete patient records");
    const id = parseId((await context.params).id);
    const { patient } = await findPatient(id);
    await db.delete(users).where(eq(users.id, patient.userId));
    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "DELETE_PATIENT",
      entity: "patient",
      entityId: id,
      level: "warning",
    });
    return ok({ success: true });
  });
}
