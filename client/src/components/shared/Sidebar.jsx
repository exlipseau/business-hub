import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Calendar, Globe, Wrench, Users, BookUser,
  Target, Timer, Bot, Settings, ChevronLeft, ChevronRight, Circle, FileText,
} from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";

const NAV = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/mbm", icon: Globe, label: "Made by Max", colour: "#3b82f6" },
  { to: "/tradex", icon: Wrench, label: "Tradex", colour: "#f59e0b" },
  { to: "/leads", icon: Users, label: "Leads" },
  { to: "/crm", icon: BookUser, label: "CRM" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/time", icon: Timer, label: "Time Tracker" },
  { to: "/ai", icon: Bot, label: "AI Assistant" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { activeTimer } = useApp();
  const location = useLocation();

  return (
    <aside
      className={`flex flex-col bg-surface border-r border-border transition-all duration-200 ease-in-out flex-shrink-0 ${
        collapsed ? "w-[60px]" : "w-[220px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mbm to-blue-400 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-display font-bold text-sm">M</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-xs font-display font-bold text-text leading-tight truncate">Max's</p>
            <p className="text-xs text-text-muted leading-tight truncate">Business Hub</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ to, icon: Icon, label, colour }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all duration-150 group relative ${
                isActive
                  ? "bg-border text-text font-medium"
                  : "text-text-muted hover:text-text hover:bg-border/50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  style={isActive && colour ? { color: colour } : {}}
                  className={isActive && !colour ? "text-mbm" : ""}
                />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && to === "/time" && activeTimer && (
                  <Circle size={6} className="text-success fill-success ml-auto flex-shrink-0 animate-pulse-slow" />
                )}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-card border border-border rounded-lg text-xs text-text whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-text-muted hover:text-text hover:bg-border/50 transition-colors text-sm"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
