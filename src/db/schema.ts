import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "doctor", "patient"]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);
export const prescriptionStatusEnum = pgEnum("prescription_status", ["active", "completed", "cancelled"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 40 }),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("patient"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const patientProfiles = pgTable("patient_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender", { length: 30 }),
  bloodGroup: varchar("blood_group", { length: 10 }),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 80 }),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const doctorProfiles = pgTable("doctor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  specialty: varchar("specialty", { length: 120 }).notNull(),
  department: varchar("department", { length: 120 }).notNull(),
  qualification: varchar("qualification", { length: 180 }).notNull(),
  experienceYears: integer("experience_years").notNull().default(5),
  consultationFee: integer("consultation_fee").notNull().default(120),
  room: varchar("room", { length: 40 }),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  ratingX10: integer("rating_x10").notNull().default(48),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
    doctorId: integer("doctor_id").notNull().references(() => doctorProfiles.id, { onDelete: "cascade" }),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    appointmentDate: date("appointment_date").notNull(),
    timeSlot: varchar("time_slot", { length: 30 }).notNull(),
    reason: text("reason").notNull(),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("appointments_patient_idx").on(table.patientId),
    index("appointments_doctor_idx").on(table.doctorId),
    index("appointments_date_idx").on(table.appointmentDate),
  ],
);

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
    doctorId: integer("doctor_id").notNull().references(() => doctorProfiles.id, { onDelete: "cascade" }),
    appointmentId: integer("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    diagnosis: varchar("diagnosis", { length: 255 }).notNull(),
    medications: text("medications").notNull(),
    notes: text("notes"),
    status: prescriptionStatusEnum("status").notNull().default("active"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("prescriptions_patient_idx").on(table.patientId),
    index("prescriptions_doctor_idx").on(table.doctorId),
  ],
);

export const medicalFiles = pgTable(
  "medical_files",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
    appointmentId: integer("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("medical_files_patient_idx").on(table.patientId)],
);

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorEmail: varchar("actor_email", { length: 255 }),
  action: varchar("action", { length: 80 }).notNull(),
  entity: varchar("entity", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 40 }),
  detail: text("detail"),
  level: varchar("level", { length: 20 }).notNull().default("info"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type PatientProfile = typeof patientProfiles.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;
export type MedicalFile = typeof medicalFiles.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type UserRole = User["role"];
