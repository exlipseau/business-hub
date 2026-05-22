import React, { useEffect, useState } from "react";
import { Plus, Target, TrendingUp, User, Edit2, Trash2 } from "lucide-react";
import { api } from "../utils/api.js";
import { formatCurrency, GOAL_PERIODS } from "../utils/format.js";
import Modal from "../components/shared/Modal.jsx";
import ProgressBar from "../components/shared/ProgressBar.jsx";
import BusinessBadge from "../components/shared/BusinessBadge.jsx";
import { useApp } from "../context/AppContext.jsx";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

function GoalCard({ goal, onEdit, onDelete, colour }) {
  const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
  const remaining = goal.target - goal.current;
  const pace = goal.current > 0 ? (goal.target / goal.current) : 0;

  const formatVal = (v) => {
    if (goal.unit === "GBP") return formatCurrency(v);
    return `${v} ${goal.unit}`;
  };

  return (
    <div className="card group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-text">{goal.name}</p>
          <div className="flex items-center gap-2 mt-1">
            {goal.businessId && <BusinessBadge businessId={goal.businessId} size="xs" />}
            <span className="text-xs text-text-muted capitalize">{goal.period}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg hover:bg-border text-text-muted hover:text-text transition-colors">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold font-mono text-text">{formatVal(goal.current)}</span>
        <span className="text-sm text-text-muted">/ {formatVal(goal.target)}</span>
      </div>
      <ProgressBar value={goal.current} max={goal.target} colour={colour || "#3b82f6"} height={8} />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-text-muted">{Math.round(pct)}% complete</span>
        <span className="text-xs text-text-muted">{remaining > 0 ? `${formatVal(remaining)} to go` : "✓ Done"}</span>
      </div>
    </div>
  );
}

function GoalForm({ goal, onSave, onClose }) {
  const { businesses } = useApp();
  const [form, setForm] = useState({
    businessId: goal?.businessId || "",
    type: goal?.type || "revenue",
    name: goal?.name || "",
    target: goal?.target || "",
    current: goal?.current || 0,
    period: goal?.period || "monthly",
    unit: goal?.unit || "GBP",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Type</label>
          <select className="select" value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="revenue">Revenue</option>
            <option value="performance">Performance</option>
            <option value="personal">Personal</option>
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Business</label>
          <select className="select" value={form.businessId} onChange={(e) => set("businessId", e.target.value)}>
            <option value="">None (personal)</option>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label block mb-1.5">Goal name</label>
        <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Monthly Revenue" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label block mb-1.5">Target</label>
          <input className="input" type="number" required value={form.target} onChange={(e) => set("target", e.target.value)} />
        </div>
        <div>
          <label className="label block mb-1.5">Current</label>
          <input className="input" type="number" value={form.current} onChange={(e) => set("current", e.target.value)} />
        </div>
        <div>
          <label className="label block mb-1.5">Unit</label>
          <select className="select" value={form.unit} onChange={(e) => set("unit", e.target.value)}>
            <option value="AUD">$ (AUD)</option>
            <option value="hours">Hours</option>
            <option value="leads">Leads</option>
            <option value="projects">Projects</option>
            <option value="days">Days</option>
            <option value="items">Items</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label block mb-1.5">Period</label>
        <select className="select" value={form.period} onChange={(e) => set("period", e.target.value)}>
          {GOAL_PERIODS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">Save goal</button>
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const { getBusinessColour } = useApp();

  useEffect(() => {
    api.get("/goals").then(setGoals).finally(() => setLoading(false));
  }, []);

  const handleSave = async (form) => {
    if (selected?.id) {
      const updated = await api.put(`/goals/${selected.id}`, form);
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    } else {
      const created = await api.post("/goals", form);
      setGoals((prev) => [...prev, created]);
    }
    setModal(false);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    await api.delete(`/goals/${id}`);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleEdit = (goal) => { setSelected(goal); setModal(true); };

  const revenueGoals = goals.filter((g) => g.type === "revenue");
  const performanceGoals = goals.filter((g) => g.type === "performance");
  const personalGoals = goals.filter((g) => g.type === "personal");

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-mbm border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="font-display font-bold text-2xl text-text">Goals</h1>
        <button onClick={() => { setSelected(null); setModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New goal
        </button>
      </div>

      {/* Revenue Goals */}
      {revenueGoals.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-mbm" />
            <h2 className="section-title">Revenue</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {revenueGoals.map((g) => (
              <GoalCard key={g.id} goal={g} onEdit={handleEdit} onDelete={handleDelete} colour={getBusinessColour(g.businessId)} />
            ))}
          </div>
        </section>
      )}

      {/* Performance Goals */}
      {performanceGoals.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-tradex" />
            <h2 className="section-title">Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceGoals.map((g) => (
              <GoalCard key={g.id} goal={g} onEdit={handleEdit} onDelete={handleDelete} colour={getBusinessColour(g.businessId) || "#f59e0b"} />
            ))}
          </div>
        </section>
      )}

      {/* Personal Goals */}
      {personalGoals.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-text-muted" />
            <h2 className="section-title">Personal</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalGoals.map((g) => (
              <GoalCard key={g.id} goal={g} onEdit={handleEdit} onDelete={handleDelete} colour="#7070a0" />
            ))}
          </div>
        </section>
      )}

      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <Target size={40} className="text-text-muted mb-4" />
          <p className="font-display font-bold text-text mb-2">No goals set yet</p>
          <p className="text-text-muted text-sm mb-6">Set revenue targets, performance metrics, and personal goals</p>
          <button onClick={() => setModal(true)} className="btn-primary">Set your first goal</button>
        </div>
      )}

      {modal && (
        <Modal title={selected ? "Edit goal" : "New goal"} onClose={() => { setModal(false); setSelected(null); }}>
          <GoalForm goal={selected} onSave={handleSave} onClose={() => { setModal(false); setSelected(null); }} />
        </Modal>
      )}
    </div>
  );
}
