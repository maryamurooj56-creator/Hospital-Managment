import { eq } from "drizzle-orm";
import { db } from "@/db";
import { prescriptions } from "@/db/schema";
import { assertSession, getSession } from "@/lib/auth";
import { getScopedPrescription } from "@/lib/access";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseId, parseJson } from "@/lib/http";
import { logActivity } from "@/lib/logging";
import { prescriptionUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    const prescription = await getScopedPrescription(session, parseId((await context.params).id));
    return ok({ prescription });
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    if (session.role === "patient") throw new ApiError(403, "Only clinicians can edit prescriptions");
    const id = parseId((await context.params).id);
    await getScopedPrescription(session, id);
    const body = await parseJson(request, prescriptionUpdateSchema);
    const patch: Partial<typeof prescriptions.$inferInsert> = {};
    if (body.diagnosis !== undefined) patch.diagnosis = body.diagnosis;
    if (body.medications !== undefined) patch.medications = body.medications;
    if (body.notes !== undefined) patch.notes = body.notes || null;
    if (body.status !== undefined) patch.status = body.status;

    const [updated] = await db.update(prescriptions).set(patch).where(eq(prescriptions.id, id)).returning();
    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "UPDATE_PRESCRIPTION",
      entity: "prescription",
      entityId: id,
      detail: `Updated ${Object.keys(body).join(", ")}`,
    });
    return ok({ prescription: updated });
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    if (session.role !== "admin") throw new ApiError(403, "Only administrators can delete prescriptions");
    const id = parseId((await context.params).id);
    await getScopedPrescription(session, id);
    await db.delete(prescriptions).where(eq(prescriptions.id, id));
    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "DELETE_PRESCRIPTION",
      entity: "prescription",
      entityId: id,
      level: "warning",
    });
    return ok({ success: true });
  });
}
