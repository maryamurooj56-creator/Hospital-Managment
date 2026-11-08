import { count, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLogs,
  appointments,
  doctorProfiles,
  patientProfiles,
  prescriptions,
  users,
  type User,
} from "@/db/schema";
import { DOCTOR_SEEDS } from "@/lib/constants";
import { hashPassword } from "@/lib/password";

export const DEMO_PASSWORD = "CareWell@123";

const PATIENT_SEEDS = [
  {
    fullName: "Jordan Ellis",
    email: "patient@carewell.test",
    phone: "+1 (323) 555-0142",
    dateOfBirth: "1992-04-18",
    gender: "Female",
    bloodGroup: "O+",
    address: "218 Rosewood Avenue, Los Angeles, CA",
    emergencyContact: "+1 (323) 555-0199",
    allergies: "Penicillin",
  },
  {
    fullName: "Michael Turner",
    email: "patient2@carewell.test",
    phone: "+1 (323) 555-0117",
    dateOfBirth: "1984-11-02",
    gender: "Male",
    bloodGroup: "A-",
    address: "74 Cedar Street, Pasadena, CA",
    emergencyContact: "+1 (323) 555-0182",
    allergies: "None known",
  },
  {
    fullName: "Priya Shah",
    email: "patient3@carewell.test",
    phone: "+1 (323) 555-0128",
    dateOfBirth: "1997-07-25",
    gender: "Female",
    bloodGroup: "B+",
    address: "19 Willow Court, Los Angeles, CA",
    emergencyContact: "+1 (323) 555-0133",
    allergies: "Latex",
  },
  {
    fullName: "Robert Hayes",
    email: "patient4@carewell.test",
    phone: "+1 (323) 555-0156",
    dateOfBirth: "1971-02-09",
    gender: "Male",
    bloodGroup: "AB+",
    address: "905 Grandview Drive, Glendale, CA",
    emergencyContact: "+1 (323) 555-0171",
    allergies: "Sulfa drugs",
  },
  {
    fullName: "Emily Carter",
    email: "patient5@carewell.test",
    phone: "+1 (323) 555-0163",
    dateOfBirth: "2000-09-14",
    gender: "Female",
    bloodGroup: "O-",
    address: "44 Lakeview Road, Los Angeles, CA",
    emergencyContact: "+1 (323) 555-0188",
    allergies: "None known",
  },
];

