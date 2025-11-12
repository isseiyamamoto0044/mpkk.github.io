// src/components/Tags.js
import React from "react";
import "./components.css"; // CSSを分離

export default function TagBadge({ name, color }) {
  return (
    <span className={`tag-badge`} style={{ backgroundColor: color }}>
      {name}
    </span>
  );
}
