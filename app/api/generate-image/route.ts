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
  "花子さん": `quiet school ghost presence
slightly uncanny
not too horror-like
not too dark
shareable eerie atmosphere
slight forward approach or subtle stepping motion
subtle childlike mood`,



"口裂け女": `quiet unsettling feminine urban legend
human-based uncanny woman
not violent
no excessive blood
not slasher horror
still posture over motion
upright stance with restrained presence
subtle eerie beauty
not too aggressive
background must remain clearly visible around her silhouette`,




  "雪女": `quiet supernatural beauty
soft and distant presence
slightly melancholic feeling
not majestic
not horror-like
gentle drifting motion with slight body tilt
pale winter spirit mood`,


"天狗": `traditional yokai presence
not heroic
not battle-character like
less dynamic posture
upright balanced stance
traditional eerie mood
background architecture must remain clearly readable
not too dominant in the frame`,




  "河童": `folk creature atmosphere
slightly creepy but not scary
awkward presence
strange but readable silhouette
playful sneaky posture with slight crouch or side step
not too cute`,


  "座敷童": `quiet uncanny childlike presence
soft eerie mood
not fully innocent
subtle unsettling eyes
small playful step or slight bouncing posture
not too dark`,


  "一つ目小僧": `odd yokai silhouette
single-eye motif
awkward but readable
not too terrifying
awkward tilted posture with uneven balance
traditional yokai mood`,

  "ぬらりひょん": `sneaky old yokai mood
slightly petty
mischievous
not cool
relaxed leaning posture with subtle shifting weight
comical but eerie`,

  "貞子": `long black hair
pale face
quiet eerie presence
not too horror
not too grotesque
more uncanny than violent
slow leaning posture with soft flowing motion
shareable eerie beauty`,





"ろくろ首": `elongated neck motif
strange silhouette
not too grotesque
not body horror
minimal motion
still posture with subtle unnatural extension
human-based form with surreal extension
background must remain clearly visible around the figure`,


"鬼女": `stylized human-based kijo
quiet refined yokai girl presence
subtle eerie Japanese beauty
pale skin
long straight black hair
small elegant red horns
soft red eyes
calm gaze
closed mouth
gentle or unreadable expression
traditional kimono styling
minimal motion
still posture over dynamic action
not full demon monster
not feral
not aggressive
not gore
not too horrifying
soft muted colors
simple readable shapes
clean silhouette
cute-shareable but uncanny
not too visually intense
background must remain clearly visible around the figure`,




  "のっぺらぼう": `blank or reduced facial simplicity
quiet uncanny mood
not gore
not horror movie style
still posture with slight unnatural tilt or shift
minimal eerie presence`,
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
  return `a narrow Japanese residential alley at dusk with concrete walls, pavement texture, utility poles, one streetlight, roadside guardrail, and clear depth receding behind the character`;
}



  if (names.includes("花子さん")) {
    return `an old school corridor or stairwell with soft ambient brightness, worn walls, classroom windows, floor reflections, and clear perspective depth`;
  }

if (names.includes("貞子")) {
  return `a dim old indoor corridor with worn walls, wooden or tiled floor, door frames, weak ceiling light, and clear perspective depth extending behind the character`;
}



  if (names.includes("雪女")) {
    return `a softly lit winter roadside, shrine path, or snowy open space with pale snow, airy mist, and light blue-gray atmosphere`;
  }

if (names.includes("鬼女")) {
  return `a shrine approach at dusk with stone steps, red torii gates, lanterns, trees, and shrine buildings clearly visible behind the character`;
}

if (names.includes("ろくろ首")) {
  return `a traditional Japanese hallway with wooden pillars, sliding doors, warm lantern light, visible floor lines, and quiet spatial depth extending behind the character`;
}



  if (names.includes("のっぺらぼう")) {
    return `a quiet evening street or old corridor with soft light, subtle emptiness, walls or railings, and simple but eerie environmental depth`;
  }


  if (names.includes("河童")) {
    return `a quiet riverside with stone edges, shallow reflections, grass, bridge or embankment hints, and subdued folkloric atmosphere in dim evening light`;
  }

