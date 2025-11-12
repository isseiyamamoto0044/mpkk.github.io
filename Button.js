import React from "react";

export default function Button({ children, onClick, type = "button", className = "", disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-xl text-sm font-medium border shadow-sm disabled:opacity-50 hover:shadow transition ${
        disabled
          ? "bg-gray-200 text-gray-500 border-gray-200"
          : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
      } ${className}`}
    >
      {children}
    </button>
  );
}
