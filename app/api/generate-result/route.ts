import { NextResponse } from "next/server";

type ResultMode = "single" | "dominant-dual" | "balanced-dual";

type Character = {
  id?: string;
  name: string;
  vibe: string;
  publicMask: string;
  innerCore: string;
  gift: string;
  risk: string;
  scaryTitle: string;
  loveWarning: string;
  traits: {
    behavior: string;
    emotion: string;
    love: string;
  };
};

type GenerateBody = {
  main: Character;
  sub?: Character;
  mode: ResultMode;
  useAI?: boolean;
  good?: string;
  bad?: string;
};

const TYPE_LABEL: Record<string, string> = {
  kuchisake: "口裂け女",
  hanako: "花子さん",
  sadako: "貞子",
  yukionna: "雪女",
  kijo: "鬼女",
  hitotsume: "一つ目小僧",
  rokuro: "ろくろ首",
  noppera: "のっぺらぼう",
  zashiki: "座敷童",
  nurarihyon: "ぬらりひょん",
  kappa: "河童",
  tengu: "天狗",
};

function labelFromId(id?: string) {
  if (!id) return "不明";
  return TYPE_LABEL[id] ?? id;
}

function serializeCharacter(c: Character) {
  return `
name: ${c.name}
vibe: ${c.vibe}
publicMask: ${c.publicMask}
innerCore: ${c.innerCore}
gift: ${c.gift}
risk: ${c.risk}
loveWarning: ${c.loveWarning}
traits:
  behavior: ${c.traits.behavior}
  emotion: ${c.traits.emotion}
  love: ${c.traits.love}
`.trim();
}

function buildPrompt(
  main: Character,
  sub: Character | undefined,
  mode: ResultMode,
  goodName: string,
  badName: string
) {
  return `
あなたは都市伝説キャラ診断の結果文を書く編集者です。

# 出力ルール
必ず以下の6セクションをこの順番で出力すること：

【基本性格】
【対人関係】
【恋愛傾向】
【隠れた性格】
【⚠ 相性の悪い相手】
【◎ 相性の良い相手】

# 全体ルール
- 各セクションは2〜4文でしっかり書く
- 抽象的すぎる表現は禁止
- 読んで納得できる内容にする
- riskは断定せず「〜しやすい」と書く

# モード別ルール
- single → main中心
- dominant-dual → mainが表、subが内面
- balanced-dual → 両方混ざる

# 相性セクション（重要）
- 悪い相手: ${badName}
- 良い相手: ${goodName}
- 必ずキャラ名を本文に入れる
- なぜ噛み合うか／なぜしんどいかを具体的に書く
- 距離感・感情・恋愛のズレまで踏み込む

# キャラ情報
mode: ${mode}

main:
${serializeCharacter(main)}

sub:
${sub ? serializeCharacter(sub) : "なし"}

# 出力開始
`.trim();
}

async function generateAI(
  main: Character,
  sub: Character | undefined,
  mode: ResultMode,
  goodName: string,
  badName: string
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const prompt = buildPrompt(main, sub, mode, goodName, badName);

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(data);
    throw new Error("AI generation failed");
  }

  const text =
    data.output?.[0]?.content?.[0]?.text ??
    data.output_text ??
    "";

  if (!text) throw new Error("AI empty");

  return text.trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBody;

    const { main, sub, mode, useAI = true, good, bad } = body;

    if (!main || !mode) {
      return NextResponse.json(
        { error: "main and mode required" },
        { status: 400 }
      );
    }

    const goodName = labelFromId(good);
    const badName = labelFromId(bad);

    const text = useAI
      ? await generateAI(main, sub, mode, goodName, badName)
      : "fallback";

    return NextResponse.json({ text });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "failed" },
      { status: 500 }
    );
  }
}