import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle, Clock, TrendingUp, Users, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { api } from "../utils/api.js";
import { formatCurrency, formatTime, isOverdue } from "../utils/format.js";
import BusinessBadge from "../components/shared/BusinessBadge.jsx";
import ProgressBar from "../components/shared/ProgressBar.jsx";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/dashboard"), api.get("/tasks?completed=false")])
      .then(([dash, t]) => { setData(dash); setTasks(t); })
      .finally(() => setLoading(false));
  }, []);

  const toggleTask = async (task) => {
    const updated = await api.put(`/tasks/${task.id}`, { ...task, completed: !task.completed });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-mbm border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { todayEvents = [], stats = {}, overdue = {}, staleLeads = {} } = data || {};
  const needsAttention = [
    ...(overdue.mbm || []).map((t) => ({ ...t, type: "overdue" })),
    ...(overdue.tradex || []).map((t) => ({ ...t, type: "overdue" })),
    ...(staleLeads.mbm || []).map((l) => ({ ...l, type: "lead" })),
    ...(staleLeads.tradex || []).map((l) => ({ ...l, type: "lead" })),
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-8">
        <p className="text-text-muted text-sm mb-1">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
        <h1 className="font-display font-bold text-3xl text-text">{greeting()}, Max</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-mbm" />
            <span className="stat-label">Leads this week</span>
          </div>
          <span className="stat-value">{stats.leadsThisWeek ?? "—"}</span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-tradex" />
            <span className="stat-label">Hours today</span>
          </div>
          <span className="stat-value font-mono">{stats.hoursToday ?? 0}h</span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-mbm" />
            <span className="stat-label">MbM revenue / goal</span>
          </div>
          <span className="stat-value">{formatCurrency(stats.mbmRevenue)}</span>
          <ProgressBar value={stats.mbmRevenue || 0} max={stats.mbmTarget || 5000} colour="#3b82f6" />
          <span className="text-xs text-text-muted">of {formatCurrency(stats.mbmTarget)}</span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-tradex" />
            <span className="stat-label">Tradex MRR / goal</span>
          </div>
          <span className="stat-value">{formatCurrency(stats.tradexRevenue)}</span>
          <ProgressBar value={stats.tradexRevenue || 0} max={stats.tradexTarget || 2000} colour="#f59e0b" />
          <span className="text-xs text-text-muted">of {formatCurrency(stats.tradexTarget)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Today's tasks</h2>
              <Link to="/calendar" className="text-xs text-mbm hover:text-blue-400 flex items-center gap-1">View all <ArrowRight size={12} /></Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-text-muted text-sm py-4 text-center">No tasks due today</p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 8).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 group">
                    <button onClick={() => toggleTask(task)} className="flex-shrink-0 text-text-muted hover:text-success transition-colors">
                      {task.completed ? <CheckCircle2 size={18} className="text-success" /> : <Circle size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${task.completed ? "line-through text-text-muted" : "text-text"}`}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <BusinessBadge businessId={task.businessId} size="xs" />
                        <span className="text-xs text-text-muted">{task.category}</span>
                        {isOverdue(task.dueDate) && <span className="text-xs text-danger">Overdue</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      task.priority === "high" ? "text-danger bg-danger/10" :
                      task.priority === "medium" ? "text-warning bg-warning/10" :
                      "text-text-muted bg-border"
                    }`}>{task.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Events */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Today's schedule</h2>
              <Link to="/calendar" className="text-xs text-mbm hover:text-blue-400 flex items-center gap-1">Calendar <ArrowRight size={12} /></Link>
            </div>
            {todayEvents.length === 0 ? (
              <p className="text-text-muted text-sm py-4 text-center">Nothing scheduled today</p>
            ) : (
              <div className="space-y-2">
                {todayEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div
                      className="w-1 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ev.business?.colour || "#7070a0" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text truncate">{ev.title}</p>
                      <p className="text-xs text-text-muted">{formatTime(ev.start)} – {formatTime(ev.end)}</p>
                    </div>
                    {ev.business && <BusinessBadge businessId={ev.businessId} size="xs" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-warning" />
            <h2 className="section-title">Needs attention</h2>
          </div>
          {needsAttention.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={28} className="text-success mx-auto mb-2" />
              <p className="text-sm text-text-muted">You're all caught up</p>
            </div>
          ) : (
            <div className="space-y-3">
              {needsAttention.slice(0, 10).map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-surface border border-border">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-text leading-tight">{item.title || item.name}</p>
                    <span className={`badge flex-shrink-0 ${item.type === "overdue" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}>
                      {item.type === "overdue" ? "Overdue" : "Follow-up"}
                    </span>
                  </div>
                  <BusinessBadge businessId={item.businessId} size="xs" />
                </div>
              ))}
              {needsAttention.length > 10 && (
                <p className="text-xs text-text-muted text-center">+{needsAttention.length - 10} more</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
