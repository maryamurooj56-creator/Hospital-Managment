"use client";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Inbox,
  Pill,
  Search,
  Stethoscope,
  Users,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { EmptyState, Message, Panel, SearchInput, StatCard, StatusPill, Tabs } from "@/components/dashboard-ui";
import type { SessionUser } from "@/lib/auth";
import type { AppointmentView, PatientView, PrescriptionView } from "@/lib/data";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";

type FileView = {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string | Date;
  patientName: string;
};

type Tab = "overview" | "appointments" | "prescriptions" | "patients" | "records";

type Props = {
  session: SessionUser;
  appointments: AppointmentView[];
  prescriptions: PrescriptionView[];
  patients: PatientView[];
  files: FileView[];
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export function DoctorDashboard({ session, appointments: initialAppointments, prescriptions: initialPrescriptions, patients, files }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [appointments, setAppointments] = useState(initialAppointments);
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [rxForm, setRxForm] = useState({ patientId: "", appointmentId: "", diagnosis: "", medications: "", notes: "" });

  const today = new Date().toISOString().slice(0, 10);
  const todays = appointments.filter((item) => item.appointmentDate === today && item.status !== "cancelled");
  const pending = appointments.filter((item) => item.status === "pending");
  const activeRx = prescriptions.filter((item) => item.status === "active");

  const filteredAppointments = useMemo(() => {
    const search = query.toLowerCase();
    return appointments.filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      const matchesSearch = !search || `${item.patientName} ${item.reason} ${item.timeSlot}`.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [appointments, query, status]);

  const filteredPrescriptions = useMemo(() => {
    const search = query.toLowerCase();
    return prescriptions.filter((item) => !search || `${item.patientName} ${item.diagnosis} ${item.medications}`.toLowerCase().includes(search));
  }, [prescriptions, query]);

  async function updateStatus(id: number, nextStatus: string) {
    setBusy(`appointment-${id}`);
    setMessage(null);
    try {
      await requestJson(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      setAppointments((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus as AppointmentView["status"] } : item)));
      setMessage({ kind: "success", text: `Appointment marked ${nextStatus}.` });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to update appointment" });
    } finally {
      setBusy("");
    }
  }

  async function createPrescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("prescription");
    setMessage(null);
    try {
      await requestJson("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: Number(rxForm.patientId),
          appointmentId: rxForm.appointmentId ? Number(rxForm.appointmentId) : null,
          diagnosis: rxForm.diagnosis,
          medications: rxForm.medications,
          notes: rxForm.notes,
        }),
      });
      const refreshed = await requestJson<{ prescriptions: PrescriptionView[] }>("/api/prescriptions");
      setPrescriptions(refreshed.prescriptions);
      setRxForm({ patientId: "", appointmentId: "", diagnosis: "", medications: "", notes: "" });
      setTab("prescriptions");
      setMessage({ kind: "success", text: "Digital prescription issued to the patient." });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to issue prescription" });
    } finally {
      setBusy("");
    }
  }

  async function updatePrescription(id: number, nextStatus: string) {
    setBusy(`rx-${id}`);
    setMessage(null);
    try {
      await requestJson(`/api/prescriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      setPrescriptions((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus as PrescriptionView["status"] } : item)));
      setMessage({ kind: "success", text: `Prescription marked ${nextStatus}.` });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to update prescription" });
    } finally {
      setBusy("");
    }
  }

  function preparePrescription(patientId: number) {
    setRxForm((current) => ({ ...current, patientId: String(patientId), appointmentId: "" }));
    setTab("prescriptions");
    setMessage(null);
  }

  return (
    <div className="fade-in">
      <Tabs<Tab> tabs={[{ id: "overview", label: "Overview" }, { id: "appointments", label: "Appointments" }, { id: "prescriptions", label: "E-prescriptions" }, { id: "patients", label: "My patients" }, { id: "records", label: "Documents" }]} active={tab} onChange={setTab} />
      {message && <div className="mb-5"><Message {...message} /></div>}

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={CalendarDays} label="Today's visits" value={todays.length} hint={`${pending.length} requests awaiting confirmation`} />
            <StatCard icon={ClipboardList} label="Total appointments" value={appointments.length} hint="Across your assigned schedule" tone="violet" />
            <StatCard icon={Pill} label="Active prescriptions" value={activeRx.length} hint="Currently active medication plans" tone="green" />
            <StatCard icon={Users} label="Patients in care" value={patients.length} hint="Patients with appointments in your clinic" tone="amber" />
          </div>
          <Panel title="Today's schedule" subtitle={`Welcome back, ${session.name}`} actions={<button type="button" onClick={() => setTab("appointments")} className="cw-btn-outline !min-h-9 !px-3 !text-xs">View all</button>} padded={false}>
            {todays.length === 0 ? <EmptyState icon={Stethoscope} title="No visits scheduled today" text="Your appointment queue will appear here as patients book." /> : (
              <div className="divide-y divide-slate-100">
                {todays.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-[var(--brand)]">{item.timeSlot.slice(0, 2)}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[var(--navy)]">{item.patientName}</p><p className="truncate text-xs text-slate-500">{item.timeSlot} · {item.reason}</p></div>
                    <StatusPill status={item.status} />
                    <button type="button" onClick={() => updateStatus(item.id, "completed")} disabled={item.status === "completed" || busy === `appointment-${item.id}`} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"><CheckCircle2 size={14} className="mr-1 inline" />Complete</button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === "appointments" && (
        <Panel title="Appointment queue" subtitle="Filter, confirm, complete or cancel visits" actions={<div className="flex flex-wrap gap-2"><SearchInput value={query} onChange={setQuery} placeholder="Search patient or reason..." /><select value={status} onChange={(event) => setStatus(event.target.value)} className="cw-input !w-auto"><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>} padded={false}>
          {filteredAppointments.length === 0 ? <EmptyState icon={Inbox} title="No appointments found" text="Change the search or status filter to see more results." /> : (
            <div className="cw-table-wrap !rounded-none !border-0"><table className="cw-table"><thead><tr><th>Patient</th><th>Date & time</th><th>Reason</th><th>Status</th><th>Update</th></tr></thead><tbody>
              {filteredAppointments.map((item) => (
                <tr key={item.id}>
                  <td><strong className="text-[var(--navy)]">{item.patientName}</strong><span className="block text-xs text-slate-400">{item.patientEmail}</span></td>
                  <td>{formatDate(item.appointmentDate)}<span className="block text-xs text-slate-400">{item.timeSlot}</span></td>
                  <td className="max-w-[230px]"><span className="line-clamp-2">{item.reason}</span></td>
                  <td><StatusPill status={item.status} /></td>
                  <td><select disabled={busy === `appointment-${item.id}`} value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)} className="cw-input !min-h-9 !w-[130px] !px-2 !py-1 !text-xs"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </Panel>
      )}

      {tab === "prescriptions" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3"><SearchInput value={query} onChange={setQuery} placeholder="Search prescriptions..." /></div>
            <Panel title="Issued prescriptions" subtitle="Medication plans currently in your care" padded={false}>
              {filteredPrescriptions.length === 0 ? <EmptyState icon={ClipboardList} title="No prescriptions found" text="Use the form to issue a new e-prescription." /> : (
                <div className="divide-y divide-slate-100">
                  {filteredPrescriptions.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">RX #{String(item.id).padStart(5, "0")} · {item.patientName}</span><h3 className="mt-1 text-sm font-extrabold text-[var(--navy)]">{item.diagnosis}</h3><p className="text-xs text-slate-500">{formatDate(item.issuedAt)}</p></div><StatusPill status={item.status} /></div>
                      <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-[#f6f9fe] p-3 font-sans text-xs leading-5 text-slate-700">{item.medications}</pre>
                      {item.notes && <p className="mt-2 text-xs text-slate-500">Notes: {item.notes}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">{item.status !== "completed" && <button type="button" disabled={busy === `rx-${item.id}`} onClick={() => updatePrescription(item.id, "completed")} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Mark completed</button>}{item.status !== "cancelled" && <button type="button" disabled={busy === `rx-${item.id}`} onClick={() => updatePrescription(item.id, "cancelled")} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Cancel Rx</button>}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Issue e-prescription" subtitle="Select a patient and record the care plan">
            <form onSubmit={createPrescription} className="space-y-4">
              <label><span className="cw-label">Patient *</span><select required className="cw-input" value={rxForm.patientId} onChange={(event) => setRxForm({ ...rxForm, patientId: event.target.value, appointmentId: "" })}><option value="">Choose a patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName}</option>)}</select></label>
              <label><span className="cw-label">Related appointment</span><select className="cw-input" value={rxForm.appointmentId} onChange={(event) => setRxForm({ ...rxForm, appointmentId: event.target.value })}><option value="">None</option>{appointments.filter((item) => !rxForm.patientId || item.patientId === Number(rxForm.patientId)).map((item) => <option key={item.id} value={item.id}>#{item.id} · {formatDate(item.appointmentDate)}</option>)}</select></label>
              <label><span className="cw-label">Diagnosis *</span><input required className="cw-input" value={rxForm.diagnosis} onChange={(event) => setRxForm({ ...rxForm, diagnosis: event.target.value })} placeholder="e.g. Essential hypertension" /></label>
              <label><span className="cw-label">Medications & dosage *</span><textarea required rows={5} className="cw-input" value={rxForm.medications} onChange={(event) => setRxForm({ ...rxForm, medications: event.target.value })} placeholder="Medicine — dose — frequency — duration" /></label>
              <label><span className="cw-label">Clinical notes</span><textarea rows={3} className="cw-input" value={rxForm.notes} onChange={(event) => setRxForm({ ...rxForm, notes: event.target.value })} placeholder="Lifestyle advice, monitoring, follow-up" /></label>
              <button type="submit" disabled={busy === "prescription"} className="cw-btn w-full"><Pill size={16} /> {busy === "prescription" ? "Issuing..." : "Issue prescription"}</button>
            </form>
          </Panel>
        </div>
      )}

      {tab === "patients" && (
        <Panel title="Patients in your care" subtitle="People with appointments assigned to you" actions={<SearchInput value={query} onChange={setQuery} placeholder="Search patients..." />} padded={false}>
          {patients.filter((item) => `${item.fullName} ${item.email}`.toLowerCase().includes(query.toLowerCase())).length === 0 ? <EmptyState icon={Users} title="No patients found" text="Patients appear here once they have an appointment with you." /> : (
            <div className="cw-table-wrap !rounded-none !border-0"><table className="cw-table"><thead><tr><th>Patient</th><th>Contact</th><th>Blood group</th><th>Allergies</th><th>Action</th></tr></thead><tbody>
              {patients.filter((item) => `${item.fullName} ${item.email}`.toLowerCase().includes(query.toLowerCase())).map((item) => (
                <tr key={item.id}><td><strong className="text-[var(--navy)]">{item.fullName}</strong><span className="block text-xs text-slate-400">DOB {formatDate(item.dateOfBirth)}</span></td><td>{item.email}<span className="block text-xs text-slate-400">{item.phone || "—"}</span></td><td>{item.bloodGroup || "—"}</td><td className="max-w-[180px]">{item.allergies || "—"}</td><td><button type="button" onClick={() => preparePrescription(item.id)} className="cw-btn-outline !min-h-9 !px-3 !text-xs"><Pill size={14} /> Issue Rx</button></td></tr>
              ))}
            </tbody></table></div>
          )}
        </Panel>
      )}

      {tab === "records" && (
        <Panel title="Patient documents" subtitle="Files shared by patients in your care" padded={false}>
          {files.length === 0 ? <EmptyState icon={FileText} title="No shared documents" text="Uploaded reports and referrals will be listed here." /> : (
            <div className="divide-y divide-slate-100">{files.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[var(--brand)]"><FileText size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[var(--navy)]">{item.fileName}</p><p className="text-xs text-slate-500">{item.patientName} · {formatBytes(item.sizeBytes)} · {formatDateTime(item.createdAt)}</p></div><a href={`/api/uploads/${item.id}`} className="cw-btn-outline !min-h-9 !px-3 !text-xs"><Download size={14} /> Download</a></div>
            ))}</div>
          )}
        </Panel>
      )}
    </div>
  );
}
