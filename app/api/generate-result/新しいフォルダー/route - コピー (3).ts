import { NextRequest, NextResponse } from "next/server";

type ResultMode = "single" | "dominant-dual" | "balanced-dual";

type Character = {
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

// true にするとAI版を使用
const USE_AI_RESULT_TEXT = true;

// 開発中にリクエスト側から上書きしたい時は true
const ALLOW_REQUEST_OVERRIDE = true;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      main: Character;
      sub?: Character;
      mode: ResultMode;
      useAI?: boolean;
    };

    const { main, sub, mode } = body;

    if (!main || !mode) {
      return NextResponse.json(
        { error: "main と mode は必須です" },
        { status: 400 }
      );
    }

    const useAI =
      ALLOW_REQUEST_OVERRIDE && typeof body.useAI === "boolean"
        ? body.useAI
        : USE_AI_RESULT_TEXT;

    const text = useAI
      ? await generateResultTextAI(main, sub, mode)
      : generateResultText(main, sub, mode);

    return NextResponse.json({
      text,
      mode,
      usedAI: useAI,
    });
  } catch (error) {
    console.error("generate-result route error:", error);
    return NextResponse.json(
      { error: "結果文の生成に失敗しました" },
      { status: 500 }
    );
  }
}

/* =========================
   ルールベース版
========================= */

function generateResultText(
  main: Character,
  sub?: Character,
  mode: ResultMode = "single"
) {
  return [
    buildBasic(main, sub, mode),
    buildRelation(main, sub, mode),
    buildLove(main, sub, mode),
    buildHidden(main, sub, mode),
    buildBadCompatibility(main, sub, mode),
    buildGoodCompatibility(main, sub, mode),
  ].join("\n\n");
}

function buildBasic(
  main: Character,
  sub?: Character,
  mode: ResultMode = "single"
) {
  if (mode === "single" || !sub) {
    return `【基本性格】
あなたは「${main.scaryTitle}」。

${main.vibe}。

周囲からは、${main.publicMask} と受け取られやすいタイプです。
ただ、その印象の奥には ${main.innerCore} という深い性質があります。

あなたの大きな魅力は、${main.gift} にあります。
${main.traits.behavior} という動きが自然にできるため、無理に目立たなくても独自の存在感が残りやすいでしょう。`;
  }

  if (mode === "dominant-dual") {
    return `【基本性格】
あなたは「${main.name}」の性質を中心に持ちながら、
その内側に「${sub.name}」の気配も抱えているタイプです。

普段は ${main.publicMask} と見られやすく、
行動や判断の軸にも ${main.traits.behavior} がはっきり表れます。
そのため、第一印象では ${main.name} の色がかなり強く出ます。

ただし感情が深く動いた時や、安心できる相手の前では
${sub.innerCore} という面も顔を出します。
その二層構造によって、${main.gift} という強みを持ちながらも、
単純に割り切れない複雑さと奥行きをあわせ持っています。`;
  }

  return `【基本性格】
あなたは「${main.name}」と「${sub.name}」、
二つの性質がほぼ同じ強さで混ざり合ったタイプです。

日常では ${main.publicMask} の傾向が出やすい一方で、
人間関係が深まったり心が揺れた場面では ${sub.innerCore} が前に出やすくなります。
そのため、場面によって印象が少し変わりやすい人でもあります。

あなたの魅力は、${main.gift} と ${sub.gift} を両方持っているところです。
片方だけなら割り切れたはずの感情や判断を、
あえて一つに決めきらず抱えられるところに、独特の深みがあります。`;
}

