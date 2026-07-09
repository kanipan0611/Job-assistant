import React, { useState } from "react";
import { C, btnStyle, inputStyle, sectionLabel, cardStyle, linkBtn, MONO } from "../theme.js";
import { uid, todayStr } from "../storage.js";

const kindBadge = (kind) => ({
  fontSize: 10,
  fontWeight: 700,
  color: "#fff",
  background: kind === "person" ? "#E8801A" : "#0FA3A3",
  borderRadius: 6,
  padding: "2px 6px",
  marginRight: 8,
  flexShrink: 0,
});

export default function Notes({ data, setData }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("term");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const addNote = (note) => {
    setData({
      ...data,
      notes: [...data.notes, { ...note, id: uid(), createdAt: todayStr() }],
      noteSuggestions: data.noteSuggestions.filter((s) => s.id !== note.suggestionId),
    });
  };

  const dismissSuggestion = (id) => {
    setData({ ...data, noteSuggestions: data.noteSuggestions.filter((s) => s.id !== id) });
  };

  const removeNote = (id) => {
    setData({ ...data, notes: data.notes.filter((n) => n.id !== id) });
  };

  const addManual = () => {
    if (!name.trim()) return;
    addNote({ kind, name: name.trim(), desc: desc.trim() });
    setName("");
    setDesc("");
  };

  const list = [...data.notes]
    .reverse()
    .filter((n) => !q.trim() || [n.name, n.desc].join(" ").toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      {data.noteSuggestions.length > 0 && (
        <div style={{ ...cardStyle, borderLeft: `4px solid #0FA3A3`, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0FA3A3", letterSpacing: 1, marginBottom: 8 }}>
            取込メモから見つかった候補
          </div>
          {data.noteSuggestions.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "5px 0" }}>
              <span style={kindBadge(s.kind)}>{s.kind === "person" ? "人物" : "用語"}</span>
              <span style={{ fontSize: 13, color: C.ink, flex: 1 }}>
                <b>{s.name}</b>
                {s.desc ? <span style={{ color: C.sub }}> — {s.desc}</span> : null}
              </span>
              <button onClick={() => addNote({ kind: s.kind, name: s.name, desc: s.desc, suggestionId: s.id })} style={linkBtn}>登録</button>
              <button onClick={() => dismissSuggestion(s.id)} style={{ ...linkBtn, color: C.sub }}>破棄</button>
            </div>
          ))}
        </div>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="用語・人物を検索"
        style={{ ...inputStyle, width: "100%" }}
      />

      <div style={sectionLabel}>手動で追加</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ ...inputStyle, fontSize: 13 }}>
          <option value="term">用語</option>
          <option value="person">人物</option>
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "person" ? "名前（例：田中課長）" : "用語（例：MQL）"} style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={kind === "person" ? "メモ（例：販促の決裁者）" : "意味・メモ"} style={{ ...inputStyle, flex: 2, minWidth: 160 }} />
        <button onClick={addManual} style={btnStyle}>追加</button>
      </div>

      {list.length === 0 ? (
        <div style={{ color: C.sub, fontSize: 13, marginTop: 24, textAlign: "center" }}>
          {data.notes.length === 0
            ? "社内用語や「この件は誰に聞く」をここに貯めていきましょう。会議メモの取込時にも候補が自動で出ます。"
            : "該当するノートが見つかりません。"}
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          {list.map((n) => (
            <div key={n.id} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "8px 2px", borderBottom: `1px solid ${C.line}` }}>
              <span style={kindBadge(n.kind)}>{n.kind === "person" ? "人物" : "用語"}</span>
              <span style={{ fontSize: 14, color: C.ink, fontWeight: 700, flexShrink: 0 }}>{n.name}</span>
              <span style={{ fontSize: 13, color: C.sub, flex: 1 }}>{n.desc}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.sub }}>{n.createdAt}</span>
              <button onClick={() => removeNote(n.id)} style={{ ...linkBtn, color: C.sub }}>削除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
