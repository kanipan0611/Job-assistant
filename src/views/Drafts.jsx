import React, { useState, useEffect } from "react";
import { C, btnStyle, btnGhost, inputStyle, sectionLabel, miniLabel, cardStyle, MONO } from "../theme.js";
import { uid, todayStr, daysAgoStr } from "../storage.js";
import { generateDraft, DRAFT_KINDS } from "../api.js";

const chip = (active, color) => ({
  padding: "7px 14px",
  borderRadius: 20,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  background: active ? color : C.card,
  color: active ? "#fff" : C.sub,
  boxShadow: active ? "none" : `inset 0 0 0 1px ${C.line}`,
});

export default function Drafts({ data, setData, prefill, clearPrefill }) {
  const [kind, setKind] = useState("report");
  const [to, setTo] = useState("");
  const [situation, setSituation] = useState("");
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  // 到着案内の「催促」ボタンからの引き継ぎ
  useEffect(() => {
    if (prefill) {
      setKind("reminder");
      setTo(prefill.who || "");
      setSituation(
        `「${prefill.task}」の状況確認。期限は${prefill.due || "未定"}。まだ受け取れていないため、状況を伺いたい。`,
      );
      clearPrefill();
    }
  }, [prefill, clearPrefill]);

  const recentDone = data.todos.filter((t) => t.done && t.doneAt >= daysAgoStr(14)).slice(-10).reverse();

  const toggleTodo = (task) => {
    setSelectedTodos((sel) => (sel.includes(task) ? sel.filter((x) => x !== task) : [...sel, task]));
  };

  const run = async () => {
    setBusy(true);
    setError("");
    setOutput("");
    try {
      const text = await generateDraft({
        kind,
        to,
        situation,
        doneTodos: kind === "report" ? selectedTodos : [],
      });
      setOutput(text);
      setData({
        ...data,
        drafts: [...data.drafts, { id: uid(), date: todayStr(), kind, to, text }],
      });
    } catch (e) {
      setError(e.message || "生成に失敗しました。");
    }
    setBusy(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard 不可の環境では手動コピー */
    }
  };

  const history = [...data.drafts].reverse().slice(0, 10);

  return (
    <div>
      <div style={{ ...sectionLabel, marginTop: 0 }}>文面の種類</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.entries(DRAFT_KINDS).map(([k, label]) => (
          <button key={k} onClick={() => setKind(k)} style={chip(kind === k, "#D64550")}>
            {label}
          </button>
        ))}
      </div>

      <div style={sectionLabel}>宛先・相手</div>
      <input
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="例）営業部 田中課長"
        style={{ ...inputStyle, width: "100%" }}
      />

      <div style={sectionLabel}>状況・伝えたいこと</div>
      <textarea
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
        placeholder={
          kind === "apology"
            ? "例）提出した見積書に単価の誤りがあった。正しい値はすでに確認済み。"
            : kind === "reminder"
              ? "例）チラシ案の提出をお願いしていたが、期限を過ぎても届いていない。"
              : kind === "consult"
                ? "例）競合調査の進め方で迷っている。AとBの2案があり、自分はA寄り。"
                : "例）今週の進捗をチームに共有したい。"
        }
        rows={4}
        style={{ ...inputStyle, width: "100%", lineHeight: 1.6, resize: "vertical" }}
      />

      {kind === "report" && recentDone.length > 0 && (
        <>
          <div style={sectionLabel}>報告に含める完了タスク（ToDo連携）</div>
          {recentDone.map((t) => (
            <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 2px", fontSize: 13, color: C.ink, cursor: "pointer" }}>
              <input type="checkbox" checked={selectedTodos.includes(t.task)} onChange={() => toggleTodo(t.task)} />
              <span style={{ flex: 1 }}>{t.task}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.sub }}>{t.doneAt} 完了</span>
            </label>
          ))}
        </>
      )}

      <div style={{ marginTop: 14 }}>
        <button onClick={run} disabled={busy} style={{ ...btnStyle, background: "#D64550", opacity: busy ? 0.5 : 1 }}>
          {busy ? "作成中…" : "下書きを作成"}
        </button>
      </div>
      {error && <div style={{ color: C.red, fontSize: 13, marginTop: 8 }}>{error}</div>}

      {output && (
        <div style={{ ...cardStyle, marginTop: 16, borderLeft: `4px solid #D64550` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ ...miniLabel, color: "#D64550" }}>下書き（送信前に必ず自分で確認・修正してください）</div>
            <button onClick={copy} style={btnGhost}>{copied ? "コピーしました" : "コピー"}</button>
          </div>
          <div style={{ fontSize: 14, color: C.ink, whiteSpace: "pre-wrap", lineHeight: 1.8, marginTop: 8 }}>{output}</div>
        </div>
      )}

      {history.length > 0 && (
        <>
          <div style={sectionLabel}>最近の下書き</div>
          {history.map((d) => (
            <details key={d.id} style={{ ...cardStyle, padding: 12, marginTop: 8 }}>
              <summary style={{ cursor: "pointer", fontSize: 13, color: C.ink }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.sub, marginRight: 8 }}>{d.date}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D64550", marginRight: 8 }}>{DRAFT_KINDS[d.kind]}</span>
                {d.to || "宛先なし"}
              </summary>
              <div style={{ fontSize: 13, color: C.sub, whiteSpace: "pre-wrap", lineHeight: 1.7, marginTop: 8 }}>{d.text}</div>
            </details>
          ))}
        </>
      )}
    </div>
  );
}
