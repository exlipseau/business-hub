import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import Layout from "./components/shared/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import MbmPage from "./pages/MbmPage.jsx";
import TradexPage from "./pages/TradexPage.jsx";
import LeadsPage from "./pages/LeadsPage.jsx";
import CrmPage from "./pages/CrmPage.jsx";
import GoalsPage from "./pages/GoalsPage.jsx";
import TimeTrackerPage from "./pages/TimeTrackerPage.jsx";
import AiPage from "./pages/AiPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";

function AppRoutes() {
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="w-6 h-6 border-2 border-mbm border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/mbm" element={<MbmPage />} />
        <Route path="/tradex" element={<TradexPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/time" element={<TimeTrackerPage />} />
        <Route path="/ai" element={<AiPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
