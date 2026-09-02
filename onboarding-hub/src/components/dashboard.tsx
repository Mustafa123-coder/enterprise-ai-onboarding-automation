"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { DashboardResponse, Employee, OnboardingPlan } from "@/lib/types";

const demoData: DashboardResponse = {
  employees: [],
  metrics: { active: 0, ready: 0, atRisk: 0, averageProgress: 0 },
};

const statusLabel = { DRAFT: "Draft", ON_TRACK: "On track", AT_RISK: "Needs attention", READY: "Ready" };

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function formatStartDate(value: string) {
  const date = new Date(value);
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const dateText = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
  if (days === 0) return `Today · ${dateText}`;
  if (days === 1) return `Tomorrow · ${dateText}`;
  return days > 1 ? `In ${days} days · ${dateText}` : `Started · ${dateText}`;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardResponse>(demoData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await fetch("/api/employees", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load the workspace");
      setError("");
      setData(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The loader's first state update occurs after its initial fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEmployees();
  }, [loadEmployees]);

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    return term ? data.employees.filter((employee) =>
      [employee.fullName, employee.role, employee.department, employee.location].some((value) => value.toLowerCase().includes(term)),
    ) : data.employees;
  }, [data.employees, query]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${navOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><span /></span><span>orbit</span></div>
        <button className="sidebar-close" onClick={() => setNavOpen(false)} aria-label="Close navigation"><X /></button>
        <nav aria-label="Primary navigation">
          <a className="nav-item active" href="#overview"><LayoutDashboard />Overview</a>
          <a className="nav-item" href="#people"><Users />People<span className="nav-count">{data.metrics.active}</span></a>
          <a className="nav-item" href="#plans"><Sparkles />AI plans</a>
          <a className="nav-item" href="#calendar"><CalendarDays />Calendar</a>
        </nav>
        <div className="sidebar-callout">
          <span className="callout-icon"><Bot /></span>
          <strong>Meet Orbit AI</strong>
          <p>Role-aware plans, grounded in approved employee details.</p>
          <button onClick={() => data.employees[0] && setSelected(data.employees[0])}>Try the planner <ArrowRight /></button>
        </div>
        <div className="account">
          <span className="avatar avatar-admin">MH</span>
          <span><strong>Mustafa Hashmi</strong><small>Workspace admin</small></span>
          <ChevronRight />
        </div>
      </aside>

      {navOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} />}

      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="topbar-copy"><span>Workspace</span><strong>People operations</strong></div>
          <div className="topbar-actions">
            <label className="search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people" aria-label="Search people" /></label>
            <button className="primary-button" onClick={() => setCreateOpen(true)}><Plus />Add new hire</button>
          </div>
        </header>

        <div className="page" id="overview">
          <section className="hero-row">
            <div><span className="eyebrow">WEDNESDAY, SEPTEMBER 2</span><h1>Good afternoon, Mustafa.</h1><p>Here’s what’s happening across your onboarding pipeline.</p></div>
            <button className="mobile-add" onClick={() => setCreateOpen(true)}><Plus /><span>Add new hire</span></button>
          </section>

          <section className="metrics" aria-label="Onboarding metrics">
            <Metric icon={<Users />} tone="indigo" value={data.metrics.active} label="Active journeys" note="Across all teams" />
            <Metric icon={<CheckCircle2 />} tone="green" value={data.metrics.ready} label="Ready for day one" note="Everything complete" />
            <Metric icon={<AlertTriangle />} tone="amber" value={data.metrics.atRisk} label="Needs attention" note="Has open blockers" />
            <Metric icon={<CircleDashed />} tone="violet" value={`${data.metrics.averageProgress}%`} label="Average progress" note="Across active hires" />
          </section>

          <section className="workspace-grid">
            <div className="panel people-panel" id="people">
              <div className="panel-header"><div><h2>Upcoming arrivals</h2><p>The people joining your team next.</p></div><button className="text-button">View all <ArrowRight /></button></div>
              {error ? <EmptyState title="We couldn’t reach the database" body={error} action="Try again" onAction={() => { setLoading(true); void loadEmployees(); }} /> :
                loading ? <div className="loading"><LoaderCircle />Loading onboarding journeys…</div> :
                filtered.length === 0 ? <EmptyState title={query ? "No matching people" : "Your pipeline is ready"} body={query ? "Try a different name, role, or location." : "Add your first new hire to begin an onboarding journey."} action={!query ? "Add new hire" : undefined} onAction={() => setCreateOpen(true)} /> :
                <div className="people-list">{filtered.map((employee, index) => (
                  <button className="person-row" key={employee.id} onClick={() => setSelected(employee)}>
                    <span className={`avatar avatar-${(index % 4) + 1}`}>{initials(employee.fullName)}</span>
                    <span className="person-main"><strong>{employee.fullName}</strong><small>{employee.role} · {employee.department}</small></span>
                    <span className="start-date"><small>STARTS</small><strong>{formatStartDate(employee.startDate)}</strong></span>
                    <span className="person-location">{employee.location}</span>
                    <span className="progress-wrap"><span className="progress-meta"><small>{employee.completedTasks}/{employee.totalTasks} tasks</small><strong>{employee.progress}%</strong></span><span className="progress"><i style={{ width: `${employee.progress}%` }} /></span></span>
                    <span className={`status status-${employee.status.toLowerCase()}`}>{statusLabel[employee.status]}</span>
                    <ChevronRight className="row-chevron" />
                  </button>
                ))}</div>
              }
            </div>

            <aside className="panel focus-panel">
              <div className="panel-header"><div><h2>Today’s focus</h2><p>Three actions need you.</p></div><span className="focus-date">02 SEP</span></div>
              <div className="focus-list">
                <FocusItem tone="amber" icon={<Clock3 />} title="Approve analytics access" person="Hamza Ali" meta="Due today" />
                <FocusItem tone="violet" icon={<Sparkles />} title="Review AI-generated plan" person="Ayesha Khan" meta="5 min review" />
                <FocusItem tone="green" icon={<Check />} title="Confirm first-day schedule" person="Bilal Raza" meta="Due tomorrow" />
              </div>
              <button className="secondary-button">Open action center <ArrowRight /></button>
            </aside>
          </section>

          <section className="ai-banner" id="plans">
            <div className="ai-orb"><Sparkles /></div>
            <div><span className="eyebrow">ORBIT AI</span><h2>Turn a role profile into a thoughtful first week.</h2><p>Generate a structured, manager-ready plan grounded in the employee details you’ve approved.</p></div>
            <button onClick={() => data.employees[0] ? setSelected(data.employees[0]) : setCreateOpen(true)}>Generate a plan <ArrowRight /></button>
          </section>
        </div>
      </main>

      {createOpen && <CreateEmployeeModal onClose={() => setCreateOpen(false)} onCreated={async () => { setCreateOpen(false); setLoading(true); await loadEmployees(); }} />}
      {selected && <PlanDrawer employee={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Metric({ icon, tone, value, label, note }: { icon: React.ReactNode; tone: string; value: string | number; label: string; note: string }) {
  return <article className="metric"><span className={`metric-icon metric-${tone}`}>{icon}</span><div><strong>{value}</strong><span>{label}</span><small>{note}</small></div></article>;
}

function FocusItem({ icon, tone, title, person, meta }: { icon: React.ReactNode; tone: string; title: string; person: string; meta: string }) {
  return <button className="focus-item"><span className={`focus-icon focus-${tone}`}>{icon}</span><span><strong>{title}</strong><small>{person} · {meta}</small></span><ChevronRight /></button>;
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction: () => void }) {
  return <div className="empty-state"><span><Users /></span><h3>{title}</h3><p>{body}</p>{action && <button onClick={onAction}>{action}</button>}</div>;
}

function CreateEmployeeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not add this employee");
      await onCreated();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add this employee"); setSaving(false); }
  }

  return <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="new-hire-title">
    <button className="modal-scrim" onClick={onClose} aria-label="Close modal" />
    <form className="modal" onSubmit={submit}>
      <div className="modal-head"><div><span className="eyebrow">NEW JOURNEY</span><h2 id="new-hire-title">Add a new hire</h2><p>Capture the essentials. Orbit will help shape the plan next.</p></div><button type="button" onClick={onClose} aria-label="Close"><X /></button></div>
      <div className="form-grid">
        <label className="field field-wide"><span>Full name</span><input name="fullName" required minLength={2} placeholder="e.g. Ayesha Khan" /></label>
        <label className="field field-wide"><span>Personal email</span><input name="email" required type="email" placeholder="ayesha@example.com" /></label>
        <label className="field"><span>Role</span><input name="role" required placeholder="Product Designer" /></label>
        <label className="field"><span>Department</span><input name="department" required placeholder="Product" /></label>
        <label className="field"><span>Location & work mode</span><input name="location" required placeholder="Islamabad · Hybrid" /></label>
        <label className="field"><span>Manager</span><input name="managerName" required placeholder="Omar Farooq" /></label>
        <label className="field field-wide"><span>Start date</span><input name="startDate" required type="date" /></label>
      </div>
      {error && <p className="form-error"><AlertTriangle />{error}</p>}
      <div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Plus />}{saving ? "Creating…" : "Create journey"}</button></div>
    </form>
  </div>;
}

