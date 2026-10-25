import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  HeartPulse,
  History,
  Pill,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import type { DoseStatus, Medication } from "./types";
import { supabaseConfigured } from "./lib/supabase";

type TabName = "Today" | "Medications" | "History" | "Follow-ups";

type DoseActivity = {
  id: string;
  medicationName: string;
  scheduledTime: string;
  status: DoseStatus;
  changedAt: Date;
};

const initialMeds: Medication[] = [
  { id: "demo-1", name: "Example medicine A", strength: "Example strength", instructions: "Follow the label supplied by your pharmacy", frequencyLabel: "Morning dose", scheduledTime: "08:00", status: "pending", prescriber: "Demo clinician", courseLabel: "Sample record" },
  { id: "demo-2", name: "Example medicine B", strength: "Example strength", instructions: "Sample food instruction — confirm from prescription", frequencyLabel: "Afternoon dose", scheduledTime: "14:00", status: "taken", prescriber: "Demo clinician", courseLabel: "Sample record" },
  { id: "demo-3", name: "Example medicine C", strength: "Example strength", instructions: "Demo only; not medical advice", frequencyLabel: "Evening dose", scheduledTime: "20:00", status: "pending", prescriber: "Demo clinician", courseLabel: "Sample record" }
];

const statusLabel: Record<DoseStatus, string> = {
  pending: "Due",
  taken: "Reported taken",
  snoozed: "Snoozed",
  missed: "Missed",
  not_recorded: "No response recorded"
};

