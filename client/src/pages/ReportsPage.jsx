import React, { useEffect, useState } from "react";
import {
  FileText, Clock, CheckSquare, Users, TrendingUp, Calendar,
  Target, Printer, AlertCircle, MessageSquare, BarChart2, Brain, Star,
} from "lucide-react";
import { api } from "../utils/api.js";
import { formatCurrency } from "../utils/format.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLOURS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

const CREDENTIALS = [
  {
    key: "communication",
    label: "Communication",
    icon: MessageSquare,
    colour: "#3b82f6",
    description: "Demonstrates ability to communicate professionally with clients, leads and stakeholders across written, oral and visual channels.",
  },
  {
    key: "empiricalReasoning",
    label: "Empirical Reasoning",
    icon: Brain,
    colour: "#8b5cf6",
    description: "Uses evidence, data and systematic analysis to make business decisions, track project stages and manage a real client pipeline.",
  },
  {
    key: "quantitativeReasoning",
    label: "Quantitative Reasoning",
    icon: BarChart2,
    colour: "#10b981",
    description: "Applies mathematical reasoning to track revenue, measure time allocation, calculate goal progress and analyse business performance.",
  },
  {
    key: "personalQualities",
    label: "Personal Qualities",
    icon: Star,
    colour: "#f59e0b",
    description: "Shows initiative, self-direction and responsibility by independently managing tasks, setting goals and maintaining consistent work habits.",
  },
];

