import React, { useEffect, useState } from "react";
import { ArrowRight, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../utils/api.js";
import { formatCurrency } from "../utils/format.js";


export default function TradexPage() {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    Promise.all([
      api.get("/tasks?businessId=tradex"),
      api.get("/goals?businessId=tradex&type=revenue"),
      api.get(`/time?businessId=tradex&from=${weekAgo}`),
    ]).then(([t, g, time]) => { setTasks(t); setGoals(g); setTimeData(time); }).finally(() => setLoading(false));
  }, []);

  const activeTasks = tasks.filter((t) => !t.completed && t.stage !== "Done");
  const inProgress = tasks.filter((t) => t.stage === "In Progress").length;
  const backlog = tasks.filter((t) => t.stage === "Backlog" || (!t.stage && !t.completed)).length;

  const CATS = ["Client Work","Admin","Development","Marketing","Sales","Meeting","Support"];
  const categoryTotals = CATS.reduce((acc, cat) => {
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
        <Link to="/tasks?b=tradex" className="btn flex items-center gap-2 bg-tradex/20 text-tradex hover:bg-tradex/30 transition-colors text-sm">
          View all tasks <ArrowRight size={15} />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card border-l-2 border-tradex">
          <span className="stat-label">In progress</span>
          <span className="stat-value">{inProgress}</span>
        </div>
        <div className="stat-card border-l-2 border-tradex">
          <span className="stat-label">Backlog</span>
          <span className="stat-value">{backlog}</span>
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

      {/* Task board link */}
      <div className="card mb-6 flex items-center justify-between">
        <div>
          <p className="font-semibold text-text text-sm">Tradex Task Board</p>
          <p className="text-xs text-text-muted mt-0.5">{activeTasks.length} active task{activeTasks.length !== 1 ? "s" : ""} — manage them on the Tasks page</p>
        </div>
        <Link
          to="/tasks"
          className="flex items-center gap-2 text-sm font-medium text-tradex hover:text-tradex/80 transition-colors"
        >
          Open Tasks <ArrowRight size={15} />
        </Link>
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

    </div>
  );
}