function buildRelation(
  main: Character,
  sub?: Character,
  mode: ResultMode = "single"
) {
  if (mode === "single" || !sub) {
    return `【対人関係】
対人面では、${main.traits.behavior} という形で人と関わる傾向があります。

あなたは ${main.publicMask} と見られやすいため、
無理に広く繋がるより、心地よい距離感を保ちながら関係を築く方が得意です。
そのぶん、相手にとっては安心感や落ち着きを感じやすい存在でもあります。

一方で、${main.risk} という面もあるため、
気を遣いすぎたり、自分のペースを崩す相手と長く関わると疲れやすいでしょう。`;
  }

  if (mode === "dominant-dual") {
    return `【対人関係】
対人関係では、基本的に ${main.traits.behavior} という
${main.name} 的な関わり方が土台になります。

普段のあなたは ${main.publicMask} と映りやすく、
人との距離も比較的わかりやすいタイプです。
ただ、相手との関係が深まると ${sub.traits.emotion} という
${sub.name} 側の反応も出やすくなります。

そのため、表向きは安定して見えても、
内側ではかなり繊細に相手を見ていることが少なくありません。
${main.gift} を持ちながらも、${sub.risk} という揺れが加わることで、
人付き合いの中に独特の温度差が生まれやすいでしょう。`;
  }

  return `【対人関係】
対人面では、${main.name} の ${main.traits.behavior} と、
${sub.name} の ${sub.traits.emotion} が同時に働きやすいタイプです。

そのため、人と自然に関われる時と、
急に距離や空気を気にしてしまう時の差が出やすいでしょう。
周囲からは一見つかみづらく見えても、
実際にはかなり丁寧に人との温度を見ています。

あなたは ${main.gift} と ${sub.gift} を持っているので、
表面的な付き合いよりも、ちゃんと意味のある関係を育てやすい人です。
ただし、${main.risk} と ${sub.risk} が重なる場面では、
気疲れや遠慮が強くなりやすいので注意が必要です。`;
}

function buildLove(
  main: Character,
  sub?: Character,
  mode: ResultMode = "single"
) {
  if (mode === "single" || !sub) {
    return `【恋愛傾向】
恋愛では、${main.traits.love} という出方をしやすいタイプです。

好きになった相手に対しては、
${main.gift} をそのまま関係の中へ持ち込みやすく、
自分なりの誠実さや温度で関係を築こうとします。
派手さよりも、関係の空気や信頼の積み重ねを大切にする恋愛になりやすいでしょう。

ただし、${main.loveWarning} という傾向もあります。
安心したい気持ちが強くなるほど、その反動で不安や我慢が深くなりやすいため、
恋愛では「ちゃんと頼ること」も大切になります。`;
  }

  if (mode === "dominant-dual") {
    return `【恋愛傾向】
恋愛では、最初の出方は ${main.name} の性質が強く、
${main.traits.love} という形で好意が表れやすいでしょう。

関係の入り口では ${main.publicMask} の雰囲気が出やすいため、
相手からは比較的わかりやすい印象を持たれやすいはずです。
そして恋愛の中でも、${main.gift} がそのまま魅力として伝わりやすいでしょう。

ただ、気持ちが深くなるほど ${sub.name} 側の性質も強くなります。
とくに内面では ${sub.traits.love} という反応が出やすく、
表では落ち着いて見えても、心の中ではかなり濃く相手を思っていることがあります。

そのため恋愛では、
${main.loveWarning} だけでなく ${sub.loveWarning} も起こりやすいです。
好きになるほど単純ではなくなるぶん、言葉にして確かめ合える相手との方がうまくいきやすいでしょう。`;
  }

  return `【恋愛傾向】
恋愛では「${main.name}」と「${sub.name}」の両方がかなり強く出ます。

好意の見せ方としては、${main.traits.love} という面と、
${sub.traits.love} という面が両方あるため、
自分でも恋愛中の温度差に驚くことがあるかもしれません。
近づきたい気持ちと、簡単には踏み込みたくない気持ちが同時に動きやすいタイプです。

一方で、その複雑さは弱さではなく深さでもあります。
${main.gift} と ${sub.gift} を恋愛に持ち込めるため、
表面的な関係よりも、空気・信頼・感情の流れまで含めて相手を大切にできるでしょう。

ただし、恋愛では
${main.loveWarning} という面と、
${sub.loveWarning} という面が重なりやすくなります。
関係が曖昧なままだと不安が増幅しやすいので、
安心できる土台をどう作るかが鍵になります。`;
}

