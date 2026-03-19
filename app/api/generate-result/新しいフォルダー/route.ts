import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const CHARACTERS = [
  { id: "kuchisake", name: "口裂け女" },
  { id: "hanako", name: "花子さん" },
  { id: "sadako", name: "貞子" },
  { id: "yukionna", name: "雪女" },
  { id: "tengu", name: "天狗" },
  { id: "kappa", name: "河童" },
  { id: "hitotsume", name: "一つ目小僧" },
  { id: "rokuro", name: "ろくろ首" },
  { id: "noppera", name: "のっぺらぼう" },
  { id: "zashiki", name: "座敷童" },
  { id: "nurarihyon", name: "ぬらりひょん" },
  { id: "kijo", name: "鬼女" },
] as const;

const TONE_MAP: Record<string, string> = {
  kuchisake: "相手の反応を気にする、少し踏み込んだ言い回し",
  hanako: "静かで淡々としていて、内側に感情を溜める語り",
  sadako: "静かで余韻が強く、後から効いてくるような語り",
  yukionna: "冷静で温度が低く、距離を感じる語り",
  tengu: "自信があり、少し上から見ているような語り",
  kappa: "合理的で現実的、感情より判断を優先する語り",
  hitotsume: "観察的で分析寄り、違和感を見逃さない語り",
  rokuro: "距離感を越えて踏み込む、執着のにじむ語り",
  noppera: "曖昧で本音を見せず、輪郭をぼかす語り",
  zashiki: "やわらかく安心感があるが、離れにくさを含む語り",
  nurarihyon: "自然体で掴めず、気づくと入り込んでいる語り",
  kijo: "感情が強く、嫉妬や怒りの熱を少し含んだ語り",
};

type Gender = "male" | "female" | "other";

type CharacterTraits = {
  behavior: string;
  emotion: string;
  love: string;
};

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
  traits: CharacterTraits;
  score: number;
};

type ResultMode = "single" | "dominant-dual" | "balanced-dual";

function resolveName(id: string) {
  return CHARACTERS.find((c) => c.id === id)?.name || id;
}

function inferResultMode(main: RankedType, sub: RankedType): ResultMode {
  const diff = (main.score ?? 0) - (sub.score ?? 0);

  if (diff >= 12) return "single";
  if (diff >= 7) return "dominant-dual";
  return "balanced-dual";
}

function buildBlendLabel(mode: ResultMode, main: RankedType, sub: RankedType) {
  if (mode === "single") return `${main.name}単独型`;
  if (mode === "dominant-dual") return `${main.name}寄り${sub.name}型`;
  return `${main.name}${sub.name}混成型`;
}

