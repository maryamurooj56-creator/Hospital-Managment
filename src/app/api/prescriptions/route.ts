import { eq } from "drizzle-orm";
import { db } from "@/db";
import { doctorProfiles, patientProfiles, prescriptions } from "@/db/schema";
import { assertRole, getSession } from "@/lib/auth";
import { listPrescriptions, requireDoctorProfile } from "@/lib/data";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseJson } from "@/lib/http";
import { logActivity } from "@/lib/logging";
import { prescriptionCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return apiHandler(async () => {
    const session = assertRole(await getSession(), ["admin", "doctor", "patient"]);
    const params = new URL(request.url).searchParams;
    const rows = await listPrescriptions(session, {
      q: params.get("q") ?? undefined,
      status: params.get("status") ?? undefined,
    });
    return ok({ prescriptions: rows });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const session = assertRole(await getSession(), ["admin", "doctor"]);
    const body = await parseJson(request, prescriptionCreateSchema);
    let doctorId: number;
    if (session.role === "doctor") {
      doctorId = (await requireDoctorProfile(session)).id;
    } else {
      if (!body.doctorId) throw new ApiError(400, "Choose the prescribing doctor");
      doctorId = body.doctorId;
    }

    const [doctor] = await db.select({ id: doctorProfiles.id }).from(doctorProfiles).where(eq(doctorProfiles.id, doctorId)).limit(1);
    const [patient] = await db
      .select({ id: patientProfiles.id })
      .from(patientProfiles)
      .where(eq(patientProfiles.id, body.patientId))
      .limit(1);
    if (!doctor) throw new ApiError(404, "Doctor not found");
    if (!patient) throw new ApiError(404, "Patient not found");

    const [created] = await db
      .insert(prescriptions)
      .values({
        patientId: body.patientId,
        doctorId,
        appointmentId: body.appointmentId ?? null,
        diagnosis: body.diagnosis,
        medications: body.medications,
        notes: body.notes ?? null,
      })
      .returning();

    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "ISSUE_PRESCRIPTION",
      entity: "prescription",
      entityId: created.id,
      detail: `${body.diagnosis} for patient #${body.patientId}`,
    });
    return ok({ prescription: created }, 201);
  });
}
