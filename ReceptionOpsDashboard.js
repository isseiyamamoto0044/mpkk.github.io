// src/pages/ReceptionOpsDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import "./ReceptionOpsDashboard.css";

import Card from "../components/card";
import Button from "../components/Button";
import Chip from "../components/Chip";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import MonthCalendar from "../components/Calendar";
import TagBadge from "../components/Tags";
import TimelinePanel from '../components/TimelinePanel';
import ChecklistPanel from '../components/ChecklistPanel';
import ChecklistCard from "../components/ChecklistCard";

import useLocalStorage from "../hooks/useLocalStorage";
import Header from "../components/Header";

import ReceptionOpsTasks from "./ReceptionOpsTasks";
import ReceptionOpsHandovers from "./ReceptionOpsHandovers";
import ReceptionOpsSettings from "./ReceptionOpsSettings";
import ReceptionOpsAccount from "./ReceptionOpsAccount";


// ---- helpers ----
const pad = (n) => String(n).padStart(2, "0");
const formatDateKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const uuid = () =>
  (crypto && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

// ★ 追記：ピンのアイコン（左に表示）
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

// 共有事項：簡易編集（プロンプト）
function useHandoverQuickEdit(handovers, setHandovers, colorOptions = []) {
  return (item) => {
    const newTitle = window.prompt("共有事項のタイトルを編集", item.text ?? "");
    if (newTitle === null) return; // キャンセル
    const newTag = window.prompt("タグ名（空でも可）", Array.isArray(item.tags) ? item.tags[0] ?? "" : (item.tag ?? ""));
    const newStart = window.prompt("開始日 (YYYY-MM-DD)", item.start);
    const newEnd   = window.prompt("終了日 (YYYY-MM-DD)", item.end);
    const newNote  = window.prompt("補足（空でも可）", item.note ?? "");

    const next = handovers.map(h => h.id === item.id ? {
      ...h,
      text: newTitle.trim(),
      // 単一タグとして保存（既存データとの互換）
      tag: (newTag ?? "").trim() || undefined,
      tags: (newTag ?? "").trim() ? [(newTag ?? "").trim()] : undefined,
      start: newStart || item.start,
      end: newEnd || item.end,
      note: (newNote ?? "").trim() || undefined,
    } : h);
    setHandovers(next);
  };
}

// ReceptionOpsDashboard.js 内のどこか（コンポーネント定義の上部など）に追加
function ImeSafeTextarea({ value, onChange, className = "", ...props }) {
  const [inner, setInner] = React.useState(value ?? "");
  const [isComposing, setIsComposing] = React.useState(false);

  // 親の value 変更を反映（外部更新にも追従）
  React.useEffect(() => {
    setInner(value ?? "");
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setInner(v);              // 入力中の見た目はローカルで更新
    if (!isComposing) {
      onChange?.(v);          // IMEしてなければ即座に親へ
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = (e) => {
    const v = e.target.value;
    setIsComposing(false);
    setInner(v);
    onChange?.(v);            // 確定時に最終値を親へ
  };

  return (
    <textarea
      {...props}
      value={inner}  // ← ローカルを表示側のソースに
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className={`border border-gray-300 rounded-lg px-3 py-2 text-sm w-full ${className}`}
    />
  );
}



const DEFAULT_MEMBERS = [
  { id: "m1", name: "山下", role: "受付", present: true },
  { id: "m2", name: "佐藤", role: "案内", present: true },
  { id: "m3", name: "鈴木", role: "清掃", present: false },
];

const DEFAULT_TEMPLATES_FALLBACK = [
  { id: "t1", title: "朝礼" },
  { id: "t2", title: "フロア巡回" },
  { id: "t3", title: "受付対応準備" },
];

export default function ReceptionOpsDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);

  // --- localStorage データ ---
  const [handovers, setHandovers] = useLocalStorage("handovers", []);
  const [perDayTasks, setPerDayTasks] = useLocalStorage("tasksByDate", {});
  const [perDaySchedule, setPerDaySchedule] = useLocalStorage("scheduleByDate", {});
  const [members, setMembers] = useLocalStorage("members", DEFAULT_MEMBERS);
  const [taskTemplates, setTaskTemplates] = useLocalStorage("taskTemplates", [
    { id: "t1", title: "朝礼" },
    { id: "t2", title: "フロア巡回" },
    { id: "t3", title: "備品補充" },
  ]);

  // 出退勤ログ
  const [shiftsByDate, setShiftsByDate] = useLocalStorage("shiftsByDate", {});
  // タグ（役職/共有事項）
  const [tags] = useLocalStorage("tags", []);

  // --- 入力状態 ---
  const [newHandoverNotes, setNewHandoverNotes] = useState("");
  const [newHandoverTag, setNewHandoverTag] = useState(""); 
  const [newHandoverText, setNewHandoverText] = useState("");
  const [newHandoverStart, setNewHandoverStart] = useState(() => dateKey);
  const [newHandoverEnd, setNewHandoverEnd] = useState(() => dateKey);
  const [newHandoverTags, setNewHandoverTags] = useState([]);

  const [newTask, setNewTask] = useState("");
  const [newTemplate, setNewTemplate] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("10:00");

  // --- 選択日のデータ ---
  const tasks = perDayTasks[dateKey] || [];
  const schedule = perDaySchedule[dateKey] || [];
  const todaysShifts = useMemo(() => shiftsByDate[dateKey] || [], [shiftsByDate, dateKey]);
  const onDuty = useMemo(() => todaysShifts.filter((s) => !s.end), [todaysShifts]);

  const visibleHandovers = handovers
    .filter((h) => (h.start || dateKey) <= dateKey && dateKey <= (h.end || dateKey))
    .slice()
    .sort((a, b) => Number(b.pin) - Number(a.pin) || b.ts - a.ts);

  // --- 初回/日付切替でテンプレを適用 ---
  useEffect(() => {
    const current = perDayTasks[dateKey];
    if (!current || current.length === 0) {
      // ① Tasksボードの“毎日タスク”から優先投入（存在すれば）
      const daily = JSON.parse(localStorage.getItem("tasks.daily") || "[]");
      let baseItems = [];

      if (Array.isArray(daily) && daily.length > 0) {
        baseItems = daily.map((d) => ({
          id: uuid(),
          title: d.title,
          done: false,
          doneBy: null,
          ts: Date.now(),
          tags: d.tags || [],
        }));
      } else {
        // ② fallback：ダッシュボード内のテンプレ（なければ DEFAULT_TEMPLATES_FALLBACK）
        const baseTemplates = (taskTemplates?.length ? taskTemplates : DEFAULT_TEMPLATES_FALLBACK);
        baseItems = baseTemplates.map((tpl) => ({
          id: uuid(),
          title: tpl.title,
          done: false,
          doneBy: null,
          ts: Date.now(),
        }));
      }

      setPerDayTasks((prev) => ({ ...prev, [dateKey]: baseItems }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, taskTemplates]);

  // === 出勤モーダル ===
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [newShiftMemberId, setNewShiftMemberId] = useState("");

  const roleColorOf = (roleName) =>
    tags.find((t) => t.type === "member" && t.name === roleName)?.color || "gray";

  const clockIn = (memberId) => {
    if (!memberId) return;
    if (onDuty.some((s) => s.memberId === memberId)) return;

    const startIso = new Date().toISOString();
    const next = [...todaysShifts, { id: uuid(), memberId, start: startIso, end: null }];
    setShiftsByDate({ ...shiftsByDate, [dateKey]: next });

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, present: true, lastPresent: dateKey } : m))
    );

    setNewShiftMemberId("");
    setShowShiftModal(false);
  };

  const clockOut = (shiftId) => {
    const endIso = new Date().toISOString();
    const next = todaysShifts.map((s) => (s.id === shiftId ? { ...s, end: endIso } : s));
    setShiftsByDate({ ...shiftsByDate, [dateKey]: next });

    const target = todaysShifts.find((s) => s.id === shiftId);
    if (target) {
      const stillOnDuty = next.some((s) => s.memberId === target.memberId && !s.end);
      if (!stillOnDuty) {
        setMembers((prev) =>
          prev.map((m) => (m.id === target.memberId ? { ...m, present: false } : m))
        );
      }
    }
  };

  const formatHm = (iso) => {
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "-";
    }
  };

  // --- 予定操作 ---
    const addEvent = () => {
    if (!newEventTitle.trim()) return;
    const base = perDaySchedule[dateKey] || [];
    const next = [
        { id: uuid(), time: newEventTime || "", title: newEventTitle.trim() },
        ...base,
    ].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    setPerDaySchedule({ ...perDaySchedule, [dateKey]: next });
    setNewEventTitle("");
    };

    const deleteEvent = (id) => {
    const base = perDaySchedule[dateKey] || [];
    const next = base.filter((e) => e.id !== id);
    setPerDaySchedule({ ...perDaySchedule, [dateKey]: next });
    };


  // === 共有事項 追加/操作 ===
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  // 期間表示（Dashboard 用：終了日だけ）
    const formatPeriodEndOnly = (start, end, fallbackDate) => {
    const e = end || start || fallbackDate;
    return `〜 ${e}`;
    };

  const addHandover = () => {
    if (!newHandoverText.trim()) return;
    const item = {
      id: uuid(),
      text: newHandoverText.trim(),
      pin: false,
      start: newHandoverStart || dateKey,
      end: newHandoverEnd || newHandoverStart || dateKey,
      ts: Date.now(),
      tags: Array.isArray(newHandoverTags) ? newHandoverTags : [],
    };
    setHandovers([item, ...handovers]);
    // リセット
    setNewHandoverText("");
    setNewHandoverStart(dateKey);
    setNewHandoverEnd(dateKey);
    setNewHandoverTags([]);
    setShowHandoverModal(false);
  };

  const quickEditHandover = useHandoverQuickEdit(handovers, setHandovers);
  
  const tagColorOfHandover = (name) =>
    (tags || []).find((t) => t.type === "handover" && t.name === name)?.color || "gray";


  const toggleHandoverPin = (id) =>
    setHandovers((list) => list.map((h) => (h.id === id ? { ...h, pin: !h.pin } : h)));
  const deleteHandover = (id) => setHandovers((list) => list.filter((h) => h.id !== id));

  // --- タスク・テンプレ ---
  const addTask = () => {
    if (!newTask.trim()) return;
    const next = [{ id: uuid(), title: newTask.trim(), done: false, doneBy: null, ts: Date.now() }, ...tasks];
    setPerDayTasks({ ...perDayTasks, [dateKey]: next });
    setNewTask("");
  };
  const toggleTask = (id) => {
    const next = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setPerDayTasks({ ...perDayTasks, [dateKey]: next });
  };
  const assignTask = (id, memberId) => {
    const next = tasks.map((t) => (t.id === id ? { ...t, doneBy: memberId || null } : t));
    setPerDayTasks({ ...perDayTasks, [dateKey]: next });
  };
  const deleteTask = (id) => {
    const next = tasks.filter((t) => t.id !== id);
    setPerDayTasks({ ...perDayTasks, [dateKey]: next });
  };
  const addTemplate = () => {
    setTaskTemplates((prev) =>
      newTemplate.trim() ? [{ id: uuid(), title: newTemplate.trim() }, ...prev] : prev
    );
    setNewTemplate("");
  };
  const deleteTemplate = (id) => setTaskTemplates((list) => list.filter((t) => t.id !== id));
  const applyTemplatesToDate = () => {
    const base = perDayTasks[dateKey] || [];

    // 1) まず“毎日タスク（tasks.daily）”を優先的に同期（重複しないようタイトルで判断）
    const daily = JSON.parse(localStorage.getItem("tasks.daily") || "[]");
    let next = base.slice();
    const have = new Set(next.map((t) => t.title));

    if (Array.isArray(daily) && daily.length > 0) {
      const toAddFromDaily = daily
        .filter((d) => d && d.title && !have.has(d.title))
        .map((d) => ({
          id: uuid(),
          title: d.title,
          done: false,
          doneBy: null,
          ts: Date.now(),
          tags: d.tags || [],
        }));
      next = [...toAddFromDaily, ...next];
      toAddFromDaily.forEach((x) => have.add(x.title));
    }

    // 2) さらに“ダッシュボード側テンプレ”も不足分だけ投入
    const templates = (taskTemplates?.length ? taskTemplates : DEFAULT_TEMPLATES_FALLBACK);
    const toAddFromTpl = templates
      .filter((tpl) => tpl && tpl.title && !have.has(tpl.title))
      .map((tpl) => ({
        id: uuid(),
        title: tpl.title,
        done: false,
        doneBy: null,
        ts: Date.now(),
      }));

    next = [...toAddFromTpl, ...next];

    setPerDayTasks({ ...perDayTasks, [dateKey]: next });
  };

  // ---- レイアウトヘルパ ----
  const TwoColumn = ({ left, right }) => (
    <div className="ops-two-col max-w-7xl mx-auto px-4 py-6">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
  
  const handoverTagColorOf = (tagName) =>
    tags.find((t) => t.type === "handover" && t.name === tagName)?.color || "gray";


  // ---- 左カラム ----
  const LeftColumn = (
    <div className="grid grid-rows-[auto,1fr] gap-6">
      <Card title="Calendar">
        <div className="mt-3 text-xs text-gray-600">
          選択日: <b>{dateKey}</b>
        </div>
        <MonthCalendar value={selectedDate} onChange={setSelectedDate} />
      </Card>

      <div className="ops-left-bottom">
        <Card
          title="Member"
          right={
            <Button className="bg-blue-600 text-white" onClick={() => setShowShiftModal(true)}>
              出勤を追加
            </Button>
          }
        >
          <div className="space-y-2">
            {onDuty.length === 0 && (
              <div className="text-sm text-gray-500">現在、出勤中のメンバーはいません</div>
            )}
            {onDuty.map((s) => {
              const m = members.find((mm) => mm.id === s.memberId);
              if (!m) return null;
              const roleColor = roleColorOf(m.role);
              return (
                <div key={s.id} className="member-row">
                  <div className="member-row__left">
                    <span className="member-name">{m.name}</span>
                    {m.role ? (
                      <TagBadge name={m.role} color={roleColor} />
                    ) : (
                      <span className="text-xs text-gray-400">役職未設定</span>
                    )}
                    <span className="member-time">出勤 {formatHm(s.start)}〜</span>
                  </div>
                  <div className="member-row__right">
                    <Button onClick={() => clockOut(s.id)}>退勤</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Timeline" right={<Chip>{schedule.length} 件</Chip>}>
          <div className="flex items-center gap-2 mb-3">
            <Input value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} placeholder="時刻 (HH:MM)" style={{ maxWidth: 110 }} />
            <Input value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="予定名を入力" />
            <Button onClick={addEvent}>追加</Button>
          </div>
          <ul className="space-y-2">
            {schedule.length === 0 && <div className="text-sm text-gray-500">予定はありません</div>}
            {schedule.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {ev.time} — {ev.title}
                </div>
                <Button onClick={() => deleteEvent(ev.id)}>削除</Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* 出勤モーダル */}
      {showShiftModal && (
        <div className="modal-backdrop" onClick={() => setShowShiftModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>出勤を追加</h2>
            </div>
            <div className="modal__body">
              <div className="flex flex-col gap-4">
                <label className="text-sm text-gray-600">選択</label>
                <select
                  value={newShiftMemberId}
                  onChange={(e) => setNewShiftMemberId(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  <option value="">NAME</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}（{m.role || "役職なし"}）
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <Button onClick={() => setShowShiftModal(false)}>キャンセル</Button>
              <Button className="bg-blue-600 text-white" onClick={() => clockIn(newShiftMemberId)}>
                出勤
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ---- 右カラム（共有事項 / チェックリスト） ----
  const RightColumn = (
    <div className="ops-right-split">
      <Card
        title="引き継ぎ・共有事項"
        right={
            <Button onClick={() => setShowHandoverModal(true)} className="bg-blue-600 text-white">
            追加
            </Button>
        }
        >
            <div className="space-y-3 max-h-64 overflow-auto pr-1">
            {visibleHandovers.length === 0 && (
                <div className="text-sm text-gray-500">
                （この日に表示される引き継ぎはありません）
                </div>
            )}

            {visibleHandovers.map((n) => (
                <div key={n.id} className="ops-handover-item">
                {/* 1行目（PIN / タイトル / タグ / 期間 … 右端に操作） */}
                    <div className="handover-row">
                        <div className="handover-left">
                        <span className="handover-pin"><PinIcon pinned={!!n.pin} /></span>
                        <div className="handover-title">{n.text}</div>

                        <div className="handover-meta">
                            {n.tag && (
                            <TagBadge
                                name={n.tag}
                                color={
                                (tags.find((t) => t.type === "handover" && t.name === n.tag)?.color) ||
                                "gray"
                                }
                            />
                            )}
                            <span className="handover-period text-xs text-gray-500">
                            {formatPeriodEndOnly(n.start, n.end, dateKey)}
                            </span>
                        </div>
                        </div>

                        <div className="handover-actions">
                        {/* ここはお好みで：ダッシュボードでも編集/削除を出したい場合 */}
                        <Button onClick={() => {
                            // 簡易編集：Handovers タブで編集したい場合はタブ切替でもOK
                            setActiveTab("handovers");
                            // もし「Handovers 側で編集対象を開く」連携をしたい場合は
                            // localStorage に id を置くなどで対応可能（必要時お知らせください）
                        }}>
                            編集
                        </Button>
                        <Button onClick={() =>
                            setHandovers((list) => list.filter((h) => h.id !== n.id))
                        }>
                            削除
                        </Button>
                        </div>
                    </div>
                    {/* 2行目：補足（カード“内”に出す） */}
                    {n.note && <div className="handover-note">補足事項：{n.note}</div>}
                </div>
            ))}
            </div>

        </Card>

      <ChecklistCard
        dateLabel={dateKey}
        items={tasks}                       // ← 既存の tasks state をそのまま渡す
        onToggle={toggleTask}               // ← チェックボックス切り替え関数
        onAdd={addTask}                     // ← 新タスク追加関数
        onRemove={deleteTask}               // ← 削除関数
        onTemplateApply={applyTemplatesToDate} // ← テンプレート反映関数
      />


      {/* 共有事項 追加モーダル */}
      {showHandoverModal && (
        <div className="modal-backdrop" onClick={() => setShowHandoverModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>共有事項を追加</h2>
            </div>
            <div className="modal__body">
              <div className="flex flex-col gap-3">
                <ImeSafeTextarea
                  rows={4}
                  placeholder="共有事項の本文を入力"
                  value={newHandoverText}
                  onChange={(v) => setNewHandoverText(v)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">開始日</label>
                    <Input type="date" value={newHandoverStart} onChange={(e) => setNewHandoverStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">終了日</label>
                    <Input type="date" value={newHandoverEnd} onChange={(e) => setNewHandoverEnd(e.target.value)} />
                  </div>
                </div>

                {/* タグ（handoverタイプのみ複数選択） */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">タグ</label>
                  <div className="tag-multi">
                    {(tags || [])
                      .filter((t) => t.type === "handover")
                      .map((t) => {
                        const checked = newHandoverTags.includes(t.name);
                        return (
                          <label key={t.id} className={`tag-multi__opt ${checked ? "is-checked" : ""}`}>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={checked}
                              onChange={(e) => {
                                setNewHandoverTags((prev) =>
                                  e.target.checked ? [...prev, t.name] : prev.filter((x) => x !== t.name)
                                );
                              }}
                            />
                            <TagBadge name={t.name} color={t.color} />
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <Button onClick={() => setShowHandoverModal(false)}>キャンセル</Button>
              <Button className="bg-blue-600 text-white" onClick={addHandover}>
                追加
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ---- render ----
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "dashboard" && <TwoColumn left={LeftColumn} right={RightColumn} />}

      {activeTab === "tasks" && (
        <ReceptionOpsTasks
          dateKey={dateKey}
          tasks={tasks}
          members={members}
          newTask={newTask}
          setNewTask={setNewTask}
          addTask={addTask}
          toggleTask={toggleTask}
          assignTask={assignTask}
          deleteTask={deleteTask}
          taskTemplates={taskTemplates}
          newTemplate={newTemplate}
          setNewTemplate={setNewTemplate}
          addTemplate={addTemplate}
          deleteTemplate={deleteTemplate}
          applyTemplatesToDate={applyTemplatesToDate}
        />
      )}

      {activeTab === "handovers" && (
        <ReceptionOpsHandovers
          dateKey={dateKey}
          handovers={handovers}
          addHandover={addHandover}
          toggleHandoverPin={toggleHandoverPin}
          deleteHandover={deleteHandover}
          newHandoverText={newHandoverText}
          setNewHandoverText={setNewHandoverText}
          newHandoverStart={newHandoverStart}
          setNewHandoverStart={setNewHandoverStart}
          newHandoverEnd={newHandoverEnd}
          setNewHandoverEnd={setNewHandoverEnd}
          newHandoverTags={newHandoverTags}
          setNewHandoverTags={setNewHandoverTags}
          allTags={tags}
        />
      )}

      {activeTab === "settings" && (
        <ReceptionOpsSettings
          members={members}
          addMember={() =>
            setMembers((prev) => [...prev, { id: uuid(), name: "新規メンバー", role: "", present: false }])
          }
          setMembers={setMembers}
          DEFAULT_MEMBERS={[]}
          updateMember={(id, field, value) =>
            setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
          }
          togglePresence={(id) =>
            setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, present: !m.present } : m)))
          }
          deleteMember={(id) => setMembers((prev) => prev.filter((m) => m.id !== id))}
        />
      )}

      {activeTab === "account" && <ReceptionOpsAccount />}
    </div>
  );
}
