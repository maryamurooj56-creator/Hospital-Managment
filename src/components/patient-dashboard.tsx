"use client";

import {
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  HeartPulse,
  Inbox,
  Search,
  Trash2,
  UploadCloud,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { EmptyState, Message, Panel, SearchInput, StatCard, StatusPill, Tabs } from "@/components/dashboard-ui";
import type { SessionUser } from "@/lib/auth";
import type { AppointmentView, PrescriptionView } from "@/lib/data";
import type { PatientProfile } from "@/db/schema";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";

type FileView = {
  id: number;
  patientId: number;
  appointmentId: number | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string | Date;
  patientName: string;
};

type Tab = "overview" | "appointments" | "prescriptions" | "records" | "profile";

type Props = {
  session: SessionUser;
  profile: PatientProfile;
  user: { phone: string | null; email: string; fullName: string };
  appointments: AppointmentView[];
  prescriptions: PrescriptionView[];
  files: FileView[];
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export function PatientDashboard({ session, profile, user, appointments: initialAppointments, prescriptions: initialPrescriptions, files: initialFiles }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [appointments, setAppointments] = useState(initialAppointments);
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [files, setFiles] = useState(initialFiles);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAppointment, setUploadAppointment] = useState("");
  const [profileForm, setProfileForm] = useState({
    fullName: user.fullName,
    phone: user.phone ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    gender: profile.gender ?? "",
    bloodGroup: profile.bloodGroup ?? "",
    address: profile.address ?? "",
    emergencyContact: profile.emergencyContact ?? "",
    allergies: profile.allergies ?? "",
    medicalHistory: profile.medicalHistory ?? "",
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter((item) => item.appointmentDate >= today && item.status !== "cancelled" && item.status !== "completed");
  const activePrescriptions = prescriptions.filter((item) => item.status === "active");

  const filteredAppointments = useMemo(() => {
    const search = query.toLowerCase();
    return appointments.filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      const matchesSearch = !search || `${item.doctorName} ${item.doctorDepartment} ${item.reason}`.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [appointments, query, status]);

  const filteredPrescriptions = useMemo(() => {
    const search = query.toLowerCase();
    return prescriptions.filter((item) => !search || `${item.diagnosis} ${item.medications} ${item.doctorName}`.toLowerCase().includes(search));
  }, [prescriptions, query]);

  async function cancelAppointment(id: number) {
    setBusy(`appointment-${id}`);
    setMessage(null);
    try {
      await requestJson(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      setAppointments((current) => current.map((item) => (item.id === id ? { ...item, status: "cancelled" } : item)));
      setMessage({ kind: "success", text: "Appointment cancelled successfully." });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to cancel appointment" });
    } finally {
      setBusy("");
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadFile) {
      setMessage({ kind: "error", text: "Choose a file first" });
      return;
    }
    setBusy("upload");
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      if (uploadAppointment) form.append("appointmentId", uploadAppointment);
      await requestJson("/api/uploads", { method: "POST", body: form });
      const refreshed = await requestJson<{ files: FileView[] }>("/api/uploads");
      setFiles(refreshed.files);
      setUploadFile(null);
      setUploadAppointment("");
      setMessage({ kind: "success", text: "Document uploaded to your secure record." });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to upload file" });
    } finally {
      setBusy("");
    }
  }

  async function deleteFile(id: number) {
    setBusy(`file-${id}`);
    setMessage(null);
    try {
      await requestJson(`/api/uploads/${id}`, { method: "DELETE" });
      setFiles((current) => current.filter((item) => item.id !== id));
      setMessage({ kind: "success", text: "Document removed." });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to remove file" });
    } finally {
      setBusy("");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("profile");
    setMessage(null);
    try {
      await requestJson(`/api/patients/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      setMessage({ kind: "success", text: "Profile updated successfully." });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof Error ? cause.message : "Unable to update profile" });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="fade-in">
      <Tabs<Tab>
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "appointments", label: "Appointments" },
          { id: "prescriptions", label: "Prescriptions" },
          { id: "records", label: "My documents" },
          { id: "profile", label: "Health profile" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {message && <div className="mb-5"><Message {...message} /></div>}

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={CalendarDays} label="Upcoming visits" value={upcoming.length} hint="Scheduled and pending appointments" />
            <StatCard icon={ClipboardList} label="Active prescriptions" value={activePrescriptions.length} hint="Current medication plans" tone="green" />
            <StatCard icon={FileText} label="Secure documents" value={files.length} hint="Reports and referrals on file" tone="violet" />
            <StatCard icon={HeartPulse} label="Blood group" value={profileForm.bloodGroup || "—"} hint="Keep your health profile current" tone="amber" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Panel title="Upcoming appointments" subtitle="Your next scheduled visits" actions={<Link href="/book" className="cw-btn !min-h-9 !px-3 !text-xs">Book a visit</Link>} padded={false}>
              {upcoming.length === 0 ? <EmptyState icon={CalendarDays} title="No upcoming visits" text="Book an appointment with one of our specialists to get started." /> : (
                <div className="divide-y divide-slate-100">
                  {upcoming.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[var(--brand)]"><CalendarDays size={19} /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[var(--navy)]">{item.doctorName}</p><p className="truncate text-xs text-slate-500">{item.doctorDepartment} · {formatDate(item.appointmentDate)} at {item.timeSlot}</p></div>
                      <StatusPill status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </Panel>
            <Panel title="Your care snapshot" subtitle="Quick access to your health information">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Patient</span><strong className="text-[var(--navy)]">{session.name}</strong></div>
                <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Email</span><strong className="max-w-[60%] truncate text-[var(--navy)]">{user.email}</strong></div>
                <div className="flex justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Allergies</span><strong className="max-w-[60%] truncate text-[var(--navy)]">{profileForm.allergies || "None recorded"}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Emergency contact</span><strong className="text-[var(--navy)]">{profileForm.emergencyContact || "—"}</strong></div>
                <button type="button" onClick={() => setTab("profile")} className="cw-btn-outline w-full">Update health profile</button>
              </div>
            </Panel>
          </div>

          <Panel title="Recent prescriptions" subtitle="Issued by your CareWell specialists" padded={false}>
            {prescriptions.length === 0 ? <EmptyState icon={ClipboardList} title="No prescriptions yet" text="Digital prescriptions will appear here after a clinician issues one." /> : (
              <div className="divide-y divide-slate-100">
                {prescriptions.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><ClipboardList size={18} /></span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[var(--navy)]">{item.diagnosis}</p><p className="truncate text-xs text-slate-500">{item.doctorName} · {formatDate(item.issuedAt)}</p></div>
                    <StatusPill status={item.status} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === "appointments" && (
        <Panel title="My appointments" subtitle="Search and manage every booking" actions={<div className="flex flex-wrap gap-2"><SearchInput value={query} onChange={setQuery} placeholder="Search appointments..." /><select value={status} onChange={(event) => setStatus(event.target.value)} className="cw-input !w-auto"><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>} padded={false}>
          {filteredAppointments.length === 0 ? <EmptyState icon={Inbox} title="No appointments found" text="Try a different search or status filter." /> : (
            <div className="cw-table-wrap !rounded-none !border-0">
              <table className="cw-table"><thead><tr><th>Doctor</th><th>Date & time</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>
                {filteredAppointments.map((item) => (
                  <tr key={item.id}>
                    <td><strong className="text-[var(--navy)]">{item.doctorName}</strong><span className="block text-xs text-slate-400">{item.doctorDepartment}</span></td>
                    <td>{formatDate(item.appointmentDate)}<span className="block text-xs text-slate-400">{item.timeSlot}</span></td>
                    <td className="max-w-[260px]"><span className="line-clamp-2">{item.reason}</span>{item.notes && <span className="mt-1 block text-xs text-slate-400">Note: {item.notes}</span>}</td>
                    <td><StatusPill status={item.status} /></td>
                    <td>{(item.status === "pending" || item.status === "confirmed") ? <button type="button" disabled={busy === `appointment-${item.id}`} onClick={() => cancelAppointment(item.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">{busy === `appointment-${item.id}` ? "..." : "Cancel"}</button> : <span className="text-xs text-slate-400">—</span>}</td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          )}
        </Panel>
      )}

      {tab === "prescriptions" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3"><SearchInput value={query} onChange={setQuery} placeholder="Search diagnosis or medicine..." /></div>
          {filteredPrescriptions.length === 0 ? <Panel title="E-prescriptions" subtitle="Your digital medication plans"><EmptyState icon={ClipboardList} title="Nothing to show" text="No prescriptions match this search." /></Panel> : (
            <div className="grid gap-5 lg:grid-cols-2">
              {filteredPrescriptions.map((item) => (
                <article key={item.id} className="cw-card p-5">
                  <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">RX #{String(item.id).padStart(5, "0")}</span><h3 className="mt-1 text-lg font-extrabold text-[var(--navy)]">{item.diagnosis}</h3><p className="mt-1 text-xs text-slate-500">{item.doctorName} · {formatDate(item.issuedAt)}</p></div><StatusPill status={item.status} /></div>
                  <div className="mt-5 rounded-xl bg-[#f6f9fe] p-4"><span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Medications</span><pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{item.medications}</pre></div>
                  {item.notes && <p className="mt-4 text-xs leading-5 text-slate-500"><strong className="text-slate-700">Clinical notes:</strong> {item.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "records" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Panel title="Medical documents" subtitle="Download or remove files you have uploaded" padded={false}>
            {files.length === 0 ? <EmptyState icon={FileText} title="No documents yet" text="Upload lab reports, referrals or imaging results to keep them with your record." /> : (
              <div className="divide-y divide-slate-100">
                {files.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[var(--brand)]"><FileText size={18} /></span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[var(--navy)]">{item.fileName}</p><p className="text-xs text-slate-500">{formatBytes(item.sizeBytes)} · {formatDateTime(item.createdAt)}</p></div>
                    <a href={`/api/uploads/${item.id}`} className="cw-btn-outline !min-h-9 !px-3 !text-xs"><Download size={14} /> Download</a>
                    <button type="button" disabled={busy === `file-${item.id}`} onClick={() => deleteFile(item.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${item.fileName}`}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Upload a document" subtitle="PDF, Word, text or image · max 3 MB">
            <form onSubmit={upload} className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-blue-200 bg-[#f7faff] p-6 text-center"><UploadCloud size={28} className="text-[var(--brand)]" /><span className="mt-2 text-sm font-bold text-[var(--navy)]">{uploadFile ? uploadFile.name : "Choose a file"}</span><span className="mt-1 text-xs text-slate-500">Your document stays private and role-protected.</span><input type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} /></label>
              <label><span className="cw-label">Link to appointment (optional)</span><select className="cw-input" value={uploadAppointment} onChange={(event) => setUploadAppointment(event.target.value)}><option value="">No appointment</option>{appointments.map((item) => <option key={item.id} value={item.id}>#{item.id} · {formatDate(item.appointmentDate)} · {item.doctorName}</option>)}</select></label>
              <button type="submit" disabled={busy === "upload" || !uploadFile} className="cw-btn w-full"><UploadCloud size={16} /> {busy === "upload" ? "Uploading..." : "Upload securely"}</button>
            </form>
          </Panel>
        </div>
      )}

      {tab === "profile" && (
        <Panel title="Health profile" subtitle="Keep your contact and clinical details accurate">
          <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
            {[
              { key: "fullName", label: "Full name", type: "text" },
              { key: "phone", label: "Phone", type: "text" },
              { key: "dateOfBirth", label: "Date of birth", type: "date" },
              { key: "gender", label: "Gender", type: "text" },
              { key: "bloodGroup", label: "Blood group", type: "text" },
              { key: "emergencyContact", label: "Emergency contact", type: "text" },
            ].map((field) => (
              <label key={field.key}><span className="cw-label">{field.label}</span><input type={field.type} className="cw-input" value={profileForm[field.key as keyof typeof profileForm]} onChange={(event) => setProfileForm({ ...profileForm, [field.key]: event.target.value })} /></label>
            ))}
            <label className="md:col-span-2"><span className="cw-label">Address</span><input className="cw-input" value={profileForm.address} onChange={(event) => setProfileForm({ ...profileForm, address: event.target.value })} /></label>
            <label><span className="cw-label">Allergies</span><textarea className="cw-input" rows={3} value={profileForm.allergies} onChange={(event) => setProfileForm({ ...profileForm, allergies: event.target.value })} /></label>
            <label><span className="cw-label">Medical history</span><textarea className="cw-input" rows={3} value={profileForm.medicalHistory} onChange={(event) => setProfileForm({ ...profileForm, medicalHistory: event.target.value })} /></label>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3"><button type="submit" disabled={busy === "profile"} className="cw-btn"><UserRound size={16} /> {busy === "profile" ? "Saving..." : "Save changes"}</button><span className="text-xs text-slate-500">Only you and authorised CareWell staff can view this information.</span></div>
          </form>
        </Panel>
      )}
    </div>
  );
}
