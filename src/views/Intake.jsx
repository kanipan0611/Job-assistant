import React, { useState } from "react";
import { C, btnStyle, inputStyle, sectionLabel, miniLabel, itemLine, cardStyle, MONO } from "../theme.js";
import { uid, todayStr, fmtDue } from "../storage.js";
import { structureMemo, summarizeDoc } from "../api.js";

const modeBtn = (active, color) => ({
  flex: 1,
  padding: "9px 0",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  background: active ? color : C.card,
  color: active ? "#fff" : C.sub,
  boxShadow: active ? "none" : `inset 0 0 0 1px ${C.line}`,
});

export default function Intake({ data, setData, onDone }) {
  const [mode, setMode] = useState("meeting"); // meeting | doc
  const [text, setText] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [docPreview, setDocPreview] = useState(null);

  const run = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    setPreview(null);
    setDocPreview(null);
    try {
      if (mode === "meeting") {
        setPreview(await structureMemo(text));
      } else {
        setDocPreview(await summarizeDoc(text, docTitle));
      }
    } catch (e) {
      setError(e.message || "解析に失敗しました。もう一度お試しください。");
    }
    setBusy(false);
  };

  const commitMeeting = () => {
    if (!preview) return;
    const recordId = uid();
    const record = {
      id: recordId,
      kind: "meeting",
      title: preview.title || "打ち合わせ",
      date: preview.date || todayStr(),
      topics: preview.topics || [],
      decisions: preview.decisions || [],
      summary: "",
      keywords: [],
      sourceText: text,
      createdAt: todayStr(),
    };
    const newTodos = (preview.todos || []).map((t) => ({
      id: uid(), task: t.task, due: t.due, assignee: t.assignee, done: false, doneAt: null, recordId,
    }));
    const newRequests = (preview.requests || []).map((r) => ({
      id: uid(), task: r.task, who: r.who, due: r.due, done: false, doneAt: null, recordId,
    }));
    const known = new Set(data.notes.map((n) => n.name));
    const newSuggestions = (preview.terms || [])
      .filter((t) => !known.has(t.name))
      .map((t) => ({ id: uid(), kind: t.kind, name: t.name, desc: t.desc }));
    setData({
      ...data,
      records: [...data.records, record],
      todos: [...data.todos, ...newTodos],
      requests: [...data.requests, ...newRequests],
      noteSuggestions: [...data.noteSuggestions, ...newSuggestions],
    });
    setText("");
    setPreview(null);
    onDone();
  };

  const commitDoc = () => {
    if (!docPreview) return;
    const record = {
      id: uid(),
      kind: "doc",
      title: docPreview.title || docTitle || "資料",
      date: todayStr(),
      topics: [],
      decisions: [],
      summary: docPreview.summary || "",
      keywords: docPreview.keywords || [],
      sourceText: text,
      createdAt: todayStr(),
    };
    setData({ ...data, records: [...data.records, record] });
    setText("");
    setDocTitle("");
    setDocPreview(null);
    onDone();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button onClick={() => setMode("meeting")} style={modeBtn(mode === "meeting", "#E8801A")}>
          会議メモ
        </button>
        <button onClick={() => setMode("doc")} style={modeBtn(mode === "doc", "#E8801A")}>
          資料・ニュース
        </button>
      </div>

      {mode === "doc" && (
        <input
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          placeholder="題名（任意）"
          style={{ ...inputStyle, width: "100%", marginBottom: 8 }}
        />
      )}

      <div style={{ ...sectionLabel, marginTop: 0 }}>
        {mode === "meeting" ? "会議メモ・議事録を貼り付け" : "資料・記事・メモを貼り付け（第二の脳に収蔵）"}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          mode === "meeting"
            ? "例）7/9 営業部定例\n・新商品の販促は8月開始で決定\n・自分：競合価格の調査を来週金曜までにまとめる\n・田中さんにチラシ案の作成を依頼（来週水曜まで）"
            : "例）読んだ記事の本文、もらった資料の内容、調べたことのメモなど"
        }
        rows={9}
        style={{ ...inputStyle, width: "100%", lineHeight: 1.6, resize: "vertical" }}
      />
      <div style={{ marginTop: 10 }}>
        <button onClick={run} disabled={busy || !text.trim()} style={{ ...btnStyle, opacity: busy || !text.trim() ? 0.5 : 1 }}>
          {busy ? "解析中…" : mode === "meeting" ? "構造化する" : "要約して収蔵"}
        </button>
      </div>
      {error && <div style={{ color: C.red, fontSize: 13, marginTop: 10 }}>{error}</div>}

      {preview && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{preview.title}</div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.sub, marginTop: 2 }}>{preview.date}</div>
          {preview.topics?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={miniLabel}>論点</div>
              {preview.topics.map((x, i) => <div key={i} style={itemLine}>・{x}</div>)}
            </div>
          )}
          {preview.decisions?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={miniLabel}>決定事項</div>
              {preview.decisions.map((x, i) => <div key={i} style={itemLine}>・{x}</div>)}
            </div>
          )}
          {preview.todos?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={miniLabel}>ToDo（発車標に載ります）</div>
              {preview.todos.map((t, i) => (
                <div key={i} style={itemLine}>
                  ・{t.task}
                  <span style={{ fontFamily: MONO, color: C.green, fontSize: 12 }}>{t.due ? ` → ${fmtDue(t.due)}` : ""}</span>
                  {t.assignee ? <span style={{ color: C.sub, fontSize: 12 }}>（{t.assignee}）</span> : null}
                </div>
              ))}
            </div>
          )}
          {preview.requests?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={miniLabel}>依頼したこと（到着案内に載ります）</div>
              {preview.requests.map((r, i) => (
                <div key={i} style={itemLine}>
                  ・{r.task}
                  <span style={{ color: C.sub, fontSize: 12 }}>（{r.who}）</span>
                  <span style={{ fontFamily: MONO, color: C.green, fontSize: 12 }}>{r.due ? ` → ${fmtDue(r.due)}` : ""}</span>
                </div>
              ))}
            </div>
          )}
          {preview.terms?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={miniLabel}>用語・人物の候補（ノートで登録できます）</div>
              {preview.terms.map((t, i) => (
                <div key={i} style={itemLine}>
                  ・{t.name}
                  <span style={{ color: C.sub, fontSize: 12 }}>{t.desc ? ` — ${t.desc}` : ""}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={commitMeeting} style={{ ...btnStyle, marginTop: 14 }}>この内容で登録</button>
        </div>
      )}

      {docPreview && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{docPreview.title}</div>
          <div style={{ marginTop: 10 }}>
            <div style={miniLabel}>要約</div>
            <div style={{ ...itemLine, whiteSpace: "pre-wrap" }}>{docPreview.summary}</div>
          </div>
          {docPreview.keywords?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={miniLabel}>キーワード</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {docPreview.keywords.map((k, i) => (
                  <span key={i} style={{ fontSize: 12, background: C.greenSoft, color: C.green, borderRadius: 8, padding: "2px 8px" }}>{k}</span>
                ))}
              </div>
            </div>
          )}
          <button onClick={commitDoc} style={{ ...btnStyle, marginTop: 14 }}>この内容で収蔵</button>
        </div>
      )}
    </div>
  );
}
