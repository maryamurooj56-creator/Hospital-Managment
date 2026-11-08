import { eq } from "drizzle-orm";
import { db } from "@/db";
import { doctorProfiles, users } from "@/db/schema";
import { assertRole, getSession } from "@/lib/auth";
import { getDoctors } from "@/lib/data";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseJson } from "@/lib/http";
import { logActivity } from "@/lib/logging";
import { hashPassword } from "@/lib/password";
import { ensureSeeded } from "@/lib/seed";
import { doctorCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return apiHandler(async () => {
    await ensureSeeded();
    const params = new URL(request.url).searchParams;
    const doctors = await getDoctors({
      q: params.get("q") ?? undefined,
      department: params.get("department") ?? undefined,
    });
    return ok({ doctors });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const session = assertRole(await getSession(), ["admin"]);
    const body = await parseJson(request, doctorCreateSchema);
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const passwordHash = await hashPassword(body.password);
    const created = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          fullName: body.fullName,
          email: body.email,
          passwordHash,
          role: "doctor",
        })
        .returning();
      const [doctor] = await tx
        .insert(doctorProfiles)
        .values({
          userId: user.id,
          specialty: body.specialty,
          department: body.department,
          qualification: body.qualification,
          experienceYears: body.experienceYears,
          consultationFee: body.consultationFee,
          room: body.room || null,
          bio: body.bio || null,
        })
        .returning();
      return { user, doctor };
    });

    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "CREATE_DOCTOR",
      entity: "doctor",
      entityId: created.doctor.id,
      detail: `${body.fullName} added to ${body.department}`,
    });
    return ok({ doctor: created.doctor, user: { id: created.user.id, email: created.user.email } }, 201);
  });
}
