import { clearSessionCookie, getSession } from "@/lib/auth";
import { apiHandler, ok } from "@/lib/http";
import { logActivity } from "@/lib/logging";

export const runtime = "nodejs";

export async function POST() {
  return apiHandler(async () => {
    const session = await getSession();
    if (session) {
      await logActivity({
        actorId: session.id,
        actorEmail: session.email,
        action: "LOGOUT",
        entity: "session",
        entityId: session.id,
      });
    }
    return clearSessionCookie(ok({ success: true }));
  });
}
