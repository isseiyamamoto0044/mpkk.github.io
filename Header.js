// src/components/Header.js
import React from "react";
import "./components.css";
import Button from "./Button";

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="header">
      <div className="header-inner">
        {/* 左：タイトル */}
        <div className="header-title">
          <div className="header-logo" />
          <div className="header-text">Reception One Board</div>
        </div>

        {/* 右：ナビ（1行・右詰） */}
        <nav className="header-nav">
          {[
            { key: "dashboard", label: "Dashboard" },
            { key: "tasks", label: "Tasks" },
            { key: "handovers", label: "Handovers" },
            { key: "settings", label: "Settings" },
            { key: "account", label: "Account" },
          ].map((t) => (
            <Button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={activeTab === t.key ? "active" : ""}
            >
              {t.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
