import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { medicalFiles } from "@/db/schema";
import { assertSession, getSession } from "@/lib/auth";
import { getScopedFile } from "@/lib/access";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok, parseId } from "@/lib/http";
import { logActivity } from "@/lib/logging";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    const file = await getScopedFile(session, parseId((await context.params).id));
    const buffer = Buffer.from(file.content, "base64");
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    const id = parseId((await context.params).id);
    const file = await getScopedFile(session, id);
    if (session.role !== "admin" && file.uploadedBy !== session.id) {
      throw new ApiError(403, "Only the uploader or an administrator can remove this file");
    }
    await db.delete(medicalFiles).where(eq(medicalFiles.id, id));
    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "DELETE_FILE",
      entity: "medical_file",
      entityId: id,
      level: "warning",
    });
    return ok({ success: true });
  });
}
