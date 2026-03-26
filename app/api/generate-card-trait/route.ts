import { NextResponse } from "next/server";

type RankedType = {
  id: string;
  name: string;
  vibe: string;
  axis: {
    passion: number;
    caution: number;
    intuition: number;
    reality: number;
    attachment: number;
    independence: number;
  };
  colors: [string, string];
  publicMask: string;
  innerCore: string;
  risk: string;
  gift: string;
  scaryTitle: string;
  loveWarning: string;
  traits: {
    behavior: string;
    emotion: string;
    love: string;
  };
  score: number;
};

type ResultMode = "single" | "dominant-dual" | "balanced-dual";

type Blend = {
  p1: number;
  p2: number;
};

type RequestBody = {
  main: RankedType;
  sub?: RankedType;
  blend: Blend;
  mode: ResultMode;
};


function buildCardTraitPrompt({
  main,
  sub,
  blend,
  mode,
}: RequestBody) {
  return `
あなたは「和風怪異トレーディングカード」の特性テキスト作家です。
診断結果を、カードに載る“特性”へ変換してください。

目的は「性格の説明」ではなく、
怪異カードに載る「能力名・異名・特性ラベル」を作ることです。

# 入力
mode: ${mode}
main: ${main.name}
sub: ${sub?.name ?? "なし"}
blend: ${blend.p1}% / ${blend.p2}%

main info:
- vibe: ${main.vibe ?? ""}
- publicMask: ${main.publicMask ?? ""}
- innerCore: ${main.innerCore ?? ""}
- risk: ${main.risk ?? ""}
- gift: ${main.gift ?? ""}
- behavior: ${main.traits?.behavior ?? ""}
- emotion: ${main.traits?.emotion ?? ""}
- love: ${main.traits?.love ?? ""}

sub info:
- vibe: ${sub?.vibe ?? ""}
- publicMask: ${sub?.publicMask ?? ""}
- innerCore: ${sub?.innerCore ?? ""}
- risk: ${sub?.risk ?? ""}
- gift: ${sub?.gift ?? ""}
- behavior: ${sub?.traits?.behavior ?? ""}
- emotion: ${sub?.traits?.emotion ?? ""}
- love: ${sub?.love ?? ""}

# 出力ルール
- 出力は必ず2行だけ
- 1行目は「特性名。」で終える
- 2行目は短い説明文1文
- 1行目は“性格の要約”ではなく、“能力名・異名・通り名・存在”にする
- 1行目は名詞中心で、短く、鋭く、印象に残る言葉にする
- 2行目は能力の作用だけを簡潔に言い切る
- カードゲームの特性欄として自然な文体にする
- 少し不気味で、印象的で、怪異らしい余韻を残す
- かわいすぎる表現は禁止
- 詩的すぎる表現は禁止
- 診断コメントの要約は禁止
- 日常会話っぽい柔らかい表現は禁止
- 「〜な人」「〜タイプ」「〜傾向」など診断語は禁止
- 「あなたは」「この人は」など主語は禁止
- 性格語をそのまま特性名にしない
- 「甘え」「やさしさ」「寂しがり」「素直」などをそのまま1行目に使わない
- 説明文は25〜32文字程度を優先
- 難解すぎる熟語は禁止
- キャラ名をそのまま特性名にしない
- mainを軸にして作る
- subがある場合は隠し味として少しだけ混ぜる
- modeがsingleなら mainを強く出す
- modeがbalanced-dualなら 二面性や混ざり方を少し入れてよい
- 1行目は中学生でも読める語を優先する
- 当て字っぽすぎる漢字連結は禁止
- 難読な四字熟語・造語は禁止
- 特性名は「口に出して読めること」を優先する
- 特性名は8〜10文字で漢字かな混じりを推奨する
- 雰囲気重視で意味不明な熟語にしない
- 特性名は、読んだ瞬間に何となく意味が伝わる言葉にする
- 意味の通らない造語は禁止
- 既存の日本語として不自然な語の連結は禁止
- 比喩よりも、作用や性質が伝わる語を優先する
- 雰囲気だけの単語合成は禁止
- 1行目を読んだだけで、能力の方向性が想像できること
- 「◯◯の◯◯」の形を使う場合は、自然な日本語に限る
- 「損得秤」「感情炎」「影距離」など、意味が曖昧な二語連結は禁止
- 特性名は“辞書にありそうな自然な日本語”を優先する
- 無理に難しい言葉を作らない
- 2行目は「何を起こすか」を書く
- 性格説明ではなく、作用や影響を書く
- 「本性は」「本質は」などの説明語から始めない
- 「〜する存在」で終わらせない
- 元ネタ怪異の身体的特徴を、そのまま説明する表現は禁止
- 「首を伸ばす」「目を光らせる」など、見た目説明を特性名や説明文の中心にしない
- 比喩っぽい身体動作ではなく、能力の作用を言葉にする
- 特性名は自然な日本語にする
- 実在しない不自然な語（例: 伸首）は禁止
- 元ネタの見た目説明ではなく、相手に起こす影響を優先する






# 良い出力例
静かな干渉者。
目立たず近づき、気配だけで空気を変える。

境界すべり。
ためらいなく距離を詰め、心の内側へ入り込む。

無音で触れる者。
騒がず触れて、相手の警戒だけを静かに溶かす。

余白の侵蝕者。
何もない顔で近づき、場の輪郭をじわりと奪う。

気配への侵入者。
自然に寄り添い、境界線の内側へ静かに入り込む。

# 悪い出力例
伸びる甘え。
無邪気に寄り添い、甘えるように距離を縮める。

やさしい人。
みんなにやさしく、安心感を与える。

寂しがり屋。
一人が苦手で、そばにいたがる。

伸首幽火。
感情の炎を伸ばし、対象を絡め取る存在。

伸首で踏み込む者。
首を伸ばし距離を越えて心へ入り込み、嫉妬で関係を過度に深める。

伸首幽火。
感情の炎を伸ばし、対象を絡め取る存在。


# 出力形式
特性名。
短い説明文。
`.trim();
}






