import React, { useEffect, useState } from "react";
import "./ReceptionOpsTasks.css";
import Card from "../components/card";
import Button from "../components/Button";
import Input from "../components/Input";
import TagBadge from "../components/Tags";
import Textarea from "../components/Textarea";
import useLocalStorage from "../hooks/useLocalStorage";

const newId = () => Math.random().toString(36).slice(2, 10);

// タスク: {id, title, detail, tags: string[], status:'todo'|'doing'|'done', isDaily:boolean, pinned:boolean}
export default function ReceptionOpsTasks() {
  // --- リスト（左右ペイン） ---
  const [special, setSpecial] = useLocalStorage("tasks.special", []); // 周知・イベント（左）
  const [daily,   setDaily]   = useLocalStorage("tasks.daily", []);   // 毎日（右）

  // --- 追加モーダル ---
  const [showForm, setShowForm] = useState(false);
  const [formSide, setFormSide] = useState("daily"); // 'special' | 'daily'
  const [form, setForm] = useState({ title: "", detail: "", tags: [], pinned: false });

  // --- タグ（タグ管理画面と同じキーを想定: "tags"） ---
  const [allTags] = useLocalStorage("tags", []);
  const taskTags = (allTags || []).filter((t) => t.type === "task" || t.type === "common" || !t.type);

  // --- モーダル時のESC & 背景スクロールロック ---
  useEffect(() => {
    if (!showForm) return;
    const onKey = (e) => e.key === "Escape" && setShowForm(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showForm]);

  // --- 並び替え（HTML5 DnD） ---
  const [dragInfo, setDragInfo] = useState(null); // { side:'daily'|'special', index:number }
  const reorder = (arr, from, to) => {
    const next = arr.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };
  const onDragStart = (side, index) => (e) => {
    setDragInfo({ side, index });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${side}:${index}`); // Firefox対策
  };
  const onDragOver = (side, overIndex) => (e) => {
    if (dragInfo?.side === side) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  };
  const onDrop = (side, overIndex) => (e) => {
    e.preventDefault();
    if (!dragInfo || dragInfo.side !== side || dragInfo.index === overIndex) return;
    if (side === "daily") setDaily((prev) => reorder(prev, dragInfo.index, overIndex));
    else setSpecial((prev) => reorder(prev, dragInfo.index, overIndex));
    setDragInfo(null);
  };
  const onDragEnd = () => setDragInfo(null);

  // --- ハンドラ ---
  const openForm = (side) => {
    setFormSide(side);
    setForm({ title: "", detail: "", tags: [], pinned: false });
    setShowForm(true);
  };

  const submit = () => {
    const item = {
      id: newId(),
      title: form.title.trim(),
      detail: form.detail.trim(),
      tags: Array.isArray(form.tags)
        ? form.tags
        : String(form.tags || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      status: "todo",
      isDaily: formSide === "daily",
      pinned: !!form.pinned,
    };
    if (!item.title) return;

    if (formSide === "daily") setDaily((prev) => [item, ...prev]);
    else setSpecial((prev) => [item, ...prev]);

    setShowForm(false);
  };

  const remove = (side, id) => {
    const setter = side === "daily" ? setDaily : setSpecial;
    setter((prev) => prev.filter((x) => x.id !== id));
  };

  const toggle = (side, id) => {
    const setter = side === "daily" ? setDaily : setSpecial;
    setter((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, status: x.status === "done" ? "todo" : "done" } : x
      )
    );
  };

  return (
    <div className="tasks-two-pane">
      {/* 左：周知事項・イベント */}
      <section className="pane">
        <div className="pane-header">
          <h2>周知事項・イベント</h2>
          <Button size="sm" onClick={() => openForm("special")}>＋ 作成</Button>
        </div>
        <Card>
          <ul className="task-list">
            {special.map((t, i) => (
              <li
                key={t.id}
                className={`task-row ${t.status} ${dragInfo?.side==='special' && dragInfo.index===i ? 'is-dragging' : ''}`}
                draggable
                onDragStart={onDragStart('special', i)}
                onDragOver={onDragOver('special', i)}
                onDrop={onDrop('special', i)}
                onDragEnd={onDragEnd}
              >
                <label className="task-label">
                  <input
                    type="checkbox"
                    checked={t.status === "done"}
                    onChange={() => toggle("special", t.id)}
                  />
                  <span>{t.title}</span>
                </label>
                <div className="task-meta">
                  {t.tags?.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                  <Button size="xs" onClick={() => remove("special", t.id)}>削除</Button>
                </div>
                {t.detail && <p className="task-detail">{t.detail}</p>}
              </li>
            ))}
            {special.length === 0 && <li className="empty">まだありません</li>}
          </ul>
        </Card>
      </section>

      {/* 右：毎日のタスク */}
      <section className="pane">
        <div className="pane-header">
          <h2>毎日のタスク</h2>
          <Button size="sm" variant="primary" onClick={() => openForm("daily")}>＋ 作成</Button>
        </div>
        <Card>
          <ul className="task-list">
            {daily.map((t, i) => (
              <li
                key={t.id}
                className={`task-row ${t.status} ${dragInfo?.side==='daily' && dragInfo.index===i ? 'is-dragging' : ''}`}
                draggable
                onDragStart={onDragStart('daily', i)}
                onDragOver={onDragOver('daily', i)}
                onDrop={onDrop('daily', i)}
                onDragEnd={onDragEnd}
              >
                <label className="task-label">
                  <input
                    type="checkbox"
                    checked={t.status === "done"}
                    onChange={() => toggle("daily", t.id)}
                  />
                  <span>{t.title}</span>
                </label>
                <div className="task-meta">
                  {t.tags?.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                  <Button size="xs" onClick={() => remove("daily", t.id)}>削除</Button>
                </div>
                {t.detail && <p className="task-detail">{t.detail}</p>}
              </li>
            ))}
            {daily.length === 0 && <li className="empty">まだありません</li>}
          </ul>
        </Card>
      </section>

      {/* 画面中央ポップアップ */}
      {showForm && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowForm(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {formSide === "daily" ? "毎日タスクを作成" : "特殊タスクを作成"}
              </h3>
              <button
                className="modal__close"
                onClick={() => setShowForm(false)}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <div className="modal__body">
              <div className="grid gap-3">
                <div>
                  <label className="label">タイトル</label>
                  <Input
                    autoFocus
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="例：朝礼、周知連絡、日報チェック"
                  />
                </div>

                <div>
                  <label className="label">詳細</label>
                  <Textarea
                    rows={3}
                    value={form.detail}
                    onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
                    placeholder="補足事項や具体的な手順など"
                  />
                </div>

                {/* タグ（タグ管理から取得） */}
                <div>
                  <label className="label">タグ</label>
                  <div className="tag-multi">
                    {taskTags.length === 0 && (
                      <div className="text-sm text-gray-500">タグ管理でタグを追加すると選べます</div>
                    )}
                    {taskTags.map((t) => {
                      const checked = (form.tags || []).includes(t.name);
                      return (
                        <label
                          key={t.id || t.name}
                          className={`tag-multi__opt ${checked ? "is-checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={(e) => {
                              setForm((f) => {
                                const prev = Array.isArray(f.tags) ? f.tags : [];
                                return e.target.checked
                                  ? { ...f, tags: [...prev, t.name] }
                                  : { ...f, tags: prev.filter((x) => x !== t.name) };
                              });
                            }}
                          />
                          {typeof t.color !== "undefined" ? (
                            <TagBadge name={t.name} color={t.color} />
                          ) : (
                            <span className="tag-chip">{t.name}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <label className="inline flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.pinned}
                    onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                  />
                  ピン留め
                </label>
              </div>
            </div>

            <div className="modal__footer">
              <Button onClick={() => setShowForm(false)}>キャンセル</Button>
              <Button variant="primary" onClick={submit} disabled={!form.title?.trim()}>
                作成
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
