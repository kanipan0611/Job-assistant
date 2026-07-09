import React, { useState, useEffect, useCallback, useRef } from "react";
import { C, FONT, MONO, LINES, btnStyle, btnGhost } from "./theme.js";
import { loadData, saveData, loadSettings, todayStr } from "./storage.js";
import { registerSendConfirmer } from "./api.js";
import Today from "./views/Today.jsx";
import Intake from "./views/Intake.jsx";
import Archive from "./views/Archive.jsx";
import Journal from "./views/Journal.jsx";
import Drafts from "./views/Drafts.jsx";
import Notes from "./views/Notes.jsx";
import Settings from "./views/Settings.jsx";

// 駅名標風ヘッダー
function StationSign({ openCount }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `2px solid ${C.ink}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(31,42,40,0.12)",
      }}
    >
      <div style={{ padding: "14px 18px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.ink, letterSpacing: 6 }}>しごとボード</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.sub, letterSpacing: 3, marginTop: 2 }}>
          SHIGOTO BOARD ── MEMO → STRUCTURE → RUN
        </div>
      </div>
      <div
        style={{
          background: C.green,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "5px 14px",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        <span>◀ きのう</span>
        <span style={{ fontFamily: MONO, letterSpacing: 1 }}>
          {todayStr()}｜発車待ち {openCount} 本
        </span>
        <span>あした ▶</span>
      </div>
    </div>
  );
}

// 路線記号タブ
function LineTabs({ tab, setTab }) {
  return (
    <nav style={{ display: "flex", gap: 4, margin: "16px 0", overflowX: "auto", paddingBottom: 2 }}>
      {Object.entries(LINES).map(([key, line]) => {
        const active = tab === key;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              flex: 1,
              minWidth: 52,
              padding: "8px 2px 7px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: active ? "#fff" : "transparent",
              boxShadow: active ? `inset 0 0 0 2px ${line.color}` : "none",
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: `3px solid ${line.color}`,
                background: active ? line.color : "#fff",
                color: active ? "#fff" : line.color,
                fontSize: 13,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT,
              }}
            >
              {line.mark}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: active ? line.color : C.sub }}>{line.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// 送信前プレビュー（マスキング後の全文を承認するまで送信されない）
function SendGate({ req }) {
  if (!req) return null;
  const parts = req.masked.split(/(【[^】]{1,20}】)/g);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,22,28,0.55)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 560, width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: C.board, color: C.amber, fontFamily: MONO, fontSize: 12, letterSpacing: 2, padding: "10px 16px" }}>
          出発前点検 ── 送信内容の確認
        </div>
        <div style={{ padding: "12px 16px", fontSize: 12, color: C.sub, borderBottom: `1px solid ${C.line}` }}>
          以下の内容が Anthropic API に送信されます（{req.count > 0 ? `固有名詞など ${req.count} 件を伏せ字化済み。対応表は端末外に出ません` : "伏せ字対象は見つかりませんでした"}）。
          機密が残っていないか確認してください。キャンセルすれば何も送信されません。
        </div>
        <div style={{ overflowY: "auto", padding: 16, fontSize: 12, lineHeight: 1.8, color: C.ink, whiteSpace: "pre-wrap", fontFamily: MONO, flex: 1 }}>
          {parts.map((p, i) =>
            /^【[^】]+】$/.test(p) ? (
              <mark key={i} style={{ background: "#FFE9A8", borderRadius: 4, padding: "0 2px" }}>{p}</mark>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 12, borderTop: `1px solid ${C.line}` }}>
          <button onClick={() => req.resolve(false)} style={btnGhost}>キャンセル</button>
          <button onClick={() => req.resolve(true)} style={btnStyle}>この内容で送信</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setDataState] = useState(null);
  const [tab, setTab] = useState("today");
  const [saveErr, setSaveErr] = useState(false);
  const [draftPrefill, setDraftPrefill] = useState(null);
  const [hasKey, setHasKey] = useState(true);
  const [offline, setOffline] = useState(false);
  const [sendReq, setSendReq] = useState(null);
  const sendReqRef = useRef(null);

  useEffect(() => {
    setDataState(loadData());
    setHasKey(Boolean(loadSettings().apiKey));
    setOffline(Boolean(loadSettings().aiDisabled));
    registerSendConfirmer(({ masked, count }) => {
      return new Promise((resolve) => {
        const req = {
          masked,
          count,
          resolve: (ok) => {
            setSendReq(null);
            sendReqRef.current = null;
            resolve(ok);
          },
        };
        sendReqRef.current = req;
        setSendReq(req);
      });
    });
  }, []);

  useEffect(() => {
    if (tab === "settings") return;
    setHasKey(Boolean(loadSettings().apiKey));
    setOffline(Boolean(loadSettings().aiDisabled));
  }, [tab]);

  const setData = useCallback((next) => {
    setDataState(next);
    setSaveErr(!saveData(next));
  }, []);

  const onRemind = useCallback((request) => {
    setDraftPrefill(request);
    setTab("drafts");
  }, []);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: C.sub }}>
        読み込み中…
      </div>
    );
  }

  const openCount = data.todos.filter((t) => !t.done).length;
  const line = LINES[tab];

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: FONT }}>
      <style>{`
        body { margin: 0; }
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid ${C.green}; outline-offset: 2px; }
        @keyframes sb-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0.25; } }
        .sb-blink { animation: sb-blink 1.2s step-end infinite; }
        @keyframes sb-ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .sb-ticker { animation: sb-ticker 22s linear infinite; padding-left: 100%; }
      `}</style>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "18px 16px 70px" }}>
        <StationSign openCount={openCount} />
        <LineTabs tab={tab} setTab={setTab} />

        {offline && tab !== "settings" && (
          <div
            style={{
              background: C.greenSoft,
              border: `1px solid ${C.green}`,
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 12,
              color: C.green,
              marginBottom: 12,
              fontWeight: 700,
            }}
          >
            ● 完全オフラインモード運行中 ── 外部への送信は一切行いません（AI機能は停止中）
          </div>
        )}

        {!hasKey && !offline && tab !== "settings" && (
          <div
            style={{
              background: "#FFF7E0",
              border: `1px solid ${C.amber}`,
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 12,
              color: "#7A5A00",
              marginBottom: 12,
            }}
          >
            AI機能を使うには
            <button onClick={() => setTab("settings")} style={{ background: "none", border: "none", color: C.green, fontWeight: 700, cursor: "pointer", fontSize: 12, padding: "0 2px" }}>
              設定
            </button>
            でAPIキーを登録してください（タスク管理・日誌はキーなしでも使えます）。
          </div>
        )}

        {saveErr && (
          <div style={{ background: "#FFF3F1", border: `1px solid ${C.red}`, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: C.red, marginBottom: 12 }}>
            保存に失敗しました。ブラウザの保存容量を確認してください（設定タブから書き出しでの退避もできます）。
          </div>
        )}

        <div style={{ fontFamily: MONO, fontSize: 10, color: line.color, letterSpacing: 2, marginBottom: 10 }}>
          ● {line.en} LINE ── {line.label}
        </div>

        {tab === "today" && <Today data={data} setData={setData} onRemind={onRemind} />}
        {tab === "intake" && <Intake data={data} setData={setData} onDone={() => setTab("today")} />}
        {tab === "archive" && <Archive data={data} />}
        {tab === "journal" && <Journal data={data} setData={setData} />}
        {tab === "drafts" && (
          <Drafts data={data} setData={setData} prefill={draftPrefill} clearPrefill={() => setDraftPrefill(null)} />
        )}
        {tab === "notes" && <Notes data={data} setData={setData} />}
        {tab === "settings" && <Settings data={data} setData={setData} />}

        <div style={{ textAlign: "center", marginTop: 40, fontFamily: MONO, fontSize: 10, color: C.sub, letterSpacing: 2 }}>
          ─── 本日もご安全に ───
        </div>
      </div>
      <SendGate req={sendReq} />
    </div>
  );
}
