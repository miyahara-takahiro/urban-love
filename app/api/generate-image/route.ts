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
quiet but watching you
do not make too terrifying
school ghost energy but still shareable`,

  "人面犬": `awkward human-like face
slightly annoying expression
not cute
do not make too horrific
strange urban legend energy rather than horror monster`,

  "モスマン": `not too scary
not horror
slightly awkward posture
not powerful
mysterious and memorable rather than threatening`,

  "ビッグフット": `not heroic
not cool
slightly clumsy presence
a bit awkward
wild but not aggressive`,

  "口裂け女": `not too violent
no excessive blood
unsettling but not horror
do not make too grotesque
urban legend woman rather than slasher horror`,

  "ツチノコ": `fat body
short and stubby
lazy posture
slightly stupid expression
not cool
not cute
odd local legend mood`,

  "雪女": `emotionless expression
slightly uncanny beauty
not elegant
not majestic
do not make too cold or horror-like
quiet supernatural presence`,

  "ネッシー": `not realistic
slightly strange proportions
not majestic
a bit awkward
mysterious creature rather than giant monster`,

  "チュパカブラ": `no blood
no gore
not horror
slightly weird expression
creepy but still shareable`,

  "天狗": `not heroic
not cool
slightly strange proportions
a bit unsettling
folkloric presence rather than battle character`,

  "河童": `not cute
slightly creepy
awkward expression
do not make too scary
folk creature atmosphere`,

  "鵺": `strange hybrid creature
not cool
not powerful
slightly unsettling
do not make it too monstrous
uncanny yokai energy`,

  "座敷童": `slightly unsettling eyes
too calm expression
not fully innocent
do not make too dark
quiet uncanny childlike presence`,

  "海坊主": `not too scary
not horror
simple face
slightly uncanny
mysterious maritime folklore presence`,

  "一つ目小僧": `not cute
slightly awkward
unsettling single eye
do not make too terrifying
odd yokai silhouette`,

  "ぬらりひょん": `not cool
petty
sneaky
annoying
uninvited guest
slightly ugly
comical but creepy
mischievous old yokai atmosphere`,

  // result route 側にあるが image route 側で未対応だったものを追加
  "貞子": `long black hair
pale face
quiet eerie presence
not too horror
not too grotesque
not cinematic ghost movie style
more uncanny than violent
shareable eerie beauty rather than terror`,

  "鬼女": `intense feminine presence
wrathful or jealous emotional energy
not full demon monster
human-based uncanny woman
not gore
not too horrifying
dramatic but still elegant in silhouette`,

  "ろくろ首": `elongated neck motif
strange silhouette
not too grotesque
not body horror
uncanny traditional yokai feeling
human-based form with surreal extension`,

  "のっぺらぼう": `blank face or reduced facial features
not gore
not horror movie style
quiet uncanny simplicity
human-like but unnatural
minimal unsettling expression rather than shock horror`,
};

function clampPercent(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function inferMode(
  first: RankedType,
  second: RankedType,
  blend?: Blend,
  mode?: ResultMode
): ResultMode {
  if (mode) return mode;
  if (blend?.p2 === 0) return "single";

  const firstScore = first.score ?? 0;
  const secondScore = second.score ?? 0;
  const diff = firstScore - secondScore;
  const bothHigh = firstScore >= 72 && secondScore >= 68;

  if (diff >= 10) return "single";
  if (diff >= 5) return "dominant-dual";
  return bothHigh ? "balanced-dual" : "dominant-dual";
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
- the final character should read primarily as ${first.name}
- ${second.name} may appear only as a very subtle secondary trace or accent
- do NOT make the image feel like an equal fusion
- silhouette, face, posture, and visual identity must be mostly driven by ${first.name}

Influence balance:
- primary influence: about ${p1}%
- secondary influence: about ${p2}%
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
- primary influence: about ${p1}%
- secondary influence: about ${p2}%
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
- primary influence: about ${p1}%
- secondary influence: about ${p2}%
`;
}

