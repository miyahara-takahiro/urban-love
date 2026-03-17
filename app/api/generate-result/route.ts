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

function resolveName(id: string) {
  return CHARACTERS.find((c) => c.id === id)?.name || id;
}

function buildTemplate(main: RankedType, sub: RankedType, badName: string, goodName: string) {
  return `
【基本性格】
普段は${main.name}のように${main.traits.behavior}傾向があります。
一方で内側には${sub.name}のように${sub.traits.behavior}側面もあります。
表に見える顔と、内側で動いている感情のあいだに少し差があるタイプです。

【対人関係】
人との距離は${main.name}のような関わり方になりやすく、
そこへ${sub.name}の影響が混ざることで、相手の変化にも敏感になりやすいです。
近づき方そのものより、残り方に個性が出やすいタイプです。

【恋愛傾向】
恋愛では${main.name}の距離感と、${sub.name}の感情の動きが混ざります。
最初の見え方と、気持ちが動いた後の出方に差が出やすいです。
関係が深くなるほど、その二面性がはっきりしていきます。

【隠れた欲求】
心の奥では、${sub.name}の性質として強く求めているものがあります。
表には出さなくても、曖昧さや温度差には反応しやすいほうです。
自分でも説明しにくいこだわりが残りやすいタイプです。

【⚠ 危険な相性】
${badName}

【◎ 元に戻れる相手】
${goodName}
`.trim();
}

function buildSystemPrompt(toneMain: string, toneSub: string, gender: Gender) {
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
- 既存の役割に縛られず、読めなさや二面性をやや強めに出す
`;

  return `
あなたは「都市伝説キャラが混ざった人格」を診断結果として書く専門ライターです。
文章は必ず自然な日本語で書いてください。

【最重要ルール】
- 出力構造は絶対に変えない
- 以下の見出しをこの順番のまま使う

【基本性格】
【対人関係】
【恋愛傾向】
【隠れた欲求】
【⚠ 危険な相性】
【◎ 元に戻れる相手】

【文章の方向性】
- 共感できるリアルさ 60%
- 都市伝説らしい不穏さ 40%
- 少し長めで満足感のある文章
- 各項目は3〜5文程度
- 普通の性格診断に見えすぎない
- でも気持ち悪すぎたり、怖すぎたりはしない
- 最後に1文だけ、少し怪奇っぽい余韻を入れる

【キャラの使い方】
- キャラはラベルではなく、行動や感情として自然に混ぜる
- 「〇〇タイプです」だけで終わらせない
- 必ず2キャラの役割差が分かるように書く
- 単純に半々で混ぜず、次のいずれかで表現する
  1. 普段の顔 × 感情が動いたとき
  2. 外から見える印象 × 内側の本音
  3. 行動の仕方 × 相手に残す影響

【今回の文体】
- メインキャラの文体: ${toneMain}
- サブキャラの文体: ${toneSub}
- この2つのトーンを混ぜて書く

【性別の出方】
${genderRule}

【各見出しの役割】
- 【基本性格】: 普段の性格、外から見える印象、内側とのズレ
- 【対人関係】: 距離感、関わり方、相手にどう残るか
- 【恋愛傾向】: 感情が動いたときの変化、二面性、関係が深くなったときの出方
- 【隠れた欲求】: 自分でも言語化しきれていない本音、執着、安心への欲求
- 【⚠ 危険な相性】: 必ずキャラ名を出し、なぜぶつかるかを書く
- 【◎ 元に戻れる相手】: 必ずキャラ名を出し、なぜ落ち着けるかを書く

【相性のルール】
- 【⚠ 危険な相性】と【◎ 元に戻れる相手】は、キャラ名で始める
- その相手となぜ噛み合わない／落ち着くのかを具体的に書く
- 相手キャラを悪者や聖人にしない

【禁止】
- グロテスク表現
- 呪い、死、殺す等の直接的ホラー
- 断定しすぎる表現
- 抽象的すぎる一般論
- ただの優等生っぽい性格診断
- キャラごとの設定説明の羅列

【理想】
- 「この2キャラが混ざってる意味が分かる」
- 「少し言い過ぎなくらい当たってる」
- 「最後に1文だけゾクッとする」
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
      return NextResponse.json(
        { error: "Missing required payload" },
        { status: 400 }
      );
    }

    const badName = resolveName(bad);
    const goodName = resolveName(good);

    const toneMain = TONE_MAP[main.id] ?? "静かで自然な語り";
    const toneSub = TONE_MAP[sub.id] ?? "少し不穏さのある語り";

    const systemPrompt = buildSystemPrompt(toneMain, toneSub, gender ?? "other");
    const userPrompt = buildTemplate(main, sub, badName, goodName);

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
      return NextResponse.json(
        { error: "No result generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("generate-result error:", error);
    return NextResponse.json(
      { error: "Result generation failed" },
      { status: 500 }
    );
  }
}