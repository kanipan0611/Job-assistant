import Anthropic from "@anthropic-ai/sdk";
import { loadSettings, todayStr, daysAgoStr } from "./storage.js";

// ブラウザから直接 Claude API を呼ぶ（APIキーは端末のlocalStorageにのみ保存）
function getClient() {
  const { apiKey } = loadSettings();
  if (!apiKey) {
    throw new Error(
      "APIキーが未設定です。「設定」タブでAnthropic APIキーを登録してください。",
    );
  }
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

function getModel() {
  return loadSettings().model || "claude-opus-4-8";
}

function firstText(response) {
  const block = response.content.find((b) => b.type === "text");
  return block ? block.text.trim() : "";
}

async function createText({ system, prompt, maxTokens = 2048 }) {
  const client = getClient();
  const response = await client.messages.create({
    model: getModel(),
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") {
    throw new Error("生成が拒否されました。内容を変えてお試しください。");
  }
  return firstText(response);
}

async function createJson({ system, prompt, schema, maxTokens = 3000 }) {
  const client = getClient();
  const response = await client.messages.create({
    model: getModel(),
    max_tokens: maxTokens,
    system,
    output_config: { format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") {
    throw new Error("生成が拒否されました。内容を変えてお試しください。");
  }
  return JSON.parse(firstText(response));
}

const str = { type: "string" };
const strArr = { type: "array", items: str };

// ---------- 会議メモ構造化 ----------
const memoSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: str,
    date: str,
    topics: strArr,
    decisions: strArr,
    todos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { task: str, due: str, assignee: str },
        required: ["task", "due", "assignee"],
      },
    },
    requests: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { task: str, who: str, due: str },
        required: ["task", "who", "due"],
      },
    },
    terms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { kind: { type: "string", enum: ["term", "person"] }, name: str, desc: str },
        required: ["kind", "name", "desc"],
      },
    },
  },
  required: ["title", "date", "topics", "decisions", "todos", "requests", "terms"],
};

export async function structureMemo(text) {
  const result = await createJson({
    system:
      "あなたは若手社会人の会議メモを構造化するアシスタントです。事実だけを抽出し、創作はしません。",
    prompt: `以下の会議メモを解析して構造化してください。

ルール:
- title: 会議名（推定でよい。不明なら「打ち合わせ」）
- date: メモ内の日付をYYYY-MM-DDで。なければ ${todayStr()}
- todos: メモの書き手（自分）がやるべきこと。dueは「来週金曜」「明日」等の相対表現を今日（${todayStr()}）基準でYYYY-MM-DDに変換。期限不明は空文字。assigneeは自分の場合は空文字。
- requests: 自分が他者に依頼したこと・他者の担当タスクで自分が結果を待つもの。whoは相手の名前。
- terms: メモに出てくる社内用語・略語・プロジェクト名（kind:"term"）や、初出のキーパーソン（kind:"person"）。descは文脈から分かる説明。分からなければ空文字。既知の一般用語は含めない。最大5件。
- 情報がない項目は空配列または空文字。

メモ:
${text}`,
    schema: memoSchema,
  });
  // 空文字 → null 正規化
  const norm = (s) => (s && s.trim() ? s.trim() : null);
  return {
    ...result,
    todos: result.todos.map((t) => ({ task: t.task, due: norm(t.due), assignee: norm(t.assignee) })),
    requests: result.requests.map((r) => ({ task: r.task, who: norm(r.who) || "担当者", due: norm(r.due) })),
    terms: result.terms.map((t) => ({ kind: t.kind, name: t.name, desc: t.desc || "" })),
  };
}

// ---------- 資料・ニュース取込（第二の脳） ----------
const docSchema = {
  type: "object",
  additionalProperties: false,
  properties: { title: str, summary: str, keywords: strArr },
  required: ["title", "summary", "keywords"],
};

export async function summarizeDoc(text, hintTitle) {
  return createJson({
    system: "あなたは資料やニュース記事を整理するアシスタントです。",
    prompt: `以下のテキスト（資料・ニュース・メモ等）を整理してください。
- title: 内容を表す短いタイトル${hintTitle ? `（ユーザー指定の題名「${hintTitle}」を優先）` : ""}
- summary: 300字以内の要約。あとで検索して読み返す用途。
- keywords: 検索用キーワード5〜10個。

テキスト:
${text}`,
    schema: docSchema,
  });
}

