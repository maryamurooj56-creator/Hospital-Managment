"use client";

import {
  Activity,
  CalendarDays,
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { EmptyState, Message, Panel, SearchInput, StatCard, StatusPill, Tabs } from "@/components/dashboard-ui";
import type { SessionUser } from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/constants";
import type { AppointmentView, DoctorView, PatientView, PrescriptionView } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/format";

type Snapshot = {
  users: number;
  doctors: number;
  patients: number;
  appointments: number;
  prescriptions: number;
  files: number;
  statusRows: { status: string; count: number }[];
  recentLogs: { id: number; action: string; entity: string; detail: string | null; actorEmail: string | null; level: string; createdAt: string }[];
};

type Tab = "overview" | "appointments" | "doctors" | "patients" | "prescriptions" | "logs";

type Props = {
  session: SessionUser;
  snapshot: Snapshot;
  doctors: DoctorView[];
  patients: PatientView[];
  appointments: AppointmentView[];
  prescriptions: PrescriptionView[];
};

const emptyDoctor: {
  fullName: string;
  email: string;
  password: string;
  specialty: string;
  department: string;
  qualification: string;
  experienceYears: string;
  consultationFee: string;
  room: string;
  bio: string;
} = {
  fullName: "",
  email: "",
  password: "CareWell@123",
  specialty: "",
  department: DEPARTMENTS[0],
  qualification: "",
  experienceYears: "5",
  consultationFee: "120",
  room: "",
  bio: "",
};

const emptyPatient = {
  fullName: "",
  email: "",
  phone: "",
  password: "CareWell@123",
  dateOfBirth: "",
  gender: "",
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export function AdminDashboard({ session, snapshot: initialSnapshot, doctors: initialDoctors, patients: initialPatients, appointments: initialAppointments, prescriptions: initialPrescriptions }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [doctors, setDoctors] = useState(initialDoctors);
  const [patients, setPatients] = useState(initialPatients);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [patientForm, setPatientForm] = useState(emptyPatient);

  const statusCounts = ["pending", "confirmed", "completed", "cancelled"].map((value) => ({
    status: value,
    count: appointments.filter((item) => item.status === value).length,
  }));
  const maxStatus = Math.max(1, ...statusCounts.map((item) => item.count));

  const matches = (value: string) => value.toLowerCase().includes(query.trim().toLowerCase());
  const filteredAppointments = useMemo(() => appointments.filter((item) => (status === "all" || item.status === status) && (!query || matches(`${item.patientName} ${item.doctorName} ${item.reason}`))), [appointments, query, status]);
  const filteredDoctors = useMemo(() => doctors.filter((item) => !query || matches(`${item.fullName} ${item.email} ${item.specialty} ${item.department}`)), [doctors, query]);
  const filteredPatients = useMemo(() => patients.filter((item) => !query || matches(`${item.fullName} ${item.email} ${item.phone ?? ""}`)), [patients, query]);
  const filteredPrescriptions = useMemo(() => prescriptions.filter((item) => !query || matches(`${item.patientName} ${item.doctorName} ${item.diagnosis} ${item.medications}`)), [prescriptions, query]);

  async function refreshStats() {
    const data = await requestJson<Snapshot>("/api/admin/stats");
    setSnapshot(data);
  }

  async function reloadDoctors() {
    const data = await requestJson<{ doctors: DoctorView[] }>("/api/doctors");
    setDoctors(data.doctors);
  }

  async function reloadPatients() {
    const data = await requestJson<{ patients: PatientView[] }>("/api/patients");
    setPatients(data.patients);
  }

  async function createDoctor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create-doctor");
    setMessage(null);
    try {
      await requestJson("/api/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doctorForm) });
      await Promise.all([reloadDoctors(), refreshStats()]);
      setDoctorForm(emptyDoctor);
      setShowDoctorForm(false);
      setMessage({ kind: "success", text: "Doctor account and profile created." });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to create doctor" });
    } finally {
      setBusy("");
    }
  }

  async function createPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("create-patient");
    setMessage(null);
    try {
      await requestJson("/api/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patientForm) });
      await Promise.all([reloadPatients(), refreshStats()]);
      setPatientForm(emptyPatient);
      setShowPatientForm(false);
      setMessage({ kind: "success", text: "Patient account and profile created." });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to create patient" });
    } finally {
      setBusy("");
    }
  }

  async function toggleDoctor(doctor: DoctorView) {
    setBusy(`doctor-${doctor.id}`);
    setMessage(null);
    try {
      await requestJson(`/api/doctors/${doctor.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAvailable: !doctor.isAvailable }) });
      setDoctors((current) => current.map((item) => (item.id === doctor.id ? { ...item, isAvailable: !doctor.isAvailable } : item)));
      await refreshStats();
      setMessage({ kind: "success", text: `${doctor.fullName} availability updated.` });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to update doctor" });
    } finally {
      setBusy("");
    }
  }

  async function removeRecord(kind: "doctors" | "patients" | "appointments" | "prescriptions", id: number, label: string) {
    if (!window.confirm(`Delete ${label}? This action cannot be undone.`)) return;
    setBusy(`delete-${kind}-${id}`);
    setMessage(null);
    try {
      await requestJson(`/api/${kind}/${id}`, { method: "DELETE" });
      if (kind === "doctors") setDoctors((current) => current.filter((item) => item.id !== id));
      if (kind === "patients") setPatients((current) => current.filter((item) => item.id !== id));
      if (kind === "appointments") setAppointments((current) => current.filter((item) => item.id !== id));
      if (kind === "prescriptions") setPrescriptions((current) => current.filter((item) => item.id !== id));
      await refreshStats();
      setMessage({ kind: "success", text: `${label} deleted.` });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to delete record" });
    } finally {
      setBusy("");
    }
  }

  async function updateAppointmentStatus(id: number, nextStatus: string) {
    setBusy(`appointment-${id}`);
    setMessage(null);
    try {
      await requestJson(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
      setAppointments((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus as AppointmentView["status"] } : item)));
      await refreshStats();
      setMessage({ kind: "success", text: `Appointment marked ${nextStatus}.` });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to update appointment" });
    } finally {
      setBusy("");
    }
  }

  async function updatePrescriptionStatus(id: number, nextStatus: string) {
    setBusy(`rx-${id}`);
    setMessage(null);
    try {
      await requestJson(`/api/prescriptions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
      setPrescriptions((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus as PrescriptionView["status"] } : item)));
      await refreshStats();
      setMessage({ kind: "success", text: `Prescription marked ${nextStatus}.` });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to update prescription" });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="fade-in">
      <Tabs<Tab> tabs={[{ id: "overview", label: "Overview" }, { id: "appointments", label: "Appointments" }, { id: "doctors", label: "Doctors" }, { id: "patients", label: "Patients" }, { id: "prescriptions", label: "Prescriptions" }, { id: "logs", label: "Activity logs" }]} active={tab} onChange={setTab} />
      {message && <div className="mb-5"><Message {...message} /></div>}

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Total users" value={snapshot.users} hint={`${snapshot.patients} patients · ${snapshot.doctors} doctors`} />
            <StatCard icon={CalendarDays} label="Appointments" value={appointments.length} hint="All booking records" tone="violet" />
            <StatCard icon={ClipboardList} label="Prescriptions" value={prescriptions.length} hint="Digital care plans issued" tone="green" />
            <StatCard icon={FileText} label="Medical files" value={snapshot.files} hint="Secure uploaded documents" tone="amber" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <Panel title="Appointment distribution" subtitle="Live status across the hospital">
              <div className="space-y-4">
                {statusCounts.map((item) => (
                  <div key={item.status}>
                    <div className="mb-1.5 flex justify-between text-xs font-bold"><span className="capitalize text-slate-600">{item.status}</span><span className="text-[var(--navy)]">{item.count}</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.status === "cancelled" ? "bg-red-400" : item.status === "pending" ? "bg-amber-400" : "bg-[var(--brand)]"}`} style={{ width: `${Math.max(4, (item.count / maxStatus) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => { setTab("doctors"); setShowDoctorForm(true); }} className="cw-btn-outline !text-xs"><Plus size={15} /> Add doctor</button>
                <button type="button" onClick={() => { setTab("patients"); setShowPatientForm(true); }} className="cw-btn-outline !text-xs"><UserPlus size={15} /> Add patient</button>
              </div>
            </Panel>
            <Panel title="Recent system activity" subtitle="Authentication, clinical and administrative events" padded={false}>
              {snapshot.recentLogs.length === 0 ? <EmptyState icon={Activity} title="No activity yet" text="Actions will be logged here as users use the platform." /> : (
                <div className="max-h-[330px] divide-y divide-slate-100 overflow-y-auto">
                  {snapshot.recentLogs.slice(0, 12).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-4"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${log.level === "warning" ? "bg-amber-400" : "bg-[var(--brand)]"}`} /><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-[var(--navy)]">{log.action.replaceAll("_", " ")}</p><p className="mt-0.5 truncate text-xs text-slate-500">{log.detail || log.entity} · {log.actorEmail || "system"}</p></div><span className="shrink-0 text-[10px] text-slate-400">{formatDateTime(log.createdAt)}</span></div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Welcome, administrator" subtitle={`Signed in as ${session.email}`}>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "Role-based access", text: "Patient, doctor and admin permissions are enforced on every API route." },
                { icon: LayoutDashboard, title: "Unified operations", text: "Manage appointments, clinicians, patients and prescriptions from one view." },
                { icon: Activity, title: "Auditable actions", text: "Create, update and delete events are written to the activity log." },
              ].map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-xl bg-[#f6f9fe] p-4"><Icon size={19} className="text-[var(--brand)]" /><h3 className="mt-3 text-sm font-extrabold text-[var(--navy)]">{item.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p></div>; })}
            </div>
          </Panel>
        </div>
      )}

      {tab === "appointments" && (
        <Panel title="All appointments" subtitle="Search, update status or remove a booking" actions={<div className="flex flex-wrap gap-2"><SearchInput value={query} onChange={setQuery} placeholder="Search appointments..." /><select value={status} onChange={(event) => setStatus(event.target.value)} className="cw-input !w-auto"><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>} padded={false}>
          {filteredAppointments.length === 0 ? <EmptyState icon={Inbox} title="No appointments found" text="Try another search or status filter." /> : (
            <div className="cw-table-wrap !rounded-none !border-0"><table className="cw-table"><thead><tr><th>Patient</th><th>Doctor</th><th>Schedule</th><th>Status</th><th>Change</th><th /></tr></thead><tbody>
              {filteredAppointments.map((item) => (
                <tr key={item.id}><td><strong className="text-[var(--navy)]">{item.patientName}</strong></td><td>{item.doctorName}<span className="block text-xs text-slate-400">{item.doctorDepartment}</span></td><td>{formatDate(item.appointmentDate)}<span className="block text-xs text-slate-400">{item.timeSlot}</span></td><td><StatusPill status={item.status} /></td><td><select disabled={busy === `appointment-${item.id}`} value={item.status} onChange={(event) => updateAppointmentStatus(item.id, event.target.value)} className="cw-input !min-h-9 !w-[125px] !px-2 !py-1 !text-xs"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td><td><button type="button" onClick={() => removeRecord("appointments", item.id, `appointment #${item.id}`)} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50" aria-label="Delete appointment"><Trash2 size={14} /></button></td></tr>
              ))}
            </tbody></table></div>
          )}
        </Panel>
      )}

      {tab === "doctors" && (
        <div className="space-y-6">
          {showDoctorForm && (
            <Panel title="Add a doctor" subtitle="Creates a doctor login and clinical profile">
              <form onSubmit={createDoctor} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { key: "fullName", label: "Full name", type: "text" },
                  { key: "email", label: "Email", type: "email" },
                  { key: "password", label: "Temporary password", type: "text" },
                  { key: "specialty", label: "Specialty", type: "text" },
                  { key: "qualification", label: "Qualification", type: "text" },
                  { key: "experienceYears", label: "Experience (years)", type: "number" },
                  { key: "consultationFee", label: "Consultation fee", type: "number" },
                  { key: "room", label: "Room", type: "text" },
                ].map((field) => <label key={field.key}><span className="cw-label">{field.label}</span><input required={!["room"].includes(field.key)} type={field.type} className="cw-input" value={doctorForm[field.key as keyof typeof doctorForm]} onChange={(event) => setDoctorForm({ ...doctorForm, [field.key]: event.target.value })} /></label>)}
                <label><span className="cw-label">Department</span><select className="cw-input" value={doctorForm.department} onChange={(event) => setDoctorForm({ ...doctorForm, department: event.target.value })}>{DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="md:col-span-2"><span className="cw-label">Short bio</span><textarea className="cw-input" rows={2} value={doctorForm.bio} onChange={(event) => setDoctorForm({ ...doctorForm, bio: event.target.value })} /></label>
                <div className="flex items-end gap-2"><button type="submit" disabled={busy === "create-doctor"} className="cw-btn">{busy === "create-doctor" ? "Creating..." : "Create doctor"}</button><button type="button" onClick={() => setShowDoctorForm(false)} className="cw-btn-outline">Cancel</button></div>
              </form>
            </Panel>
          )}
          <Panel title="Doctor management" subtitle={`${doctors.length} clinician profiles`} actions={<div className="flex gap-2"><SearchInput value={query} onChange={setQuery} placeholder="Search doctors..." /><button type="button" onClick={() => setShowDoctorForm((value) => !value)} className="cw-btn !min-h-10 !px-3 !text-xs"><Plus size={15} /> Add doctor</button></div>} padded={false}>
            {filteredDoctors.length === 0 ? <EmptyState icon={Stethoscope} title="No doctors found" text="Adjust your search or add a new specialist." /> : (
              <div className="cw-table-wrap !rounded-none !border-0"><table className="cw-table"><thead><tr><th>Doctor</th><th>Department</th><th>Experience</th><th>Fee</th><th>Available</th><th>Action</th></tr></thead><tbody>
                {filteredDoctors.map((item) => <tr key={item.id}><td><strong className="text-[var(--navy)]">{item.fullName}</strong><span className="block text-xs text-slate-400">{item.email}</span></td><td>{item.department}<span className="block text-xs text-slate-400">{item.specialty}</span></td><td>{item.experienceYears} yrs</td><td>${item.consultationFee}</td><td><span className={item.isAvailable ? "cw-badge badge-green" : "cw-badge badge-slate"}>{item.isAvailable ? "Yes" : "No"}</span></td><td><div className="flex gap-2"><button type="button" disabled={busy === `doctor-${item.id}`} onClick={() => toggleDoctor(item)} className="cw-btn-outline !min-h-8 !px-2.5 !text-xs">{item.isAvailable ? "Pause" : "Activate"}</button><button type="button" onClick={() => removeRecord("doctors", item.id, item.fullName)} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50" aria-label={`Delete ${item.fullName}`}><Trash2 size={14} /></button></div></td></tr>)}
              </tbody></table></div>
            )}
          </Panel>
        </div>
      )}

      {tab === "patients" && (
        <div className="space-y-6">
          {showPatientForm && (
            <Panel title="Add a patient" subtitle="Creates a patient login and health profile">
              <form onSubmit={createPatient} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label><span className="cw-label">Full name *</span><input required className="cw-input" value={patientForm.fullName} onChange={(event) => setPatientForm({ ...patientForm, fullName: event.target.value })} /></label>
                <label><span className="cw-label">Email *</span><input required type="email" className="cw-input" value={patientForm.email} onChange={(event) => setPatientForm({ ...patientForm, email: event.target.value })} /></label>
                <label><span className="cw-label">Phone</span><input className="cw-input" value={patientForm.phone} onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })} /></label>
                <label><span className="cw-label">Temporary password *</span><input required minLength={8} className="cw-input" value={patientForm.password} onChange={(event) => setPatientForm({ ...patientForm, password: event.target.value })} /></label>
                <label><span className="cw-label">Date of birth</span><input type="date" className="cw-input" value={patientForm.dateOfBirth} onChange={(event) => setPatientForm({ ...patientForm, dateOfBirth: event.target.value })} /></label>
                <label><span className="cw-label">Gender</span><select className="cw-input" value={patientForm.gender} onChange={(event) => setPatientForm({ ...patientForm, gender: event.target.value })}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Other</option></select></label>
                <div className="flex items-end gap-2 md:col-span-2 lg:col-span-3"><button type="submit" disabled={busy === "create-patient"} className="cw-btn">{busy === "create-patient" ? "Creating..." : "Create patient"}</button><button type="button" onClick={() => setShowPatientForm(false)} className="cw-btn-outline">Cancel</button></div>
              </form>
            </Panel>
          )}
          <Panel title="Patient records" subtitle={`${patients.length} registered patients`} actions={<div className="flex gap-2"><SearchInput value={query} onChange={setQuery} placeholder="Search patients..." /><button type="button" onClick={() => setShowPatientForm((value) => !value)} className="cw-btn !min-h-10 !px-3 !text-xs"><UserPlus size={15} /> Add patient</button></div>} padded={false}>
            {filteredPatients.length === 0 ? <EmptyState icon={Users} title="No patients found" text="Adjust your search or register a new patient." /> : (
              <div className="cw-table-wrap !rounded-none !border-0"><table className="cw-table"><thead><tr><th>Patient</th><th>Contact</th><th>DOB</th><th>Blood group</th><th>Allergies</th><th /></tr></thead><tbody>
                {filteredPatients.map((item) => <tr key={item.id}><td><strong className="text-[var(--navy)]">{item.fullName}</strong><span className="block text-xs text-slate-400">Joined {formatDate(item.createdAt)}</span></td><td>{item.email}<span className="block text-xs text-slate-400">{item.phone || "—"}</span></td><td>{formatDate(item.dateOfBirth)}</td><td>{item.bloodGroup || "—"}</td><td className="max-w-[160px]">{item.allergies || "—"}</td><td><button type="button" onClick={() => removeRecord("patients", item.id, item.fullName)} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50" aria-label={`Delete ${item.fullName}`}><Trash2 size={14} /></button></td></tr>)}
              </tbody></table></div>
            )}
          </Panel>
        </div>
      )}

      {tab === "prescriptions" && (
        <Panel title="All e-prescriptions" subtitle="Review and manage care plans" actions={<SearchInput value={query} onChange={setQuery} placeholder="Search prescriptions..." />} padded={false}>
          {filteredPrescriptions.length === 0 ? <EmptyState icon={ClipboardList} title="No prescriptions found" text="Try a different diagnosis, patient or medicine." /> : (
            <div className="cw-table-wrap !rounded-none !border-0"><table className="cw-table"><thead><tr><th>RX</th><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Status</th><th>Change</th><th /></tr></thead><tbody>
              {filteredPrescriptions.map((item) => <tr key={item.id}><td><strong>#{String(item.id).padStart(5, "0")}</strong><span className="block text-xs text-slate-400">{formatDate(item.issuedAt)}</span></td><td>{item.patientName}</td><td>{item.doctorName}</td><td className="max-w-[180px]"><span className="line-clamp-2">{item.diagnosis}</span></td><td><StatusPill status={item.status} /></td><td><select disabled={busy === `rx-${item.id}`} value={item.status} onChange={(event) => updatePrescriptionStatus(item.id, event.target.value)} className="cw-input !min-h-9 !w-[120px] !px-2 !py-1 !text-xs"><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td><td><button type="button" onClick={() => removeRecord("prescriptions", item.id, `prescription #${item.id}`)} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50" aria-label="Delete prescription"><Trash2 size={14} /></button></td></tr>)}
            </tbody></table></div>
          )}
        </Panel>
      )}

      {tab === "logs" && (
        <Panel title="Audit log" subtitle="Most recent 30 platform events" padded={false}>
          {snapshot.recentLogs.length === 0 ? <EmptyState icon={Activity} title="No events recorded" text="The audit log will fill as records are created and updated." /> : (
            <div className="cw-table-wrap !rounded-none !border-0"><table className="cw-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th><th>Level</th></tr></thead><tbody>
              {snapshot.recentLogs.map((log) => <tr key={log.id}><td className="whitespace-nowrap text-xs">{formatDateTime(log.createdAt)}</td><td>{log.actorEmail || "system"}</td><td><strong className="text-[var(--navy)]">{log.action.replaceAll("_", " ")}</strong></td><td className="capitalize">{log.entity.replaceAll("_", " ")}</td><td className="max-w-[280px]"><span className="line-clamp-2">{log.detail || "—"}</span></td><td><span className={log.level === "warning" ? "cw-badge badge-amber" : "cw-badge badge-blue"}>{log.level}</span></td></tr>)}
            </tbody></table></div>
          )}
        </Panel>
      )}
    </div>
  );
}