function getBackgroundDirection(first: RankedType, second: RankedType) {
  const names = [first.name, second.name];

  if (names.includes("口裂け女")) {
    return `a quiet residential street, alley, or school-adjacent path in soft evening light, with distant streetlights, walls, pavement texture, and gentle depth`;
  }

  if (names.includes("花子さん")) {
    return `an old school corridor or stairwell with soft ambient brightness, worn walls, classroom windows, floor reflections, and clear perspective depth`;
  }

  if (names.includes("貞子")) {
    return `a dim but readable old hallway, room, or indoor corridor with soft ambient light, subtle depth, old textures, and classic eerie atmosphere without heavy darkness`;
  }

  if (names.includes("雪女")) {
    return `a softly lit winter roadside, shrine path, or snowy open space with pale snow, airy mist, and light blue-gray atmosphere`;
  }

  if (names.includes("鬼女")) {
    return `a shrine path, old street, or traditional Japanese setting at dusk with layered architecture, warm ambient light, and dramatic but readable atmosphere`;
  }

  if (names.includes("ろくろ首")) {
    return `a traditional Japanese room, hallway, or alley with visible wooden architecture, lantern or window light, and quiet uncanny spatial depth`;
  }

  if (names.includes("のっぺらぼう")) {
    return `a quiet evening street or old corridor with soft light, subtle emptiness, walls or railings, and simple but eerie environmental depth`;
  }

  if (names.includes("人面犬")) {
    return `a city backstreet or residential lane at dusk with pavement texture, distant signage, soft streetlights, walls, and a slightly odd urban atmosphere`;
  }

  if (names.includes("モスマン")) {
    return `an open roadside, hill overlook, or suburban edge at dusk with sky glow, faint haze, distant town lights, and mysterious but readable atmosphere`;
  }

  if (names.includes("ビッグフット")) {
    return `a forest edge or mountain path in evening light with visible trees, soft haze, layered depth, and adventurous but uncanny atmosphere`;
  }

  if (names.includes("河童")) {
    return `a quiet riverside with stone edges, shallow reflections, grass, bridge or embankment hints, and subdued folkloric atmosphere in dim evening light`;
  }

  if (names.includes("天狗")) {
    return `a mountain shrine approach with stone steps, lanterns, trees, torii-like elements, and soft evening brightness`;
  }

  if (names.includes("海坊主")) {
    return `a seaside walkway or quiet coast at dusk with visible horizon, sea mist, reflected light, railings or rocks, and mysterious but readable atmosphere`;
  }

  if (names.includes("座敷童")) {
    return `an old Japanese hallway or tatami room with soft indoor ambient light, shoji details, low furniture hints, and a gentle uncanny atmosphere`;
  }

  if (names.includes("一つ目小僧")) {
    return `an old temple path or nostalgic Japanese alley with lantern glow, wooden textures, stone ground, and soft atmospheric depth`;
  }

  if (names.includes("ぬらりひょん")) {
    return `a traditional Japanese interior or engawa with soft warm light, subtle shadows, visible decorative textures, and a strange but not terrifying presence`;
  }

  if (names.includes("鵺")) {
    return `a ruined shrine edge or mountain clearing with visible structure, faint fog, evening light, trees, and layered environmental depth`;
  }

  if (names.includes("チュパカブラ")) {
    return `a rural roadside or field edge at dusk with fences, dry textures, distant landforms, open sky, and restrained mysterious atmosphere`;
  }

  if (names.includes("ツチノコ")) {
    return `a grassy mountain path or roadside with weeds, stones, earth textures, and soft evening light creating a playful mysterious local-legend atmosphere`;
  }

  if (names.includes("ネッシー")) {
    return `a lakeside at dusk with soft water reflections, visible shoreline, misty depth, and a mysterious but not horror-like atmosphere`;
  }

  return `a Japanese urban-legend inspired outdoor or semi-outdoor setting at dusk or evening with visible scenery, soft ambient light, subtle depth, and restrained mysterious atmosphere`;
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
  const backgroundDirection = getBackgroundDirection(first, second);

  const compositionRule =
    mode === "single"
      ? `
Composition:
- one full-body character
- centered composition
- iconic silhouette
- scenic background with perspective depth
- background must remain secondary to the character
- highly readable shape
- avoid overcomplicated fusion details
- maintain clear separation between character and background
- entire head and hair must be fully visible within the frame
- do not crop the top of the head
- include full body from head to feet
- leave comfortable margin above the head
- avoid zoomed-in framing
- camera distance should be medium to long shot
- the character should be slightly smaller within the canvas
- ensure visible space above the head and around the body
- do not place the face close to the top edge
- keep the entire silhouette comfortably inside the frame
`
      : `
Composition:
- one full-body character
- centered composition
- scenic background with perspective depth
- background must remain secondary to the character
- clear silhouette
- visible fusion details
- readable at a glance
- face must remain clearly visible
- avoid cropping or hiding the face with hair, pose, or frame
- maintain clear separation between character and background
- entire head and hair must be fully visible within the frame
- do not crop the top of the head
- include full body from head to feet
- leave comfortable margin above the head
- avoid zoomed-in framing
- camera distance should be medium to long shot
`;

  return `
Japanese urban legend fusion character illustration.

Core style:
- semi-realistic illustration
- slightly grotesque kimo-kawaii balance
- unsettling but not horror
- strange and memorable but shareable
- not too scary
- not too dark
- not cute
- not cinematic
- no gore
- no excessive blood
- not photorealistic
- full body
- centered composition
- one character only
- light eerie atmosphere
- soft environmental storytelling
- brighter than horror imagery
- background should include visible scenery and place details such as corridors, streets, shrine paths, riversides, coastlines, windows, walls, steps, rails, lights, reflections, room depth, or distant structures

Absolute rules:
- this must be ONE unified character only
- do NOT show two separate characters
- do NOT split the body into left and right halves
- do NOT create collage, comparison sheet, or character lineup
- do NOT make it look like cosplay
- do NOT add text, logo, caption, frame, UI, or watermark
- the character must remain the clear main subject
- do NOT let the background overpower the character
- avoid cluttered scenery
- avoid overly busy composition
- avoid large background objects competing with the subject
- keep the face and body clearly readable
- avoid plain empty background
- avoid flat blank walls with no variation
- background should feel like a place, not a blank studio backdrop
- overall lighting should be softly bright, dusk-like, or gently lit, not horror-dark
- avoid heavy shadow that makes the character too frightening
- keep the image suitable for social sharing and visually catchy
- maintain an eerie tone without becoming grotesque horror

Character fusion:
Primary influence: ${first.name} (${blend.p1}%)
Secondary influence: ${second.name} (${blend.p2}%)

${modeInstruction}

${compositionRule}

Background direction:
- use a fitting Japanese urban-legend inspired setting
- ${backgroundDirection}
- include subtle environmental details such as walls, corridors, objects, textures, architecture, paths, railings, windows, water edges, stones, or landscape elements
- add depth and perspective to the background
- include atmospheric lighting variation and gentle shadow
- keep the background readable, scenic, and slightly bright
- use atmosphere rather than giant props
- the background should support the character's world, not dominate the image

Design intent:
- create a strange new creature, not two characters standing together
- use the dominant character as the main silhouette and personality base
- blend the secondary character through facial structure, body details, expression, texture, posture, aura, or iconic motifs
- the visual balance must clearly reflect the percentage difference
- memorable, uncanny, slightly disturbing, slightly comical
- the image should feel like a character portrait with environmental mood, not a horror scene
- the final result should feel visually appealing and easy to share, not oppressively scary

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