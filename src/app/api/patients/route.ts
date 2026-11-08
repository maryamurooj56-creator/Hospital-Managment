import { eq } from "drizzle-orm";
import { db } from "@/db";
import { patientProfiles, users } from "@/db/schema";
import { assertRole, getSession } from "@/lib/auth";
import { listPatients } from "@/lib/data";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseJson } from "@/lib/http";
import { logActivity } from "@/lib/logging";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  return apiHandler(async () => {
    const session = assertRole(await getSession(), ["admin", "doctor"]);
    const patients = await listPatients(session);
    return ok({ patients });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const session = assertRole(await getSession(), ["admin"]);
    const body = await parseJson(request, registerSchema);
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const passwordHash = await hashPassword(body.password);
    const [user] = await db
      .insert(users)
      .values({
        fullName: body.fullName,
        email: body.email,
        phone: body.phone || null,
        passwordHash,
        role: "patient",
      })
      .returning();
    const [patient] = await db
      .insert(patientProfiles)
      .values({
        userId: user.id,
        dateOfBirth: body.dateOfBirth || null,
        gender: body.gender || null,
      })
      .returning();

    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "CREATE_PATIENT",
      entity: "patient",
      entityId: patient.id,
    });
    return ok({ patient }, 201);
  });
}
