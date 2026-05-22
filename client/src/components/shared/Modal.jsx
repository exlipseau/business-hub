import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ title, children, onClose, size = "md" }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-card border border-border rounded-2xl w-full ${widths[size]} max-h-[90vh] flex flex-col animate-slide-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display font-bold text-lg text-text">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors p-1 rounded-lg hover:bg-border">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
