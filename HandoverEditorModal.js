import React, { useState, useEffect } from "react";
import Button from "./Button";
import Input from "./Input";
import Textarea from "./Textarea";
import "./handover-shared.css";

export default function HandoverEditorModal({
  open,
  initial,          // 既存 {text,tag,note,pin,start,end} or null（新規）
  handoverTags,     // [{id,name,color,type:'handover'}, ...]
  onClose,
  onSave,           // (payload) => void
  dateKey,          // 既定日付
}) {
  const [form, setForm] = useState({
    text: "",
    tag: "",
    note: "",
    pin: false,
    start: dateKey,
    end: dateKey,
  });

  useEffect(() => {
    if (open) {
      setForm({
        text: initial?.text ?? "",
        tag: initial?.tag ?? "",
        note: initial?.note ?? "",
        pin: initial?.pin ?? false,
        start: initial?.start ?? dateKey,
        end: initial?.end ?? dateKey,
      });
    }
  }, [open, initial, dateKey]);

  const save = () => {
    if (!form.text.trim()) return;
    onSave({
      text: form.text.trim(),
      tag: form.tag || "",
      note: form.note?.trim() || "",
      pin: !!form.pin,
      start: form.start || dateKey,
      end: form.end || form.start || dateKey,
    });
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-body">
        <h3 className="modal-title">{initial ? "共有事項を編集" : "共有事項を追加"}</h3>

        <div className="modal-form">
          <label className="frow">
            <span className="flabel">内容</span>
            <Input value={form.text} onChange={(e)=>setForm({...form,text:e.target.value})} placeholder="共有事項の件名" />
          </label>

          <label className="frow">
            <span className="flabel">タグ</span>
            <select
              className="iselect"
              value={form.tag}
              onChange={(e)=>setForm({...form, tag: e.target.value})}
            >
              <option value="">（なし）</option>
              {handoverTags.map(t=>(
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </label>

          <div className="frow">
            <span className="flabel">期間</span>
            <div className="fgroup">
              <Input type="date" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/>
              <span>〜</span>
              <Input type="date" value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/>
            </div>
          </div>

          <label className="frow">
            <span className="flabel">補足事項</span>
            <Textarea rows={3} value={form.note} onChange={(e)=>setForm({...form,note:e.target.value})} placeholder="詳細や注意点など" />
          </label>

          <label className="frow fcheck">
            <input type="checkbox" checked={form.pin} onChange={(e)=>setForm({...form,pin:e.target.checked})}/>
            <span>ピン留めする</span>
          </label>
        </div>

        <div className="modal-actions">
          <Button onClick={onClose}>キャンセル</Button>
          <Button className="bg-blue-600 text-white" onClick={save}>
            {initial ? "更新" : "追加"}
          </Button>
        </div>
      </div>
    </div>
  );
}
