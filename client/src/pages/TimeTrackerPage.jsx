import React, { useEffect, useState, useCallback } from "react";
import { Play, Square, Plus, Clock, Edit2, Trash2 } from "lucide-react";
import { api } from "../utils/api.js";
import { formatDate, formatTime, CATEGORIES } from "../utils/format.js";
import { useApp } from "../context/AppContext.jsx";
import Modal from "../components/shared/Modal.jsx";
import BusinessBadge from "../components/shared/BusinessBadge.jsx";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, format, differenceInMinutes } from "date-fns";

function formatDuration(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function TimerDisplay({ entry }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!entry) return;
    const update = () => setElapsed(differenceInMinutes(new Date(), new Date(entry.startTime)));
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [entry]);

  return (
    <span className="font-mono text-4xl font-bold text-text">{formatDuration(elapsed)}</span>
  );
}

function EntryForm({ entry, onSave, onClose, onDelete }) {
  const { businesses } = useApp();
  const [form, setForm] = useState({
    businessId: entry?.businessId || "mbm",
    category: entry?.category || "Client Work",
    startTime: entry?.startTime ? new Date(entry.startTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    endTime: entry?.endTime ? new Date(entry.endTime).toISOString().slice(0, 16) : "",
    notes: entry?.notes || "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const start = new Date(form.startTime);
    const end = form.endTime ? new Date(form.endTime) : null;
    const duration = end ? Math.round((end - start) / 60000) : null;
    onSave({ ...form, duration, startTime: start.toISOString(), endTime: end?.toISOString() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Business</label>
          <select className="select" value={form.businessId} onChange={(e) => set("businessId", e.target.value)}>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Category</label>
          <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Start time</label>
          <input className="input" type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
        </div>
        <div>
          <label className="label block mb-1.5">End time</label>
          <input className="input" type="datetime-local" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label block mb-1.5">Notes</label>
        <input className="input" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="What did you work on?" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">Save entry</button>
        {entry?.id && <button type="button" onClick={onDelete} className="btn-danger">Delete</button>}
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

const PIE_COLOURS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function TimeTrackerPage() {
  const { businesses, activeTimer, setActiveTimer, refreshActiveTimer } = useApp();
  const [entries, setEntries] = useState([]);
  const [weekEntries, setWeekEntries] = useState([]);
  const [prevWeekEntries, setPrevWeekEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [timerBusiness, setTimerBusiness] = useState("mbm");
  const [timerCategory, setTimerCategory] = useState("Client Work");

  const loadData = useCallback(async () => {
    const now = new Date();
    const wStart = startOfWeek(now, { weekStartsOn: 1 });
    const wEnd = endOfWeek(now, { weekStartsOn: 1 });
    const prevStart = new Date(wStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevEnd = new Date(wEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayStart = startOfDay(now);

    const [todayE, weekE, prevE] = await Promise.all([
      api.get(`/time?from=${dayStart.toISOString()}`),
      api.get(`/time?from=${wStart.toISOString()}&to=${wEnd.toISOString()}`),
      api.get(`/time?from=${prevStart.toISOString()}&to=${prevEnd.toISOString()}`),
    ]);
    setEntries(todayE);
    setWeekEntries(weekE);
    setPrevWeekEntries(prevE);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startTimer = async () => {
    const entry = await api.post("/time", {
      businessId: timerBusiness,
      category: timerCategory,
      startTime: new Date().toISOString(),
    });
    setActiveTimer(entry);
    loadData();
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    await api.put(`/time/${activeTimer.id}/stop`);
    setActiveTimer(null);
    loadData();
    refreshActiveTimer();
  };

  const handleSave = async (form) => {
    if (selected?.id) {
      const updated = await api.put(`/time/${selected.id}`, form);
      loadData();
    } else {
      await api.post("/time", form);
      loadData();
    }
    setModal(false);
    setSelected(null);
  };

  const handleDelete = async () => {
    await api.delete(`/time/${selected.id}`);
    loadData();
    setModal(false);
    setSelected(null);
  };

  const weekTotalMins = weekEntries.reduce((s, e) => s + (e.duration || 0), 0);
  const prevWeekMins = prevWeekEntries.reduce((s, e) => s + (e.duration || 0), 0);
  const todayMins = entries.reduce((s, e) => s + (e.duration || 0), 0);

  const byBusiness = businesses.map((b) => ({
    name: b.name,
    value: weekEntries.filter((e) => e.businessId === b.id).reduce((s, e) => s + (e.duration || 0), 0) / 60,
    colour: b.colour,
  })).filter((d) => d.value > 0);

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    const mins = weekEntries.filter((e) => e.category === cat).reduce((s, e) => s + (e.duration || 0), 0);
    if (mins > 0) acc.push({ name: cat, value: Math.round(mins / 60 * 10) / 10 });
    return acc;
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-mbm border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="font-display font-bold text-2xl text-text">Time Tracker</h1>
        <button onClick={() => { setSelected(null); setModal(true); }} className="btn-ghost flex items-center gap-2">
          <Plus size={16} /> Manual entry
        </button>
      </div>

      {/* Timer */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            {activeTimer ? (
              <>
                <p className="text-text-muted text-sm mb-2">Timer running</p>
                <TimerDisplay entry={activeTimer} />
                <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                  <BusinessBadge businessId={activeTimer.businessId} />
                  <span className="text-sm text-text-muted">{activeTimer.category}</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-text-muted text-sm mb-1">Start a new session</p>
                <p className="font-mono text-4xl font-bold text-text">0h 0m</p>
              </>
            )}
          </div>

          {!activeTimer && (
            <div className="flex items-center gap-3">
              <select className="select w-44" value={timerBusiness} onChange={(e) => setTimerBusiness(e.target.value)}>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select className="select w-44" value={timerCategory} onChange={(e) => setTimerCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}

          <button
            onClick={activeTimer ? stopTimer : startTimer}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95 ${
              activeTimer ? "bg-danger/20 text-danger hover:bg-danger/30" : "bg-mbm text-white hover:bg-blue-400"
            }`}
          >
            {activeTimer ? <><Square size={18} />Stop</> : <><Play size={18} />Start</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <span className="stat-label">Today</span>
          <span className="stat-value">{formatDuration(todayMins)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">This week</span>
          <span className="stat-value">{formatDuration(weekTotalMins)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">vs last week</span>
          <span className={`stat-value ${weekTotalMins >= prevWeekMins ? "text-success" : "text-danger"}`}>
            {weekTotalMins >= prevWeekMins ? "+" : ""}{formatDuration(weekTotalMins - prevWeekMins)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* By business pie */}
        {byBusiness.length > 0 && (
          <div className="card">
            <h2 className="section-title mb-4">This week by business</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={byBusiness} dataKey="value" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                  {byBusiness.map((d, i) => <Cell key={i} fill={d.colour} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}h`, ""]} contentStyle={{ background: "#16161f", border: "1px solid #1e1e2d", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1 mt-2">
              {byBusiness.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.colour }} />{d.name}</span>
                  <span className="font-mono text-text-muted">{d.value.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By category */}
        {byCategory.length > 0 && (
          <div className="card lg:col-span-2">
            <h2 className="section-title mb-4">This week by category</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byCategory} layout="vertical">
                <XAxis type="number" tick={{ fill: "#7070a0", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#7070a0", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #1e1e2d", borderRadius: 8 }} formatter={(v) => [`${v}h`, "Hours"]} />
                <Bar dataKey="value" radius={4}>
                  {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Entry log */}
      <div className="card">
        <h2 className="section-title mb-4">Today's sessions</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No sessions logged today</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface border border-border group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <BusinessBadge businessId={entry.businessId} size="xs" />
                    <span className="text-sm text-text-muted">{entry.category}</span>
                    {!entry.endTime && <span className="badge bg-mbm/20 text-mbm text-[10px] animate-pulse-slow">Active</span>}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatTime(entry.startTime)}{entry.endTime && ` → ${formatTime(entry.endTime)}`}
                    {entry.notes && ` · ${entry.notes}`}
                  </p>
                </div>
                <span className="font-mono text-sm text-text">{formatDuration(entry.duration)}</span>
                <button
                  onClick={() => { setSelected(entry); setModal(true); }}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-border text-text-muted hover:text-text transition-all"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={selected ? "Edit entry" : "New entry"} onClose={() => { setModal(false); setSelected(null); }}>
          <EntryForm entry={selected} onSave={handleSave} onClose={() => { setModal(false); setSelected(null); }} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
}