if (names.includes("天狗")) {
  return `a mountain shrine approach with clearly visible stone steps, red torii gates, lanterns, cedar trees, and layered shrine-path depth behind the character`;
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
- the character should appear slightly smaller within the canvas
- ensure visible space above the head and around the body
- do not place the face close to the top edge
- keep the entire silhouette comfortably inside the frame
- background should be clearly visible behind the character
- maintain comfortable margins on all sides
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
- the character should appear slightly smaller within the canvas
- ensure visible space above the head and around the body
- background should be clearly visible behind the character
- maintain comfortable margins on all sides
`;

  return `
Japanese urban legend fusion character illustration.

Core style:
- stylized creature illustration
- simplified character design, but background must retain structural detail
- strong deformation and readability
- bold clean outline
- flat colors with minimal shading
- no realistic texture
- no painterly rendering
- no semi-realistic style
- smooth clean surfaces
- large readable shapes
- slightly exaggerated proportions
- slightly larger head and eyes
- simple facial features
- iconic silhouette design
- high contrast color separation
- clean but not empty background, maintain environmental detail
- easy to recognize at a glance
- resembles trading card game creature illustration
- full body
- centered composition
- one character only
- light eerie atmosphere
- soft environmental storytelling
- brighter than horror imagery
- slightly uncanny but not horror
- not grotesque
- no gore
- no excessive blood
- no excessive detail in character, but keep environmental detail in background
- no cinematic lighting
- no realistic lighting
- evenly lit, soft shading only
- background must remain visible even when the character is dynamic
- strongly stylized proportions
- simplified anatomy
- rounded and soft shapes
- minimal detail in hands and fingers
- reduce realism in body structure
- cartoon-like body proportions
- no realistic human anatomy

Absolute rules:
- this must be ONE unified character only
- do NOT show two separate characters
- do NOT split the body into left and right halves
- do NOT create collage, comparison sheet, or character lineup
- do NOT make it look like cosplay
- do NOT add text, logo, caption, frame, UI, or watermark
- the character must remain the clear main subject
- do NOT let the background overpower the character
- avoid overly cluttered scenery but keep clear environmental structures visible
- avoid overly busy composition
- avoid large background objects competing with the subject
- keep the face and body clearly readable
- overall lighting should be softly bright, dusk-like, or gently lit, not horror-dark
- avoid heavy shadow that makes the character too frightening
- keep the image suitable for social sharing and visually catchy
- maintain an eerie tone without becoming grotesque horror
- only one head
- no extra faces
- no duplicated body parts
- the neck must connect to a single head
- no twin head
- no second face

Character fusion:
Primary influence: ${first.name} (${blend.p1}%)
Secondary influence: ${second.name} (${blend.p2}%)

${modeInstruction}

${compositionRule}


Background:
- a detailed environment background is mandatory
- never use plain, blank, gradient, studio, or single-color background
- the scene must clearly show a real place in Japan
- use this setting: ${backgroundDirection}
- include visible ground plane, depth, and at least 3 environmental elements
- examples of environmental elements: walls, corridors, windows, railings, steps, trees, stones, water edges, lanterns, snow, room structures
- the character must be clearly grounded in the environment, not floating
- the background must stay readable and clearly visible behind the character
- background structures must remain identifiable at first glance
- do not reduce the environment to vague blur, fog, or abstract color
- for strong-presence characters like 鬼女, 口裂け女, and 天狗, the setting must occupy a meaningful visible portion of the composition
- the environment should support the character's world without overpowering the character





Face:
- calm and neutral expression
- very subtle emotion
- slightly distant gaze
- quiet and mysterious feeling
- not overly expressive
- balanced between eerie and calm
- slightly cute but restrained
- elegant and minimal facial detail
- gentle and approachable rather than scary
- avoid overly sharp or horror-like teeth
- keep the face readable and not grotesque
- slight visible eye highlights
- expression should feel slightly alive and personable

Pose and motion:
- add subtle pose variation
- slight body twist or gentle weight shift
- natural asymmetry in arms or shoulders
- one hand may be slightly raised or softly interacting with space
- subtle movement in hair or clothing is allowed
- prefer stillness over strong action
- avoid exaggerated motion
- avoid symmetrical front-facing standing pose
- do not default to a perfectly neutral standing pose


Framing:
- compose for a wider frame
- use a full-body composition
- the entire character must fit comfortably inside the frame
- do not crop hair, hands, sleeves, or feet
- leave a small margin above the head and below the feet
- reduce excessive empty space on both sides
- the character should occupy about 55 to 60 percent of the canvas height
- ensure visible ground space below the feet





Design intent:
- create a strange new creature, not two characters standing together
- use the dominant character as the main silhouette and personality base
- blend the secondary character through facial structure, body details, expression, texture, posture, aura, or iconic motifs
- the visual balance must clearly reflect the percentage difference
- memorable, uncanny, slightly disturbing, but still visually appealing
- the image should feel like a trading card character portrait with environmental mood
- prioritize simplicity over realism
- prioritize shape over texture
- prioritize silhouette over detail
- avoid realistic anatomy
- avoid complex lighting

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
        size: "1536x1024",
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