function fallbackTrait(main: RankedType, sub?: RankedType) {
  const source = `${main.name} ${sub?.name ?? ""} ${main.traits?.behavior ?? ""} ${
    main.traits?.emotion ?? ""
  } ${main.gift ?? ""}`;

  if (/座敷童|干渉/.test(source)) {
    return {
      name: "静かな干渉者。",
      body: "目立たず近づき、気配だけで空気を変える。",
    };
  }
  if (/ぬらりひょん|侵食/.test(source)) {
    return {
      name: "日常の侵食者。",
      body: "違和感なく入り込み、場の輪郭を静かに塗り替える。",
    };
  }
  if (/雪女|静/.test(source)) {
    return {
      name: "冷たい残響。",
      body: "熱を奪う気配だけが、あとまで静かに残り続ける。",
    };
  }
  if (/天狗|俯瞰|観察/.test(source)) {
    return {
      name: "無音の観測者。",
      body: "騒がず見抜き、揺らぎだけを上空から拾い上げる。",
    };
  }
  if (/鬼女|口裂け女|執着/.test(source)) {
    return {
      name: "感情の捕食者。",
      body: "強い気配で迫り、心の揺れを逃さず絡め取る。",
    };
  }

  return {
    name: "怪異の発露。",
    body: "輪郭の読めない気配で、場の空気だけを先に変える。",
  };
}

function parseTraitText(text: string) {
  const cleaned = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const name = cleaned[0] ?? "";
  const body = cleaned[1] ?? "";

  const valid =
    cleaned.length >= 2 &&
    name.endsWith("。") &&
    body.length >= 8;

  return {
    valid,
    name,
    body,
    text: [name, body].filter(Boolean).join("\n"),
  };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY 環境変数を設定してください" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as RequestBody;
    const { main, sub, blend, mode } = body;

    if (!main || !blend || !mode) {
      return NextResponse.json(
        { error: "main, blend, mode は必須です。" },
        { status: 400 }
      );
    }

    const prompt = buildCardTraitPrompt({
      main,
      sub,
      blend,
      mode,
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: prompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("generate-card-trait api error:", data);
      const fallback = fallbackTrait(main, sub);
      return NextResponse.json({
        ...fallback,
        text: `${fallback.name}\n${fallback.body}`,
        fallback: true,
      });
    }

    const rawText =
      data?.output_text ||
      data?.output?.map((item: any) =>
        item?.content?.map((c: any) => c?.text || "").join("")
      ).join("\n") ||
      "";

    const parsed = parseTraitText(rawText);

    if (!parsed.valid) {
      const fallback = fallbackTrait(main, sub);
      return NextResponse.json({
        ...fallback,
        text: `${fallback.name}\n${fallback.body}`,
        fallback: true,
      });
    }

    return NextResponse.json({
      name: parsed.name,
      body: parsed.body,
      text: parsed.text,
      fallback: false,
    });
  } catch (error) {
    console.error("generate-card-trait error:", error);
    return NextResponse.json(
      { error: "card trait generation failed" },
      { status: 500 }
    );
  }
}