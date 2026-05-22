import React, { useEffect, useState } from "react";
import { Plus, ChevronRight, Clock, DollarSign, Calendar } from "lucide-react";
import { api } from "../utils/api.js";
import { formatDate, formatCurrency, formatHours, stageColour, STAGES_MBM } from "../utils/format.js";
import Modal from "../components/shared/Modal.jsx";
import EmptyState from "../components/shared/EmptyState.jsx";
import ProgressBar from "../components/shared/ProgressBar.jsx";

const STAGE_ORDER = ["Discovery", "Design", "Build", "Revisions", "Live", "Invoiced"];

function ProjectForm({ project, onSave, onClose, onDelete }) {
  const [form, setForm] = useState({
    businessId: "mbm",
    clientName: project?.clientName || "",
    stage: project?.stage || "Discovery",
    deadline: project?.deadline ? new Date(project.deadline).toISOString().split("T")[0] : "",
    revenue: project?.revenue || "",
    notes: project?.notes || "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="label block mb-1.5">Client name</label>
        <input className="input" required value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Client name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Stage</label>
          <select className="select" value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {STAGES_MBM.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Deadline</label>
          <input className="input" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label block mb-1.5">Revenue (£)</label>
        <input className="input" type="number" value={form.revenue} onChange={(e) => set("revenue", e.target.value)} placeholder="0" />
      </div>
      <div>
        <label className="label block mb-1.5">Notes</label>
        <textarea className="input resize-none" rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Project notes..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">Save project</button>
        {project?.id && <button type="button" onClick={onDelete} className="btn-danger">Delete</button>}
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

function ProjectDetail({ project, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [p, setP] = useState(project);

  const handleSave = async (form) => {
    const updated = await api.put(`/projects/${p.id}`, { ...p, ...form });
    setP(updated);
    onUpdate(updated);
    setEditing(false);
  };

  return (
    <div>
      {editing ? (
        <ProjectForm project={p} onSave={handleSave} onClose={() => setEditing(false)} onDelete={async () => { await api.delete(`/projects/${p.id}`); onClose(); onUpdate(null, p.id); }} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`badge ${stageColour(p.stage)}`}>{p.stage}</span>
            <button onClick={() => setEditing(true)} className="btn-ghost text-xs">Edit</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface rounded-lg p-3">
              <p className="label mb-1">Hours logged</p>
              <p className="font-mono font-bold text-text">{formatHours((p.hoursLogged || 0) * 60)}</p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="label mb-1">Revenue</p>
              <p className="font-mono font-bold text-mbm">{formatCurrency(p.revenue)}</p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="label mb-1">Deadline</p>
              <p className="text-sm font-medium text-text">{formatDate(p.deadline)}</p>
            </div>
          </div>
          {p.notes && (
            <div className="bg-surface rounded-lg p-4">
              <p className="label mb-2">Notes</p>
              <p className="text-sm text-text whitespace-pre-wrap">{p.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MbmPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/projects?businessId=mbm").then(setProjects).finally(() => setLoading(false));
  }, []);

  const handleSave = async (form) => {
    if (selected) {
      const updated = await api.put(`/projects/${selected.id}`, form);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const created = await api.post("/projects", form);
      setProjects((prev) => [created, ...prev]);
    }
    setModal(null);
    setSelected(null);
  };

  const handleDelete = async () => {
    await api.delete(`/projects/${selected.id}`);
    setProjects((prev) => prev.filter((p) => p.id !== selected.id));
    setModal(null);
    setSelected(null);
  };

  const handleUpdate = (updated, deletedId) => {
    if (deletedId) {
      setProjects((prev) => prev.filter((p) => p.id !== deletedId));
      setModal(null);
    } else if (updated) {
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
  };

  const totalRevenue = projects.reduce((s, p) => s + (p.revenue || 0), 0);
  const activeProjects = projects.filter((p) => !["Live", "Invoiced"].includes(p.stage));
  const upcomingDeadlines = [...projects]
    .filter((p) => p.deadline && new Date(p.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-mbm border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-mbm" />
            <span className="text-text-muted text-sm">Made by Max</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text">Projects</h1>
        </div>
        <button onClick={() => { setSelected(null); setModal("form"); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-2 border-mbm">
          <span className="stat-label">Active projects</span>
          <span className="stat-value">{activeProjects.length}</span>
        </div>
        <div className="stat-card border-l-2 border-mbm">
          <span className="stat-label">Revenue this month</span>
          <span className="stat-value text-mbm">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="stat-card border-l-2 border-mbm">
          <span className="stat-label">Total projects</span>
          <span className="stat-value">{projects.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Projects list */}
        <div className="xl:col-span-2">
          <div className="card">
            <h2 className="section-title mb-4">All projects</h2>
            {projects.length === 0 ? (
              <EmptyState icon={DollarSign} title="No projects yet" description="Add your first Made by Max project" action={<button onClick={() => setModal("form")} className="btn-primary">Add project</button>} />
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { setSelected(p); setModal("detail"); }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-mbm/50 cursor-pointer transition-all duration-150 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-text truncate">{p.clientName}</span>
                        <span className={`badge ${stageColour(p.stage)}`}>{p.stage}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><Clock size={11} />{formatHours((p.hoursLogged || 0) * 60)}</span>
                        <span className="flex items-center gap-1 text-mbm font-medium">{formatCurrency(p.revenue)}</span>
                        {p.deadline && <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(p.deadline)}</span>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted group-hover:text-mbm transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="section-title mb-4">Pipeline</h2>
            {STAGE_ORDER.map((stage) => {
              const count = projects.filter((p) => p.stage === stage).length;
              return (
                <div key={stage} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${stageColour(stage)}`}>{stage}</span>
                  </div>
                  <span className="font-mono text-sm text-text-muted">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="card">
            <h2 className="section-title mb-4">Upcoming deadlines</h2>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-text-muted">No upcoming deadlines</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text">{p.clientName}</p>
                      <p className="text-xs text-text-muted">{formatDate(p.deadline)}</p>
                    </div>
                    <span className={`badge ${stageColour(p.stage)}`}>{p.stage}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {modal === "form" && (
        <Modal title={selected ? "Edit project" : "New project"} onClose={() => { setModal(null); setSelected(null); }}>
          <ProjectForm project={selected} onSave={handleSave} onClose={() => { setModal(null); setSelected(null); }} onDelete={handleDelete} />
        </Modal>
      )}
      {modal === "detail" && selected && (
        <Modal title={selected.clientName} onClose={() => { setModal(null); setSelected(null); }} size="lg">
          <ProjectDetail project={selected} onClose={() => { setModal(null); setSelected(null); }} onUpdate={handleUpdate} />
        </Modal>
      )}
    </div>
  );
}
