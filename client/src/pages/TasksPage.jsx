import React, { useEffect, useState, useMemo } from "react";
import {
  Plus, ArrowRight, CheckCheck, Clock, Inbox, Loader2, Trash2,
  CheckSquare, LayoutKanban, ListChecks,
} from "lucide-react";
import { api } from "../utils/api.js";
import { formatDate, CATEGORIES } from "../utils/format.js";
import Modal from "../components/shared/Modal.jsx";
import EmptyState from "../components/shared/EmptyState.jsx";

const KANBAN_COLS = ["Backlog", "In Progress", "Done"];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const COL_META = {
  Backlog: {
    accent: "border-border",
    dot: "bg-text-muted",
    header: "text-text-muted",
    add: true,
  },
  "In Progress": {
    accent: "border-mbm/40",
    dot: "bg-mbm",
    header: "text-mbm",
    add: false,
  },
  Done: {
    accent: "border-success/40",
    dot: "bg-success",
    header: "text-success",
    add: false,
    note: "Tasks auto-hide after 7 days",
  },
};

const PRIORITY_COLOR = {
  high: "text-danger bg-danger/10",
  medium: "text-warning bg-warning/10",
  low: "text-text-muted bg-border",
};

function BusinessPill({ businessId }) {
  if (businessId === "mbm")
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-mbm/15 text-mbm tracking-wide">MBM</span>;
  if (businessId === "tradex")
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-tradex/15 text-tradex tracking-wide">TRADEX</span>;
  return null;
}