function dateOffset(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export async function seedDatabase(): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const userValues = [
    {
      fullName: "Alex Morgan",
      email: "admin@carewell.test",
      phone: "+1 (323) 456-7890",
      passwordHash,
      role: "admin" as const,
    },
    ...DOCTOR_SEEDS.map((doctor) => ({
      fullName: doctor.fullName,
      email: doctor.email,
      phone: "+1 (323) 456-7891",
      passwordHash,
      role: "doctor" as const,
    })),
    ...PATIENT_SEEDS.map((patient) => ({
      fullName: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      passwordHash,
      role: "patient" as const,
    })),
  ];

  await db.insert(users).values(userValues).onConflictDoNothing({ target: users.email });

  const allEmails = userValues.map((user) => user.email);
  const existingUsers: User[] = await db
    .select()
    .from(users)
    .where(inArray(users.email, allEmails));
  const userByEmail = new Map(existingUsers.map((user) => [user.email, user]));

  await db
    .insert(doctorProfiles)
    .values(
      DOCTOR_SEEDS.map((doctor) => {
        const user = userByEmail.get(doctor.email);
        if (!user) throw new Error(`Missing seeded doctor user: ${doctor.email}`);
        return {
          userId: user.id,
          specialty: doctor.specialty,
          department: doctor.department,
          qualification: doctor.qualification,
          experienceYears: doctor.experienceYears,
          consultationFee: doctor.consultationFee,
          room: doctor.room,
          bio: doctor.bio,
          photoUrl: doctor.photoUrl,
          ratingX10: doctor.ratingX10,
          isAvailable: true,
        };
      }),
    )
    .onConflictDoNothing({ target: doctorProfiles.userId });

  await db
    .insert(patientProfiles)
    .values(
      PATIENT_SEEDS.map((patient) => {
        const user = userByEmail.get(patient.email);
        if (!user) throw new Error(`Missing seeded patient user: ${patient.email}`);
        return {
          userId: user.id,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          allergies: patient.allergies,
          medicalHistory: "No significant past medical history recorded.",
        };
      }),
    )
    .onConflictDoNothing({ target: patientProfiles.userId });

  const doctorUserIds = DOCTOR_SEEDS.map((doctor) => userByEmail.get(doctor.email)!.id);
  const patientUserIds = PATIENT_SEEDS.map((patient) => userByEmail.get(patient.email)!.id);
  const doctorRows = await db
    .select()
    .from(doctorProfiles)
    .where(inArray(doctorProfiles.userId, doctorUserIds));
  const patientRows = await db
    .select()
    .from(patientProfiles)
    .where(inArray(patientProfiles.userId, patientUserIds));

  const doctorIdByEmail = new Map<string, number>();
  for (const doctor of DOCTOR_SEEDS) {
    const user = userByEmail.get(doctor.email)!;
    const profile = doctorRows.find((row) => row.userId === user.id);
    if (profile) doctorIdByEmail.set(doctor.email, profile.id);
  }
  const patientIdByEmail = new Map<string, number>();
  for (const patient of PATIENT_SEEDS) {
    const user = userByEmail.get(patient.email)!;
    const profile = patientRows.find((row) => row.userId === user.id);
    if (profile) patientIdByEmail.set(patient.email, profile.id);
  }

  const [{ value: appointmentCount }] = await db.select({ value: count() }).from(appointments);
  if (appointmentCount === 0 && patientRows.length >= 5 && doctorRows.length >= 6) {
    const p1 = patientIdByEmail.get(PATIENT_SEEDS[0].email)!;
    const p2 = patientIdByEmail.get(PATIENT_SEEDS[1].email)!;
    const p3 = patientIdByEmail.get(PATIENT_SEEDS[2].email)!;
    const p4 = patientIdByEmail.get(PATIENT_SEEDS[3].email)!;
    const p5 = patientIdByEmail.get(PATIENT_SEEDS[4].email)!;
    const d1 = doctorIdByEmail.get(DOCTOR_SEEDS[0].email)!;
    const d2 = doctorIdByEmail.get(DOCTOR_SEEDS[1].email)!;
    const d3 = doctorIdByEmail.get(DOCTOR_SEEDS[2].email)!;
    const d4 = doctorIdByEmail.get(DOCTOR_SEEDS[3].email)!;
    const d5 = doctorIdByEmail.get(DOCTOR_SEEDS[4].email)!;
    const d6 = doctorIdByEmail.get(DOCTOR_SEEDS[5].email)!;

    await db.insert(appointments).values([
      {
        patientId: p1,
        doctorId: d1,
        appointmentDate: dateOffset(2),
        timeSlot: "10:00 AM",
        reason: "Follow-up ECG and blood pressure review",
        status: "confirmed",
        notes: "Please bring recent lab reports.",
      },
      {
        patientId: p1,
        doctorId: d3,
        appointmentDate: dateOffset(-12),
        timeSlot: "11:30 AM",
        reason: "Seasonal allergy consultation",
        status: "completed",
      },
      {
        patientId: p2,
        doctorId: d2,
        appointmentDate: dateOffset(1),
        timeSlot: "09:15 AM",
        reason: "Recurring migraine evaluation",
        status: "pending",
      },
      {
        patientId: p3,
        doctorId: d4,
        appointmentDate: dateOffset(4),
        timeSlot: "02:30 PM",
        reason: "Knee pain after weekend sports injury",
        status: "confirmed",
      },
      {
        patientId: p4,
        doctorId: d5,
        appointmentDate: dateOffset(-5),
        timeSlot: "01:00 PM",
        reason: "Annual skin screening",
        status: "completed",
      },
      {
        patientId: p5,
        doctorId: d6,
        appointmentDate: dateOffset(6),
        timeSlot: "08:30 AM",
        reason: "General wellness check and bloodwork",
        status: "pending",
      },
      {
        patientId: p2,
        doctorId: d1,
        appointmentDate: dateOffset(-25),
        timeSlot: "03:15 PM",
        reason: "Chest discomfort assessment",
        status: "cancelled",
      },
    ]);
  }

  const [{ value: prescriptionCount }] = await db.select({ value: count() }).from(prescriptions);
  if (prescriptionCount === 0 && patientRows.length >= 5 && doctorRows.length >= 6) {
    const p1 = patientIdByEmail.get(PATIENT_SEEDS[0].email)!;
    const p2 = patientIdByEmail.get(PATIENT_SEEDS[1].email)!;
    const p4 = patientIdByEmail.get(PATIENT_SEEDS[3].email)!;
    const d1 = doctorIdByEmail.get(DOCTOR_SEEDS[0].email)!;
    const d2 = doctorIdByEmail.get(DOCTOR_SEEDS[1].email)!;
    const d5 = doctorIdByEmail.get(DOCTOR_SEEDS[4].email)!;

    await db.insert(prescriptions).values([
      {
        patientId: p1,
        doctorId: d1,
        diagnosis: "Essential hypertension",
        medications: "Amlodipine 5 mg — once daily, 30 days\nLow-dose aspirin 81 mg — once daily, 30 days",
        notes: "Monitor blood pressure each morning. Review in four weeks.",
        status: "active",
      },
      {
        patientId: p2,
        doctorId: d2,
        diagnosis: "Migraine without aura",
        medications: "Sumatriptan 50 mg — at onset, max 2 doses in 24 hours",
        notes: "Maintain a sleep and trigger diary.",
        status: "active",
      },
      {
        patientId: p4,
        doctorId: d5,
        diagnosis: "Mild contact dermatitis",
        medications: "Hydrocortisone 1% cream — thin layer twice daily for 7 days",
        notes: "Avoid fragranced products and follow up if rash spreads.",
        status: "completed",
      },
    ]);
  }

  const [{ value: logCount }] = await db.select({ value: count() }).from(activityLogs);
  if (logCount === 0) {
    await db.insert(activityLogs).values([
      {
        actorEmail: "admin@carewell.test",
        action: "SEED_DATABASE",
        entity: "system",
        detail: "Demo doctors, patients, appointments and prescriptions created",
        level: "info",
      },
      {
        actorEmail: "doctor@carewell.test",
        action: "ISSUE_PRESCRIPTION",
        entity: "prescription",
        detail: "Sample e-prescription issued to Jordan Ellis",
        level: "info",
      },
    ]);
  }
}

const globalForSeed = globalThis as typeof globalThis & {
  __carewellSeedPromise?: Promise<void>;
};

export function ensureSeeded(): Promise<void> {
  if (!globalForSeed.__carewellSeedPromise) {
    globalForSeed.__carewellSeedPromise = seedDatabase().catch((error) => {
      console.error("[CareWell] Database seeding failed", error);
      globalForSeed.__carewellSeedPromise = undefined;
    });
  }
  return globalForSeed.__carewellSeedPromise;
}
