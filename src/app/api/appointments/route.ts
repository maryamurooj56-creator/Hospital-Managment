import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { appointments, doctorProfiles, patientProfiles } from "@/db/schema";
import { assertRole, getSession } from "@/lib/auth";
import { listAppointments, requirePatientProfile } from "@/lib/data";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseJson } from "@/lib/http";
import { logActivity } from "@/lib/logging";
import { appointmentCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

function today(): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  return apiHandler(async () => {
    const session = assertRole(await getSession(), ["admin", "doctor", "patient"]);
    const params = new URL(request.url).searchParams;
    const rows = await listAppointments(session, {
      status: params.get("status") ?? undefined,
      q: params.get("q") ?? undefined,
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      doctorId: params.get("doctorId") ? Number(params.get("doctorId")) : undefined,
    });
    return ok({ appointments: rows });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const session = assertRole(await getSession(), ["admin", "patient"]);
    const body = await parseJson(request, appointmentCreateSchema);
    if (body.appointmentDate < today()) throw new ApiError(400, "Appointment date cannot be in the past");

    let patientId: number;
    if (session.role === "patient") {
      const profile = await requirePatientProfile(session);
      patientId = profile.id;
    } else {
      if (!body.patientId) throw new ApiError(400, "Choose a patient for this appointment");
      const [patient] = await db
        .select({ id: patientProfiles.id })
        .from(patientProfiles)
        .where(eq(patientProfiles.id, body.patientId))
        .limit(1);
      if (!patient) throw new ApiError(404, "Patient not found");
      patientId = patient.id;
    }

    const [doctor] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.id, body.doctorId))
      .limit(1);
    if (!doctor || !doctor.isAvailable) throw new ApiError(400, "This doctor is not available for new bookings");

    const [conflict] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, body.doctorId),
          eq(appointments.appointmentDate, body.appointmentDate),
          eq(appointments.timeSlot, body.timeSlot),
          ne(appointments.status, "cancelled"),
        ),
      )
      .limit(1);
    if (conflict) throw new ApiError(409, "This time slot is already booked. Please choose another time.");

    const [created] = await db
      .insert(appointments)
      .values({
        patientId,
        doctorId: body.doctorId,
        createdBy: session.id,
        appointmentDate: body.appointmentDate,
        timeSlot: body.timeSlot,
        reason: body.reason,
        status: session.role === "admin" ? "confirmed" : "pending",
      })
      .returning();

    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "CREATE_APPOINTMENT",
      entity: "appointment",
      entityId: created.id,
      detail: `Appointment with doctor #${body.doctorId} on ${body.appointmentDate} at ${body.timeSlot}`,
    });
    return ok({ appointment: created }, 201);
  });
}
