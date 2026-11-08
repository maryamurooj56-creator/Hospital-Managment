import { alias } from "drizzle-orm/pg-core";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLogs,
  appointments,
  doctorProfiles,
  medicalFiles,
  patientProfiles,
  prescriptions,
  users,
} from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";

const patientUsers = alias(users, "patient_users");
const doctorUsers = alias(users, "doctor_users");

export type DoctorView = {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  specialty: string;
  department: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  room: string | null;
  bio: string | null;
  photoUrl: string | null;
  ratingX10: number;
  isAvailable: boolean;
};

export type AppointmentView = {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  timeSlot: string;
  reason: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  createdAt: Date;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorDepartment: string;
};

export type PrescriptionView = {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentId: number | null;
  diagnosis: string;
  medications: string;
  notes: string | null;
  status: "active" | "completed" | "cancelled";
  issuedAt: Date;
  patientName: string;
  doctorName: string;
};

export type PatientView = {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  address: string | null;
  emergencyContact: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  isActive: boolean;
  createdAt: Date;
};

export async function getDoctors(filters: { q?: string; department?: string } = {}): Promise<DoctorView[]> {
  const conditions: SQL[] = [];
  if (filters.department && filters.department !== "all") {
    conditions.push(eq(doctorProfiles.department, filters.department));
  }
  if (filters.q) {
    const search = `%${filters.q}%`;
    const searchCondition = or(
      ilike(users.fullName, search),
      ilike(doctorProfiles.specialty, search),
      ilike(doctorProfiles.department, search),
      ilike(doctorProfiles.qualification, search),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  return db
    .select({
      id: doctorProfiles.id,
      userId: doctorProfiles.userId,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      specialty: doctorProfiles.specialty,
      department: doctorProfiles.department,
      qualification: doctorProfiles.qualification,
      experienceYears: doctorProfiles.experienceYears,
      consultationFee: doctorProfiles.consultationFee,
      room: doctorProfiles.room,
      bio: doctorProfiles.bio,
      photoUrl: doctorProfiles.photoUrl,
      ratingX10: doctorProfiles.ratingX10,
      isAvailable: doctorProfiles.isAvailable,
    })
    .from(doctorProfiles)
    .innerJoin(users, eq(doctorProfiles.userId, users.id))
    .where(and(...conditions))
    .orderBy(asc(doctorProfiles.id));
}

export async function getPatientProfileByUserId(userId: number) {
  const [profile] = await db
    .select()
    .from(patientProfiles)
    .where(eq(patientProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function getDoctorProfileByUserId(userId: number) {
  const [profile] = await db
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function requirePatientProfile(session: SessionUser) {
  if (session.role !== "patient") throw new ApiError(403, "A patient account is required");
  const profile = await getPatientProfileByUserId(session.id);
  if (!profile) throw new ApiError(404, "Patient profile not found");
  return profile;
}

export async function requireDoctorProfile(session: SessionUser) {
  if (session.role !== "doctor") throw new ApiError(403, "A doctor account is required");
  const profile = await getDoctorProfileByUserId(session.id);
  if (!profile) throw new ApiError(404, "Doctor profile not found");
  return profile;
}

export type AppointmentFilters = {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  doctorId?: number;
  limit?: number;
};

export async function listAppointments(
  session: SessionUser | null,
  filters: AppointmentFilters = {},
  scoped = true,
): Promise<AppointmentView[]> {
  const conditions: SQL[] = [];
  if (scoped && session) {
    if (session.role === "patient") {
      const profile = await requirePatientProfile(session);
      conditions.push(eq(appointments.patientId, profile.id));
    } else if (session.role === "doctor") {
      const profile = await requireDoctorProfile(session);
      conditions.push(eq(appointments.doctorId, profile.id));
    }
  }
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(appointments.status, filters.status as (typeof appointments.status)["_"]["data"]));
  }
  if (filters.from) conditions.push(gte(appointments.appointmentDate, filters.from));
  if (filters.to) conditions.push(lte(appointments.appointmentDate, filters.to));
  if (filters.doctorId) conditions.push(eq(appointments.doctorId, filters.doctorId));
  if (filters.q) {
    const search = `%${filters.q}%`;
    const condition = or(
      ilike(patientUsers.fullName, search),
      ilike(doctorUsers.fullName, search),
      ilike(appointments.reason, search),
    );
    if (condition) conditions.push(condition);
  }

  return db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      doctorId: appointments.doctorId,
      appointmentDate: appointments.appointmentDate,
      timeSlot: appointments.timeSlot,
      reason: appointments.reason,
      status: appointments.status,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      patientName: patientUsers.fullName,
      patientEmail: patientUsers.email,
      doctorName: doctorUsers.fullName,
      doctorDepartment: doctorProfiles.department,
    })
    .from(appointments)
    .innerJoin(patientProfiles, eq(appointments.patientId, patientProfiles.id))
    .innerJoin(patientUsers, eq(patientProfiles.userId, patientUsers.id))
    .innerJoin(doctorProfiles, eq(appointments.doctorId, doctorProfiles.id))
    .innerJoin(doctorUsers, eq(doctorProfiles.userId, doctorUsers.id))
    .where(and(...conditions))
    .orderBy(desc(appointments.appointmentDate), desc(appointments.id))
    .limit(Math.min(filters.limit ?? 200, 500));
}

export async function listPrescriptions(
  session: SessionUser | null,
  filters: { q?: string; status?: string } = {},
  scoped = true,
): Promise<PrescriptionView[]> {
  const conditions: SQL[] = [];
  if (scoped && session) {
    if (session.role === "patient") {
      const profile = await requirePatientProfile(session);
      conditions.push(eq(prescriptions.patientId, profile.id));
    } else if (session.role === "doctor") {
      const profile = await requireDoctorProfile(session);
      conditions.push(eq(prescriptions.doctorId, profile.id));
    }
  }
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(prescriptions.status, filters.status as (typeof prescriptions.status)["_"]["data"]));
  }
  if (filters.q) {
    const search = `%${filters.q}%`;
    const condition = or(
      ilike(patientUsers.fullName, search),
      ilike(prescriptions.diagnosis, search),
      ilike(prescriptions.medications, search),
    );
    if (condition) conditions.push(condition);
  }

  return db
    .select({
      id: prescriptions.id,
      patientId: prescriptions.patientId,
      doctorId: prescriptions.doctorId,
      appointmentId: prescriptions.appointmentId,
      diagnosis: prescriptions.diagnosis,
      medications: prescriptions.medications,
      notes: prescriptions.notes,
      status: prescriptions.status,
      issuedAt: prescriptions.issuedAt,
      patientName: patientUsers.fullName,
      doctorName: doctorUsers.fullName,
    })
    .from(prescriptions)
    .innerJoin(patientProfiles, eq(prescriptions.patientId, patientProfiles.id))
    .innerJoin(patientUsers, eq(patientProfiles.userId, patientUsers.id))
    .innerJoin(doctorProfiles, eq(prescriptions.doctorId, doctorProfiles.id))
    .innerJoin(doctorUsers, eq(doctorProfiles.userId, doctorUsers.id))
    .where(and(...conditions))
    .orderBy(desc(prescriptions.issuedAt), desc(prescriptions.id))
    .limit(200);
}

