// ---------- 永続化（localStorage） ----------
const DATA_KEY = "shigoto-board-v2";
const SETTINGS_KEY = "shigoto-board-settings-v1";

export const emptyData = () => ({
  records: [], // 会議記録・資料 {id, kind:'meeting'|'doc', title, date, topics, decisions, summary, keywords, sourceText, createdAt}
  todos: [], // {id, task, due, assignee, done, doneAt, recordId}
  requests: [], // 人に依頼したこと {id, task, who, due, done, doneAt, recordId}
  journal: [], // 業務日誌 {id, date, text, isFeedback}
  reviews: [], // {id, date, kind:'weekly'|'period', text}
  drafts: [], // {id, date, kind, to, text}
  notes: [], // 用語・人物 {id, kind:'term'|'person', name, desc, createdAt}
  noteSuggestions: [], // 取込時のAI提案 {id, kind, name, desc}
});

export function loadData() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) return { ...emptyData(), ...JSON.parse(raw) };
  } catch (e) {
    console.error("load failed", e);
  }
  return emptyData();
}

export function saveData(data) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("save failed", e);
    return false;
  }
}

export const defaultSettings = () => ({
  apiKey: "",
  model: "claude-opus-4-8",
  aiDisabled: false, // 完全オフラインモード（AI送信を遮断）
  confirmBeforeSend: true, // 送信前プレビューを必須にする
  ngWords: "", // 必ず伏せる語（1行1語）
});

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch (e) {
    /* ignore */
  }
  return defaultSettings();
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function clearAll() {
  localStorage.removeItem(DATA_KEY);
}

export function exportData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shigoto-board-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- 日付ユーティリティ ----------
export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const daysAgoStr = (n) => {
  const d = new Date(Date.now() - n * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const fmtDue = (due) => {
  if (!due) return "――";
  const parts = due.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return due;
  return `${parts[1]}/${parts[2]}`;
};

export const dueStatus = (due) => {
  if (!due) return { label: "──", color: "#66736F", key: "none" };
  const t = todayStr();
  if (due < t) return { label: "遅延", color: "#FF5F52", key: "late" };
  if (due === t) return { label: "まもなく", color: "#FFB300", key: "soon" };
  return { label: "定刻", color: "#3DDC84", key: "ontime" };
};
