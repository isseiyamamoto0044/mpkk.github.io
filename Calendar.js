// src/components/Calendar.js
import React, { useEffect, useMemo, useState } from "react";
import Button from "./Button";

export default function MonthCalendar({ value, onChange }) {
  const [cursor, setCursor] = useState(() => new Date(value || new Date()));

  useEffect(() => {
    if (value) setCursor(new Date(value));
  }, [value]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth(); // 0-11

  const firstDay = useMemo(() => new Date(year, month, 1), [year, month]);
  const startWeekday = firstDay.getDay(); // 0:Sun
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  // 表（7列×最大6行）を作る
  const weeks = useMemo(() => {
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null); // 前パディング
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    // 7個ごとに分割（最大6週）
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    // 末尾の行を7列にパディング
    if (rows.length && rows[rows.length - 1].length < 7) {
      const last = rows[rows.length - 1];
      while (last.length < 7) last.push(null);
    }
    // 表示を6行に揃えたいならここでパディング行を追加してもOK
    return rows;
  }, [startWeekday, daysInMonth, year, month]);

  const isSameDay = (a, b) =>
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const today = new Date();

  return (
    <div className="calendar">
      {/* ヘッダー */}
      <div className="calendar-header">
        <Button onClick={() => setCursor(new Date(year, month - 1, 1))}>←</Button>
        <div className="calendar-title">
          {year}年 {month + 1}月
        </div>
        <Button onClick={() => setCursor(new Date(year, month + 1, 1))}>→</Button>
      </div>

      {/* 週見出し */}
      <table className="calendar-table">
        <thead>
          <tr>
            {["日","月","火","水","木","金","土"].map((w, i) => (
              <th key={w} className={`dow-${i}`}>{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((d, cIdx) => {
                const selected = d && value && isSameDay(d, value);
                const isToday = d && isSameDay(d, today);
                return (
                  <td
                    key={cIdx}
                    className={[
                      d ? "is-date" : "is-empty",
                      selected ? "is-selected" : "",
                      isToday ? "is-today" : "",
                      `dow-${cIdx}`,
                    ].join(" ").trim()}
                  >
                    {d ? (
                      <button
                        type="button"
                        onClick={() => onChange && onChange(d)}
                        className="calendar-cell"
                        aria-label={`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
                      >
                        {d.getDate()}
                      </button>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
