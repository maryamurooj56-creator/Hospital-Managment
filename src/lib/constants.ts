export const APP_NAME = "CareWell Hospital";
export const EMERGENCY_PHONE = "+1 (323) 456-7890";

export const DEPARTMENTS = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Dermatology",
  "General Medicine",
] as const;

export const TIME_SLOTS = [
  "08:30 AM",
  "09:15 AM",
  "10:00 AM",
  "10:45 AM",
  "11:30 AM",
  "01:00 PM",
  "01:45 PM",
  "02:30 PM",
  "03:15 PM",
  "04:00 PM",
] as const;

export const APPOINTMENT_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export const PRESCRIPTION_STATUSES = ["active", "completed", "cancelled"] as const;
export const USER_ROLES = ["admin", "doctor", "patient"] as const;

export type DoctorSeed = {
  fullName: string;
  email: string;
  specialty: string;
  department: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  room: string;
  bio: string;
  photoUrl: string;
  ratingX10: number;
};

export const DOCTOR_SEEDS: DoctorSeed[] = [
  {
    fullName: "Dr. Amelia Hart",
    email: "doctor@carewell.test",
    specialty: "Interventional Cardiologist",
    department: "Cardiology",
    qualification: "MD, FACC, Fellowship in Cardiology",
    experienceYears: 14,
    consultationFee: 180,
    room: "Heart Center · 302",
    bio: "Specialises in preventive cardiology, heart rhythm care and minimally invasive cardiac procedures.",
    photoUrl:
      "https://images.pexels.com/photos/6749778/pexels-photo-6749778.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    ratingX10: 49,
  },
  {
    fullName: "Dr. Sofia Reyes",
    email: "doctor2@carewell.test",
    specialty: "Neurologist",
    department: "Neurology",
    qualification: "MD, DM Neurology",
    experienceYears: 11,
    consultationFee: 165,
    room: "Neuroscience Wing · 410",
    bio: "Cares for patients with migraine, epilepsy, movement disorders and complex neurological conditions.",
    photoUrl:
      "https://images.pexels.com/photos/6749773/pexels-photo-6749773.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    ratingX10: 48,
  },
  {
    fullName: "Dr. Elena Brooks",
    email: "doctor3@carewell.test",
    specialty: "Pediatric Specialist",
    department: "Pediatrics",
    qualification: "MD, DCH, Fellowship in Pediatrics",
    experienceYears: 9,
    consultationFee: 130,
    room: "Children's Clinic · 118",
    bio: "Provides gentle, evidence-based care from newborn checkups through adolescent health.",
    photoUrl:
      "https://images.pexels.com/photos/8459997/pexels-photo-8459997.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    ratingX10: 50,
  },
  {
    fullName: "Dr. Daniel Kim",
    email: "doctor4@carewell.test",
    specialty: "Orthopedic Surgeon",
    department: "Orthopedics",
    qualification: "MS Orthopedics, Sports Medicine Fellowship",
    experienceYears: 16,
    consultationFee: 190,
    room: "Bone & Joint Center · 215",
    bio: "Focuses on sports injuries, joint preservation and minimally invasive orthopedic surgery.",
    photoUrl:
      "https://images.pexels.com/photos/15962798/pexels-photo-15962798.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    ratingX10: 48,
  },
  {
    fullName: "Dr. Marcus Chen",
    email: "doctor5@carewell.test",
    specialty: "Dermatologist",
    department: "Dermatology",
    qualification: "MD, DDVL, Laser Medicine Certification",
    experienceYears: 8,
    consultationFee: 140,
    room: "Skin & Wellness · 224",
    bio: "Expert in medical dermatology, skin cancer screening and personalised treatment plans.",
    photoUrl:
      "https://images.pexels.com/photos/29995617/pexels-photo-29995617.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    ratingX10: 47,
  },
  {
    fullName: "Dr. Oliver Grant",
    email: "doctor6@carewell.test",
    specialty: "General Physician",
    department: "General Medicine",
    qualification: "MD, Internal Medicine",
    experienceYears: 12,
    consultationFee: 110,
    room: "Primary Care · 105",
    bio: "Coordinates whole-person primary care, chronic condition management and preventive health.",
    photoUrl:
      "https://images.pexels.com/photos/17221170/pexels-photo-17221170.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    ratingX10: 49,
  },
];

export const SERVICES = [
  {
    title: "Online Appointments",
    description: "Choose a specialist, preferred date and time in under two minutes.",
    icon: "calendar",
  },
  {
    title: "Digital Prescriptions",
    description: "Access diagnosis, medicines and clinician notes securely after your visit.",
    icon: "prescription",
  },
  {
    title: "Specialist Care",
    description: "Six leading departments with experienced, board-certified consultants.",
    icon: "stethoscope",
  },
  {
    title: "Secure Records",
    description: "Upload reports and keep your care history organised in one protected place.",
    icon: "shield",
  },
];