function buildTemplate(
  main: RankedType,
  sub: RankedType,
  badName: string,
  goodName: string,
  mode: ResultMode
) {
  const blendLabel = buildBlendLabel(mode, main, sub);

  const dualityLine =
    mode === "single"
      ? `今回は${main.name}の性質がかなり明確に強く、全体として一本芯の通った出方になっています。`
      : mode === "dominant-dual"
      ? `今回は${main.name}が主軸ですが、内側には${sub.name}らしい反応も残っていて、場面によって印象が少し変わります。`
      : `今回は${main.name}と${sub.name}の両方がかなり近く出ていて、表に見える顔と感情が動いたときの顔にズレが出やすいタイプです。`;

  const basicBlock =
    mode === "single"
      ? `
【基本性格】
今回の結果は「${blendLabel}」です。
普段は${main.traits.behavior}という形で性格が出やすく、外から見た印象もかなり分かりやすいタイプです。
${main.publicMask}と見られやすい一方で、本音では${main.innerCore}という部分を強く持っています。
${dualityLine}
`.trim()
      : `
【基本性格】
今回の結果は「${blendLabel}」です。
普段は${main.traits.behavior}という形で性格が出やすく、第一印象では${main.publicMask}と見られやすいです。
ただ本音では${sub.traits.behavior}や${sub.traits.emotion}も混ざり、外から見える印象と内側の濃さに少し差が出ます。
${dualityLine}
`.trim();

  const relationshipBlock =
    mode === "single"
      ? `
【対人関係】
人との関わり方には${main.traits.behavior}傾向がそのまま出やすいです。
相手との距離感でも${main.risk}が弱くにじみやすく、曖昧なやり取りをあまりそのままにできません。
表向きには落ち着いていても、内側では関係の温度差をかなり正確に拾っています。
だから相手には、あとから印象が強く残りやすいです。
`.trim()
      : `
【対人関係】
人との関わり方には${main.traits.behavior}傾向が出やすいです。
ただ関係が深くなると${sub.traits.emotion}がにじみやすく、相手の言動を思った以上に受け取りやすくなります。
距離感そのものより、相手からどう見えるか、どこまで本音を見せるかに個性が出やすいです。
そのズレがあるからこそ、関係が浅い時と深い時で印象が変わりやすいです。
`.trim();

  const loveBlock =
    mode === "single"
      ? `
【恋愛傾向】
恋愛になると${main.traits.love}という出方がかなり強くなります。
好きな相手には分かりやすく気持ちが向きやすく、曖昧な距離感には我慢し続けにくいです。
優しさもある一方で、${main.loveWarning}という面が出ると一気に空気が変わります。
そこで関係が軽く終わらず、相手の中に残りやすくなります。
`.trim()
      : `
【恋愛傾向】
恋愛になると${main.traits.love}という出方がベースになります。
そこに${sub.traits.love}傾向が混ざるので、最初の印象と関係が深まってからで見え方が変わりやすいです。
近づき方は一つに見えても、内側ではかなり細かく温度差を見ています。
そのため、恋人になると二面性のある恋愛スタイルになりやすいです。
`.trim();

  const hiddenBlock =
    mode === "single"
      ? `
【隠れた性格】
あなたの内面には${main.traits.emotion}のような濃さがあります。
本人は普通に反応しているつもりでも、実際にはかなり強く印象を受け取っていることが多いです。
特に曖昧さや放置には鈍くなく、納得できる形を求める気持ちが強めです。
それを表に出し切らない時ほど、静かな圧として残りやすいです。
`.trim()
      : `
【隠れた性格】
あなたは内面に${sub.traits.emotion}のようなものを秘めています。
そのため、曖昧な関係や温度差には思った以上に反応しやすいです。
表では平気そうでも、内側では納得できる形をかなり求めています。
その見えにくさがあるぶん、本人より先に相手が濃さに気づくことがあります。
`.trim();

  return `
${basicBlock}

${relationshipBlock}

${loveBlock}

${hiddenBlock}

【⚠ 相性の悪い相性】
${badName}
自分の反応を受け止めてもらえない、もしくは主導権の取り合いになりやすい相手です。
気持ちの濃さや距離感の違いが噛み合わないと、関係が急に重くなりやすいです。

【◎ 相性の良い相手】
${goodName}
あなたの濃さや距離感を無理に否定せず、自然に整えてくれる相手です。
感情の持ち方やテンポが噛み合うと、関係が深くなっても崩れにくいです。
`.trim();
}

