// ---------- 漏洩対策: 端末内マスキング ----------
// 送信前にテキスト中の固有名詞・金額・連絡先を【人物1】等のプレースホルダに置換し、
// 対応表（mapping）は端末内にのみ保持する。AIの応答は端末内で元に戻す。

const HONORIFICS =
  "さん|様|氏|君|くん|ちゃん|部長|課長|係長|主任|社長|副社長|専務|常務|取締役|先生|先輩|マネージャー";
const NOT_NAMES = new Set(["皆", "みな", "お客", "客", "お疲れ", "お兄", "お姉", "誰", "各位"]);

export function buildDict(ngWordsText, notes) {
  const dict = [];
  (ngWordsText || "")
    .split(/\r?\n/)
    .map((w) => w.trim())
    .filter(Boolean)
    .forEach((w) => dict.push({ word: w, cat: "NG" }));
  (notes || [])
    .filter((n) => n.kind === "person" && n.name)
    .forEach((n) => dict.push({ word: n.name, cat: "人物" }));
  // 長い語から先に置換（部分一致の事故を防ぐ）
  dict.sort((a, b) => b.word.length - a.word.length);
  return dict;
}

export function maskText(text, dict) {
  const mapping = {}; // placeholder -> original
  const reverse = {}; // original -> placeholder
  const counters = {};

  const put = (original, cat) => {
    if (reverse[original]) return reverse[original];
    counters[cat] = (counters[cat] || 0) + 1;
    const ph = `【${cat}${counters[cat]}】`;
    mapping[ph] = original;
    reverse[original] = ph;
    return ph;
  };

  let out = text;

  // 1. ユーザー辞書（NGワード・人物ノート）— 完全一致
  for (const { word, cat } of dict) {
    if (!out.includes(word)) continue;
    const ph = put(word, cat);
    out = out.split(word).join(ph);
  }

  // 2. メールアドレス
  out = out.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, (m) => put(m, "メール"));

  // 3. 電話番号
  out = out.replace(/0\d{1,4}-\d{1,4}-\d{4}/g, (m) => put(m, "電話"));

  // 4. 金額（¥1,200,000 / 300万円 / 1,200円 など）
  out = out.replace(/[¥￥]\s?[\d,]+|\d[\d,]*(?:\.\d+)?\s?(?:億|万|千)?円/g, (m) => put(m, "金額"));

  // 5. 会社名（株式会社○○ / ○○株式会社 / （株）○○）
  out = out.replace(
    /(?:株式会社|有限会社|合同会社|（株）|\(株\))[一-龥ァ-ヶーA-Za-z0-9]{1,15}|[一-龥ァ-ヶーA-Za-z0-9]{1,15}(?:株式会社|（株）|\(株\))/g,
    (m) => put(m, "会社"),
  );

  // 6. 敬称つき人名（田中さん / 佐藤課長 など） — 敬称は残し、名前だけ伏せる
  out = out.replace(new RegExp(`([一-龥]{1,4})(${HONORIFICS})(?![一-龥])`, "g"), (m, name, hon) => {
    if (NOT_NAMES.has(name) || name.startsWith("【")) return m;
    return put(name, "人物") + hon;
  });

  return { masked: out, mapping, count: Object.keys(mapping).length };
}

export function unmaskText(text, mapping) {
  let out = text;
  for (const [ph, original] of Object.entries(mapping)) {
    out = out.split(ph).join(original);
  }
  return out;
}

// 構造化出力（オブジェクト）内の文字列を再帰的に復元
export function unmaskDeep(value, mapping) {
  if (typeof value === "string") return unmaskText(value, mapping);
  if (Array.isArray(value)) return value.map((v) => unmaskDeep(v, mapping));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = unmaskDeep(v, mapping);
    return out;
  }
  return value;
}