function CredentialCard({ cred, data }) {
  const score = data?.score || 0;
  const Icon = cred.icon;

  const bullets = {
    communication: [
      data?.totalInteractions > 0 && `${data.totalInteractions} client interaction${data.totalInteractions !== 1 ? "s" : ""} recorded (${data.meetings} meeting${data.meetings !== 1 ? "s" : ""}, ${data.calls} call${data.calls !== 1 ? "s" : ""}, ${data.emails} email${data.emails !== 1 ? "s" : ""})`,
      data?.calendarMeetings > 0 && `${data.calendarMeetings} scheduled meeting${data.calendarMeetings !== 1 ? "s" : ""} in calendar`,
      data?.leadsContacted > 0 && `Actively managing ${data.leadsContacted} lead${data.leadsContacted !== 1 ? "s" : ""} in sales pipeline`,
      data?.activeClients > 0 && `${data.activeClients} active client project${data.activeClients !== 1 ? "s" : ""} in progress`,
    ].filter(Boolean),
    empiricalReasoning: [
      data?.projectsManaged > 0 && `Managing ${data.projectsManaged} client project${data.projectsManaged !== 1 ? "s" : ""} across ${data.stagesTracked} stages`,
      data?.leadsInPipeline > 0 && `Tracking ${data.leadsInPipeline} leads through a structured sales pipeline`,
      data?.goalsSet > 0 && `${data.goalsSet} measurable goals set with defined targets and tracked progress`,
      `Running 2 distinct businesses with different models (agency + SaaS product)`,
    ].filter(Boolean),
    quantitativeReasoning: [
      data?.hoursTracked > 0 && `${data.hoursTracked} hours tracked across ${data.trackingDays} working day${data.trackingDays !== 1 ? "s" : ""}`,
      data?.revenue > 0 && `${formatCurrency(data.revenue)} revenue calculated and recorded across projects`,
      data?.goalsWithData > 0 && `${data.goalsWithData} goal${data.goalsWithData !== 1 ? "s" : ""} with quantitative progress measurements`,
      data?.hoursByBusiness?.length > 0 && `Time allocation analysed: ${data.hoursByBusiness.map(b => `${b.name} ${b.hours}h`).join(", ")}`,
    ].filter(Boolean),
    personalQualities: [
      data?.tasksCompleted > 0 && `${data.tasksCompleted} task${data.tasksCompleted !== 1 ? "s" : ""} completed independently`,
      data?.onTimeCount > 0 && `${data.onTimeCount} task${data.onTimeCount !== 1 ? "s" : ""} completed on time`,
      data?.uniqueTrackingDays > 0 && `Consistent work logged across ${data.uniqueTrackingDays} day${data.uniqueTrackingDays !== 1 ? "s" : ""}`,
      data?.goalsOnTrack > 0 && `${data.goalsOnTrack} of ${data.totalGoals} goals currently on track`,
      data?.overdueCount === 0 && data?.tasksCompleted > 0 && "No overdue tasks — all deadlines met",
    ].filter(Boolean),
  };

  const items = bullets[cred.key] || [];

  return (
    <div className="card border-l-2" style={{ borderLeftColor: cred.colour }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cred.colour}20` }}>
            <Icon size={17} style={{ color: cred.colour }} />
          </div>
          <div>
            <p className="font-display font-semibold text-text">{cred.label}</p>
            <p className="text-xs text-text-muted mt-0.5 max-w-sm">{cred.description}</p>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="space-y-2 mt-4 pl-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-text">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cred.colour }} />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted mt-3 italic">No activity recorded yet — add data to see evidence here.</p>
      )}
    </div>
  );
}

function CredentialsSection({ credentials }) {
  if (!credentials) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <Target size={15} className="text-text-muted" />
        <h2 className="font-display font-semibold text-text">Big Picture Learning Credentials</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {CREDENTIALS.map((cred) => (
          <CredentialCard key={cred.key} cred={cred} data={credentials[cred.key]} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, colour = "#3b82f6" }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${colour}20` }}>
        <Icon size={20} style={{ color: colour }} />
      </div>
      <div>
        <p className="text-2xl font-bold font-mono text-text">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
      <Icon size={15} className="text-text-muted" />
      <h2 className="font-display font-semibold text-text">{title}</h2>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const map = { high: "text-danger bg-danger/10", medium: "text-warning bg-warning/10", low: "text-text-muted bg-border" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[priority] || map.low}`}>{priority}</span>;
}

function StageBadge({ stage }) {
  return <span className="text-xs px-2 py-0.5 rounded-full bg-border text-text-muted">{stage}</span>;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

function formatDateTime(d) {
  return new Date(d).toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function WeeklyReport({ data }) {
  const start = formatDate(data.period.start);
  const end = formatDate(data.period.end);

  return (
    <div className="space-y-6">
      <p className="text-text-muted text-sm">{start} — {end}</p>

      <CredentialsSection credentials={data.credentials} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Hours logged" value={`${data.totalHours}h`} colour="#3b82f6" />
        <StatCard icon={CheckSquare} label="Tasks completed" value={data.tasksCompleted.length} colour="#10b981" />
        <StatCard icon={Users} label="New leads" value={data.newLeads.length} colour="#f59e0b" />
        <StatCard icon={Calendar} label="Events" value={data.events.length} colour="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.hoursByBusiness.length > 0 && (
          <div className="card">
            <SectionHeader title="Hours by Business" icon={Clock} />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.hoursByBusiness} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: "#9090b0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9090b0", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 8 }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {data.hoursByBusiness.map((_, i) => <Cell key={i} fill={COLOURS[i % COLOURS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.hoursByCategory.length > 0 && (
          <div className="card">
            <SectionHeader title="Hours by Category" icon={Clock} />
            <div className="space-y-3 mt-2">
              {data.hoursByCategory.sort((a, b) => b.hours - a.hours).map((cat, i) => {
                const pct = data.totalHours > 0 ? (cat.hours / data.totalHours) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text">{cat.name}</span>
                      <span className="font-mono text-text-muted">{cat.hours}h</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLOURS[i % COLOURS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <SectionHeader title="Tasks Completed This Week" icon={CheckSquare} />
        {data.tasksCompleted.length === 0 ? (
          <p className="text-text-muted text-sm">No tasks completed this week.</p>
        ) : (
          <div className="space-y-2">
            {data.tasksCompleted.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <CheckSquare size={13} className="text-success flex-shrink-0" />
                  <span className="text-sm text-text line-through opacity-60">{t.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{t.business?.name}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <SectionHeader title="Pending Tasks" icon={AlertCircle} />
        {data.tasksPending.length === 0 ? (
          <p className="text-text-muted text-sm">No pending tasks — all clear!</p>
        ) : (
          <div className="space-y-2">
            {data.tasksPending.slice(0, 10).map((t) => {
              const overdue = t.dueDate && new Date(t.dueDate) < new Date();
              return (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border border-border flex-shrink-0" />
                    <span className="text-sm text-text">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{t.business?.name}</span>
                    <PriorityBadge priority={t.priority} />
                    {t.dueDate && (
                      <span className={`text-xs ${overdue ? "text-danger" : "text-text-muted"}`}>
                        {overdue ? "Overdue · " : ""}{formatDate(t.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {data.events.length > 0 && (
        <div className="card">
          <SectionHeader title="Calendar Events This Week" icon={Calendar} />
          <div className="space-y-2">
            {data.events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm text-text">{ev.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{formatDateTime(ev.start)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{ev.category}</span>
                  {ev.business && <span className="text-xs text-text-muted">{ev.business.name}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.interactions?.length > 0 && (
        <div className="card">
          <SectionHeader title="Client Interactions This Week" icon={Users} />
          <div className="space-y-2">
            {data.interactions.map((i) => (
              <div key={i.id} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm text-text">{i.contact?.name} <span className="text-text-muted">· {i.contact?.company}</span></p>
                  {i.notes && <p className="text-xs text-text-muted mt-0.5 max-w-md">{i.notes}</p>}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-border text-text-muted capitalize ml-3 flex-shrink-0">{i.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.newLeads.length > 0 && (
        <div className="card">
          <SectionHeader title="New Leads This Week" icon={Users} />
          <div className="space-y-2">
            {data.newLeads.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm text-text">{l.name}</p>
                  <p className="text-xs text-text-muted">{l.company} · {l.source}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StageBadge stage={l.stage} />
                  <span className="text-sm font-mono text-text">{l.value ? formatCurrency(l.value) : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.goals.length > 0 && (
        <div className="card">
          <SectionHeader title="Goals Progress" icon={Target} />
          <div className="space-y-4">
            {data.goals.map((g) => {
              const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
              const unit = g.unit === "AUD" ? `${formatCurrency(g.current)} / ${formatCurrency(g.target)}` : `${g.current} / ${g.target} ${g.unit}`;
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <div>
                      <span className="text-text font-medium">{g.name}</span>
                      {g.business && <span className="text-text-muted ml-2 text-xs">({g.business.name})</span>}
                    </div>
                    <span className="font-mono text-text-muted text-xs">{unit}</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-mbm" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-text-muted mt-1">{Math.round(pct)}% complete · {g.period}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyReport({ data }) {
  const start = new Date(data.period.start).toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  const totalRevenue = data.revenueByBusiness.reduce((s, b) => s + b.revenue, 0);

  return (
    <div className="space-y-6">
      <p className="text-text-muted text-sm">{start}</p>

      <CredentialsSection credentials={data.credentials} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total revenue" value={formatCurrency(totalRevenue)} colour="#10b981" />
        <StatCard icon={Clock} label="Hours logged" value={`${data.totalHours}h`} colour="#3b82f6" />
        <StatCard icon={CheckSquare} label="Tasks completed" value={data.tasksCompleted.length} colour="#f59e0b" />
        <StatCard icon={Users} label="Total leads" value={data.leads.length} colour="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.revenueByBusiness.length > 0 && (
          <div className="card">
            <SectionHeader title="Revenue by Business" icon={TrendingUp} />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.revenueByBusiness} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: "#9090b0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9090b0", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 8 }} formatter={(v) => [formatCurrency(v), "Revenue"]} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {data.revenueByBusiness.map((_, i) => <Cell key={i} fill={COLOURS[i % COLOURS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.hoursByBusiness.length > 0 && (
          <div className="card">
            <SectionHeader title="Hours by Business" icon={Clock} />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.hoursByBusiness} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: "#9090b0", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9090b0", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 8 }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {data.hoursByBusiness.map((_, i) => <Cell key={i} fill={COLOURS[i % COLOURS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card">
        <SectionHeader title="Projects" icon={FileText} />
        {data.projects.length === 0 ? (
          <p className="text-text-muted text-sm">No projects yet.</p>
        ) : (
          <div className="space-y-2">
            {data.projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm text-text font-medium">{p.clientName}</p>
                  <p className="text-xs text-text-muted">{p.business?.name} · {p.hoursLogged}h logged</p>
                </div>
                <div className="flex items-center gap-3">
                  <StageBadge stage={p.stage} />
                  <span className="text-sm font-mono text-text">{formatCurrency(p.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <SectionHeader title="Leads Pipeline" icon={Users} />
        {data.leads.length === 0 ? (
          <p className="text-text-muted text-sm">No leads yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {data.leadsByStage.map((s) => (
                <div key={s.stage} className="text-center p-3 rounded-lg bg-surface border border-border">
                  <p className="text-xl font-bold font-mono text-text">{s.count}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.stage}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {data.leads.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm text-text">{l.name}</p>
                    <p className="text-xs text-text-muted">{l.company} · {l.business?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StageBadge stage={l.stage} />
                    <span className="text-sm font-mono text-text">{l.value ? formatCurrency(l.value) : "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {data.interactions?.length > 0 && (
        <div className="card">
          <SectionHeader title="Client Interactions This Month" icon={MessageSquare} />
          <div className="space-y-2">
            {data.interactions.map((i) => (
              <div key={i.id} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm text-text">{i.contact?.name} <span className="text-text-muted">· {i.contact?.company}</span></p>
                  {i.notes && <p className="text-xs text-text-muted mt-0.5 max-w-md">{i.notes}</p>}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-border text-text-muted capitalize ml-3 flex-shrink-0">{i.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.goals.length > 0 && (
        <div className="card">
          <SectionHeader title="Goals Progress" icon={Target} />
          <div className="space-y-4">
            {data.goals.map((g) => {
              const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
              const unit = g.unit === "AUD"
                ? `${formatCurrency(g.current)} / ${formatCurrency(g.target)}`
                : `${g.current} / ${g.target} ${g.unit}`;
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <div>
                      <span className="text-text font-medium">{g.name}</span>
                      {g.business && <span className="text-text-muted ml-2 text-xs">({g.business.name})</span>}
                    </div>
                    <span className="font-mono text-text-muted text-xs">{unit}</span>
                  </div>
                  <div className="h-2.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#10b981" : "#3b82f6" }} />
                  </div>
                  <p className="text-xs text-text-muted mt-1">{Math.round(pct)}% complete · {g.period}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <SectionHeader title={`Completed Tasks (${data.tasksCompleted.length})`} icon={CheckSquare} />
          {data.tasksCompleted.length === 0 ? (
            <p className="text-text-muted text-sm">None completed this month.</p>
          ) : (
            <div className="space-y-1.5">
              {data.tasksCompleted.map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-1.5">
                  <CheckSquare size={12} className="text-success flex-shrink-0" />
                  <span className="text-sm text-text line-through opacity-60">{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <SectionHeader title={`Pending Tasks (${data.tasksPending.length})`} icon={AlertCircle} />
          {data.tasksPending.length === 0 ? (
            <p className="text-text-muted text-sm">All tasks done!</p>
          ) : (
            <div className="space-y-1.5">
              {data.tasksPending.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border border-border flex-shrink-0" />
                    <span className="text-sm text-text">{t.title}</span>
                  </div>
                  <PriorityBadge priority={t.priority} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState("weekly");
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/reports/weekly"),
      api.get("/reports/monthly"),
    ]).then(([weekly, monthly]) => {
      setWeeklyData(weekly);
      setMonthlyData(monthly);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-mbm border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="page max-w-4xl">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <FileText size={22} className="text-text" />
          <div>
            <h1 className="font-display font-bold text-2xl text-text">Reports</h1>
            <p className="text-xs text-text-muted mt-0.5">Business activity & learning credentials</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="btn-ghost flex items-center gap-2">
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl mb-6 w-fit">
        {[
          { key: "weekly", label: "Weekly Report" },
          { key: "monthly", label: "Monthly Report" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? "bg-card text-text shadow-sm" : "text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "weekly" && weeklyData && <WeeklyReport data={weeklyData} />}
      {tab === "monthly" && monthlyData && <MonthlyReport data={monthlyData} />}
    </div>
  );
}
