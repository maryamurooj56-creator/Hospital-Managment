import { describe, expect, it } from "vitest";
import {
  appointmentCreateSchema,
  loginSchema,
  prescriptionCreateSchema,
  registerSchema,
} from "../src/lib/validation";

describe("request validation", () => {
  it("accepts a valid registration and normalises the email", () => {
    const result = registerSchema.safeParse({
      fullName: "Jordan Ellis",
      email: "  Jordan@Example.COM ",
      phone: "",
      password: "CareWell@123",
      dateOfBirth: "",
      gender: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("jordan@example.com");
  });

  it("rejects short passwords and invalid emails", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "123" }).success).toBe(false);
    expect(registerSchema.safeParse({ fullName: "A B", email: "a@b.com", password: "short" }).success).toBe(false);
  });

  it("validates appointment dates and reasons", () => {
    expect(appointmentCreateSchema.safeParse({ doctorId: 1, appointmentDate: "2026-05-20", timeSlot: "10:00 AM", reason: "Annual checkup" }).success).toBe(true);
    expect(appointmentCreateSchema.safeParse({ doctorId: 1, appointmentDate: "20/05/2026", timeSlot: "10:00 AM", reason: "Annual checkup" }).success).toBe(false);
    expect(appointmentCreateSchema.safeParse({ doctorId: 1, appointmentDate: "2026-05-20", timeSlot: "10:00 AM", reason: "hi" }).success).toBe(false);
  });

  it("requires a patient, diagnosis and medication list for prescriptions", () => {
    expect(prescriptionCreateSchema.safeParse({ patientId: 2, diagnosis: "Migraine", medications: "Sumatriptan 50 mg" }).success).toBe(true);
    expect(prescriptionCreateSchema.safeParse({ patientId: 0, diagnosis: "Migraine", medications: "Sumatriptan 50 mg" }).success).toBe(false);
    expect(prescriptionCreateSchema.safeParse({ patientId: 2, diagnosis: "", medications: "" }).success).toBe(false);
  });
});
