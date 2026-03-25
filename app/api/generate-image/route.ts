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


  "口裂け女": `unsettling feminine urban legend energy
not violent
no excessive blood
not slasher horror
gentle forward lean with subtle reaching gesture
shareable eerie beauty`,

  "雪女": `quiet supernatural beauty
soft and distant presence
slightly melancholic feeling
not majestic
not horror-like
gentle drifting motion with slight body tilt
pale winter spirit mood`,


  "天狗": `folkloric supernatural presence
not heroic
not battle-character like
slightly strange proportions
light confident stance with subtle dynamic balance
traditional yokai mood`,

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

  "鬼女": `intense feminine supernatural presence
dramatic but elegant silhouette
not full demon monster
human-based uncanny woman
not gore
active stance with expressive movement but non-aggressive
not too horrifying`,

  "ろくろ首": `elongated neck motif
strange silhouette
not too grotesque
not body horror
slight unnatural stretch with gentle body tilt
human-based form with surreal extension`,

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


  if (names.includes("河童")) {
    return `a quiet riverside with stone edges, shallow reflections, grass, bridge or embankment hints, and subdued folkloric atmosphere in dim evening light`;
  }

  if (names.includes("天狗")) {
    return `a mountain shrine approach with stone steps, lanterns, trees, torii-like elements, and soft evening brightness`;
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

- avoid overly cluttered scenery but keep clear environmental structures visible

- avoid overly busy composition
- avoid large background objects competing with the subject
- keep the face and body clearly readable
- avoid plain empty background
- avoid blank white background
- avoid plain studio backdrop
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

Background direction:
- use a fitting Japanese urban-legend inspired setting
- ${backgroundDirection}
- include subtle environmental details such as walls, corridors, objects, textures, architecture, paths, railings, windows, water edges, stones, snow, mist, lanterns, or landscape elements
- add depth and perspective to the background
- include atmospheric lighting variation and gentle shadow
- keep the background readable, scenic, and slightly bright
- the background should feel like a place, not an empty backdrop
- use atmosphere rather than giant props
- the background should support the character's world, not dominate the image
- background is required and must not be simplified into a plain backdrop
- background should be clearly visible and not too faint or washed out
- maintain clear contrast between foreground and background elements




Background requirement:
- a detailed environment background is REQUIRED
- the background is mandatory and must always be present
- NEVER use a plain, empty, or single-color background
- the scene must clearly show a location (corridor, street, river, room, etc.)
- must include visible ground plane AND multiple environmental structures
- include at least two background elements such as walls, buildings, trees, railings, or interior structures
- the image must not look like a character on a blank backdrop
- the background must form a complete scene, not a partial or abstract space


Background enforcement:
- NEVER use plain, empty, or single-color background
- background must contain visible environmental elements at all times
- do not simplify the background into a flat backdrop
- even in minimal style, keep walls, floor, depth, or scenery visible
- the scene must clearly show a place, not a blank space
- do not replace the background with paper texture or plain gradient
- the character must be grounded in the environment (not floating on empty space)
- always include visible ground plane and depth behind the character


Environment anchoring:
- the character must be clearly standing on a visible surface connected to the environment
- the feet must be grounded in a detailed floor or terrain that extends into the background
- the ground must visually connect to a full environment, not fade into empty space



Background dominance control:
- background must remain present regardless of character intensity or expression
- do not remove or simplify the background even if the character is visually strong
- even if the character is expressive or visually dominant, keep the environment clearly visible



Environment dependency:
- the character must be interacting with or clearly placed within the environment
- the pose or composition should not make sense without a background
- the character should visually relate to the environment (touching ground, aligned with perspective, or interacting with space)




Face design:
- calm and neutral expression
- very subtle emotion
- slightly distant gaze
- quiet and mysterious feeling
- not smiling
- not expressive
- not fully emotionless
- faint melancholic presence
- soft eyes with minimal highlight
- slightly pale expression
- balanced between eerie and calm
- slightly cute but restrained
- elegant and minimal facial detail
- gentle and approachable rather than scary


- avoid overly sharp or horror-like teeth
- keep the face readable and not grotesque
- slightly soften the expression even if eerie



Expression override:
- add slight emotion to the face (not fully neutral)
- soft subtle smile OR gentle curious expression
- eyes must have visible highlights
- avoid empty, hollow, or fully black eyes
- expression should feel slightly alive and personable
- keep it approachable and shareable, not scary

Pose and motion:
- add slight dynamic pose (no stiff standing)
- slight body twist or weight shift
- natural asymmetry in arms or shoulders
- one hand slightly raised or interacting with space
- subtle movement in hair or clothing
- pose should reflect personality traits
- keep it simple but not static

Dynamic motion emphasis:
- create a clear sense of motion, not just a hand gesture
- the pose should feel captured mid-movement
- show visible weight shift through hips, shoulders, and legs
- add a slight forward lean, side step, or turning motion
- avoid symmetrical front-facing standing pose
- use flowing hair and sleeve movement to reinforce motion
- make the body feel alive and in action, not posed like a doll

Pose variation:
- avoid default or typical pose for the character type
- introduce variation in stance, gesture, and body angle
- do not repeat similar poses across different characters
- each character should feel slightly different in posture and movement




Motion priority:
- prioritize dynamic movement over perfectly centered or balanced pose
- even in full-body framing, keep a sense of motion and asymmetry
- do not default to a neutral standing pose






Framing override:
- use a zoomed-out full-body composition
- the entire character must fit comfortably inside the frame
- leave clear space above the head, below the feet, and on both sides
- do not crop hair, hands, sleeves, or feet
- keep generous margins around the full silhouette
- camera should be pulled back enough to show the whole body and surrounding background
- avoid close-up or near-close framing
- the character should occupy about 40 to 50 percent of the canvas height
- ensure visible ground space below the feet
- ensure clear space above the head




Framing rules (strict):
- the entire character must be fully visible within the frame
- DO NOT crop any part of the character
- full body must be shown from head to toe
- leave clear margin above the head and below the feet
- the character must not touch the image edges
- if any part would be cropped, adjust camera to include everything

Camera distance:
- use a zoomed-out full-body view
- avoid close-up framing
- the character should appear smaller within the frame
- prioritize full-body visibility over detail






Full-body motion:
- include movement in legs and hips, not just arms
- one leg slightly forward, stepping, or shifting weight
- hips and shoulders should not be parallel (twist the body slightly)
- avoid straight vertical posture







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