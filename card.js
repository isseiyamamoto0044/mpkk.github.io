import React from "react";
import "./components.css";

export default function Card({ title, right, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {(title || right) && (
        <div className="card-header">
          <span>{title}</span>
          {right && <div>{right}</div>}
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  );
}