export async function listPatients(session: SessionUser): Promise<PatientView[]> {
  if (session.role === "patient") throw new ApiError(403, "Not permitted");
  const conditions: SQL[] = [];
  if (session.role === "doctor") {
    const doctor = await requireDoctorProfile(session);
    const related = await db
      .selectDistinct({ patientId: appointments.patientId })
      .from(appointments)
      .where(eq(appointments.doctorId, doctor.id));
    const ids = related.map((row) => row.patientId);
    if (ids.length === 0) return [];
    conditions.push(inArray(patientProfiles.id, ids));
  }

  return db
    .select({
      id: patientProfiles.id,
      userId: patientProfiles.userId,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      dateOfBirth: patientProfiles.dateOfBirth,
      gender: patientProfiles.gender,
      bloodGroup: patientProfiles.bloodGroup,
      address: patientProfiles.address,
      emergencyContact: patientProfiles.emergencyContact,
      allergies: patientProfiles.allergies,
      medicalHistory: patientProfiles.medicalHistory,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(patientProfiles)
    .innerJoin(users, eq(patientProfiles.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(users.createdAt))
    .limit(200);
}

export async function listMedicalFiles(session: SessionUser) {
  if (session.role === "patient") {
    const profile = await requirePatientProfile(session);
    return db
      .select({
        id: medicalFiles.id,
        patientId: medicalFiles.patientId,
        appointmentId: medicalFiles.appointmentId,
        fileName: medicalFiles.fileName,
        mimeType: medicalFiles.mimeType,
        sizeBytes: medicalFiles.sizeBytes,
        createdAt: medicalFiles.createdAt,
        patientName: users.fullName,
      })
      .from(medicalFiles)
      .innerJoin(patientProfiles, eq(medicalFiles.patientId, patientProfiles.id))
      .innerJoin(users, eq(patientProfiles.userId, users.id))
      .where(eq(medicalFiles.patientId, profile.id))
      .orderBy(desc(medicalFiles.createdAt));
  }

  if (session.role === "doctor") {
    const doctor = await requireDoctorProfile(session);
    const related = await db
      .selectDistinct({ patientId: appointments.patientId })
      .from(appointments)
      .where(eq(appointments.doctorId, doctor.id));
    const ids = related.map((row) => row.patientId);
    if (ids.length === 0) return [];
    return db
      .select({
        id: medicalFiles.id,
        patientId: medicalFiles.patientId,
        appointmentId: medicalFiles.appointmentId,
        fileName: medicalFiles.fileName,
        mimeType: medicalFiles.mimeType,
        sizeBytes: medicalFiles.sizeBytes,
        createdAt: medicalFiles.createdAt,
        patientName: users.fullName,
      })
      .from(medicalFiles)
      .innerJoin(patientProfiles, eq(medicalFiles.patientId, patientProfiles.id))
      .innerJoin(users, eq(patientProfiles.userId, users.id))
      .where(inArray(medicalFiles.patientId, ids))
      .orderBy(desc(medicalFiles.createdAt));
  }

  return db
    .select({
      id: medicalFiles.id,
      patientId: medicalFiles.patientId,
      appointmentId: medicalFiles.appointmentId,
      fileName: medicalFiles.fileName,
      mimeType: medicalFiles.mimeType,
      sizeBytes: medicalFiles.sizeBytes,
      createdAt: medicalFiles.createdAt,
      patientName: users.fullName,
    })
    .from(medicalFiles)
    .innerJoin(patientProfiles, eq(medicalFiles.patientId, patientProfiles.id))
    .innerJoin(users, eq(patientProfiles.userId, users.id))
    .orderBy(desc(medicalFiles.createdAt));
}

export async function getAdminSnapshot() {
  const [[userCount], [doctorCount], [patientCount], [appointmentCount], [prescriptionCount], [fileCount]] =
    await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(doctorProfiles),
      db.select({ value: count() }).from(patientProfiles),
      db.select({ value: count() }).from(appointments),
      db.select({ value: count() }).from(prescriptions),
      db.select({ value: count() }).from(medicalFiles),
    ]);

  const statusRows = await db
    .select({ status: appointments.status, value: count() })
    .from(appointments)
    .groupBy(appointments.status);
  const recentLogs = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(30);

  return {
    users: userCount?.value ?? 0,
    doctors: doctorCount?.value ?? 0,
    patients: patientCount?.value ?? 0,
    appointments: appointmentCount?.value ?? 0,
    prescriptions: prescriptionCount?.value ?? 0,
    files: fileCount?.value ?? 0,
    statusRows: statusRows.map((row) => ({ status: row.status, count: row.value })),
    recentLogs: recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      detail: log.detail,
      actorEmail: log.actorEmail,
      level: log.level,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}
