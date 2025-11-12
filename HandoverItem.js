import React from "react";
import TagBadge from "./Tags";
import "./handover-shared.css";

/** 📌ピンアイコン（ダッシュボード / Handovers 共通） */
function PinIcon({ pinned }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 3l7 7-3 3 3 3-1.5 1.5-3-3-3 3L4 7l3-3 3 3 4-4z"
        fill={pinned ? "#f59e0b" : "none"}
        stroke={pinned ? "#b45309" : "#6b7280"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * 共有事項の1行表示（ピン → タイトル → タグ → 期間｜右端：編集/削除）
 * 下段に「補足事項」を改行表示（あれば）
 */
export default function HandoverItem({
  item,        // {id,text,tag,note,pin,start,end}
  tagColor,    // (tagName) => color string
  onEdit,      // () => void
  onDelete,    // () => void
}) {
  return (
    <div className="handover-row">
      {/* 左：📌 + タイトル */}
      <div className="handover-left">
        <span className="handover-pin"><PinIcon pinned={item.pin} /></span>
        <span className="handover-title">{item.text}</span>
      </div>

      {/* 中央：タグ + 期間（左寄せのまま） */}
      <div className="handover-middle">
        {item.tag && <TagBadge name={item.tag} color={tagColor(item.tag)} />}
        <span className="handover-period">
          {item.start} 〜 {item.end}
        </span>
      </div>

      {/* 右端：操作 */}
      <div className="handover-actions">
        <button className="opbtn" onClick={onEdit}>編集</button>
        <button className="opbtn opbtn-danger" onClick={onDelete}>削除</button>
      </div>

      {/* 下段：補足事項 */}
      {item.note && (
        <div className="handover-note">
          <span className="note-label">補足事項：</span>
          <span className="note-text">{item.note}</span>
        </div>
      )}
    </div>
  );
}
