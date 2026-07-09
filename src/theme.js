// ---------- 鉄道モチーフ デザイントークン ----------
export const C = {
  paper: "#F2F4F3",
  card: "#FFFFFF",
  ink: "#1F2A28",
  sub: "#66736F",
  line: "#DCE3E0",
  green: "#0B7A45", // 駅名標の帯
  greenSoft: "#E2F0E9",
  board: "#0F161C", // 発車標の地
  boardLine: "#1E2A33",
  amber: "#FFB300", // 電光文字
  led: "#3DDC84", // 定刻
  red: "#FF5F52", // 遅延
  blue: "#2E6FD8",
};

export const FONT = `'Zen Kaku Gothic New','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif`;
export const MONO = `'IBM Plex Mono','SFMono-Regular','Osaka-Mono','MS Gothic',Consolas,monospace`;

// 路線カラー（タブ = 路線）
export const LINES = {
  today: { label: "運行", mark: "運", color: "#0B7A45", en: "OPERATIONS" },
  intake: { label: "取込", mark: "取", color: "#E8801A", en: "INTAKE" },
  archive: { label: "記録", mark: "記", color: "#2E6FD8", en: "ARCHIVES" },
  journal: { label: "日誌", mark: "日", color: "#8E4FC7", en: "LOGBOOK" },
  drafts: { label: "文書", mark: "文", color: "#D64550", en: "DISPATCH" },
  notes: { label: "ノート", mark: "ノ", color: "#0FA3A3", en: "NOTES" },
  settings: { label: "設定", mark: "設", color: "#66736F", en: "DEPOT" },
};

export const btnStyle = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: C.green,
  color: "#fff",
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

export const btnGhost = {
  ...btnStyle,
  background: C.card,
  color: C.green,
  boxShadow: `inset 0 0 0 1.5px ${C.green}`,
};

export const linkBtn = {
  background: "none",
  border: "none",
  color: C.green,
  fontSize: 12,
  cursor: "pointer",
  fontFamily: FONT,
};

export const inputStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  fontFamily: FONT,
  fontSize: 14,
  background: C.card,
  color: C.ink,
  boxSizing: "border-box",
};

export const sectionLabel = {
  fontSize: 12,
  fontWeight: 700,
  color: C.sub,
  letterSpacing: 1,
  margin: "18px 0 8px",
};

export const miniLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: C.green,
  letterSpacing: 1,
};

export const itemLine = { fontSize: 13, color: C.ink, lineHeight: 1.7 };

export const cardStyle = {
  background: C.card,
  borderRadius: 12,
  border: `1px solid ${C.line}`,
  padding: 16,
};
