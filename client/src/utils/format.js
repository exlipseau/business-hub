import { format, formatDistanceToNow, isToday, isPast, parseISO } from "date-fns";

export function formatDate(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "d MMM yyyy");
}

export function formatDateTime(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "d MMM, h:mma").replace("AM", "am").replace("PM", "pm");
}

export function formatTime(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "h:mma").replace("AM", "am").replace("PM", "pm");
}

export function formatRelative(d) {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatCurrency(n) {
  if (n == null) return "$0";
  return `$${Number(n).toLocaleString("en-AU", { minimumFractionDigits: 0 })}`;
}

export function formatHours(mins) {
  if (!mins) return "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function isOverdue(d) {
  if (!d) return false;
  const date = typeof d === "string" ? parseISO(d) : d;
  return isPast(date) && !isToday(date);
}

export function isDueToday(d) {
  if (!d) return false;
  const date = typeof d === "string" ? parseISO(d) : d;
  return isToday(date);
}

export const STAGES_MBM = ["Discovery", "Design", "Build", "Revisions", "Live", "Invoiced"];
export const STAGES_LEAD = ["New", "Contacted", "Proposal Sent", "Negotiating", "Won", "Lost"];
export const CATEGORIES = ["Client Work", "Admin", "Development", "Marketing", "Sales", "Meeting", "Support"];
export const PRIORITIES = ["low", "medium", "high"];
export const SOURCES = ["Referral", "Instagram", "Website", "Cold Outreach", "Other"];
export const CONTACT_STATUSES = ["Prospect", "Active Client", "Past Client", "Partner"];
export const GOAL_PERIODS = ["daily", "weekly", "monthly", "quarterly", "annual"];
export const INTERACTION_TYPES = ["call", "email", "meeting", "message"];

export function priorityColour(p) {
  return { high: "text-danger", medium: "text-warning", low: "text-text-muted" }[p] || "text-text-muted";
}

export function stageColour(stage) {
  const map = {
    Discovery: "bg-blue-500/10 text-blue-400",
    Design: "bg-purple-500/10 text-purple-400",
    Build: "bg-yellow-500/10 text-yellow-400",
    Revisions: "bg-orange-500/10 text-orange-400",
    Live: "bg-green-500/10 text-green-400",
    Invoiced: "bg-gray-500/10 text-gray-400",
  };
  return map[stage] || "bg-border text-text-muted";
}

export function leadStageColour(stage) {
  const map = {
    New: "bg-blue-500/10 text-blue-400",
    Contacted: "bg-indigo-500/10 text-indigo-400",
    "Proposal Sent": "bg-yellow-500/10 text-yellow-400",
    Negotiating: "bg-orange-500/10 text-orange-400",
    Won: "bg-green-500/10 text-green-400",
    Lost: "bg-red-500/10 text-red-400",
  };
  return map[stage] || "bg-border text-text-muted";
}
