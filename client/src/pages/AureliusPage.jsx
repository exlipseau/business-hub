import React, { useEffect, useState } from "react";
import { Plus, ChevronRight, DollarSign, Calendar, TrendingUp, ListTodo, Briefcase } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../utils/api.js";
import { formatDate, formatCurrency, apcStageColour, STAGES_APC } from "../utils/format.js";
import Modal from "../components/shared/Modal.jsx";
import EmptyState from "../components/shared/EmptyState.jsx";

const STAGE_ORDER = ["Enquiry", "Quote Sent", "Scheduled", "In Progress", "Complete", "Invoiced"];

function JobForm({ job, onSave, onClose, onDelete }) {
  const [form, setForm] = useState({
    businessId: "apc",
    clientName: job?.clientName || "",
    stage: job?.stage || "Enquiry",
    deadline: job?.deadline ? new Date(job.deadline).toISOString().split("T")[0] : "",
    revenue: job?.revenue || "",
    notes: job?.notes || "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="label block mb-1.5">Client / Property</label>
        <input
          className="input"
          required
          value={form.clientName}
          onChange={(e) => set("clientName", e.target.value)}
          placeholder="Client name or property address"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Stage</label>
          <select className="select" value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {STAGES_APC.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Job date</label>
          <input className="input" type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label block mb-1.5">Revenue ($)</label>
        <input
          className="input"
          type="number"
          step="0.01"
          value={form.revenue}
          onChange={(e) => set("revenue", e.target.value)}
          placeholder="0"
        />
      </div>
      <div>
        <label className="label block mb-1.5">Notes</label>
        <textarea
          className="input resize-none"
          rows={4}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Job details, address, scope of work..."
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">Save job</button>
        {job?.id && (
          <button type="button" onClick={onDelete} className="btn-danger">Delete</button>
        )}
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

function JobDetail({ job, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [j, setJ] = useState(job);

  const handleSave = async (form) => {
    const updated = await api.put(`/projects/${j.id}`, { ...j, ...form });
    setJ(updated);
    onUpdate(updated);
    setEditing(false);
  };

  return (
    <div>
      {editing ? (
        <JobForm
          job={j}
          onSave={handleSave}
          onClose={() => setEditing(false)}
          onDelete={async () => {
            await api.delete(`/projects/${j.id}`);
            onClose();
            onUpdate(null, j.id);
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`badge ${apcStageColour(j.stage)}`}>{j.stage}</span>
            <button onClick={() => setEditing(true)} className="btn-ghost text-xs">Edit</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-lg p-3">
              <p className="label mb-1">Revenue</p>
              <p className="font-mono font-bold text-apc">{formatCurrency(j.revenue)}</p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="label mb-1">Job date</p>
              <p className="text-sm font-medium text-text">{formatDate(j.deadline)}</p>
            </div>
          </div>
          {j.notes && (
            <div className="bg-surface rounded-lg p-4">
              <p className="label mb-2">Notes</p>
              <p className="text-sm text-text whitespace-pre-wrap">{j.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AureliusPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/projects?businessId=apc").then(setJobs).finally(() => setLoading(false));
  }, []);

  const handleSave = async (form) => {
    if (selected) {
      const updated = await api.put(`/projects/${selected.id}`, form);
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    } else {
      const created = await api.post("/projects", form);
      setJobs((prev) => [created, ...prev]);
    }
    setModal(null);
    setSelected(null);
  };

  const handleDelete = async () => {
    await api.delete(`/projects/${selected.id}`);
    setJobs((prev) => prev.filter((j) => j.id !== selected.id));
    setModal(null);
    setSelected(null);
  };

  const handleUpdate = (updated, deletedId) => {
    if (deletedId) {
      setJobs((prev) => prev.filter((j) => j.id !== deletedId));
      setModal(null);
    } else if (updated) {
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    }
  };

  // Revenue stats
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const totalRevenue = jobs.reduce((s, j) => s + (j.revenue || 0), 0);
  const revenueThisMonth = jobs
    .filter((j) => j.createdAt && new Date(j.createdAt) >= thisMonthStart)
    .reduce((s, j) => s + (j.revenue || 0), 0);
  const revenueLastMonth = jobs
    .filter((j) => j.createdAt && new Date(j.createdAt) >= lastMonthStart && new Date(j.createdAt) <= lastMonthEnd)
    .reduce((s, j) => s + (j.revenue || 0), 0);

  const activeJobs = jobs.filter((j) => !["Complete", "Invoiced"].includes(j.stage));

  // Last 6 months chart
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const total = jobs
      .filter((j) => j.createdAt && new Date(j.createdAt) >= mStart && new Date(j.createdAt) <= mEnd)
      .reduce((s, j) => s + (j.revenue || 0), 0);
    monthlyRevenue.push({
      name: mStart.toLocaleDateString("en-AU", { month: "short" }),
      revenue: total,
    });
  }

  const upcomingJobs = [...jobs]
    .filter((j) => j.deadline && new Date(j.deadline) > now && !["Complete", "Invoiced"].includes(j.stage))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-apc border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-apc" />
            <span className="text-text-muted text-sm">Aurelius Property Care</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text">Jobs</h1>
        </div>
        <button
          onClick={() => { setSelected(null); setModal("form"); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-apc/20 text-apc hover:bg-apc/30 transition-colors font-medium text-sm"
        >
          <Plus size={16} /> New job
        </button>
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card border-l-2 border-apc">
          <span className="stat-label">Revenue this month</span>
          <span className="stat-value text-apc">{formatCurrency(revenueThisMonth)}</span>
        </div>
        <div className="stat-card border-l-2 border-apc">
          <span className="stat-label">Revenue last month</span>
          <span className="stat-value text-apc">{formatCurrency(revenueLastMonth)}</span>
        </div>
        <div className="stat-card border-l-2 border-apc">
          <span className="stat-label">All-time revenue</span>
          <span className="stat-value text-apc">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="stat-card border-l-2 border-apc">
          <span className="stat-label">Active jobs</span>
          <span className="stat-value">{activeJobs.length}</span>
        </div>
      </div>

      {/* Monthly revenue chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title flex items-center gap-2">
            <TrendingUp size={16} className="text-apc" />
            Monthly revenue
          </h2>
          <span className="text-xs text-text-muted">Last 6 months</span>
        </div>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyRevenue} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                cursor={{ fill: "rgba(22,163,74,0.08)" }}
                contentStyle={{ background: "#0a0a0f", border: "1px solid #1e1e2d", borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [formatCurrency(value), "Revenue"]}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {monthlyRevenue.map((_, i) => (
                  <Cell key={i} fill="#16a34a" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Jobs list */}
        <div className="xl:col-span-2">
          <div className="card">
            <h2 className="section-title mb-4">All jobs</h2>
            {jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No jobs yet"
                description="Add your first Aurelius Property Care job"
                action={
                  <button onClick={() => setModal("form")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-apc/20 text-apc hover:bg-apc/30 transition-colors font-medium text-sm">
                    Add job
                  </button>
                }
              />
            ) : (
              <div className="space-y-2">
                {jobs.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => { setSelected(j); setModal("detail"); }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-apc/50 cursor-pointer transition-all duration-150 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-text truncate">{j.clientName}</span>
                        <span className={`badge ${apcStageColour(j.stage)}`}>{j.stage}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1 text-apc font-medium">
                          {formatCurrency(j.revenue)}
                        </span>
                        {j.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />{formatDate(j.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted group-hover:text-apc transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Pipeline */}
          <div className="card">
            <h2 className="section-title mb-4">Pipeline</h2>
            {STAGE_ORDER.map((stage) => {
              const count = jobs.filter((j) => j.stage === stage).length;
              const stageRevenue = jobs.filter((j) => j.stage === stage).reduce((s, j) => s + (j.revenue || 0), 0);
              return (
                <div key={stage} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className={`badge ${apcStageColour(stage)}`}>{stage}</span>
                  <div className="text-right">
                    <span className="font-mono text-sm text-text-muted">{count}</span>
                    {stageRevenue > 0 && (
                      <p className="text-[10px] text-apc">{formatCurrency(stageRevenue)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upcoming jobs */}
          <div className="card">
            <h2 className="section-title mb-4">Upcoming jobs</h2>
            {upcomingJobs.length === 0 ? (
              <p className="text-sm text-text-muted">No upcoming jobs scheduled</p>
            ) : (
              <div className="space-y-3">
                {upcomingJobs.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => { setSelected(j); setModal("detail"); }}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <p className="text-sm text-text group-hover:text-apc transition-colors">{j.clientName}</p>
                      <p className="text-xs text-text-muted">{formatDate(j.deadline)}</p>
                    </div>
                    <span className={`badge ${apcStageColour(j.stage)}`}>{j.stage}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === "form" && (
        <Modal
          title={selected ? "Edit job" : "New job"}
          onClose={() => { setModal(null); setSelected(null); }}
        >
          <JobForm
            job={selected}
            onSave={handleSave}
            onClose={() => { setModal(null); setSelected(null); }}
            onDelete={handleDelete}
          />
        </Modal>
      )}
      {modal === "detail" && selected && (
        <Modal
          title={selected.clientName}
          onClose={() => { setModal(null); setSelected(null); }}
          size="lg"
        >
          <JobDetail
            job={selected}
            onClose={() => { setModal(null); setSelected(null); }}
            onUpdate={handleUpdate}
          />
        </Modal>
      )}
    </div>
  );
}
