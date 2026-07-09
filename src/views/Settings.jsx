import React, { useState, useRef } from "react";
import { C, btnStyle, btnGhost, inputStyle, sectionLabel, cardStyle } from "../theme.js";
import { loadSettings, saveSettings, exportData, clearAll, emptyData } from "../storage.js";

const MODELS = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8（高品質・既定）" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5（速度と品質のバランス）" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5（高速・低コスト）" },
];

export default function Settings({ data, setData }) {
  const [settings, setSettings] = useState(loadSettings());
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const save = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const importFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.records)) {
          alert("バックアップファイルの形式が正しくありません。");
          return;
        }
        if (!confirm("現在のデータをバックアップの内容で置き換えます。よろしいですか？")) return;
        setData({ ...emptyData(), ...parsed });
        alert("読み込みました。");
      } catch {
        alert("読み込みに失敗しました。JSONファイルか確認してください。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const wipe = () => {
    if (!confirm("すべての記録・タスク・日誌を削除します。元に戻せません。よろしいですか？")) return;
    clearAll();
    setData(emptyData());
  };

  return (
    <div>
      <div style={{ ...sectionLabel, marginTop: 0 }}>Anthropic APIキー</div>
      <input
        type="password"
        value={settings.apiKey}
        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
        placeholder="sk-ant-…"
        autoComplete="off"
        style={{ ...inputStyle, width: "100%" }}
      />
      <div style={{ fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 1.7 }}>
        キーはこの端末のブラウザ（localStorage）にのみ保存され、Anthropic API以外には送信されません。
        共用PCでは登録しないでください。
      </div>

      <div style={sectionLabel}>使用モデル</div>
      <select
        value={settings.model}
        onChange={(e) => setSettings({ ...settings, model: e.target.value })}
        style={{ ...inputStyle, width: "100%" }}
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>

      <div style={sectionLabel}>プライバシー（漏洩対策）</div>
      <div style={{ ...cardStyle, padding: 14 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: C.ink, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={settings.aiDisabled}
            onChange={(e) => setSettings({ ...settings, aiDisabled: e.target.checked })}
            style={{ marginTop: 3 }}
          />
          <span>
            <b>完全オフラインモード</b>
            <span style={{ display: "block", fontSize: 12, color: C.sub }}>
              AIへの送信を一切遮断します。タスク管理・日誌・検索など、AI以外の機能はすべて使えます。漏洩を確実にゼロにしたい場合はこちら。
            </span>
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: C.ink, cursor: "pointer", marginTop: 12 }}>
          <input
            type="checkbox"
            checked={settings.confirmBeforeSend !== false}
            onChange={(e) => setSettings({ ...settings, confirmBeforeSend: e.target.checked })}
            style={{ marginTop: 3 }}
          />
          <span>
            <b>送信前に必ず内容を確認する（推奨）</b>
            <span style={{ display: "block", fontSize: 12, color: C.sub }}>
              AIに送る直前に、マスキング後の全文をプレビューします。承認しない限り1文字も送信されません。
            </span>
          </span>
        </label>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 14 }}>必ず伏せる語（NGワード辞書）</div>
        <div style={{ fontSize: 12, color: C.sub, margin: "4px 0 6px" }}>
          顧客名・案件名など、絶対に社外へ出したくない語を1行に1つ。送信前に自動で【NG1】等に置き換わり、AIの回答内では元に戻ります。人物ノートに登録した名前も自動で伏せられます。
        </div>
        <textarea
          value={settings.ngWords}
          onChange={(e) => setSettings({ ...settings, ngWords: e.target.value })}
          placeholder={"例）\n○○商事\nプロジェクトあかつき"}
          rows={4}
          style={{ ...inputStyle, width: "100%", lineHeight: 1.6, resize: "vertical" }}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <button onClick={save} style={btnStyle}>{saved ? "保存しました" : "保存"}</button>
      </div>

      <div style={sectionLabel}>データのバックアップ</div>
      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.7, marginBottom: 8 }}>
        データはブラウザ内にのみ保存されます。PCの入れ替え・ブラウザ設定の初期化で消えることがあるため、定期的に書き出しての保管をおすすめします。
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => exportData(data)} style={btnGhost}>JSONに書き出す</button>
        <button onClick={() => fileRef.current?.click()} style={btnGhost}>JSONを読み込む</button>
        <input ref={fileRef} type="file" accept="application/json" onChange={importFile} style={{ display: "none" }} />
      </div>

      <div style={sectionLabel}>データの削除</div>
      <button onClick={wipe} style={{ ...btnStyle, background: C.red }}>すべてのデータを削除</button>

      <div style={{ ...cardStyle, marginTop: 24, borderLeft: `4px solid ${C.amber}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>取り扱い上の注意</div>
        <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.8 }}>
          ・貼り付けたメモはAI処理のためAnthropicのAPIに送信されます。会社の生成AI利用ルールを確認のうえ利用してください。<br />
          ・機密性の高い固有名詞（顧客名・金額など）は伏せ字にしてから貼り付けるとより安全です。<br />
          ・AIが生成した文面は必ず自分で確認してから使用してください。
        </div>
      </div>
    </div>
  );
}
