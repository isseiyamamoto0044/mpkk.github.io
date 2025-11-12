import React from "react";

export default function Chip({ children }) {
  return (
    <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
      {children}
    </span>
  );
}
