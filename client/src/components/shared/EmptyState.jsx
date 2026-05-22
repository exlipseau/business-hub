import React from "react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-border flex items-center justify-center mb-4">
          <Icon size={22} className="text-text-muted" />
        </div>
      )}
      <p className="font-display font-bold text-text mb-1">{title}</p>
      {description && <p className="text-sm text-text-muted max-w-xs mb-4">{description}</p>}
      {action && action}
    </div>
  );
}
