import React from "react";
import Sidebar from "./Sidebar.jsx";

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