function PlanDrawer({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [plan, setPlan] = useState<OnboardingPlan | null>(employee.latestPlan ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employeeId: employee.id }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not generate the plan");
      setPlan(body.plan);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not generate the plan"); }
    finally { setLoading(false); }
  }

  return <div className="drawer-layer" role="dialog" aria-modal="true" aria-labelledby="plan-title">
    <button className="drawer-scrim" onClick={onClose} aria-label="Close plan" />
    <aside className="drawer">
      <div className="drawer-head"><div><span className="avatar avatar-2">{initials(employee.fullName)}</span><span><small>ONBOARDING PLAN</small><h2 id="plan-title">{employee.fullName}</h2><p>{employee.role} · starts {new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(new Date(employee.startDate))}</p></span></div><button onClick={onClose} aria-label="Close"><X /></button></div>
      {!plan ? <div className="plan-empty"><span className="ai-orb"><Sparkles /></span><h3>Build a thoughtful first week</h3><p>Orbit AI will use the approved role, department, location, manager, and start date to draft a structured plan. Nothing is sent automatically.</p><ul><li><Check />Five-day role-aware schedule</li><li><Check />Manager preparation checklist</li><li><Check />Risks and priorities surfaced clearly</li></ul><button className="primary-button" onClick={generate} disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <Sparkles />}{loading ? "Designing the plan…" : "Generate with AI"}</button>{error && <p className="form-error"><AlertTriangle />{error}</p>}</div> :
        <div className="plan-content">
          <div className="plan-intro"><span className="generated-pill"><Sparkles />AI-generated draft</span><h3>{plan.summary}</h3><p>{plan.welcomeNote}</p></div>
          <section><h4>First-week priorities</h4><div className="priority-list">{plan.priorities.map((priority, index) => <div key={priority}><span>0{index + 1}</span><p>{priority}</p></div>)}</div></section>
          <section><h4>Suggested schedule</h4><div className="schedule-list">{plan.schedule.map((item, index) => <article key={`${item.day}-${index}`}><span className="day-pill">DAY {item.day}</span><div><strong>{item.title}</strong><p>{item.purpose}</p><small>{item.owner} · {item.durationMinutes} min</small></div></article>)}</div></section>
          <section><h4>Manager actions</h4><ul className="check-list">{plan.managerActions.map((item) => <li key={item}><Check />{item}</li>)}</ul></section>
          {plan.risks.length > 0 && <section className="risk-box"><h4><AlertTriangle />Things to confirm</h4>{plan.risks.map((risk) => <p key={risk}>{risk}</p>)}</section>}
          <div className="plan-footer"><small>Draft generated by {plan.model || "the configured OpenAI model"}. Review before sharing.</small><button className="secondary-button" onClick={generate} disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <Sparkles />}Regenerate</button></div>
        </div>}
    </aside>
  </div>;
}
