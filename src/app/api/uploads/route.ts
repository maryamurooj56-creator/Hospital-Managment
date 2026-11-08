import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, medicalFiles, patientProfiles } from "@/db/schema";
import { assertSession, getSession } from "@/lib/auth";
import { getDoctorProfileByUserId, listMedicalFiles, requirePatientProfile } from "@/lib/data";
import { ApiError } from "@/lib/errors";
import { apiHandler, ok } from "@/lib/http";
import { logActivity } from "@/lib/logging";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_SIZE = 3 * 1024 * 1024;

export async function GET() {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    const files = await listMedicalFiles(session);
    return ok({ files });
  });
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const session = assertSession(await getSession());
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file || typeof file.arrayBuffer !== "function") throw new ApiError(400, "Choose a file to upload");
    if (!ALLOWED_TYPES.has(file.type)) throw new ApiError(400, "Only PDF, Word, text and image files are allowed");
    if (file.size > MAX_SIZE) throw new ApiError(400, "Files must be 3 MB or smaller");

    let patientId: number;
    if (session.role === "patient") {
      patientId = (await requirePatientProfile(session)).id;
    } else {
      const requested = Number(form.get("patientId"));
      if (!Number.isInteger(requested) || requested <= 0) throw new ApiError(400, "Choose a patient");
      const [patient] = await db
        .select({ id: patientProfiles.id })
        .from(patientProfiles)
        .where(eq(patientProfiles.id, requested))
        .limit(1);
      if (!patient) throw new ApiError(404, "Patient not found");
      if (session.role === "doctor") {
        const doctor = await getDoctorProfileByUserId(session.id);
        const [related] = doctor
          ? await db
              .select({ id: appointments.id })
              .from(appointments)
              .where(and(eq(appointments.patientId, requested), eq(appointments.doctorId, doctor.id)))
              .limit(1)
          : [];
        if (!related) throw new ApiError(403, "This patient is not in your care");
      }
      patientId = requested;
    }

    const appointmentRaw = form.get("appointmentId");
    const appointmentId = appointmentRaw ? Number(appointmentRaw) : null;
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "medical-record";
    const [created] = await db
      .insert(medicalFiles)
      .values({
        patientId,
        appointmentId: Number.isInteger(appointmentId) && appointmentId ? appointmentId : null,
        uploadedBy: session.id,
        fileName: safeName,
        mimeType: file.type,
        sizeBytes: buffer.byteLength,
        content: buffer.toString("base64"),
      })
      .returning();

    await logActivity({
      actorId: session.id,
      actorEmail: session.email,
      action: "UPLOAD_FILE",
      entity: "medical_file",
      entityId: created.id,
      detail: `${safeName} (${Math.ceil(buffer.byteLength / 1024)} KB)`,
    });
    return ok({ file: { ...created, content: undefined } }, 201);
  });
}
