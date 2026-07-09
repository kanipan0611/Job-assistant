import React from "react";
import { C, MONO } from "../theme.js";
import { fmtDue, dueStatus, todayStr } from "../storage.js";

// 電光掲示板の外枠
export function BoardShell({ titleJa, titleEn, right, children, ticker }) {
  return (
    <div
      style={{
        background: C.board,
        borderRadius: 14,
        padding: "16px 16px 10px",
        boxShadow: "0 4px 18px rgba(15,22,28,0.3)",
        border: `1px solid #000`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: `1px solid ${C.boardLine}`,
        }}
      >
        <span style={{ fontFamily: MONO, color: C.amber, fontSize: 13, letterSpacing: 2 }}>
          {titleEn}
          <span style={{ color: "#8FA3AD", fontSize: 11, marginLeft: 8, letterSpacing: 1 }}>{titleJa}</span>
        </span>
        <span style={{ fontFamily: MONO, color: "#8FA3AD", fontSize: 11 }}>{right}</span>
      </div>
      {children}
      {ticker ? (
        <div
          style={{
            marginTop: 8,
            paddingTop: 6,
            borderTop: `1px solid ${C.boardLine}`,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span className="sb-ticker" style={{ fontFamily: MONO, color: C.amber, fontSize: 12, display: "inline-block" }}>
            {ticker}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function StatusLamp({ st }) {
  return (
    <span
      className={st.key === "soon" || st.key === "late" ? "sb-blink" : undefined}
      style={{
        fontFamily: MONO,
        color: st.color,
        fontSize: 11,
        width: 64,
        textAlign: "right",
        flexShrink: 0,
      }}
    >
      {st.label}
    </span>
  );
}

// 発車標（自分のToDo）
export function DepartureBoard({ todos, onToggle }) {
  const open = todos
    .filter((t) => !t.done)
    .sort((a, b) => ((a.due || "9999") < (b.due || "9999") ? -1 : 1));
  const late = open.filter((t) => dueStatus(t.due).key === "late").length;
  const soon = open.filter((t) => dueStatus(t.due).key === "soon").length;
  const ticker =
    open.length === 0
      ? "全列車 発車済み ／ おつかれさまです"
      : `本日の運行情報 ▶ 発車待ち ${open.length}本 ／ 遅延 ${late}本 ／ まもなく発車 ${soon}本 ── 期限の近い列車からご乗車ください`;

  return (
    <BoardShell titleEn="DEPARTURES" titleJa="タスク発車標" right={todayStr()} ticker={ticker}>
      <div style={{ display: "flex", gap: 10, padding: "0 4px 4px", fontFamily: MONO, fontSize: 10, color: "#8FA3AD" }}>
        <span style={{ width: 18 }} />
        <span style={{ width: 46 }}>発車</span>
        <span style={{ flex: 1 }}>行先（タスク）</span>
        <span style={{ width: 64, textAlign: "right" }}>備考</span>
      </div>
      {open.length === 0 && (
        <div style={{ fontFamily: MONO, color: C.led, fontSize: 13, padding: "14px 4px" }}>
          発車待ちのタスクはありません
        </div>
      )}
      {open.map((t) => {
        const st = dueStatus(t.due);
        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 4px",
              borderBottom: `1px solid ${C.boardLine}`,
            }}
          >
            <button
              onClick={() => onToggle(t.id)}
              aria-label="完了にする"
              title="完了（発車）"
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: `1.5px solid #8FA3AD`,
                background: "transparent",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: MONO, color: C.amber, fontSize: 13, width: 46, flexShrink: 0 }}>
              {fmtDue(t.due)}
            </span>
            <span style={{ color: "#E8EDEA", fontSize: 14, flex: 1, lineHeight: 1.4 }}>
              {t.task}
              {t.assignee ? <span style={{ color: "#8FA3AD", fontSize: 12 }}>（{t.assignee}）</span> : null}
            </span>
            <StatusLamp st={st} />
          </div>
        );
      })}
    </BoardShell>
  );
}

// 到着案内（人に依頼したこと）
export function ArrivalsBoard({ requests, onReceive, onRemind }) {
  const open = requests
    .filter((r) => !r.done)
    .sort((a, b) => ((a.due || "9999") < (b.due || "9999") ? -1 : 1));

  return (
    <BoardShell
      titleEn="ARRIVALS"
      titleJa="到着案内（依頼中）"
      right={`${open.length} 本 到着待ち`}
    >
      <div style={{ display: "flex", gap: 10, padding: "0 4px 4px", fontFamily: MONO, fontSize: 10, color: "#8FA3AD" }}>
        <span style={{ width: 18 }} />
        <span style={{ width: 46 }}>到着</span>
        <span style={{ flex: 1 }}>便名（依頼内容）</span>
        <span style={{ width: 64, textAlign: "right" }}>備考</span>
      </div>
      {open.length === 0 && (
        <div style={{ fontFamily: MONO, color: C.led, fontSize: 13, padding: "14px 4px" }}>
          到着待ちの依頼はありません
        </div>
      )}
      {open.map((r) => {
        const st = dueStatus(r.due);
        const needRemind = st.key === "late" || st.key === "soon";
        return (
          <div
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 4px",
              borderBottom: `1px solid ${C.boardLine}`,
            }}
          >
            <button
              onClick={() => onReceive(r.id)}
              aria-label="受領にする"
              title="受領（到着）"
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: `1.5px solid #8FA3AD`,
                background: "transparent",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: MONO, color: C.amber, fontSize: 13, width: 46, flexShrink: 0 }}>
              {fmtDue(r.due)}
            </span>
            <span style={{ color: "#E8EDEA", fontSize: 14, flex: 1, lineHeight: 1.4 }}>
              {r.task}
              <span style={{ color: "#8FA3AD", fontSize: 12 }}>（{r.who}）</span>
            </span>
            {needRemind ? (
              <button
                onClick={() => onRemind(r)}
                className={st.key === "late" ? "sb-blink" : undefined}
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: st.key === "late" ? C.red : C.amber,
                  background: "none",
                  border: `1px solid ${st.key === "late" ? C.red : C.amber}`,
                  borderRadius: 6,
                  padding: "2px 6px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                title="催促文の下書きを作る"
              >
                催促
              </button>
            ) : (
              <StatusLamp st={st} />
            )}
          </div>
        );
      })}
    </BoardShell>
  );
}
