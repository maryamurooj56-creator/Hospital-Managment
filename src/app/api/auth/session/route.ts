import { getSession, roleHome } from "@/lib/auth";
import { apiHandler, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    const user = await getSession();
    return ok({ user, redirectTo: user ? roleHome(user.role) : null });
  });
}