const tabs: { name: TabName; icon: typeof Activity }[] = [
  { name: "Today", icon: Activity },
  { name: "Medications", icon: Pill },
  { name: "History", icon: History },
  { name: "Follow-ups", icon: CalendarDays }
];

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function App() {
  const [meds, setMeds] = useState(initialMeds);
  const [activities, setActivities] = useState<DoseActivity[]>([]);
  const [activeTab, setActiveTab] = useState<TabName>("Today");
  const [syncMessage, setSyncMessage] = useState("Demo data loaded. No pharmacy is connected.");
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const completed = useMemo(() => meds.filter((med) => med.status === "taken").length, [meds]);
  const pendingReview = useMemo(
    () => meds.filter((med) => med.status === "pending" || med.status === "snoozed").length,
    [meds]
  );
  const takenShare = Math.round((completed / Math.max(meds.length, 1)) * 100);
  const greeting = getGreeting(new Date().getHours());
  const nextStepLabel = pendingReview === 0 ? "All sample doses are updated" : `${pendingReview} sample dose${pendingReview === 1 ? "" : "s"} need attention`;

  function updateStatus(id: string, status: DoseStatus) {
    const medication = meds.find((med) => med.id === id);
    if (!medication) return;

    const changedAt = new Date();
    setMeds((current) => current.map((med) => med.id === id ? { ...med, status } : med));
    setActivities((current) => [{
      id: `${changedAt.getTime()}-${current.length}`,
      medicationName: medication.name,
      scheduledTime: medication.scheduledTime,
      status,
      changedAt
    }, ...current]);
  }

  async function syncDemo() {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage("Checking the demo pharmacy adapter…");

    try {
      // Intentionally no real pharmacy request is made in this starter.
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      setLastSync(new Date());
      setSyncMessage("Demo sync completed. Sample records only; no external pharmacy was contacted.");
    } finally {
      setIsSyncing(false);
    }
  }

  const pageTitle: Record<TabName, string> = {
    Today: "Today's schedule",
    Medications: "Medications",
    History: "Dose activity",
    "Follow-ups": "Follow-ups"
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><HeartPulse size={22} aria-hidden="true" /></div>
          <div><strong>CareTrack</strong><small>Medication companion</small></div>
        </div>
        <div className="demo-banner"><ShieldCheck size={16} aria-hidden="true" /><span>Academic demo · Sample data</span></div>
        <nav aria-label="Main navigation">
          {tabs.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              className={`nav-item ${activeTab === name ? "selected" : ""}`}
              aria-current={activeTab === name ? "page" : undefined}
              onClick={() => setActiveTab(name)}
            >
              <Icon size={18} aria-hidden="true" /> {name} <ChevronRight className="nav-chevron" size={15} aria-hidden="true" />
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="secure-icon"><ShieldCheck size={18} aria-hidden="true" /></div>
          <div><strong>Privacy first</strong><small>Use fictional data in this prototype.</small></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">PATIENT PORTAL</span><h1>{pageTitle[activeTab]}</h1></div>
          <div className="demo-indicator"><span className="notification-dot" /> Demo mode</div>
        </header>

        {activeTab === "Today" && <>
          <section className="welcome-row">
            <div className="welcome-copy">
              <p className="muted">{greeting}</p>
              <h2>Ready for your check-in?</h2>
              <p className="muted">Review the sample routine for today and update the dose status before the final demo sync.</p>
            </div>
            <div className="mini-summary" aria-live="polite">
              <span>Next action</span>
              <strong>{nextStepLabel}</strong>
            </div>
            <div className="date-pill"><CalendarDays size={16} aria-hidden="true" /> {new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</div>
          </section>
          <section className="stats-grid" aria-label="Today's demo summary">
            <article className="stat-card"><div className="stat-icon teal"><Pill size={19} aria-hidden="true" /></div><span className="muted">Today's doses</span><strong>{meds.length}</strong><small>Sample schedule</small></article>
            <article className="stat-card"><div className="stat-icon green"><Check size={19} aria-hidden="true" /></div><span className="muted">Reported taken</span><strong>{completed} of {meds.length}</strong><small>Patient-reported responses</small></article>
            <article className="stat-card"><div className="stat-icon purple"><Activity size={19} aria-hidden="true" /></div><span className="muted">Reported-taken share</span><strong>{takenShare}%</strong><small>Not a clinical adherence measure</small></article>
          </section>
          <section className="section-heading">
            <div><h3>Medication timeline</h3><p className="muted">Confirm the sample instructions with your pharmacy before treating this as a real schedule.</p></div>
            <button className="secondary-button" type="button" onClick={syncDemo} disabled={isSyncing}>
              <RefreshCw className={isSyncing ? "spinning" : ""} size={16} aria-hidden="true" />
              {isSyncing ? "Syncing demo…" : "Sync demo"}
            </button>
          </section>
          <div className="sync-message" role="status" aria-live="polite">
            <span className="status-dot" />
            <div><strong>Pharmacy connection</strong><p>{syncMessage}{lastSync ? ` Last demo sync: ${lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.` : ""}</p></div>
          </div>
          <section className="med-list" aria-label="Medication schedule">
            {meds.map((med) => <article className="med-card" key={med.id}>
              <div className="time-column"><Clock3 size={16} aria-hidden="true" /><strong>{med.scheduledTime}</strong><span>{med.frequencyLabel}</span></div>
              <div className="med-divider" />
              <div className="med-info">
                <div className="med-title-row"><h4>{med.name}</h4><span className={`status status-${med.status}`}>{statusLabel[med.status]}</span></div>
                <p className="strength">{med.strength} · {med.courseLabel}</p>
                <p className="instructions">{med.instructions}</p>
                <small className="muted">Prescriber: {med.prescriber}</small>
              </div>
              <div className="med-actions">
                {med.status === "pending" || med.status === "snoozed" ? <>
                  <button className="take-button" type="button" onClick={() => updateStatus(med.id, "taken")}><Check size={16} aria-hidden="true" /> Mark reported taken</button>
                  <button className="text-button" type="button" onClick={() => updateStatus(med.id, "snoozed")}>Snooze demo</button>
                </> : <button className="secondary-button" type="button" onClick={() => updateStatus(med.id, "not_recorded")}>Correct response</button>}
              </div>
            </article>)}
          </section>
          <section className="note-card"><ShieldCheck size={20} aria-hidden="true" /><div><strong>Medication safety notice</strong><p>This prototype uses fictional records. It does not prescribe medicines, verify ingestion, or replace advice from a pharmacist or clinician.</p></div></section>
        </>}

        {activeTab === "Medications" && <section className="content-card">
          <h3>Current medications</h3>
          <p className="muted">Demo medication records only. A future pharmacy integration will populate this view after identity matching and validation.</p>
          {meds.map((med) => <div className="simple-row" key={med.id}>
            <div className="round-icon"><Pill size={18} aria-hidden="true" /></div>
            <div><strong>{med.name}</strong><p>{med.strength} · {med.instructions}</p></div>
            <span className={`status status-${med.status}`}>{statusLabel[med.status]}</span>
          </div>)}
        </section>}

        {activeTab === "History" && <section className="content-card">
          <h3>Activity in this session</h3>
          <p className="muted">This temporary demo history records changes made during this browser session only.</p>
          {activities.length === 0
            ? <div className="empty-state"><History size={28} aria-hidden="true" /><strong>No activity recorded yet</strong><span>Update a sample dose on Today to see it here.</span></div>
            : <div className="activity-list">{activities.map((event) => (
              <article className="activity-row" key={event.id}>
                <div className="round-icon"><Clock3 size={18} aria-hidden="true" /></div>
                <div><strong>{event.medicationName}</strong><p>Scheduled {event.scheduledTime} · {statusLabel[event.status]}</p></div>
                <time dateTime={event.changedAt.toISOString()}>{event.changedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
              </article>
            ))}</div>}
        </section>}

        {activeTab === "Follow-ups" && <section className="content-card">
          <h3>Upcoming follow-ups</h3>
          <p className="muted">Appointments shown here must come from verified clinic records or be entered by an authorized user.</p>
          <div className="appointment-card"><div className="appointment-icon"><CalendarDays size={22} aria-hidden="true" /></div><div><strong>Example clinic follow-up</strong><p>Demo appointment · Date not confirmed</p><span className="muted">Clinician and department to be supplied by the authorized source.</span></div></div>
        </section>}

        <footer><span>CareTrack · Prototype v0.1</span><span><ShieldCheck size={14} aria-hidden="true" /> Demo mode {supabaseConfigured ? "· Supabase configured" : "· Supabase not configured"}</span></footer>
      </main>
    </div>
  );
}