function buildSystemPrompt(
  toneMain: string,
  toneSub: string,
  gender: Gender,
  mode: ResultMode
) {
  const genderRule =
    gender === "male"
      ? `
- 男性向けの出方として、感情は内側に溜め込みやすく、表には遅れて出るニュアンスを入れる
- ただし鈍感・不器用と決めつけず、内側の濃さや執着がじわっと出る書き方にする
`
      : gender === "female"
      ? `
- 女性向けの出方として、感情は関係の中で動きやすく、距離感や温度差に反応が出やすいニュアンスを入れる
- ただし重い・依存的と決めつけず、静かさの奥に濃さがある書き方にする
`
      : `
- 性別に寄せすぎず、外から見える顔と内側の濃さにズレがある書き方にする
- 読めなさや二面性をやや強めに出す
`;

  const modeRule =
    mode === "single"
      ? `
- 今回は単独型として扱う
- サブキャラは補助的な参照までに留める
- 二面性を無理に作らない
- 全体として一本芯の通った人格像にする
`
      : mode === "dominant-dual"
      ? `
- 今回はメイン優勢の寄り型として扱う
- メインキャラを7割、サブキャラを3割くらいの体感で混ぜる
- 普段の顔はメイン、感情が動いた時だけサブが出る構図にする
`
      : `
- 今回は混成型として扱う
- 2キャラが近い強さで混ざっている前提で書く
- 表の顔と内側の反応にズレが出る構図を自然に作る
- ただしキャラ名の連呼はしない
`;

  return `
あなたは「都市伝説キャラが混ざった人格」を、分かりやすく具体的に言語化する診断ライターです。
文章は必ず自然な日本語で書いてください。

【絶対ルール】
- 出力構造は絶対に変えない
- 以下の見出しをこの順番のまま使う

【基本性格】
【対人関係】
【恋愛傾向】
【隠れた性格】
【⚠ 相性の悪い相性】
【◎ 相性の良い相手】

【文章の方向性】
- 抽象的すぎる表現を避ける
- 読んですぐ意味が分かるように書く
- 共感できるリアルさ 70%
- 都市伝説らしい不穏さ 30%
- 各項目は3〜5文
- 少し長めで、読みごたえはあるが回りくどくしない

【最重要】
- キャラ名の連呼は禁止
- 各見出しの中で、キャラ名を出すのは多くても1回まで
- 「〇〇のように」を何度も使わない
- キャラ説明は、具体的な行動や反応に変換する


【救いのルール（必須）】
- 各見出しに必ず1文ポジティブを入れる
- 弱さ → 強みに変換する
- ネガだけで終わらせない


【良い書き方の例】
- 「相手の反応を確かめたくなる」
- 「表には出さないまま長く引きずりやすい」
- 「小さな違和感を見逃さない」
- 「距離を取っているのに印象は残りやすい」

【悪い書き方の例】
- 「花子さんのように〜、さらに貞子のように〜、また花子さんのように〜」
- 「不思議な気配」「奇妙な存在感」だけで終わる説明
- 意味が曖昧な怪奇表現で締める

【キャラの混ぜ方】
${modeRule}

【文体】
- メインキャラの文体: ${toneMain}
- サブキャラの文体: ${toneSub}
- ただし文体差を優先しすぎて読みにくくしない

【性別の出方】
${genderRule}

【各見出しの役割】
- 【基本性格】: 普段の性格、外から見える印象、内面とのズレ
- 【対人関係】: 距離感、関わり方、相手にどう見えるか
- 【恋愛傾向】: 恋愛観や、恋人になるとどうなるか
- 【隠れた性格】: 本人が自覚していない内面や本音や性格
- 【⚠ 相性の悪い相性】: キャラ名を出し、何故相性が悪いのかを具体的に書く
- 【◎ 相性の良い相手】: キャラ名を出し、なぜ相性がいいのかを具体的に書く

【最後の1文ルール】
- 各見出しの最後の1文は、意味の分かる余韻にする
- 雰囲気だけの怪奇表現は禁止
- 「だから相手の中に残りやすい」「そこで関係が重くなりやすい」など、
  内容を補強する締めにする

【禁止】
- 抽象的すぎる一般論
- キャラ名の繰り返し
- 比喩の多用
- 意味の分からない締め
- グロテスク表現
- 呪い、死、殺す等の直接的ホラー

【理想】
- 分かりやすい
- 具体的
- 少しだけ不穏
- キャラの個性は出るが、くどくない
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { main, sub, bad, good, gender } = (await req.json()) as {
      main: RankedType;
      sub: RankedType;
      bad: string;
      good: string;
      gender: Gender;
    };

    if (!main || !sub || !bad || !good) {
      return NextResponse.json({ error: "Missing required payload" }, { status: 400 });
    }

    const badName = resolveName(bad);
    const goodName = resolveName(good);

    const toneMain = TONE_MAP[main.id] ?? "静かで自然な語り";
    const toneSub = TONE_MAP[sub.id] ?? "少し不穏さのある語り";
    const mode = inferResultMode(main, sub);

    const systemPrompt = buildSystemPrompt(toneMain, toneSub, gender ?? "other", mode);
    const userPrompt = buildTemplate(main, sub, badName, goodName, mode);

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim();

    if (!result) {
      return NextResponse.json({ error: "No result generated" }, { status: 500 });
    }

    return NextResponse.json({
      result,
      meta: {
        mode,
        label: buildBlendLabel(mode, main, sub),
      },
    });
  } catch (error) {
    console.error("generate-result error:", error);
    return NextResponse.json({ error: "Result generation failed" }, { status: 500 });
  }
}