function buildHidden(
  main: Character,
  sub?: Character,
  mode: ResultMode = "single"
) {
  if (mode === "single" || !sub) {
    return `【隠れた性格】
表には出にくい部分では、${main.innerCore} という性質があります。

この内側の深さがあるからこそ、
あなたの ${main.gift} はただの長所ではなく、
ちゃんと相手や状況に届く力として働きます。
外から見える印象よりも、実際のあなたはずっと繊細で、よく考えている人です。

その反面、${main.risk} という形で
心の疲れや不安を内側に溜め込みやすいところもあります。
見えない場所で抱えすぎた時ほど、本来の良さが出にくくなるでしょう。`;
  }

  if (mode === "dominant-dual") {
    return `【隠れた性格】
表では ${main.name} の性質が前に出やすいあなたですが、
深い部分では ${sub.innerCore} という
${sub.name} 側の感情の持ち方が強く影響しています。

普段は ${main.publicMask} と見られやすいため、
周囲からは比較的わかりやすい人だと思われやすいかもしれません。
けれど実際には、その下に ${sub.traits.emotion} という
繊細で複雑な反応が眠っています。

この二層構造があるからこそ、
あなたは ${main.gift} だけでなく ${sub.gift} も持てます。
ただし、無理を続けると ${main.risk} に加えて ${sub.risk} も出やすくなり、
外側より内側の消耗が先に大きくなるでしょう。`;
  }

  return `【隠れた性格】
あなたの内面には、「${main.name}」の深さと「${sub.name}」の深さが同時にあります。

表から見える印象だけでは読みきれず、
実際には ${main.innerCore} と ${sub.innerCore} が
場面によって入れ替わるように動いています。
そのため、自分でも気分や対人距離の変化を大きく感じることがあるはずです。

ただ、この複雑さは不安定さだけではありません。
${main.gift} と ${sub.gift} が重なることで、
人の感情や空気を一段深く理解できる力になっています。

一方で、無理が続くと ${main.risk} と ${sub.risk} の両方が表に出やすくなります。
あなたに必要なのは、感情を整理する時間と、
ちゃんと安心できる相手や場所を持つことです。`;
}

function buildBadCompatibility(
  main: Character,
  sub?: Character,
  mode: ResultMode = "single"
) {
  if (mode === "single" || !sub) {
    return `【⚠ 相性の悪い相手】
あなたと噛み合いにくいのは、
感情や距離感を雑に扱うタイプです。

あなたは ${main.gift} を大切にする人なので、
急に踏み込みすぎたり、配慮なく関係を動かしてくる相手とは
少しずつストレスが溜まりやすいでしょう。

特に、${main.risk} を刺激してくるような相手とは、
自分でも気づかないうちに疲弊しやすくなります。`;
  }

  return `【⚠ 相性の悪い相手】
あなたと噛み合いにくいのは、
${main.name} の持つ ${main.gift} も、
${sub.name} の持つ ${sub.gift} も理解しようとしない相手です。

表面的には合わせられていても、
感情の扱いが雑だったり、距離の詰め方が極端だったりすると、
${main.risk} と ${sub.risk} の両方が刺激されやすくなります。

とくに「わかりやすさ」だけを求めてくる相手とは、
あなたの複雑さや深さが負担として処理されやすいため、相性はあまり良くありません。`;
}

function buildGoodCompatibility(
  main: Character,
  sub?: Character,
  mode: ResultMode = "single"
) {
  if (mode === "single" || !sub) {
    return `【◎ 相性の良い相手】
あなたと相性が良いのは、
距離感を急がず、自然な形で信頼を育ててくれる相手です。

あなたの ${main.gift} を無理なく受け取り、
必要な時にはちゃんと言葉にして返してくれる人とは、
安心感のある関係を作りやすいでしょう。

強く押す人よりも、
あなたのペースや温度を理解してくれる相手の方が長く続きやすいです。`;
  }

  return `【◎ 相性の良い相手】
あなたと相性が良いのは、
${main.name} の持つ ${main.gift} と
${sub.name} の持つ ${sub.gift} の両方を受け止められる相手です。

表に出ているあなたの性質だけで判断せず、
見えにくい感情や揺れも含めて理解しようとしてくれる人とは、
かなり深く安定した関係を築けるでしょう。

あなたには単純な相手よりも、
ペースを急がず、安心を言葉と行動の両方で示してくれる相手の方が合っています。
そういう相手となら、あなたの複雑さは弱さではなく魅力として機能します。`;
}

