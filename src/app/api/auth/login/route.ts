import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { attachSessionCookie, roleHome } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseJson } from "@/lib/http";
import { logActivity } from "@/lib/logging";
import { verifyPassword } from "@/lib/password";
import { ensureSeeded } from "@/lib/seed";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return apiHandler(async () => {
    await ensureSeeded();
    const body = await parseJson(request, loginSchema);
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new ApiError(401, "Invalid email or password");
    }
    if (!user.isActive) throw new ApiError(403, "This account has been deactivated");

    await logActivity({
      actorId: user.id,
      actorEmail: user.email,
      action: "LOGIN",
      entity: "session",
      entityId: user.id,
      detail: `Successful ${user.role} sign in`,
    });

    const response = ok({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      redirectTo: roleHome(user.role),
    });
    return attachSessionCookie(response, user);
  });
}
