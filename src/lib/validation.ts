import { z } from "zod";
import { APPOINTMENT_STATUSES, PRESCRIPTION_STATUSES } from "@/lib/constants";

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(255);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(160),
  email,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  password,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date").optional().or(z.literal("")),
  gender: z.string().max(30).optional().or(z.literal("")),
});

export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password") });

export const appointmentCreateSchema = z.object({
  doctorId: z.coerce.number().int().positive("Choose a doctor"),
  patientId: z.coerce.number().int().positive().optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date"),
  timeSlot: z.string().trim().min(3).max(30),
  reason: z.string().trim().min(5, "Tell us a little about your visit").max(1000),
});

export const appointmentUpdateSchema = z
  .object({
    status: z.enum(APPOINTMENT_STATUSES).optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
    appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    timeSlot: z.string().trim().min(3).max(30).optional(),
    reason: z.string().trim().min(5).max(1000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "No changes supplied" });

export const prescriptionCreateSchema = z.object({
  patientId: z.coerce.number().int().positive("Choose a patient"),
  doctorId: z.coerce.number().int().positive().optional(),
  appointmentId: z.coerce.number().int().positive().optional().nullable(),
  diagnosis: z.string().trim().min(3, "Enter a diagnosis").max(255),
  medications: z.string().trim().min(3, "List at least one medication").max(4000),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const prescriptionUpdateSchema = z
  .object({
    diagnosis: z.string().trim().min(3).max(255).optional(),
    medications: z.string().trim().min(3).max(4000).optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
    status: z.enum(PRESCRIPTION_STATUSES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "No changes supplied" });

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  phone: z.string().trim().max(40).optional().nullable(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal("")),
  gender: z.string().max(30).optional().nullable(),
  bloodGroup: z.string().max(10).optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  emergencyContact: z.string().max(80).optional().nullable(),
  allergies: z.string().max(1000).optional().nullable(),
  medicalHistory: z.string().max(2000).optional().nullable(),
});

export const doctorCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email,
  password,
  specialty: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(120),
  qualification: z.string().trim().min(2).max(180),
  experienceYears: z.coerce.number().int().min(0).max(60).default(5),
  consultationFee: z.coerce.number().int().min(0).max(10000).default(120),
  room: z.string().trim().max(40).optional().or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const doctorUpdateSchema = z.object({
  specialty: z.string().trim().min(2).max(120).optional(),
  department: z.string().trim().min(2).max(120).optional(),
  qualification: z.string().trim().min(2).max(180).optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  consultationFee: z.coerce.number().int().min(0).max(10000).optional(),
  room: z.string().trim().max(40).optional(),
  bio: z.string().trim().max(1000).optional(),
  isAvailable: z.boolean().optional(),
});
