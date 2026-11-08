import { db } from "@/db";
import { activityLogs } from "@/db/schema";

type LogInput = {
  actorId?: number | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  detail?: string | null;
  level?: "info" | "warning" | "error";
};

export async function logActivity(input: LogInput): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId == null ? null : String(input.entityId),
      detail: input.detail ?? null,
      level: input.level ?? "info",
    });
  } catch (error) {
    console.error("[CareWell] Failed to write activity log", error);
  }
}