function TaskCard({ task, showBusiness, onEdit, onAdvance }) {
  const nextStage = { Backlog: "In Progress", "In Progress": "Done" }[task.stage || "Backlog"];
  const isDone = task.stage === "Done" || (!task.stage && task.completed);

  return (
    <div
      onClick={() => onEdit(task)}
      className="group relative p-3.5 rounded-xl bg-card border border-border hover:border-text-muted/40 cursor-pointer transition-all duration-150 hover:shadow-sm"
    >
      <p
        className={`text-sm font-medium leading-snug mb-3 ${
          isDone ? "line-through text-text-muted" : "text-text"
        }`}
      >
        {task.title}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {showBusiness && <BusinessPill businessId={task.businessId} />}
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium
            }`}
          >
            {task.priority || "medium"}
          </span>
          <span className="text-[10px] text-text-muted bg-surface border border-border px-1.5 py-0.5 rounded">
            {task.category || "Admin"}
          </span>
        </div>

        {!isDone && nextStage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvance(task, nextStage);
            }}
            title={`Move to ${nextStage}`}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-text-muted hover:text-text px-2 py-1 rounded-lg hover:bg-surface border border-transparent hover:border-border transition-all flex-shrink-0"
          >
            <ArrowRight size={11} />
          </button>
        )}
      </div>

      {task.dueDate && (
        <p className="text-[10px] text-text-muted mt-2.5 pt-2.5 border-t border-border/50">
          Due {formatDate(task.dueDate)}
        </p>
      )}
    </div>
  );
}

function TaskForm({ task, onSave, onClose, onDelete }) {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    businessId: task?.businessId || "mbm",
    title: task?.title || "",
    category: task?.category || "Admin",
    priority: task?.priority || "medium",
    stage: task?.stage || (task?.completed ? "Done" : "Backlog"),
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    notes: task?.notes || "",
    projectId: task?.projectId || "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.businessId === "mbm") {
      api.get("/projects?businessId=mbm").then(setProjects).catch(() => {});
    } else {
      setProjects([]);
      set("projectId", "");
    }
  }, [form.businessId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, completed: form.stage === "Done" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label block mb-1.5">Title</label>
        <input
          className="input"
          required
          autoFocus
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="What needs to be done?"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Business</label>
          <select className="select" value={form.businessId} onChange={(e) => set("businessId", e.target.value)}>
            <option value="mbm">Made by Max</option>
            <option value="tradex">Tradex</option>
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Column</label>
          <select className="select" value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {KANBAN_COLS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {form.businessId === "mbm" && projects.length > 0 && (
        <div>
          <label className="label block mb-1.5">
            Project <span className="text-text-muted">(optional)</span>
          </label>
          <select className="select" value={form.projectId} onChange={(e) => set("projectId", e.target.value)}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.clientName}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Category</label>
          <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Priority</label>
          <select className="select" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label block mb-1.5">
          Due date <span className="text-text-muted">(optional)</span>
        </label>
        <input
          className="input"
          type="date"
          value={form.dueDate}
          onChange={(e) => set("dueDate", e.target.value)}
        />
      </div>

      <div>
        <label className="label block mb-1.5">Notes</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">Save task</button>
        {task?.id && (
          <button type="button" onClick={onDelete} className="btn-danger">Delete</button>
        )}
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bFilter, setBFilter] = useState("all");
  const [view, setView] = useState("board");
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/tasks").then(setTasks).finally(() => setLoading(false));
  }, []);

  const handleSave = async (form) => {
    if (selected?.id) {
      const updated = await api.put(`/tasks/${selected.id}`, { ...selected, ...form });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const created = await api.post("/tasks", form);
      setTasks((prev) => [...prev, created]);
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

  const handleAdvance = async (task, nextStage) => {
    const updated = await api.put(`/tasks/${task.id}`, {
      ...task,
      stage: nextStage,
      completed: nextStage === "Done",
    });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const filtered = useMemo(
    () => (bFilter === "all" ? tasks : tasks.filter((t) => t.businessId === bFilter)),
    [tasks, bFilter]
  );

  const WEEK_AGO = Date.now() - WEEK_MS;

  const isDoneTask = (t) => t.stage === "Done" || (!t.stage && t.completed);

  // Board: active tasks + done tasks completed within last 7 days
  const boardTasks = useMemo(
    () =>
      filtered.filter((t) => {
        if (!isDoneTask(t)) return true;
        return new Date(t.updatedAt).getTime() >= WEEK_AGO;
      }),
    [filtered, WEEK_AGO]
  );

  const tasksByCol = (col) =>
    boardTasks.filter((t) => {
      if (col === "Done") return isDoneTask(t);
      if (col === "Backlog") return (t.stage === "Backlog" || !t.stage) && !t.completed;
      return t.stage === col;
    });

  // All completed tasks for the Completed tab
  const completedTasks = useMemo(
    () =>
      filtered
        .filter(isDoneTask)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [filtered]
  );

  const inProgressCount = tasksByCol("In Progress").length;
  const backlogCount = tasksByCol("Backlog").length;
  const doneThisWeekCount = completedTasks.filter(
    (t) => new Date(t.updatedAt).getTime() >= WEEK_AGO
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-mbm border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="font-display font-bold text-2xl text-text">Tasks</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {filtered.length} tasks · {inProgressCount} in progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Business filter */}
          <div className="flex bg-surface border border-border rounded-lg overflow-hidden text-xs">
            {[
              ["all", "All"],
              ["mbm", "Made by Max"],
              ["tradex", "Tradex"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setBFilter(val)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  bFilter === val
                    ? "bg-border text-text"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setSelected(null); setModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> New task
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-surface border border-border rounded-xl w-fit">
        <button
          onClick={() => setView("board")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === "board"
              ? "bg-card text-text shadow-sm border border-border"
              : "text-text-muted hover:text-text"
          }`}
        >
          <LayoutKanban size={14} /> Board
        </button>
        <button
          onClick={() => setView("completed")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === "completed"
              ? "bg-card text-text shadow-sm border border-border"
              : "text-text-muted hover:text-text"
          }`}
        >
          <ListChecks size={14} /> Completed
          {completedTasks.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 text-[10px] bg-border rounded-full text-text-muted">
              {completedTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-2 border-mbm">
          <span className="stat-label">In progress</span>
          <span className="stat-value text-mbm">{inProgressCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Backlog</span>
          <span className="stat-value">{backlogCount}</span>
        </div>
        <div className="stat-card border-l-2 border-success">
          <span className="stat-label">Done this week</span>
          <span className="stat-value text-success">{doneThisWeekCount}</span>
        </div>
      </div>

      {/* Board view */}
      {view === "board" && (
        <div className="grid grid-cols-3 gap-5">
          {KANBAN_COLS.map((col) => {
            const meta = COL_META[col];
            const colTasks = tasksByCol(col);
            return (
              <div
                key={col}
                className={`rounded-2xl border-2 ${meta.accent} bg-surface/60 p-4 flex flex-col`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    <h3 className={`font-semibold text-sm ${meta.header}`}>{col}</h3>
                  </div>
                  <span className="text-xs font-mono text-text-muted bg-border px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="flex-1 space-y-2.5 min-h-[60px]">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      showBusiness={bFilter === "all"}
                      onEdit={(t) => { setSelected(t); setModal(true); }}
                      onAdvance={handleAdvance}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-xs text-text-muted">Nothing here</p>
                    </div>
                  )}
                </div>

                {/* Column footer */}
                {meta.note && (
                  <p className="text-[10px] text-text-muted mt-3 pt-3 border-t border-border/50 text-center">
                    {meta.note}
                  </p>
                )}
                {meta.add && (
                  <button
                    onClick={() => { setSelected(null); setModal(true); }}
                    className="mt-3 w-full py-2.5 border border-dashed border-border rounded-xl text-xs text-text-muted hover:text-text hover:border-text-muted transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={12} /> Add task
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed view */}
      {view === "completed" && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">Completed tasks</h2>
              <p className="text-xs text-text-muted mt-0.5">All time — including tasks hidden from the board</p>
            </div>
            <span className="text-xs font-mono text-text-muted bg-surface border border-border px-2.5 py-1 rounded-lg">
              {completedTasks.length} tasks
            </span>
          </div>

          {completedTasks.length === 0 ? (
            <EmptyState
              icon={CheckCheck}
              title="No completed tasks yet"
              description="Move tasks to Done on the board and they'll appear here"
            />
          ) : (
            <div className="space-y-1.5">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => { setSelected(task); setModal(true); }}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface hover:bg-card border border-border cursor-pointer transition-colors group"
                >
                  <div className="w-5 h-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center flex-shrink-0">
                    <CheckCheck size={10} className="text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-muted line-through truncate">{task.title}</p>
                    {task.notes && (
                      <p className="text-xs text-text-muted/60 truncate mt-0.5">{task.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs text-text-muted">
                    <BusinessPill businessId={task.businessId} />
                    <span className={`font-medium ${PRIORITY_COLOR[task.priority]?.split(" ")[0] || ""}`}>
                      {task.priority}
                    </span>
                    <span>{formatDate(task.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modal && (
        <Modal
          title={selected ? "Edit task" : "New task"}
          onClose={() => { setModal(false); setSelected(null); }}
        >
          <TaskForm
            task={selected}
            onSave={handleSave}
            onClose={() => { setModal(false); setSelected(null); }}
            onDelete={handleDelete}
          />
        </Modal>
      )}
    </div>
  );
}
