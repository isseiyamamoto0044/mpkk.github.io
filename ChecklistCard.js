// src/components/ChecklistCard.jsx
import React from "react";
import Card from "./card";
import Button from "./Button";
import TagBadge from "./Tags";
import "./components.css";

export default function ChecklistCard({
  dateLabel,
  items,           // [{ id, title, done, assignee, tags:[] }]
  onToggle,        // (id)=>void
  onAdd,           // ()=>void
  onRemove,        // (id)=>void
  onTemplateApply, // ()=>void
}) {
  const list = Array.isArray(items) ? items : [];
  const doneCount = list.filter(i => i.done).length;
  const total = list.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);


  return (
    <Card className="cl-card">
      <div className="cl-header">
        <div className="cl-title">
          <span>チェックリスト</span>
          <span className="cl-sub">（{dateLabel}）</span>
        </div>
        <div className="cl-actions">
          <Button size="sm" onClick={onTemplateApply}>テンプレートを反映</Button>
          <Button size="sm" variant="primary" onClick={onAdd}>追加</Button>
        </div>
      </div>

       <div className="cl-progress">完了率：{percent}%</div>

      <ul className="cl-list">
        {items.map(item => (
          <li key={item.id} className={`cl-row ${item.done ? "is-done" : ""}`}>
            <label className="cl-check">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggle(item.id)}
              />
              <span className="cl-text">{item.title}</span>
            </label>
            <div className="cl-meta">
              {item.assignee && <span className="cl-chip">@{item.assignee}</span>}
              {item.tags?.map(t => <TagBadge key={t} label={t} />)}
              <Button size="xs" onClick={() => onRemove(item.id)}>削除</Button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="cl-empty">タスクはまだありません。右上の「追加」から作成してください。</li>
        )}
      </ul>
    </Card>
  );
}
