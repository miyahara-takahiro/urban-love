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

const characterAdjustments: Record<string, string> = {
  "花子さん": `slightly unsettling smile
not friendly
quiet but watching you`,
  "人面犬": `awkward human-like face
slightly annoying expression
not cute`,
  "モスマン": `not too scary
not horror
slightly awkward posture
not powerful`,
  "ビッグフット": `not heroic
not cool
slightly clumsy presence
a bit awkward`,
  "口裂け女": `not too violent
no excessive blood
unsettling but not horror`,
  "ツチノコ": `fat body
short and stubby
lazy posture
slightly stupid expression
not cool
not cute`,
  "雪女": `emotionless expression
slightly uncanny beauty
not elegant
not majestic`,
  "ネッシー": `not realistic
slightly strange proportions
not majestic
a bit awkward`,
  "チュパカブラ": `no blood
no gore
not horror
slightly weird expression`,
  "天狗": `not heroic
not cool
slightly strange proportions
a bit unsettling`,
  "河童": `not cute
slightly creepy
awkward expression`,
  "鵺": `strange hybrid creature
not cool
not powerful
slightly unsettling`,
  "座敷童": `slightly unsettling eyes
too calm expression
not fully innocent`,
  "海坊主": `not too scary
not horror
simple face
slightly uncanny`,
  "一つ目小僧": `not cute
slightly awkward
unsettling single eye`,
  "ぬらりひょん": `not cool
petty
sneaky
annoying
uninvited guest
slightly ugly
comical but creepy`,
};

function clampPercent(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function inferMode(first: RankedType, second: RankedType, blend?: Blend, mode?: ResultMode): ResultMode {
  if (mode) return mode;
  if (blend?.p2 === 0) return "single";

  const diff = (first.score ?? 0) - (second.score ?? 0);
  if (diff >= 12) return "single";
  if (diff >= 7) return "dominant-dual";
  return "balanced-dual";
}

function buildModeInstruction(
  mode: ResultMode,
  first: RankedType,
  second: RankedType,
  blend: Blend
) {
  const p1 = clampPercent(blend?.p1 ?? 100, 0, 100);
  const p2 = clampPercent(blend?.p2 ?? 0, 0, 100);

  if (mode === "single") {
    return `
Mode: SINGLE DOMINANT CHARACTER

Visual priority:
- ${first.name} must overwhelmingly dominate the design
- The final character should read primarily as ${first.name}
- ${second.name} may appear only as a very subtle secondary trace or accent
- Do NOT make the image feel like an equal fusion
- silhouette, face, posture, and visual identity must be mostly driven by ${first.name}

Influence balance:
- primary influence must feel like about ${Math.max(88, p1)}%
- secondary influence must feel very minor
`;
  }

  if (mode === "dominant-dual") {
    return `
Mode: DOMINANT DUAL CHARACTER

Visual priority:
- ${first.name} must clearly dominate
- ${second.name} must remain recognizable but secondary
- the image should feel like one creature derived mainly from ${first.name}
- use ${second.name} as accent influence in face details, body texture, gesture, hair, aura, or uncanny features
- do NOT split the body into two halves

Influence balance:
- primary influence: about ${Math.max(70, p1)}%
- secondary influence: about ${Math.min(30, Math.max(15, p2))}%
`;
  }

  return `
Mode: BALANCED DUAL CHARACTER

Visual priority:
- both ${first.name} and ${second.name} must remain clearly visible in one unified creature
- the final design must feel balanced, not one-sided
- do NOT create twins or side-by-side characters
- combine the two identities in a natural but uncanny single-body design
- silhouette may come from one, but face, details, texture, posture, and atmosphere must visibly carry both

Influence balance:
- primary influence: about ${Math.max(55, Math.min(65, p1))}%
- secondary influence: about ${Math.max(35, Math.min(45, p2))}%
`;
}

function buildImagePrompt({
  prompt,
  first,
  second,
  blend,
  mode,
}: {
  prompt?: string;
  first: RankedType;
  second: RankedType;
  blend: Blend;
  mode: ResultMode;
}) {
  const firstAdjust = characterAdjustments[first.name] ?? "";
  const secondAdjust = characterAdjustments[second.name] ?? "";
  const modeInstruction = buildModeInstruction(mode, first, second, blend);

  const compositionRule =
    mode === "single"
      ? `
Composition:
- one full-body character
- centered composition
- iconic silhouette
- simple plain background
- highly readable shape
- avoid overcomplicated fusion details
`
      : `
Composition:
- one full-body character
- centered composition
- simple plain background
- clear silhouette
- visible fusion details
- readable at a glance
`;

  return `
Japanese urban legend fusion character illustration.

Core style:
- semi-realistic illustration
- slightly grotesque kimo-kawaii balance
- unsettling but not horror
- not cute
- not cinematic
- no gore
- no excessive blood
- not photorealistic
- full body
- centered composition
- simple plain background
- one character only

Absolute rules:
- this must be ONE unified character only
- do NOT show two separate characters
- do NOT split the body into left and right halves
- do NOT create collage, comparison sheet, or character lineup
- do NOT make it look like cosplay
- do NOT add text, logo, caption, frame, UI, or watermark
- keep the background simple so the character is the focus

Character fusion:
Primary influence: ${first.name} (${blend.p1}%)
Secondary influence: ${second.name} (${blend.p2}%)

${modeInstruction}

${compositionRule}

Design intent:
- create a strange new creature, not two characters standing together
- use the dominant character as the main silhouette and personality base
- blend the secondary character through facial structure, body details, expression, texture, posture, aura, or iconic motifs
- the visual balance must clearly reflect the percentage difference
- memorable, uncanny, slightly disturbing, slightly comical

${first.name} adjustment:
${firstAdjust}

${second.name} adjustment:
${secondAdjust}

Additional prompt from client:
${prompt ?? ""}
`.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY 環境変数を設定してください" },
        { status: 500 }
      );
    }

    const {
      prompt,
      first,
      second,
      blend,
      mode,
    } = body as {
      prompt?: string;
      first: RankedType;
      second: RankedType;
      blend: Blend;
      mode?: ResultMode;
    };

    if (!first || !second || !blend) {
      return NextResponse.json(
        { error: "first, second, blend は必須です。" },
        { status: 400 }
      );
    }

    const resolvedMode = inferMode(first, second, blend, mode);
    const safePrompt = buildImagePrompt({
      prompt,
      first,
      second,
      blend,
      mode: resolvedMode,
    });

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1-mini",
        prompt: safePrompt,
        size: "1024x1024",
        output_format: "png",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "画像生成に失敗しました。" },
        { status: response.status }
      );
    }

    const b64 = data?.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "画像データの取得に失敗しました。" },
        { status: 500 }
      );
    }

    const imageUrl = `data:image/png;base64,${b64}`;

    return NextResponse.json({
      imageUrl,
      meta: {
        mode: resolvedMode,
        primary: first.name,
        secondary: second.name,
        p1: blend.p1,
        p2: blend.p2,
      },
    });
  } catch (error) {
    console.error("generate-image error:", error);
    return NextResponse.json(
      { error: "image generation failed" },
      { status: 500 }
    );
  }
}