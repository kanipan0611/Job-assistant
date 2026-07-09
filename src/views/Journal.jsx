import React, { useState } from "react";
import { C, btnStyle, btnGhost, inputStyle, sectionLabel, miniLabel, itemLine, cardStyle, linkBtn, MONO } from "../theme.js";
import { uid, todayStr, daysAgoStr } from "../storage.js";
import { generateReview, generatePeriodSummary } from "../api.js";

export default function Journal({ data, setData }) {
  const [text, setText] = useState("");
  const [isFeedback, setIsFeedback] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [from, setFrom] = useState(daysAgoStr(30));
  const [to, setTo] = useState(todayStr());
  const [periodBusy, setPeriodBusy] = useState(false);

  const addEntry = () => {
    if (!text.trim()) return;
    setData({
      ...data,
      journal: [...data.journal, { id: uid(), date: todayStr(), text: text.trim(), isFeedback }],
    });
    setText("");
    setIsFeedback(false);
  };

  const removeEntry = (id) => {
    setData({ ...data, journal: data.journal.filter((j) => j.id !== id) });
  };

  const runWeekly = async () => {
    setBusy(true);
    setError("");
    try {
      const textOut = await generateReview(data);
      setData({
        ...data,
        reviews: [...data.reviews, { id: uid(), date: todayStr(), kind: "weekly", text: textOut }],
      });
    } catch (e) {
      setError(e.message || "生成に失敗しました。");
    }
    setBusy(false);
  };

  const runPeriod = async () => {
    setPeriodBusy(true);
    setError("");
    try {
      const textOut = await generatePeriodSummary(data, from, to);
      setData({
        ...data,
        reviews: [...data.reviews, { id: uid(), date: todayStr(), kind: "period", text: textOut, from, to }],
      });
    } catch (e) {
      setError(e.message || "生成に失敗しました。");
    }
    setPeriodBusy(false);
  };

  const entries = [...data.journal].reverse();
  const reviews = [...data.reviews].reverse();

  return (
    <div>
      <div style={{ ...sectionLabel, marginTop: 0 }}>乗務日誌（今日の一言）</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="例）見積書の数字ミスを指摘された。提出前にダブルチェックする。"
        rows={3}
        style={{ ...inputStyle, width: "100%", lineHeight: 1.6, resize: "vertical" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <label style={{ fontSize: 13, color: C.sub, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={isFeedback} onChange={(e) => setIsFeedback(e.target.checked)} />
          上司・先輩からの指摘を含む
        </label>
        <button onClick={addEntry} disabled={!text.trim()} style={{ ...btnStyle, opacity: text.trim() ? 1 : 0.5 }}>記帳</button>
      </div>

      <div style={sectionLabel}>振り返りの生成</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={runWeekly} disabled={busy} style={{ ...btnStyle, opacity: busy ? 0.5 : 1 }}>
          {busy ? "生成中…" : "直近1週間の振り返り"}
        </button>
        <span style={{ color: C.line }}>｜</span>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
        <span style={{ color: C.sub, fontSize: 12 }}>〜</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
        <button onClick={runPeriod} disabled={periodBusy} style={{ ...btnGhost, opacity: periodBusy ? 0.5 : 1 }}>
          {periodBusy ? "生成中…" : "面談用サマリ"}
        </button>
      </div>
      <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>
        記録・タスク完了履歴・日誌が素材になります。面談用サマリは1on1や評価面談の直前にどうぞ。
      </div>
      {error && <div style={{ color: C.red, fontSize: 13, marginTop: 8 }}>{error}</div>}

      {reviews.map((r) => (
        <div key={r.id} style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: r.kind === "period" ? C.blue : C.green, marginBottom: 8 }}>
            {r.kind === "period" ? `面談用サマリ（${r.from}〜${r.to}）` : "週次振り返り"} ／ {r.date} 作成
          </div>
          <div style={{ fontSize: 14, color: C.ink, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{r.text}</div>
        </div>
      ))}

      {entries.length > 0 && (
        <>
          <div style={sectionLabel}>日誌の記録</div>
          {entries.map((j) => (
            <div key={j.id} style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "6px 2px", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.sub, flexShrink: 0 }}>{j.date}</span>
              {j.isFeedback && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#8E4FC7", borderRadius: 6, padding: "1px 6px", flexShrink: 0 }}>指摘</span>
              )}
              <span style={{ ...itemLine, flex: 1 }}>{j.text}</span>
              <button onClick={() => removeEntry(j.id)} style={{ ...linkBtn, color: C.sub }}>削除</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
