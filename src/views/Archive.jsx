import React, { useState } from "react";
import { C, btnStyle, btnGhost, inputStyle, miniLabel, itemLine, cardStyle, linkBtn, MONO } from "../theme.js";
import { generateBrief, askArchive } from "../api.js";

// 質問モード用: 質問語との一致で記録をスコアリングして上位を渡す
function pickRelevant(records, question, limit = 6) {
  const words = question.toLowerCase().split(/[\s、。,.]+/).filter((w) => w.length >= 2);
  const scored = records.map((r) => {
    const hay = [r.title, ...(r.topics || []), ...(r.decisions || []), ...(r.keywords || []), r.summary, r.sourceText]
      .join(" ")
      .toLowerCase();
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    return { r, score };
  });
  const hit = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  const base = hit.length ? hit : scored.slice().reverse(); // 一致なしなら新しい順
  return base.slice(0, limit).map((x) => x.r);
}

export default function Archive({ data }) {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [briefs, setBriefs] = useState({}); // recordId -> text
  const [briefBusy, setBriefBusy] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askBusy, setAskBusy] = useState(false);
  const [error, setError] = useState("");

  const hit = (r) => {
    if (!q.trim()) return true;
    const hay = [r.title, r.date, ...(r.topics || []), ...(r.decisions || []), ...(r.keywords || []), r.summary, r.sourceText]
      .join(" ")
      .toLowerCase();
    return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
  };
  const list = [...data.records].reverse().filter(hit);

  const makeBrief = async (record) => {
    setBriefBusy(record.id);
    setError("");
    try {
      const related = data.records.filter((r) => r.kind === "meeting" && r.title === record.title);
      const relatedIds = new Set(related.map((r) => r.id));
      const openTodos = data.todos.filter((t) => !t.done && relatedIds.has(t.recordId));
      const text = await generateBrief(record.title, related, openTodos);
      setBriefs((b) => ({ ...b, [record.id]: text }));
    } catch (e) {
      setError(e.message || "ブリーフの生成に失敗しました。");
    }
    setBriefBusy(null);
  };

  const ask = async () => {
    if (!question.trim()) return;
    setAskBusy(true);
    setError("");
    setAnswer("");
    try {
      setAnswer(await askArchive(question, pickRelevant(data.records, question)));
    } catch (e) {
      setError(e.message || "回答の生成に失敗しました。");
    }
    setAskBusy(false);
  };

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="キーワードで検索（例：販促 価格）"
        style={{ ...inputStyle, width: "100%" }}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="記録に質問する（例：販促の開始時期はいつに決まった？）"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={ask} disabled={askBusy || !question.trim()} style={{ ...btnGhost, opacity: askBusy || !question.trim() ? 0.5 : 1 }}>
          {askBusy ? "検索中…" : "質問"}
        </button>
      </div>
      {error && <div style={{ color: C.red, fontSize: 13, marginTop: 8 }}>{error}</div>}
      {answer && (
        <div style={{ ...cardStyle, marginTop: 10, borderLeft: `4px solid ${C.blue}` }}>
          <div style={{ ...miniLabel, color: C.blue }}>記録からの回答</div>
          <div style={{ ...itemLine, whiteSpace: "pre-wrap", marginTop: 4 }}>{answer}</div>
        </div>
      )}

      {list.length === 0 && (
        <div style={{ color: C.sub, fontSize: 13, marginTop: 20, textAlign: "center" }}>
          {data.records.length === 0
            ? "まだ記録がありません。「取込」からメモや資料を登録すると、ここに溜まっていきます。"
            : "該当する記録が見つかりません。"}
        </div>
      )}
      {list.map((r) => (
        <div key={r.id} style={{ ...cardStyle, padding: 14, marginTop: 12 }}>
          <button
            onClick={() => setOpenId(openId === r.id ? null : r.id)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    background: r.kind === "doc" ? C.blue : C.green,
                    borderRadius: 6,
                    padding: "2px 6px",
                    marginRight: 8,
                    verticalAlign: "middle",
                  }}
                >
                  {r.kind === "doc" ? "資料" : "会議"}
                </span>
                {r.title}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.sub, flexShrink: 0 }}>{r.date}</span>
            </div>
          </button>
          {openId === r.id && (
            <div style={{ marginTop: 10 }}>
              {r.kind === "meeting" && (
                <button
                  onClick={() => makeBrief(r)}
                  disabled={briefBusy === r.id}
                  style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, marginBottom: 10, opacity: briefBusy === r.id ? 0.5 : 1 }}
                >
                  {briefBusy === r.id ? "生成中…" : "この会議の予習ブリーフを作る"}
                </button>
              )}
              {briefs[r.id] && (
                <div style={{ background: C.greenSoft, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={miniLabel}>予習ブリーフ</div>
                  <div style={{ ...itemLine, whiteSpace: "pre-wrap", marginTop: 4 }}>{briefs[r.id]}</div>
                </div>
              )}
              {r.summary && (<><div style={miniLabel}>要約</div><div style={{ ...itemLine, whiteSpace: "pre-wrap" }}>{r.summary}</div></>)}
              {r.topics?.length > 0 && (<><div style={{ ...miniLabel, marginTop: 8 }}>論点</div>{r.topics.map((x, i) => <div key={i} style={itemLine}>・{x}</div>)}</>)}
              {r.decisions?.length > 0 && (<><div style={{ ...miniLabel, marginTop: 8 }}>決定事項</div>{r.decisions.map((x, i) => <div key={i} style={itemLine}>・{x}</div>)}</>)}
              {r.keywords?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {r.keywords.map((k, i) => (
                    <button key={i} onClick={() => setQ(k)} style={{ ...linkBtn, fontSize: 12, background: C.greenSoft, borderRadius: 8, padding: "2px 8px" }}>{k}</button>
                  ))}
                </div>
              )}
              <div style={{ ...miniLabel, marginTop: 8 }}>元メモ</div>
              <div style={{ fontSize: 12, color: C.sub, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{r.sourceText}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
