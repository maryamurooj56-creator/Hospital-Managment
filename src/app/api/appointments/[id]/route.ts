import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { assertSession, getSession } from "@/lib/auth";
import { getScopedAppointment } from "@/lib/access";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseId, parseJson } from "@/lib/http";
import { logActivity } from "@/lib/logging";
import { appointmentUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    const appointment = await getScopedAppointment(session, parseId((await context.params).id));
    return ok({ appointment });
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    const id = parseId((await context.params).id);
    const current = await getScopedAppointment(session, id);
    const body = await parseJson(request, appointmentUpdateSchema);
    if (session.role === "patient" && body.status && body.status !== "cancelled") {
      throw new ApiError(403, "Patients may only cancel appointments");
    }

    const patch: Partial<typeof appointments.$inferInsert> = { updatedAt: new Date() };
    if (body.status !== undefined) patch.status = body.status;
    if (body.notes !== undefined) patch.notes = body.notes || null;
    if (body.appointmentDate !== undefined) patch.appointmentDate = body.appointmentDate;
    if (body.timeSlot !== undefined) patch.timeSlot = body.timeSlot;
    if (body.reason !== undefined) patch.reason = body.reason;

    if (body.appointmentDate || body.timeSlot) {
      const [conflict] = await db
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, current.doctorId),
            eq(appointments.appointmentDate, body.appointmentDate ?? current.appointmentDate),
            eq(appointments.timeSlot, body.timeSlot ?? current.timeSlot),
            ne(appointments.id, id),
            ne(appointments.status, "cancelled"),
          ),
        )
        .limit(1);
      if (conflict) throw new ApiError(409, "This time slot is already booked");
    }

    const [updated] = await db.update(appointments).set(patch).where(eq(appointments.id, id)).returning();
    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "UPDATE_APPOINTMENT",
      entity: "appointment",
      entityId: id,
      detail: `Updated ${Object.keys(body).join(", ")}`,
    });
    return ok({ appointment: updated });
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    if (session.role !== "admin") throw new ApiError(403, "Only administrators can delete appointments");
    const id = parseId((await context.params).id);
    await getScopedAppointment(session, id);
    await db.delete(appointments).where(eq(appointments.id, id));
    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "DELETE_APPOINTMENT",
      entity: "appointment",
      entityId: id,
      level: "warning",
    });
    return ok({ success: true });
  });
}
