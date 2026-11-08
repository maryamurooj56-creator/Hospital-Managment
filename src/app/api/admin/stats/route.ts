import { assertRole, getSession } from "@/lib/auth";
import { getAdminSnapshot } from "@/lib/data";
import { apiHandler, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return apiHandler(async () => {
    assertRole(await getSession(), ["admin"]);
    return ok(await getAdminSnapshot());
  });
}
