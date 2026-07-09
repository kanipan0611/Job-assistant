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