/* =========================
   AI版
========================= */

async function generateResultTextAI(
  main: Character,
  sub?: Character,
  mode: ResultMode = "single"
) {
  try {
    const prompt = buildAIPrompt(main, sub, mode);

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("OpenAI API error:", errorText);
      return generateResultText(main, sub, mode);
    }

    const data = await res.json();
    const text = extractResponseText(data);

    if (!text || typeof text !== "string") {
      return generateResultText(main, sub, mode);
    }

    return text.trim();
  } catch (error) {
    console.error("generateResultTextAI error:", error);
    return generateResultText(main, sub, mode);
  }
}

function buildAIPrompt(
  main: Character,
  sub?: Character,
  mode: ResultMode = "single"
) {
  return `
あなたは、都市伝説モチーフの性格診断サイトの結果文を書く日本語ライターです。

# 目的
- 読んだ人が「怖い」よりも「自分のこととして妙にわかる」と感じる文章を書く
- 分析っぽさはあるが、冷たすぎない
- 少しだけ不穏で神秘的な余韻を残す
- ただし、ネガティブ一辺倒にはしない
- 自己理解として納得感があることを優先する

# 禁止
- グロテスク
- 露骨なホラー描写
- 単なる脅し
- 抽象的すぎる言い回しの連発
- 同じ意味の反復
- 箇条書き
- セクション見出し以外の記号装飾

# 必須ルール
- 日本語で書く
- 以下の6セクションを、必ずこの順番・この見出しで出力する

【基本性格】
【対人関係】
【恋愛傾向】
【隠れた性格】
【⚠ 相性の悪い相手】
【◎ 相性の良い相手】

- 見出しごとに段落を書く
- mode に応じて文章量を変える
  - single: 各セクションやや簡潔
  - dominant-dual: 各セクション中くらい
  - balanced-dual: 各セクションやや厚め
- gift は必ず長所として自然に入れる
- risk は断定せず「〜しやすい」「〜になりやすい」で書く
- single は main を中心に書く
- dominant-dual は main が表、sub が内面や感情の揺れとして効くように書く
- balanced-dual は main と sub の二面性が両方わかるように書く
- 恋愛傾向と隠れた性格では、sub がいる場合は必ず sub の影響も反映する
- 最後の1文は、意味のある余韻で締める

# 文体
- やわらかいが安っぽくない
- 分析口調ベース
- 少しだけ都市伝説的
- 「あなたは〜です」が連続しすぎないようにする
- テンプレ感を弱めるため、自然な言い換えを入れる

# キャラ情報
mode: ${mode}

メイン:
${serializeCharacter(main)}

サブ:
${sub ? serializeCharacter(sub) : "なし"}

# 出力開始
`;
}

function serializeCharacter(c: Character) {
  return `
名前: ${c.name}
雰囲気: ${c.vibe}
外から見えやすい印象: ${c.publicMask}
内面の核: ${c.innerCore}
長所: ${c.gift}
弱点になりやすい点: ${c.risk}
都市伝説的な異名: ${c.scaryTitle}
恋愛で出やすい注意点: ${c.loveWarning}
対人行動: ${c.traits.behavior}
感情の動き: ${c.traits.emotion}
恋愛時の出方: ${c.traits.love}
`.trim();
}

function extractResponseText(data: any): string {
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  if (Array.isArray(data?.output)) {
    const texts: string[] = [];

    for (const item of data.output) {
      if (Array.isArray(item?.content)) {
        for (const content of item.content) {
          if (content?.type === "output_text" && typeof content?.text === "string") {
            texts.push(content.text);
          }
        }
      }
    }

    if (texts.length > 0) {
      return texts.join("\n").trim();
    }
  }

  return "";
}