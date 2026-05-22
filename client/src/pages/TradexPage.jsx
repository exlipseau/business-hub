import React, { useEffect, useState } from "react";
import { Plus, GripVertical, Check, Clock, TrendingUp } from "lucide-react";
import { api } from "../utils/api.js";
import { formatCurrency, CATEGORIES } from "../utils/format.js";
import Modal from "../components/shared/Modal.jsx";
import EmptyState from "../components/shared/EmptyState.jsx";

const KANBAN_COLS = ["Backlog", "In Progress", "Done"];

const COL_STYLES = {
  Backlog: "border-border",
  "In Progress": "border-mbm/50",
  Done: "border-success/50",
};

function TaskCard({ task, onEdit, onStatusChange }) {
  return (
    <div
      onClick={() => onEdit(task)}
      className="p-3 rounded-lg bg-card border border-border hover:border-tradex/50 cursor-pointer transition-all duration-150 group"
    >
      <p className="text-sm text-text font-medium mb-1 leading-tight">{task.title}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="badge bg-border text-text-muted text-[10px]">{task.category}</span>
        <span className={`text-xs font-medium ${task.priority === "high" ? "text-danger" : task.priority === "medium" ? "text-warning" : "text-text-muted"}`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
}

function TaskForm({ task, onSave, onClose, onDelete }) {
  const [form, setForm] = useState({
    businessId: "tradex",
    title: task?.title || "",
    category: task?.category || "Development",
    priority: task?.priority || "medium",
    notes: task?.notes || "",
  });
  const [stage, setStage] = useState(task?.stage || "Backlog");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, stage }); }} className="space-y-4">
      <div>
        <label className="label block mb-1.5">Task title</label>
        <input className="input" required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Task title" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label block mb-1.5">Column</label>
          <select className="select" value={stage} onChange={(e) => setStage(e.target.value)}>
            {KANBAN_COLS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Category</label>
          <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Priority</label>
          <select className="select" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {["low", "medium", "high"].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label block mb-1.5">Notes</label>
        <textarea className="input resize-none" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">Save</button>
        {task?.id && <button type="button" onClick={onDelete} className="btn-danger">Delete</button>}
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export default function TradexPage() {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    Promise.all([
      api.get("/tasks?businessId=tradex"),
      api.get("/goals?businessId=tradex&type=revenue"),
      api.get(`/time?businessId=tradex&from=${weekAgo}`),
    ]).then(([t, g, time]) => { setTasks(t); setGoals(g); setTimeData(time); }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (form) => {
    if (selected?.id) {
      const updated = await api.put(`/tasks/${selected.id}`, { ...selected, ...form });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const created = await api.post("/tasks", form);
      setTasks((prev) => [created, ...prev]);
    }
    setModal(false);
    setSelected(null);
  };

  const handleDelete = async () => {
    await api.delete(`/tasks/${selected.id}`);
    setTasks((prev) => prev.filter((t) => t.id !== selected.id));
    setModal(false);
    setSelected(null);
  };

  const tasksByCol = (col) => tasks.filter((t) => t.stage === col || (!t.stage && col === "Backlog"));

  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    const mins = timeData.filter((e) => e.category === cat).reduce((s, e) => s + (e.duration || 0), 0);
    if (mins > 0) acc[cat] = mins;
    return acc;
  }, {});

  const totalMins = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
  const revenueGoal = goals[0];

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-tradex border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-tradex" />
            <span className="text-text-muted text-sm">Tradex</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text">Product Board</h1>
        </div>
        <button onClick={() => { setSelected(null); setModal(true); }} className="btn flex items-center gap-2 bg-tradex/20 text-tradex hover:bg-tradex/30 transition-colors">
          <Plus size={16} /> New task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card border-l-2 border-tradex">
          <span className="stat-label">In progress</span>
          <span className="stat-value">{tasksByCol("In Progress").length}</span>
        </div>
        <div className="stat-card border-l-2 border-tradex">
          <span className="stat-label">Backlog</span>
          <span className="stat-value">{tasksByCol("Backlog").length}</span>
        </div>
        {revenueGoal && (
          <>
            <div className="stat-card border-l-2 border-tradex">
              <span className="stat-label">MRR this month</span>
              <span className="stat-value text-tradex">{formatCurrency(revenueGoal.current)}</span>
            </div>
            <div className="stat-card border-l-2 border-tradex">
              <span className="stat-label">Revenue target</span>
              <span className="stat-value">{formatCurrency(revenueGoal.target)}</span>
            </div>
          </>
        )}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {KANBAN_COLS.map((col) => (
          <div key={col} className={`rounded-xl border-2 ${COL_STYLES[col]} bg-surface p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-text">{col}</h3>
              <span className="badge bg-border text-text-muted">{tasksByCol(col).length}</span>
            </div>
            <div className="space-y-2">
              {tasksByCol(col).map((task) => (
                <TaskCard key={task.id} task={task} onEdit={(t) => { setSelected(t); setModal(true); }} onStatusChange={() => {}} />
              ))}
              {tasksByCol(col).length === 0 && (
                <p className="text-xs text-text-muted text-center py-4">Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Time breakdown */}
      {totalMins > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">Time this week by category</h2>
          <div className="space-y-3">
            {Object.entries(categoryTotals).sort(([, a], [, b]) => b - a).map(([cat, mins]) => (
              <div key={cat} className="flex items-center gap-4">
                <span className="text-sm text-text-muted w-32 flex-shrink-0">{cat}</span>
                <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-tradex"
                    style={{ width: `${(mins / totalMins) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-text-muted w-12 text-right">
                  {Math.round(mins / 60)}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <Modal title={selected ? "Edit task" : "New task"} onClose={() => { setModal(false); setSelected(null); }}>
          <TaskForm task={selected} onSave={handleSave} onClose={() => { setModal(false); setSelected(null); }} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
}
