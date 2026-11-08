import { eq } from "drizzle-orm";
import { db } from "@/db";
import { patientProfiles, users } from "@/db/schema";
import { attachSessionCookie } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseJson } from "@/lib/http";
import { logActivity } from "@/lib/logging";
import { hashPassword } from "@/lib/password";
import { ensureSeeded } from "@/lib/seed";
import { registerSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return apiHandler(async () => {
    await ensureSeeded();
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

    await db.insert(patientProfiles).values({
      userId: user.id,
      dateOfBirth: body.dateOfBirth || null,
      gender: body.gender || null,
    });

    await logActivity({
      actorId: user.id,
      actorEmail: user.email,
      action: "REGISTER",
      entity: "user",
      entityId: user.id,
      detail: "New patient account created",
    });

    const response = ok(
      {
        user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
        redirectTo: "/patient",
      },
      201,
    );
    return attachSessionCookie(response, user);
  });
}
