import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, ValidationError } from "@/lib/errors";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export async function parseJson<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(
      "Please check the highlighted fields",
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  return result.data;
}

export function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError("Invalid record ID");
  return id;
}

export async function apiHandler(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details ?? null },
        { status: error.status },
      );
    }
    console.error("[CareWell API] Unhandled error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
