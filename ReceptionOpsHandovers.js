// src/pages/ReceptionOpsHandovers.js
import React, { useMemo, useState } from "react";
import "./ReceptionOpsHandovers.css";
import Card from "../components/card";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import TagBadge from "../components/Tags";
import useLocalStorage from "../hooks/useLocalStorage";

// 画鋲アイコン
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

export default function ReceptionOpsHandovers({ dateKey }) {
  const [handovers, setHandovers] = useLocalStorage("handovers", []);
  const [tags] = useLocalStorage("tags", []);

  // モーダル
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");
  const [start, setStart] = useState(dateKey);
  const [end, setEnd] = useState(dateKey);
  const [pin, setPin] = useState(false);

  const visible = useMemo(() => {
    return handovers
      .filter((h) => (h.start || dateKey) <= dateKey && dateKey <= (h.end || dateKey))
      .slice()
      .sort((a, b) => Number(b.pin) - Number(a.pin) || b.ts - a.ts);
  }, [handovers, dateKey]);

  const colorOf = (name) =>
    tags.find((t) => t.type === "handover" && t.name === name)?.color || "gray";

  // 追加/編集
  const openAdd = () => {
    setEditId(null);
    setTitle("");
    setTag("");
    setNote("");
    setStart(dateKey);
    setEnd(dateKey);
    setPin(false);
    setShowModal(true);
  };
  const openEdit = (h) => {
    setEditId(h.id);
    setTitle(h.text || "");
    setTag(h.tag || "");
    setNote(h.note || "");
    setStart(h.start || dateKey);
    setEnd(h.end || dateKey);
    setPin(!!h.pin);
    setShowModal(true);
  };
  const save = () => {
    if (!title.trim()) return;
    if (editId) {
      setHandovers((list) =>
        list.map((h) =>
          h.id === editId
            ? { ...h, text: title.trim(), tag: tag || "", note: note || "", start: start, end: end || start, pin: !!pin, ts: Date.now() }
            : h
        )
      );
    } else {
      setHandovers((list) => [
        { id: String(Date.now()), text: title.trim(), tag: tag || "", note: note || "", start, end: end || start, pin: !!pin, ts: Date.now() },
        ...list,
      ]);
    }
    setShowModal(false);
    setEditId(null);
  };
  const remove = (id) => setHandovers((list) => list.filter((h) => h.id !== id));

  return (
    <div className="ops-handovers max-w-5xl mx-auto px-4 py-6">
      <Card title="共有事項" right={<Button className="bg-blue-600 text-white" onClick={openAdd}>追加</Button>}>
        <div className="space-y-3 ops-scroll pr-1">
          {visible.length === 0 && <div className="text-sm text-gray-500">（この日に表示される共有事項はありません）</div>}

          {visible.map((n) => (
            <div key={n.id} className="handover-card">
              {/* 1行目: PIN + 題目 + 期間（Handovers は開始〜終了） */}
              <div className="handover-header">
                <span className="handover-pin"><PinIcon pinned={!!n.pin} /></span>
                <div className="handover-title">{n.text}</div>
                <div className="handover-period">{n.start} 〜 {n.end}</div>
              </div>

              {/* 2行目: タグ + 操作 */}
              <div className="handover-meta-row">
                <div>{n.tag && <TagBadge name={n.tag} color={colorOf(n.tag)} />}</div>
                <div className="handover-actions">
                  <Button onClick={() => openEdit(n)}>編集</Button>
                  <Button onClick={() => remove(n.id)}>削除</Button>
                </div>
              </div>

              {/* 3行目: 補足 */}
              {n.note && <div className="handover-note">補足事項：{n.note}</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* 追加/編集モーダル */}
      {showModal && (
        <div className="ops-modal-overlay">
          <div className="ops-modal">
            <div className="ops-modal-title">{editId ? "共有事項を編集" : "共有事項を追加"}</div>

            <div className="ops-modal-body">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="題目（共有事項のタイトル）" />

              <div className="ops-field-row">
                <span className="ops-field-label">タグ</span>
                <select value={tag} onChange={(e) => setTag(e.target.value)} className="ops-select">
                  <option value="">選択</option>
                  {tags.filter((t) => t.type === "handover").map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                {tag && <TagBadge name={tag} color={colorOf(tag)} />}
              </div>

              <div className="ops-grid-2">
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>

              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="補足事項（任意）" />

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={pin} onChange={(e) => setPin(e.target.checked)} />
                ピン留め
              </label>

              <div className="ops-modal-actions">
                <Button onClick={() => { setShowModal(false); setEditId(null); }}>キャンセル</Button>
                <Button className="bg-blue-600 text-white" onClick={save}>保存</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
