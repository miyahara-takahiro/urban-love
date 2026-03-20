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
- 主人格（main）を必ず軸にして書く
- 結果全体を通して「表に出ている性質」と「本人も気づいていない内面」が伝わるようにする
- mainとsubをただ並べるのではなく、mainを表の顔、subを深層の顔としてつなげて書く
- 性格診断テンプレのような無難な表現は禁止
- それぞれのセクションで、行動・距離感・感情の動きが見える書き方にする

# モード別ルール（最重要）
- single → main中心で一貫した人物像として書く
- dominant-dual → 各セクションで「表ではmainの性質が出やすいが、深い部分ではsubの性質も強く出る」という構造で書く
- balanced-dual → 両方の性質が強いが、mainをわずかに主役として扱う
- dominant-dual と balanced-dual では、subを「本人も気づいていない内面」として扱う
- dominant-dual では「しかし」「ただし」「実は」などを使って、表と裏の落差を自然に出す
- balanced-dual でも完全な50:50の説明にはしない

# セクション別ルール

【基本性格】
- まずmainの印象をはっきり書く
- dual系の場合は、そのあとにsub由来の内面を補足する
- 読んだ瞬間に「自分の表の性格っぽい」と思える内容にする

【対人関係】
- 人との距離の取り方、空気の読み方、心の開き方を書く
- dual系の場合は「表向きの接し方」と「本音のズレ」を入れる

【恋愛傾向】
- 好きになった時の出方、距離感、執着、依存、警戒心を書く
- dual系の場合は、表の恋愛態度と内面の感情の深さの差を書く

【隠れた性格】
- このセクションではsubを主役として扱ってよい
- 「本人も気づいていない」「表には出にくい」が前提
- hiddenな欲求、弱さ、執着、怖さ、魅力を書く

# 相性セクション（重要）
- 悪い相手: ${badName}
- 良い相手: ${goodName}
- 必ずキャラ名を本文に入れる
- なぜ噛み合うか／なぜしんどいかを具体的に書く
- 距離感・感情・恋愛のズレまで踏み込む
- 相性説明でもmain中心に書き、必要ならsubの影響も入れる
- 単に「合う」「合わない」で終わらせず、どういう場面でそうなるかを書く

# NG
- 抽象語だけで終わる説明
- mainとsubの特徴を箇条書きのように並べるだけの文章
- どのキャラにも当てはまりそうな無難な表現
- balanced-dualだからといって完全に対等な説明にすること

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