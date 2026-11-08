import { eq } from "drizzle-orm";
import { db } from "@/db";
import { doctorProfiles, users } from "@/db/schema";
import { assertRole, getSession } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseId, parseJson } from "@/lib/http";
import { logActivity } from "@/lib/logging";
import { doctorUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertRole(await getSession(), ["admin"]);
    const id = parseId((await context.params).id);
    const body = await parseJson(request, doctorUpdateSchema);
    if (Object.keys(body).length === 0) throw new ApiError(400, "No changes supplied");

    const [doctor] = await db
      .update(doctorProfiles)
      .set(body)
      .where(eq(doctorProfiles.id, id))
      .returning();
    if (!doctor) throw new ApiError(404, "Doctor not found");

    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "UPDATE_DOCTOR",
      entity: "doctor",
      entityId: id,
      detail: `Updated ${Object.keys(body).join(", ")}`,
    });
    return ok({ doctor });
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertRole(await getSession(), ["admin"]);
    const id = parseId((await context.params).id);
    const [doctor] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.id, id)).limit(1);
    if (!doctor) throw new ApiError(404, "Doctor not found");
    await db.delete(users).where(eq(users.id, doctor.userId));
    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "DELETE_DOCTOR",
      entity: "doctor",
      entityId: id,
      level: "warning",
    });
    return ok({ success: true });
  });
}
