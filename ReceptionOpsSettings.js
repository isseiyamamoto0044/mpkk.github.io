import React, { useEffect, useState } from "react";
import "./ReceptionOpsSettings.css";
import Card from "../components/card";
import Button from "../components/Button";
import Input from "../components/Input";
import TagBadge from "../components/Tags";
import useLocalStorage from "../hooks/useLocalStorage";

export default function ReceptionOpsSettings({
  members,
  setMembers,
  DEFAULT_MEMBERS,
  updateMember,   // (id, field, value)
  togglePresence, // 使わず、presentはupdateMemberで更新します
  deleteMember,
  addMember,
}) {
  // ===== タグ管理 =====
  const [tags, setTags] = useLocalStorage("tags", [
    { id: "role1", name: "受付", color: "green", type: "member" },
    { id: "role2", name: "案内", color: "red", type: "member" },
    { id: "role3", name: "清掃", color: "blue", type: "member" },
    { id: "handover1", name: "重要", color: "red", type: "handover" },
    { id: "handover2", name: "午後", color: "purple", type: "handover" },
  ]);
  const COLOR_OPTIONS = ["red", "blue", "yellow", "green", "purple", "orange"];
  const sortedTags = [...tags].sort(
    (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, "ja")
  );

  // --- タグ：追加モーダル ---
  const [isTagModal, setIsTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("red");
  const [newTagType, setNewTagType] = useState("member");

  const openTagModal = () => setIsTagModal(true);
  const closeTagModal = () => {
    setIsTagModal(false);
    setNewTagName("");
    setNewTagColor("red");
    setNewTagType("member");
  };
  const addTag = () => {
    if (!newTagName.trim()) return;
    setTags((prev) => [
      ...prev,
      { id: String(Date.now()), name: newTagName.trim(), color: newTagColor, type: newTagType },
    ]);
    closeTagModal();
  };
  const editTagField = (id, field, value) => {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };
  const deleteTag = (id) => setTags((prev) => prev.filter((t) => t.id !== id));

  // Escでモーダルを閉じる
  useEffect(() => {
    if (!isTagModal) return;
    const onKey = (e) => e.key === "Escape" && closeTagModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isTagModal]);

  // ===== メンバー管理 =====

  // 追加モーダル
  const [isMemberAddModal, setIsMemberAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("");
  const [addPresent, setAddPresent] = useState(false);

  const openMemberAddModal = () => setIsMemberAddModal(true);
  const closeMemberAddModal = () => {
    setIsMemberAddModal(false);
    setAddName("");
    setAddRole("");
    setAddPresent(false);
  };
  const addNewMember = () => {
    if (!addName.trim()) return;
    setMembers((prev) => [
      ...prev,
      { id: String(Date.now()), name: addName.trim(), role: addRole, present: addPresent },
    ]);
    closeMemberAddModal();
  };

  // 編集モーダル
  const [isMemberEditModal, setIsMemberEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPresent, setEditPresent] = useState(false);

  const openMemberEditModal = (m) => {
    setEditingId(m.id);
    setEditName(m.name || "");
    setEditRole(m.role || "");
    setEditPresent(!!m.present);
    setIsMemberEditModal(true);
  };
  const closeMemberEditModal = () => {
    setIsMemberEditModal(false);
    setEditingId(null);
    setEditName("");
    setEditRole("");
    setEditPresent(false);
  };
  const saveMemberEdit = () => {
    if (!editingId) return;
    updateMember(editingId, "name", editName.trim());
    updateMember(editingId, "role", editRole);
    updateMember(editingId, "present", !!editPresent);
    closeMemberEditModal();
  };

  return (
    <div className="settings-two-col">
      {/* ===== 左：タグ管理 ===== */}
      <div>
        <Card title="タグ管理" right={<Button className="bg-blue-600 text-white" onClick={openTagModal}>追加</Button>}>
          <div className="tag-table no-header">
            {sortedTags.map((t) => (
              <div key={t.id} className="tag-table-row">
                {/* タグ名（色付きバッジ） */}
                <div className="tag-col">
                  <TagBadge name={t.name} color={t.color} />
                </div>
                {/* カテゴリ */}
                <div className="tag-col tag-type">{t.type}</div>
                {/* 操作 */}
                <div className="tag-actions">
                  <Button
                    onClick={() => {
                      const newName = window.prompt("新しいタグ名", t.name);
                      if (newName?.trim()) editTagField(t.id, "name", newName.trim());
                      const newType = window.prompt('カテゴリ（"member" か "handover"）', t.type);
                      if (newType && (newType === "member" || newType === "handover")) editTagField(t.id, "type", newType);
                      const newColor = window.prompt(`色 (${COLOR_OPTIONS.join(", ")})`, t.color);
                      if (newColor && COLOR_OPTIONS.includes(newColor)) editTagField(t.id, "color", newColor);
                    }}
                  >
                    編集
                  </Button>
                  <Button className="bg-red-600 text-white" onClick={() => deleteTag(t.id)}>
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ===== 右：メンバー管理 ===== */}
      <div>
        <Card
          title="メンバー管理"
          right={
            <div className="flex items-center gap-2">
              <Button className="bg-blue-600 text-white" onClick={openMemberAddModal}>
                追加
              </Button>
            </div>
          }
        >
          {/* テーブル形式：名前 / 役職 / 最終出勤日 / 操作 */}
          <div className="tag-table no-header">
            {members.map((m) => {
              const roleColor =
                sortedTags.find((t) => t.type === "member" && t.name === m.role)
                  ?.color || "gray";
              return (
                <div key={m.id} className="tag-table-row">
                  {/* 名前 */}
                  <div className="tag-col">{m.name}</div>

                  {/* 役職（タグバッジ表示） */}
                  <div className="tag-col">
                    {m.role ? (
                      <TagBadge name={m.role} color={roleColor} />
                    ) : (
                      <span className="text-xs text-gray-400">未設定</span>
                    )}
                  </div>

                  {/* 最終出勤日 */}
                  <div className="tag-col">
                    {m.lastPresent ? (
                      <span>{m.lastPresent}</span>
                    ) : (
                      <span className="text-xs text-gray-400">未記録</span>
                    )}
                  </div>

                  {/* 操作（右端に編集・削除を横並びで） */}
                  <div className="tag-col tag-actions">
                    <Button onClick={() => openMemberEditModal(m)}>編集</Button>
                    <Button
                      className="bg-red-600 text-white"
                      onClick={() => deleteMember(m.id)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-gray-500 mt-2">
            ※ 役職は左の「タグ管理」で追加・編集した <b>member</b> タグから選べます。
          </div>
        </Card>

      </div>

      {/* ===== タグ追加モーダル ===== */}
      {isTagModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeTagModal()}>
          <div className="modal" role="dialog" aria-modal="true">
            <h3 className="modal-title">新しいタグを追加</h3>
            <div className="modal-body space-y-3">
              <div>
                <label className="block text-sm mb-1">カテゴリ</label>
                <select value={newTagType} onChange={(e) => setNewTagType(e.target.value)} className="border rounded px-2 py-1 w-full">
                  <option value="member">メンバー</option>
                  <option value="handover">引き継ぎ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">タグ名</label>
                <Input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="タグ名（例：受付）" />
              </div>
              <div>
                <label className="block text-sm mb-1">カラー</label>
                <select value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} className="border rounded px-2 py-1 w-full">
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="mt-2"><TagBadge name={newTagName || "プレビュー"} color={newTagColor} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="bg-blue-600 text-white" onClick={addTag}>決定</Button>
              <Button onClick={closeTagModal}>キャンセル</Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== メンバー追加モーダル ===== */}
      {isMemberAddModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeMemberAddModal()}>
          <div className="modal" role="dialog" aria-modal="true">
            <h3 className="modal-title">メンバーを追加</h3>
            <div className="modal-body space-y-3">
              <div>
                <label className="block text-sm mb-1">氏名</label>
                <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="氏名" />
              </div>
              <div>
                <label className="block text-sm mb-1">役職</label>
                <select value={addRole} onChange={(e) => setAddRole(e.target.value)} className="border rounded px-2 py-1 w-full">
                  <option value="">選択</option>
                  {sortedTags.filter((t) => t.type === "member").map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">出勤状況</label>
                <select value={addPresent ? "1" : "0"} onChange={(e) => setAddPresent(e.target.value === "1")} className="border rounded px-2 py-1 w-full">
                  <option value="1">出勤</option>
                  <option value="0">不在</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="bg-blue-600 text-white" onClick={addNewMember}>決定</Button>
              <Button onClick={closeMemberAddModal}>キャンセル</Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== メンバー編集モーダル ===== */}
      {isMemberEditModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeMemberEditModal()}>
          <div className="modal" role="dialog" aria-modal="true">
            <h3 className="modal-title">メンバーを編集</h3>
            <div className="modal-body space-y-3">
              <div>
                <label className="block text-sm mb-1">氏名</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">役職</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="border rounded px-2 py-1 w-full">
                  <option value="">選択</option>
                  {sortedTags.filter((t) => t.type === "member").map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">出勤状況</label>
                <select value={editPresent ? "1" : "0"} onChange={(e) => setEditPresent(e.target.value === "1")} className="border rounded px-2 py-1 w-full">
                  <option value="1">出勤</option>
                  <option value="0">不在</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="bg-blue-600 text-white" onClick={saveMemberEdit}>保存</Button>
              <Button onClick={closeMemberEditModal}>キャンセル</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