// ---------- 週次振り返り ----------
export async function generateReview(data) {
  const cutoff = daysAgoStr(7);
  const records = data.records.filter((r) => (r.date || r.createdAt) >= cutoff);
  const done = data.todos.filter((t) => t.done && t.doneAt >= cutoff);
  const open = data.todos.filter((t) => !t.done);
  const journal = data.journal.filter((j) => j.date >= cutoff);
  const feedback = journal.filter((j) => j.isFeedback);

  return createText({
    system: "あなたは若手社会人の業務振り返りを支援するアシスタントです。",
    prompt: `以下の1週間分のデータから週次振り返りを日本語で書いてください。装飾記号（#や*）は使わず、短い段落で。

構成: (1)今週の主な動き 2〜3文 (2)完了したこと (3)受けた指摘と気づき（あれば。過去に同様の指摘を繰り返していそうなら一言添える） (4)積み残し・来週注意すべきこと。全体で400字以内。

会議・記録: ${JSON.stringify(records.map((r) => ({ title: r.title, date: r.date, decisions: r.decisions })))}
完了タスク: ${JSON.stringify(done.map((t) => t.task))}
未完了タスク: ${JSON.stringify(open.map((t) => ({ task: t.task, due: t.due })))}
業務日誌: ${JSON.stringify(journal.map((j) => ({ date: j.date, text: j.text, 指摘: j.isFeedback })))}
今週の指摘: ${JSON.stringify(feedback.map((j) => j.text))}`,
  });
}

// ---------- 期間サマリ（1on1・評価面談準備） ----------
export async function generatePeriodSummary(data, from, to) {
  const inRange = (d) => d && d >= from && d <= to;
  const records = data.records.filter((r) => inRange(r.date || r.createdAt));
  const done = data.todos.filter((t) => t.done && inRange(t.doneAt));
  const journal = data.journal.filter((j) => inRange(j.date));

  return createText({
    system:
      "あなたは若手社会人の評価面談・1on1準備を支援するアシスタントです。",
    prompt: `${from}〜${to} の実績データから、面談で使える実績サマリを日本語で書いてください。装飾記号は使わず、話し言葉に近い簡潔な文章で。

構成: (1)期間中の主な取り組みと成果 (2)完了した主なタスク（件数と代表例） (3)成長した点・受けた指摘への対応 (4)今後の課題・挑戦したいこと。全体で600字以内。

会議・記録: ${JSON.stringify(records.map((r) => ({ title: r.title, date: r.date, decisions: r.decisions })))}
完了タスク（${done.length}件）: ${JSON.stringify(done.map((t) => t.task))}
業務日誌・指摘: ${JSON.stringify(journal.map((j) => ({ date: j.date, text: j.text, 指摘: j.isFeedback })))}`,
    maxTokens: 3000,
  });
}

// ---------- 状況別メール・報告文の下書き ----------
export const DRAFT_KINDS = {
  report: "報告",
  apology: "謝罪",
  reminder: "催促",
  consult: "相談",
};

export async function generateDraft({ kind, to, situation, doneTodos }) {
  const kindLabel = DRAFT_KINDS[kind] || "報告";
  return createText({
    system:
      "あなたは日本のビジネスメール・チャット文面の作成を支援するアシスタントです。若手社員が上司・先輩・取引先に送っても失礼のない、簡潔で自然な文面を書きます。過剰にへりくだらず、要点が先に伝わる構成にします。",
    prompt: `以下の条件で「${kindLabel}」の文面の下書きを1つ作成してください。件名と本文をこの形式で:

件名: …
本文:
…

- 宛先・相手: ${to || "上司"}
- 状況・伝えたいこと: ${situation || "（特記なし）"}
${doneTodos && doneTodos.length ? `- 完了したタスク（報告に含める）: ${JSON.stringify(doneTodos)}` : ""}
- トーン: ${kindLabel}にふさわしい丁寧さ。謝罪なら誠実に原因と再発防止まで、催促なら相手を責めずに期限と背景を添えて、相談なら論点と自分の考えを先に、報告なら結論から。
- 長さ: 本文300字以内。署名は「＿＿＿」でプレースホルダに。`,
  });
}

// ---------- 会議前ブリーフ ----------
export async function generateBrief(title, relatedRecords, openTodos) {
  return createText({
    system: "あなたは会議準備を支援するアシスタントです。",
    prompt: `これから「${title}」に出席します。過去の記録から予習ブリーフを日本語で作ってください。装飾記号なし、箇条書き中心で300字以内。

構成: (1)前回までの決定事項 (2)自分の未完了タスク（この会議で聞かれそうなもの） (3)積み残し論点・今回確認すべきこと。

過去の記録: ${JSON.stringify(relatedRecords.map((r) => ({ date: r.date, topics: r.topics, decisions: r.decisions })))}
関連する未完了タスク: ${JSON.stringify(openTodos.map((t) => ({ task: t.task, due: t.due })))}`,
  });
}

// ---------- アーカイブへの質問 ----------
export async function askArchive(question, records) {
  return createText({
    system:
      "あなたは業務記録アーカイブの検索アシスタントです。渡された記録に書かれていることだけを根拠に答え、記録にない場合は「記録には見当たりません」と答えます。",
    prompt: `質問: ${question}

参照できる記録:
${JSON.stringify(
      records.map((r) => ({
        title: r.title,
        date: r.date,
        topics: r.topics,
        decisions: r.decisions,
        summary: r.summary,
        本文抜粋: (r.sourceText || "").slice(0, 1500),
      })),
    )}

回答は日本語で簡潔に。根拠となった記録のタイトルと日付を末尾に添えてください。`,
    maxTokens: 1500,
  });
}
