import React from "react";
import { useApp } from "../../context/AppContext.jsx";

export default function BusinessBadge({ businessId, size = "sm" }) {
  const { getBusinessName, getBusinessColour } = useApp();
  if (!businessId) return null;
  const colour = getBusinessColour(businessId);
  const name = getBusinessName(businessId);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${size === "xs" ? "text-[10px]" : ""}`}
      style={{ backgroundColor: `${colour}18`, color: colour }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colour }} />
      {name}
    </span>
  );
}
