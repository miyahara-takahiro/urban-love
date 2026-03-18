"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

const USE_MOCK = false;
const RESULT_API_URL = "/api/generate-result";
const IMAGE_API_URL = "/api/generate-image";

const AXES = [
  "passion",
  "caution",
  "intuition",
  "reality",
  "attachment",
  "independence",
] as const;

type AxisKey = (typeof AXES)[number];
type AxisScores = Record<AxisKey, number>;
type Category = "self" | "emotion" | "romance" | "social";
type ViewMode = "intro" | "diagnosis" | "result";
type Gender = "male" | "female" | "other";

type QuestionOption = { label: string; score: Partial<AxisScores> };
type Question = {
  category: Category;
  text: string;
  visualEmoji: string;
  visualTitle: string;
  visualTag: string;
  colors: [string, string];
  options: QuestionOption[];
};

type CharacterTraits = {
  behavior: string;
  emotion: string;
  love: string;
};

type TypeDef = {
  id: string;
  name: string;
  vibe: string;
  axis: AxisScores;
  colors: [string, string];
  publicMask: string;
  innerCore: string;
  risk: string;
  gift: string;
  scaryTitle: string;
  loveWarning: string;
  traits: CharacterTraits;
  introHint?: string;
};

type RankedType = TypeDef & { score: number };

type GenerateResultPayload = {
  main: RankedType;
  sub: RankedType;
  bad: string;
  good: string;
  gender: Gender;
};

const ZERO: AxisScores = {
  passion: 0,
  caution: 0,
  intuition: 0,
  reality: 0,
  attachment: 0,
  independence: 0,
};

const q = (
  category: Category,
  visualEmoji: string,
  visualTitle: string,
  visualTag: string,
  text: string,
  colors: [string, string],
  options: QuestionOption[]
): Question => ({
  category,
  visualEmoji,
  visualTitle,
  visualTag,
  text,
  colors,
  options,
});

const questions: Question[] = [
  q(
    "self",
    "🧠",
    "ひとり時間",
    "alone",
    "ひとりで過ごす時間が続いたとき、いちばん近い感覚は？",
    ["#141e30", "#243b55"],
    [
      { label: "落ち着いて、自分のペースに戻れる", score: { independence: 2, reality: 1 } },
      { label: "少し寂しくなって誰かを思い出す", score: { attachment: 2, intuition: 1 } },
      { label: "いろんなことを考え始める", score: { intuition: 2, caution: 1 } },
      { label: "特に何も変わらず普通に過ごす", score: { reality: 2, caution: 1 } },
    ]
  ),

  q(
    "self",
    "🔥",
    "ハマり方",
    "obsession",
    "何かに興味を持ったとき、自分はどうなりやすい？",
    ["#1c1c1c", "#434343"],
    [
      { label: "気づいたらかなりのめり込んでいる", score: { attachment: 2, passion: 1 } },
      { label: "バランスを取りながら楽しむ", score: { reality: 2, caution: 1 } },
      { label: "ある程度で満足して飽きる", score: { independence: 2, reality: 1 } },
      { label: "そのときの気分で変わる", score: { passion: 2, intuition: 1 } },
    ]
  ),

  q(
    "self",
    "⚖️",
    "判断",
    "decision",
    "何かを決めるとき、いちばん近いのは？",
    ["#232526", "#414345"],
    [
      { label: "直感を信じて決める", score: { intuition: 2, passion: 1 } },
      { label: "慎重に考えてから決める", score: { caution: 2, reality: 1 } },
      { label: "現実的に損得で判断する", score: { reality: 2, caution: 1 } },
      { label: "その場の気分で決める", score: { passion: 2, independence: 1 } },
    ]
  ),

  q(
    "social",
    "👥",
    "距離感",
    "distance",
    "人と関わるときの距離感は？",
    ["#0f2027", "#2c5364"],
    [
      { label: "自然と距離が近くなりやすい", score: { attachment: 2, passion: 1 } },
      { label: "ちょうどいい距離を保てる", score: { reality: 2, caution: 1 } },
      { label: "少し距離を置くことが多い", score: { independence: 2, caution: 1 } },
      { label: "相手によって変わる", score: { caution: 1, intuition: 1, passion: 1 } },
    ]
  ),

  q(
    "social",
    "👀",
    "違和感",
    "sense",
    "相手のちょっとした違和感に気づいたときは？",
    ["#141e30", "#243b55"],
    [
      { label: "細かいところまで気になってしまう", score: { caution: 2, intuition: 1 } },
      { label: "なんとなく引っかかる程度", score: { intuition: 2, caution: 1 } },
      { label: "あまり気にしない", score: { reality: 2, independence: 1 } },
      { label: "気になるとずっと考えてしまう", score: { attachment: 1, caution: 1, intuition: 1 } },
    ]
  ),

  q(
    "emotion",
    "🫀",
    "感情",
    "emotion",
    "自分の感情はどちらかというと？",
    ["#1f1c2c", "#928dab"],
    [
      { label: "感情をそのまま表に出やすい", score: { passion: 2, attachment: 1 } },
      { label: "あまり感情は外に出さない", score: { independence: 2, caution: 1 } },
      { label: "感情はコントロールできる", score: { reality: 2, caution: 1 } },
      { label: "その場の状況によって変える", score: { caution: 2, intuition: 1 } },
    ]
  ),

  q(
    "emotion",
    "🕯",
    "記憶",
    "memory",
    "過去の出来事については？",
    ["#232526", "#000000"],
    [
      { label: "ずっと覚えていることが多い", score: { attachment: 2, intuition: 1 } },
      { label: "経験として整理して忘れる", score: { reality: 2, independence: 1 } },
      { label: "あまり引きずらない", score: { independence: 2, reality: 1 } },
      { label: "たまに思い出して考えてしまう", score: { intuition: 2, attachment: 1 } },
    ]
  ),

  q(
    "emotion",
    "💣",
    "不安",
    "anxiety",
    "不安やモヤっとした気持ちがあるときは？",
    ["#0f2027", "#2c5364"],
    [
      { label: "気持ちが強く揺れ不安になる", score: { passion: 2, attachment: 1 } },
      { label: "相手に伝えず内側に溜め込む", score: { attachment: 2, caution: 1 } },
      { label: "一度落ち着いてから考える", score: { caution: 2, reality: 1 } },
      { label: "考えずにその場から離れる", score: { independence: 2, reality: 1 } },
    ]
  ),

  q(
    "romance",
    "💬",
    "返信",
    "response",
    "好きな人に送ったメッセージが既読のまま返ってこない。そんなときは？",
    ["#141e30", "#243b55"],
    [
      { label: "何度も見返してしまう", score: { attachment: 2, caution: 1 } },
      { label: "何故か理由を考える", score: { caution: 2, intuition: 1 } },
      { label: "気にしないようにする", score: { reality: 2, independence: 1 } },
      { label: "少し距離を置こうと思う", score: { independence: 2, caution: 1 } },
    ]
  ),

  q(
    "romance",
    "🔥",
    "恋",
    "love",
    "誰かを好きになったときの自分に近いのは？",
    ["#232526", "#ff4e50"],
    [
      { label: "一気に気持ちが強くなる", score: { passion: 2, attachment: 1 } },
      { label: "相手をよく観察する", score: { caution: 2, intuition: 1 } },
      { label: "慎重に距離を保つ", score: { independence: 2, caution: 1 } },
      { label: "どこか運命のように感じる", score: { intuition: 2, passion: 1 } },
    ]
  ),

  q(
    "romance",
    "💔",
    "違和感",
    "unease",
    "相手の態度が少しだけ冷たくなったと感じたときは？",
    ["#000000", "#434343"],
    [
      { label: "気づかないふりをする", score: { attachment: 2, caution: 1 } },
      { label: "理由を知りたくなる", score: { caution: 2, intuition: 1 } },
      { label: "少し気持ちが冷める", score: { independence: 2, reality: 1 } },
      { label: "考えすぎかもしれないと思う", score: { reality: 2, caution: 1 } },
    ]
  ),

  q(
    "social",
    "👁",
    "観察",
    "observe",
    "人のことをどれくらい観察していると思う？",
    ["#232526", "#414345"],
    [
      { label: "細かい変化までよく見ている", score: { caution: 2, intuition: 1 } },
      { label: "なんとなく観察する程度", score: { intuition: 2, reality: 1 } },
      { label: "必要な時だけ観察する", score: { reality: 2, caution: 1 } },
      { label: "興味がある相手だけ", score: { passion: 1, attachment: 1, intuition: 1 } },
    ]
  ),

  q(
    "emotion",
    "🌙",
    "夜",
    "night",
    "夜に考え事をするときは？",
    ["#0f2027", "#2c5364"],
    [
      { label: "過去や人間関係を思い出す", score: { attachment: 2, intuition: 1 } },
      { label: "将来の可能性を考える", score: { caution: 2, intuition: 1 } },
      { label: "夜に考え事はしない", score: { reality: 2, independence: 1 } },
      { label: "ぼんやり考える程度", score: { intuition: 2, passion: 1 } },
    ]
  ),

  q(
    "self",
    "⚡",
    "衝動",
    "impulse",
    "衝動的に動くことは？",
    ["#141e30", "#243b55"],
    [
      { label: "よくある", score: { passion: 2, independence: 1 } },
      { label: "あまりない", score: { reality: 2, caution: 1 } },
      { label: "抑えることが多い", score: { caution: 2, reality: 1 } },
      { label: "状況次第", score: { intuition: 1, passion: 1, caution: 1 } },
    ]
  ),

  q(
    "romance",
    "💭",
    "未来",
    "future",
    "好きな人との未来については？",
    ["#232526", "#414345"],
    [
      { label: "幸せな未来を想像する", score: { intuition: 2, attachment: 1 } },
      { label: "現実的にどうなるか考える", score: { reality: 2, caution: 1 } },
      { label: "あまり先の事は考えない", score: { independence: 2, reality: 1 } },
      { label: "その時の気持ちで変わる", score: { passion: 2, intuition: 1 } },
    ]
  ),

  q(
    "emotion",
    "🧊",
    "防御",
    "defense",
    "傷つきそうだと感じたときは？",
    ["#0f2027", "#000000"],
    [
      { label: "先に距離を取り自分を守る", score: { independence: 2, caution: 1 } },
      { label: "関係を崩さないように耐える", score: { attachment: 2, caution: 1 } },
      { label: "一度落ち着いて考える", score: { caution: 2, reality: 1 } },
      { label: "気にしないように割り切る", score: { reality: 2, independence: 1 } },
    ]
  ),

  q(
    "social",
    "🫂",
    "信頼",
    "trust",
    "人を信じるときは？",
    ["#141e30", "#243b55"],
    [
      { label: "比較的信じやすい", score: { attachment: 2, passion: 1 } },
      { label: "慎重に判断して信じる", score: { caution: 2, reality: 1 } },
      { label: "あまり深く信じない", score: { independence: 2, caution: 1 } },
      { label: "状況を判断して決める", score: { reality: 2, intuition: 1 } },
    ]
  ),

  q(
    "self",
    "🎭",
    "本音",
    "mask",
    "自分の本音は？",
    ["#232526", "#414345"],
    [
      { label: "あまり見せない", score: { independence: 2, caution: 1 } },
      { label: "気にせずに出す", score: { passion: 2, attachment: 1 } },
      { label: "少し考えてから出す", score: { caution: 2, reality: 1 } },
      { label: "自分でもよくわからない", score: { intuition: 2, attachment: 1 } },
    ]
  ),

  q(
    "emotion",
    "🔥",
    "嫉妬",
    "jealous",
    "相手に嫉妬したときは？",
    ["#000000", "#ff4e50"],
    [
      { label: "強く嫉妬する", score: { attachment: 2, passion: 1 } },
      { label: "少し気になる程度", score: { caution: 2, reality: 1 } },
      { label: "あまり嫉妬しない", score: { reality: 2, independence: 1 } },
      { label: "相手との距離を取る", score: { independence: 2, caution: 1 } },
    ]
  ),

  q(
    "romance",
    "❤️",
    "怖さ",
    "fear",
    "恋愛で一番不安になりやすいのは？",
    ["#141e30", "#243b55"],
    [
      { label: "関係が終わること", score: { attachment: 2, intuition: 1 } },
      { label: "裏切られること", score: { caution: 2, attachment: 1 } },
      { label: "縛られること", score: { independence: 2, reality: 1 } },
      { label: "情緒が不安になること", score: { passion: 2, attachment: 1 } },
    ]
  ),
];

const types: TypeDef[] = [
  {
    id: "kuchisake",
    name: "口裂け女",
    vibe: "答えを求め続ける存在",
    axis: { passion: 70, caution: 70, intuition: 40, reality: 30, attachment: 85, independence: 20 },
    colors: ["#ff416c", "#ff4b2b"],
    publicMask: "魅力的で距離感がうまい",
    innerCore: "曖昧な愛に耐えられない",
    risk: "確認しすぎる",
    gift: "本音を見抜く",
    scaryTitle: "問い続ける女",
    loveWarning: "答えを求めすぎる",
    traits: { behavior: "反応を確かめる", emotion: "不安と承認欲求", love: "確かめたくなる" },
  },
  {
    id: "hanako",
    name: "花子さん",
    vibe: "静かに残る存在",
    axis: { passion: 40, caution: 60, intuition: 70, reality: 30, attachment: 80, independence: 50 },
    colors: ["#1c1c1c", "#434343"],
    publicMask: "大人しく優しい",
    innerCore: "忘れられるのが怖い",
    risk: "溜め込む",
    gift: "深い共感",
    scaryTitle: "消えない記憶",
    loveWarning: "言わずに縛る",
    traits: { behavior: "静かに残る", emotion: "内向きの執着", love: "言わずに続く" },
  },
  {
    id: "sadako",
    name: "貞子",
    vibe: "忘れられない侵食",
    axis: { passion: 30, caution: 65, intuition: 80, reality: 20, attachment: 90, independence: 30 },
    colors: ["#000000", "#434343"],
    publicMask: "静か",
    innerCore: "消えない存在",
    risk: "侵食する",
    gift: "強い印象",
    scaryTitle: "消えない存在",
    loveWarning: "離れても残る",
    traits: { behavior: "離れても影響が続く", emotion: "消えない存在感", love: "後から効く" },
  },
  {
    id: "yukionna",
    name: "雪女",
    vibe: "冷たい境界",
    axis: { passion: 20, caution: 60, intuition: 40, reality: 70, attachment: 30, independence: 90 },
    colors: ["#e0eafc", "#cfdef3"],
    publicMask: "静かで美しい",
    innerCore: "傷つく前に離れる",
    risk: "冷たすぎる",
    gift: "冷静さ",
    scaryTitle: "凍らせる存在",
    loveWarning: "距離を取りすぎる",
    traits: { behavior: "距離を取る", emotion: "冷静・防御", love: "近づきすぎない" },
  },
  {
    id: "tengu",
    name: "天狗",
    vibe: "支配と誇り",
    axis: { passion: 60, caution: 60, intuition: 40, reality: 60, attachment: 50, independence: 70 },
    colors: ["#c31432", "#240b36"],
    publicMask: "自信家",
    innerCore: "主導権を握りたい",
    risk: "支配的",
    gift: "リーダー性",
    scaryTitle: "見下ろす者",
    loveWarning: "優位に立とうとする",
    traits: { behavior: "主導権を取る", emotion: "プライド", love: "リードしたい" },
  },
  {
    id: "kappa",
    name: "河童",
    vibe: "合理的な存在",
    axis: { passion: 30, caution: 70, intuition: 30, reality: 80, attachment: 40, independence: 60 },
    colors: ["#56ab2f", "#a8e063"],
    publicMask: "穏やか",
    innerCore: "損をしたくない",
    risk: "冷静すぎる",
    gift: "安定",
    scaryTitle: "計算する者",
    loveWarning: "感情が薄い",
    traits: { behavior: "合理的に判断する", emotion: "安定", love: "バランス型" },
  },
  {
    id: "hitotsume",
    name: "一つ目小僧",
    vibe: "観察者",
    axis: { passion: 30, caution: 85, intuition: 60, reality: 50, attachment: 60, independence: 50 },
    colors: ["#232526", "#414345"],
    publicMask: "静か",
    innerCore: "見逃さない",
    risk: "見すぎる",
    gift: "洞察",
    scaryTitle: "すべてを見る",
    loveWarning: "観察しすぎる",
    traits: { behavior: "観察する", emotion: "敏感・分析", love: "気づきすぎる" },
  },
  {
    id: "rokuro",
    name: "ろくろ首",
    vibe: "伸びる執着",
    axis: { passion: 60, caution: 60, intuition: 50, reality: 40, attachment: 80, independence: 30 },
    colors: ["#434343", "#000000"],
    publicMask: "普通",
    innerCore: "離れられない",
    risk: "侵入する",
    gift: "関係を深める",
    scaryTitle: "伸びる想い",
    loveWarning: "踏み込みすぎる",
    traits: { behavior: "距離を越えて入り込む", emotion: "執着", love: "踏み込みすぎる" },
  },
  {
    id: "noppera",
    name: "のっぺらぼう",
    vibe: "読めない存在",
    axis: { passion: 20, caution: 50, intuition: 60, reality: 50, attachment: 40, independence: 80 },
    colors: ["#232526", "#000000"],
    publicMask: "無表情",
    innerCore: "本音を隠す",
    risk: "何もわからない",
    gift: "冷静",
    scaryTitle: "顔のない者",
    loveWarning: "本音を見せない",
    traits: { behavior: "本音を見せない", emotion: "不明・曖昧", love: "読めない" },
  },
  {
    id: "zashiki",
    name: "座敷童",
    vibe: "守られる存在",
    axis: { passion: 40, caution: 40, intuition: 60, reality: 40, attachment: 80, independence: 20 },
    colors: ["#f7971e", "#ffd200"],
    publicMask: "無邪気",
    innerCore: "依存",
    risk: "離れられない",
    gift: "愛される",
    scaryTitle: "離れない存在",
    loveWarning: "依存しすぎる",
    traits: { behavior: "離れずに居続ける", emotion: "依存・安心", love: "守られたい" },
  },
  {
    id: "nurarihyon",
    name: "ぬらりひょん",
    vibe: "掴めない存在",
    axis: { passion: 30, caution: 60, intuition: 70, reality: 60, attachment: 40, independence: 70 },
    colors: ["#434343", "#232526"],
    publicMask: "自然体",
    innerCore: "読ませない",
    risk: "掴めない",
    gift: "余裕",
    scaryTitle: "気づけばいる",
    loveWarning: "本心が見えない",
    traits: { behavior: "自然に入り込む", emotion: "掴めない", love: "流される" },
  },
  {
    id: "kijo",
    name: "鬼女",
    vibe: "感情の暴走",
    axis: { passion: 90, caution: 60, intuition: 40, reality: 20, attachment: 85, independence: 20 },
    colors: ["#ff0000", "#000000"],
    publicMask: "普通",
    innerCore: "怒りと嫉妬",
    risk: "暴走",
    gift: "強い愛",
    scaryTitle: "変わる女",
    loveWarning: "感情が強すぎる",
    traits: { behavior: "感情が一気に強くなる", emotion: "嫉妬・怒り", love: "重くなる" },
  },
];

const BAD_MATCH: Record<string, string[]> = {
  kuchisake: ["kijo", "tengu"],
  hanako: ["kijo", "rokuro"],
  sadako: ["kijo", "kuchisake"],
  yukionna: ["kijo", "rokuro"],
  kijo: ["kuchisake", "yukionna"],
  hitotsume: ["kijo", "tengu"],
  rokuro: ["yukionna", "kappa"],
  noppera: ["kuchisake", "kijo"],
  zashiki: ["tengu", "nurarihyon"],
  nurarihyon: ["kijo", "kuchisake"],
  kappa: ["kijo", "rokuro"],
  tengu: ["zashiki", "hanako"],
};

const GOOD_MATCH: Record<string, string[]> = {
  kuchisake: ["yukionna", "hitotsume"],
  hanako: ["yukionna", "zashiki"],
  sadako: ["yukionna", "nurarihyon"],
  yukionna: ["hanako", "sadako"],
  kijo: ["tengu", "kappa"],
  hitotsume: ["kappa", "yukionna"],
  rokuro: ["kijo", "kuchisake"],
  noppera: ["nurarihyon", "yukionna"],
  zashiki: ["hanako", "kappa"],
  nurarihyon: ["noppera", "sadako"],
  kappa: ["hitotsume", "zashiki"],
  tengu: ["kijo", "kuchisake"],
};

const characterAdjustments: Record<string, string> = {
  花子さん: `slightly unsettling smile
not friendly
quiet but watching you`,
  人面犬: `awkward human-like face
slightly annoying expression
not cute`,
  モスマン: `not too scary
not horror
slightly awkward posture
not powerful`,
  ビッグフット: `not heroic
not cool
slightly clumsy presence
a bit awkward`,
  口裂け女: `not too violent
no excessive blood
unsettling but not horror`,
  ツチノコ: `fat body
short and stubby
lazy posture
slightly stupid expression
not cool
not cute`,
  雪女: `emotionless expression
slightly uncanny beauty
not elegant
not majestic`,
  ネッシー: `not realistic
slightly strange proportions
not majestic
a bit awkward`,
  チュパカブラ: `no blood
no gore
not horror
slightly weird expression`,
  天狗: `not heroic
not cool
slightly strange proportions
a bit unsettling`,
  河童: `not cute
slightly creepy
awkward expression`,
  鵺: `strange hybrid creature
not cool
not powerful
slightly unsettling`,
  座敷童: `slightly unsettling eyes
too calm expression
not fully innocent`,
  海坊主: `not too scary
not horror
simple face
slightly uncanny`,
  一つ目小僧: `not cute
slightly awkward
unsettling single eye`,
  ぬらりひょん: `not cool
petty
sneaky
annoying
uninvited guest
slightly ugly
comical but creepy`,
};

// ===== diagnosis engine =====

function buildAxisMaxScores(questionsList: Question[]): AxisScores {
  const totals = { ...ZERO };

  for (const question of questionsList) {
    for (const axis of AXES) {
      const maxForQuestion = Math.max(
        ...question.options.map((option) => option.score[axis] ?? 0),
        0
      );
      totals[axis] += maxForQuestion;
    }
  }

  return totals;
}

function buildAxisExposureScores(questionsList: Question[]): AxisScores {
  const totals = { ...ZERO };

  for (const question of questionsList) {
    for (const option of question.options) {
      for (const axis of AXES) {
        totals[axis] += option.score[axis] ?? 0;
      }
    }
  }

  return totals;
}

const AXIS_MAX_SCORES = buildAxisMaxScores(questions);
const AXIS_EXPOSURE_SCORES = buildAxisExposureScores(questions);

const AXIS_SIMILARITY_WEIGHTS: AxisScores = (() => {
  const result = { ...ZERO };
  const values = AXES.map((axis) => AXIS_EXPOSURE_SCORES[axis] || 1);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  for (const axis of AXES) {
    const exposure = AXIS_EXPOSURE_SCORES[axis] || 1;
    result[axis] = Math.sqrt(avg / exposure);
  }

  return result;
})();

function normalizeVectorToPercent(axis: AxisScores): AxisScores {
  const sum = AXES.reduce((acc, key) => acc + Math.max(0, axis[key]), 0) || 1;
  const result = { ...ZERO };

  for (const key of AXES) {
    result[key] = Number(((Math.max(0, axis[key]) / sum) * 100).toFixed(2));
  }

  return result;
}

function normalizeUserAxisScores(raw: AxisScores): AxisScores {
  const corrected = { ...ZERO };

  for (const key of AXES) {
    const maxScore = AXIS_MAX_SCORES[key] || 1;
    corrected[key] = raw[key] / maxScore;
  }

  return normalizeVectorToPercent(corrected);
}

function normalizeTypeAxisScores(axis: AxisScores): AxisScores {
  return normalizeVectorToPercent(axis);
}

function weightedCosineSimilarity(user: AxisScores, target: AxisScores): number {
  let dot = 0;
  let userNorm = 0;
  let targetNorm = 0;

  for (const key of AXES) {
    const w = AXIS_SIMILARITY_WEIGHTS[key];
    const u = user[key] * w;
    const t = target[key] * w;

    dot += u * t;
    userNorm += u * u;
    targetNorm += t * t;
  }

  if (userNorm === 0 || targetNorm === 0) return 0;

  const cosine = dot / (Math.sqrt(userNorm) * Math.sqrt(targetNorm));
  return cosine * 100;
}

function getTopAxes(axis: AxisScores, count = 2): AxisKey[] {
  return [...AXES].sort((a, b) => axis[b] - axis[a]).slice(0, count);
}

function getPrimaryAxisGap(axis: AxisScores): number {
  const sorted = [...AXES].map((key) => axis[key]).sort((a, b) => b - a);
  return (sorted[0] ?? 0) - (sorted[1] ?? 0);
}

function similarity(user: AxisScores, target: AxisScores): number {
  const base = weightedCosineSimilarity(user, target);

  const userTop = getTopAxes(user, 2);
  const targetTop = getTopAxes(target, 2);
  const overlap = userTop.filter((axis) => targetTop.includes(axis)).length;

  const overlapBonus = overlap === 2 ? 4 : overlap === 1 ? 1.8 : 0;
  const sharpness = getPrimaryAxisGap(user);
  const sharpnessBonus = sharpness >= 12 && userTop[0] === targetTop[0] ? 2 : 0;

  return Number(Math.max(0, Math.min(100, base + overlapBonus + sharpnessBonus)).toFixed(2));
}

function topTwoBlend(firstScore: number, secondScore: number) {
  const diff = firstScore - secondScore;

  if (diff >= 12) return { p1: 100, p2: 0 };
  if (diff >= 7) return { p1: 78, p2: 22 };

  const total = firstScore + secondScore || 1;
  const rawP1 = Math.round((firstScore / total) * 100);
  const p1 = Math.max(55, Math.min(68, rawP1));

  return { p1, p2: 100 - p1 };
}

function buildResultName(first: RankedType, second: RankedType, p1: number) {
  if (p1 >= 95) return `${first.name}単独型`;
  if (p1 >= 75) return `${first.name}寄り${second.name}型`;
  if (p1 >= 60) return `${first.name}${second.name}混成型`;
  return `${first.name}${second.name}融合型`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function trimForCard(text: string, max = 240) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}…`;
}

function splitSections(resultText: string) {
  if (!resultText) {
    return {
      basic: "",
      relationship: "",
      love: "",
      hidden: "",
      bad: "",
      good: "",
    };
  }

  const get = (start: string, end?: string) => {
    const s = resultText.indexOf(start);
    if (s === -1) return "";
    const from = s + start.length;
    const to = end ? resultText.indexOf(end, from) : resultText.length;
    return resultText.slice(from, to === -1 ? resultText.length : to).trim();
  };

  return {
    basic: get("【基本性格】", "【対人関係】"),
    relationship: get("【対人関係】", "【恋愛傾向】"),
    love: get("【恋愛傾向】", "【隠れた性格】"),
    hidden: get("【隠れた性格】", "【⚠ 相性の悪い相性】"),
    bad: get("【⚠ 相性の悪い相性】", "【◎ 相性の良い相手】"),
    good: get("【◎ 相性の良い相手】"),
  };
}

function buildFusionPrompt(first: TypeDef, second: TypeDef, p1: number, p2: number) {
  const firstAdjust = characterAdjustments[first.name] ?? "";
  const secondAdjust = characterAdjustments[second.name] ?? "";

  return `
Create ONE unified character that fuses two Japanese urban legend creatures.

Primary influence: ${first.name} (${p1}%)
Secondary influence: ${second.name} (${p2}%)

IMPORTANT:
- This must be ONE character only
- Do NOT split the character into two halves
- Do NOT show two separate characters
- Do NOT place characters side by side
- Do NOT make it look like cosplay
- Both influences must remain visible
- The ${p1}% / ${p2}% balance must clearly affect the final design
- ${first.name} should be visibly dominant, but ${second.name} must still remain recognizable

Design direction:
- create a strange new creature, not two characters standing together
- use the dominant character as the main silhouette and personality base
- blend the secondary character into facial structure, body details, expression, texture, posture, or small iconic traits
- the percentage difference must noticeably change how strong each influence appears
- uncanny, memorable, slightly disturbing, slightly comical
- semi-realistic illustration
- slightly grotesque (kimo-kawaii)
- unsettling but not horror
- not cute
- not cinematic
- full body
- centered composition
- simple plain background
- character clearly visible
- no gore
- no excessive blood

${first.name} adjustment:
${firstAdjust}

${second.name} adjustment:
${secondAdjust}
`.trim();
}

function buildMockResult(
  first: RankedType,
  second: RankedType,
  p1: number,
  p2: number,
  axis: AxisScores,
  gender: Gender
) {
  const intense =
    axis.attachment >= axis.independence
      ? "相手の温度差を静かに記憶していく"
      : "平気そうな顔で一歩引いて支配権を渡さない";

  const genderLine =
    gender === "male"
      ? "一見すると余裕がありそうに見えるのに、内側では想像以上に執着が深いタイプとして出やすいです。"
      : gender === "female"
      ? "柔らかく見えても、感情の持ち方がかなり濃く、曖昧さに対して静かに怖くなるタイプとして出やすいです。"
      : "性別の印象に縛られず、外から見える顔と内側の濃さにかなり差があるタイプとして出やすいです。";

  return `【基本性格】
普段は${first.name}の性質が強く出やすく、特に「${first.traits.behavior}」という形で表れやすいです。一方で内側には${second.name}らしい「${second.traits.behavior}」もあり、外から見える印象と本音に少し差があります。${genderLine}

【対人関係】
人との関わり方には${first.traits.behavior}傾向が出やすいです。ただ、関係ができてからは${second.traits.emotion}がにじみやすく、相手の言動を思った以上に受け取ることがあります。距離感そのものより、相手からの見え方に個性が出ます。

【恋愛傾向】
恋愛をすると${first.traits.love}のようになりやすいです。そこに${second.traits.love}傾向が混ざるので、最初と関係が深くなってからで印象が変わりやすいです。しかもあなたは${intense}タイプです。

【隠れた性格】
あなたは内面に${second.traits.emotion}のようなものを秘めています。そのため、曖昧な関係や温度差には思った以上に反応しやすいです。表では平気そうでも、内側では納得できる形をかなり求めています。

【⚠ 相性の悪い相性】
${BAD_MATCH[first.id]?.[0] ?? "鬼女"}

【◎ 相性の良い相手】
${GOOD_MATCH[first.id]?.[0] ?? "雪女"}`;
}

function mockImageUrl(first: RankedType, second: RankedType) {
  const text = encodeURIComponent(`${first.name} × ${second.name}`);
  return `https://placehold.co/1024x1024/111827/f8fafc?text=${text}`;
}



async function requestResult(payload: GenerateResultPayload) {
  if (USE_MOCK) {
    return buildMockResult(payload.main, payload.sub, 60, 40, ZERO, payload.gender);
  }

  const response = await fetch(RESULT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      main: payload.main,
      sub: payload.sub,
      bad: payload.bad,
      good: payload.good,
      gender: payload.gender,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "結果文の生成に失敗しました。");
  return data.result as string;
}







async function requestImage({
  prompt,
  first,
  second,
  blend,
  mode,
}: {
  prompt: string;
  first: RankedType;
  second: RankedType;
  blend: { p1: number; p2: number };
  mode: ResultMode;
}) {
  if (USE_MOCK) return mockImageUrl(first, second);

  const response = await fetch(IMAGE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      first,
      second,
      blend,
      mode,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "画像生成に失敗しました。");
  return data.imageUrl as string;
}








function ResultHero({
  first,
  second,
  p1,
  p2,
  resultName,
}: {





  first: RankedType;
  second: RankedType;
  p1: number;
  p2: number;
  resultName: string;
}) {
  return (
    <div
      style={{
        ...styles.hero,
        background: `linear-gradient(135deg, ${first.colors[0]}, ${second.colors[1]})`,
      }}
    >
      <div style={styles.heroNoise} />
      <div style={styles.heroChip}>都市伝説占い RESULT</div>
      <div style={styles.heroName}>{resultName}</div>
      <div style={styles.heroMix}>
        {first.name} × {second.name}
      </div>
      <div style={styles.heroPercent}>
        {p1}% / {p2}%
      </div>
      <div style={styles.heroSub}>{p1 >= 95 ? first.loveWarning : `${first.loveWarning} / ${second.loveWarning}`}</div>
    </div>
  );
}

function QuestionVisual({ item }: { item: Question }) {
  return (
    <div
      style={{
        ...styles.questionVisual,
        background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})`,
      }}
    >
      <div style={styles.questionVisualNoise} />
      <div style={styles.questionEmoji}>{item.visualEmoji}</div>
      <div style={styles.questionTitleWrap}>
        <div style={styles.questionTitle}>{item.visualTitle}</div>
        <div style={styles.questionTag}>{item.visualTag}</div>
      </div>
    </div>
  );
}




const AXIS_LABELS_JP: Record<AxisKey, string> = {
  passion: "情熱",
  caution: "慎重さ",
  intuition: "直感",
  reality: "現実感",
  attachment: "執着",
  independence: "自立",
};

function AxisMeter({ axis }: { axis: AxisScores }) {
  const sorted = [...AXES]
    .map((key) => ({ key, value: axis[key] }))
    .sort((a, b) => b.value - a.value);

  return (
    <div style={styles.axisCard}>
      <div style={styles.sectionTitle}>あなたの内側にある6つの要素</div>

      <div style={styles.axisList}>
        {sorted.map((item) => (
          <div key={item.key} style={styles.axisRow}>
            {/* 日本語ラベル */}
            <div style={styles.axisLabel}>
              {AXIS_LABELS_JP[item.key]}
            </div>

            {/* バー */}
            <div style={styles.axisTrack}>
              <div
                style={{
                  ...styles.axisFill,
                  width: `${item.value}%`,
                }}
              />
            </div>

            {/* 数値（%つけると良い） */}
            <div style={styles.axisValue}>
              {Math.round(item.value)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}






function CaptureCard({
  resultName,
  first,
  second,
  blend,
  imageUrl,
  resultText,
  normalizedAxis,
}: {
  resultName: string;
  first: RankedType;
  second: RankedType;
  blend: { p1: number; p2: number };
  imageUrl: string;
  resultText: string;
  normalizedAxis: AxisScores;
}) {
  const sections = splitSections(resultText);
  const topAxes = [...AXES]
    .map((key) => ({ key, value: normalizedAxis[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <div style={styles.captureFixed}>
      <div style={styles.captureHeader}>
        <div style={styles.captureBadge}>都市伝説占い</div>
        <div style={styles.captureTitle}>{resultName}</div>
        <div style={styles.captureSub}>
          {first.name} {blend.p1}% × {second.name} {blend.p2}%
        </div>
      </div>

      <div style={styles.captureMainGrid}>
        <div style={styles.captureImagePanel}>
          {imageUrl ? (
            <img src={imageUrl} alt="診断イメージ" style={styles.captureImage} />
          ) : (
            <div style={styles.captureImagePlaceholder}>IMAGE NOT GENERATED</div>
          )}
        </div>

        <div style={styles.captureTextPanel}>
          <div style={styles.captureMiniSection}>
            <div style={styles.captureMiniLabel}>表向き</div>
            <div style={styles.captureMiniBody}>{first.publicMask}</div>
          </div>

          <div style={styles.captureMiniSection}>
            <div style={styles.captureMiniLabel}>内側</div>
            <div style={styles.captureMiniBody}>{first.innerCore}</div>
          </div>

          <div style={styles.captureMiniSection}>
            <div style={styles.captureMiniLabel}>危うさ</div>
            <div style={styles.captureMiniBody}>
              {blend.p1 >= 95 ? first.risk : `${first.risk} / ${second.risk}`}
            </div>
          </div>

          <div style={styles.captureMiniSection}>
            <div style={styles.captureMiniLabel}>魅力</div>
            <div style={styles.captureMiniBody}>
              {blend.p1 >= 95 ? first.gift : `${first.gift} / ${second.gift}`}
            </div>
          </div>

          <div style={styles.captureMiniSection}>
            <div style={styles.captureMiniLabel}>要約</div>
            <div style={styles.captureSummary}>
              {trimForCard(sections.basic || resultText, 190)}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.captureFooter}>
        <div style={styles.captureFooterBlock}>
          <div style={styles.captureMiniLabel}>恋愛傾向</div>
          <div style={styles.captureFooterText}>{trimForCard(sections.love || "", 120)}</div>
        </div>
        <div style={styles.captureFooterBlock}>
          <div style={styles.captureMiniLabel}>隠れた性格</div>
          <div style={styles.captureFooterText}>{trimForCard(sections.hidden || "", 120)}</div>
        </div>
      </div>
    </div>
  );
}






export default function App() {
  const [step, setStep] = useState(0);
  const [axis, setAxis] = useState<AxisScores>({ ...ZERO });
  const [viewMode, setViewMode] = useState<ViewMode>("intro");
  const [gender, setGender] = useState<Gender>("other");
  const [resultText, setResultText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCapturePreparing, setIsCapturePreparing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);


  const captureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);






  const current = questions[Math.min(step, questions.length - 1)];
  const normalizedAxis = useMemo(() => normalizeUserAxisScores(axis), [axis]);

  const ranked = useMemo(() => {
    return [...types]
      .map((item) => {
        const normalizedTypeAxis = normalizeTypeAxisScores(item.axis);
        return {
          ...item,
          score: similarity(normalizedAxis, normalizedTypeAxis),
        };
      })
      .sort((a, b) => b.score - a.score) as RankedType[];
  }, [normalizedAxis]);

  const first = ranked[0] ?? ({ ...types[0], score: 50 } as RankedType);
  const second = ranked[1] ?? ({ ...types[1], score: 49 } as RankedType);
  const blend = topTwoBlend(first.score, second.score);

  const mode: ResultMode =
    blend.p2 === 0
      ? "single"
      : blend.p1 >= 75
      ? "dominant-dual"
      : "balanced-dual";

  const imagePrompt = buildFusionPrompt(first, second, blend.p1, blend.p2);
  const resultName = buildResultName(first, second, blend.p1);

 

  useEffect(() => {
    if (viewMode !== "result") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [viewMode]);

  const answer = (score: Partial<AxisScores>) => {
    setAxis((prev) => {
      const next = { ...prev };
      AXES.forEach((key) => {
        next[key] += score[key] ?? 0;
      });
      return next;
    });

    if (step + 1 >= questions.length) {
      setViewMode("result");
    }

    setStep((prev) => prev + 1);
  };

  const restart = () => {
    setAxis({ ...ZERO });
    setStep(0);
    setViewMode("intro");
    setResultText("");
    setImageUrl("");
    setErrorMessage("");
    setIsGenerating(false);
    setIsCapturePreparing(false);
  };

  const generateAll = async () => {
    try {
      setIsGenerating(true);
      setErrorMessage("");

      const bad = BAD_MATCH[first.id]?.[0] ?? "kijo";
      const good = GOOD_MATCH[first.id]?.[0] ?? "yukionna";

      const [text, img] = await Promise.all([
        requestResult({
          main: first,
          sub: second,
          bad,
          good,
          gender,
        }),
        
      requestImage({
        prompt: imagePrompt,
        first,
        second,
        blend,
        mode,
      }),
    ]);




  



      setResultText(text);
      setImageUrl(img);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadResultImage = async () => {
    if (!captureRef.current) return;

    try {
      setIsCapturePreparing(true);

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise((resolve) => setTimeout(resolve, 80));

      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#0b0b12",
        scale: 2,
        useCORS: true,
        logging: false,
        width: 1080,
        height: 1350,
        windowWidth: 1080,
        windowHeight: 1350,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (!blob) {
        throw new Error("PNGの生成に失敗しました");
      }

      const file = new File([blob], "urban-legend-result.png", {
        type: "image/png",
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "都市伝説占い",
          text: "診断結果を共有する",
          files: [file],
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "urban-legend-result.png";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("画像の共有または保存に失敗しました");
    } finally {
      setIsCapturePreparing(false);
    }
  };

  if (viewMode === "intro") {
    return (
      <div style={styles.horrorPage}>
        <div style={styles.scanlines} />
        <div style={styles.pageNoise} />

        <div style={styles.horrorWrap}>
          <div style={styles.horrorTopline}>
            <span style={styles.horrorDot} />
            urban myth . exe
          </div>

          <div style={styles.kvHero}>
            <img src="/images/urban-legend-kv.jpg" alt="都市伝説診断" style={styles.kvImage} />
            <div style={styles.kvOverlay} />

            <div style={styles.kvContent}>
              <div style={styles.kvMini}>urban myth . exe</div>
              <h1 style={styles.kvTitle}>都市伝説診断</h1>
              <div style={styles.kvLead}>あなたの内側に棲むもう一つの姿を解析します</div>

              <p style={styles.kvText}>
                ふとした瞬間に理由もなく自分に違和感を覚えた事はありませんか。
                <br />
                それはあなたがまだ知らない本当の自分かもしれません。
                <br />
                この診断では、あなたの中に潜むもう一つの姿を明らかにします。
              </p>

              <div style={styles.genderRow}>
                <button
                  style={gender === "male" ? styles.genderBtnActive : styles.genderBtn}
                  onClick={() => setGender("male")}
                >
                  男性向け
                </button>
                <button
                  style={gender === "female" ? styles.genderBtnActive : styles.genderBtn}
                  onClick={() => setGender("female")}
                >
                  女性向け
                </button>
                <button
                  style={gender === "other" ? styles.genderBtnActive : styles.genderBtn}
                  onClick={() => setGender("other")}
                >
                  指定なし
                </button>
              </div>

              <div style={styles.kvWarning}>WARNING / 結果にはホラー的な表現が含まれます</div>

              <button style={styles.horrorStartBtn} onClick={() => setViewMode("diagnosis")}>
                診断を開始する
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "result") {
    return (
      <div style={styles.page}>
        <div style={styles.scanlinesAbsolute} />
        <div style={styles.pageNoiseAbsolute} />

        <div style={styles.card}>
          <div style={styles.badge}>診断結果</div>
          <h1 style={styles.titleLarge}>あなたの都市伝説タイプ</h1>

          <ResultHero
            first={first}
            second={second}
            p1={blend.p1}
            p2={blend.p2}
            resultName={resultName}
          />

          <div style={styles.resultGrid}>
            <div style={styles.resultMainCol}>
              {!resultText && !isGenerating && (
                <button style={styles.generateBtn} onClick={generateAll}>
                  あなたの本当の姿を生成する
                </button>
              )}

              {isGenerating && <div style={styles.loading}>あなたの隠された姿を呼び出しています…</div>}
              {errorMessage && <div style={styles.errorText}>{errorMessage}</div>}

              {imageUrl && (
                <div style={styles.box}>
                  <div style={styles.sectionTitle}>合成された姿</div>
                  <img src={imageUrl} alt="診断結果イメージ" style={styles.resultImage} />
                </div>
              )}


{resultText && (
  <div
    style={{
      ...styles.box,
      padding: isMobile ? "16px 14px" : 20,
    }}
  >
    <div style={styles.sectionTitle}>最終結果</div>

    <div style={styles.resultLeadCard}>
      <div style={styles.resultLeadLabel}>SUMMARY</div>
      <div style={styles.resultLeadText}>
        {trimForCard(splitSections(resultText).basic || resultText, isMobile ? 82 : 120)}
      </div>
    </div>

    {[
      { title: "基本性格", body: splitSections(resultText).basic },
      { title: "対人関係", body: splitSections(resultText).relationship },
      { title: "恋愛傾向", body: splitSections(resultText).love },
      { title: "隠れた性格", body: splitSections(resultText).hidden },
      { title: "⚠ 相性の悪い相手", body: splitSections(resultText).bad },
      { title: "◎ 相性の良い相手", body: splitSections(resultText).good },
    ]
      .filter((section) => section.body)
      .map((section) => (
        <div
          key={section.title}
          style={{
            ...styles.resultSection,
            marginTop: isMobile ? 14 : 18,
          }}
        >
          <div style={styles.resultSectionHeading}>{section.title}</div>
          <div
            style={{
              ...styles.resultTextReadable,
              fontSize: isMobile ? 16 : 15,
              lineHeight: isMobile ? 1.72 : 1.9,
            }}
          >
            {section.body}
          </div>
        </div>
      ))}
  </div>
)}
            </div>

            <div style={styles.resultSideCol}>
              <div style={styles.box}>
                <div style={styles.sectionTitle}>タイプ概要</div>
                <div style={styles.metaStack}>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>メイン</span>
                    <span style={styles.metaValue}>{first.name}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>サブ</span>
                    <span style={styles.metaValue}>{blend.p2 === 0 ? "なし" : second.name}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>比率</span>
                    <span style={styles.metaValue}>
                      {blend.p1}% / {blend.p2}%
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>危うさ</span>
                    <span style={styles.metaValue}>{first.risk}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>魅力</span>
                    <span style={styles.metaValue}>{first.gift}</span>
                  </div>
                </div>
              </div>

              <AxisMeter axis={normalizedAxis} />
            </div>
          </div>

          <div style={styles.actionGrid}>
            <button
              style={styles.actionBtn}
              onClick={downloadResultImage}
              disabled={!resultText || !imageUrl || isCapturePreparing}
            >
              {isCapturePreparing ? "画像を準備中…" : "画像を共有"}
            </button>
          </div>

          <div style={styles.row}>
            <button style={styles.btnGhost} onClick={restart}>
              もう一度占う
            </button>
          </div>
        </div>

        <div style={styles.captureStage}>
          <div ref={captureRef}>
            <CaptureCard
              resultName={resultName}
              first={first}
              second={second}
              blend={blend}
              imageUrl={imageUrl}
              resultText={resultText}
              normalizedAxis={normalizedAxis}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.scanlinesAbsolute} />
      <div style={styles.pageNoiseAbsolute} />

      <div style={styles.card}>
        <div style={styles.progressRow}>
          <div style={styles.badge}>
            質問 {step + 1} / {questions.length}
          </div>
          <div style={styles.progressText}>analysis running...</div>
        </div>

        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${((step + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        <QuestionVisual item={current} />

        <h2 style={styles.titleLarge}>{current.text}</h2>

        <div style={styles.stack}>
          {current.options.map((option, index) => (
            <button key={`${step}-${index}`} style={styles.btn} onClick={() => answer(option.score)}>
              <span style={styles.optionIndex}>{String(index + 1).padStart(2, "0")}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  horrorPage: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #2a0008 0%, #12030a 24%, #070b14 55%, #020617 100%)",
    color: "white",
    position: "relative",
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
  },

  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #2d0712 0%, #13040b 24%, #0a0e18 58%, #020617 100%)",
    color: "white",
    padding: 24,
    fontFamily: "Arial, sans-serif",
    position: "relative",
    overflow: "hidden",
  },



resultLeadCard: {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  padding: "12px 12px",
  marginTop: 10,
},

resultLeadLabel: {
  fontSize: 10,
  letterSpacing: "0.14em",
  color: "rgba(252,165,165,0.78)",
  marginBottom: 6,
  fontWeight: 700,
},

resultLeadText: {
  fontSize: 15,
  lineHeight: 1.65,
  color: "rgba(255,255,255,0.96)",
  fontWeight: 600,
},

resultSection: {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  paddingTop: 12,
},

resultSectionHeading: {
  fontSize: 14,
  fontWeight: 800,
  color: "#fecaca",
  letterSpacing: "0.05em",
  marginBottom: 8,
},

resultTextReadable: {
  color: "rgba(255,255,255,0.92)",
  whiteSpace: "pre-wrap",
  wordBreak: "keep-all",
  letterSpacing: "0.01em",
},












  scanlines: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    background:
      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 2px, transparent 4px)",
    opacity: 0.18,
    mixBlendMode: "soft-light",
  },

  scanlinesAbsolute: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 2px, transparent 4px)",
    opacity: 0.16,
    mixBlendMode: "soft-light",
  },

  pageNoise: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.04), transparent 24%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.03), transparent 20%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.02), transparent 22%)",
    opacity: 0.35,
  },

  pageNoiseAbsolute: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.04), transparent 24%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.03), transparent 20%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.02), transparent 22%)",
    opacity: 0.22,
  },

  horrorWrap: {
    position: "relative",
    zIndex: 1,
    maxWidth: 980,
    margin: "0 auto",
    padding: "40px 24px 64px",
  },

  horrorTopline: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "rgba(252,165,165,0.9)",
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 18,
  },

  horrorDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#ef4444",
    boxShadow: "0 0 12px rgba(239,68,68,0.9)",
  },

  kvHero: {
    position: "relative",
    minHeight: 640,
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45), 0 0 40px rgba(239,68,68,0.08)",
    background: "#0b0b12",
  },

  kvImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "brightness(0.62) contrast(1.05) saturate(0.9)",
  },

  kvOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.52) 42%, rgba(0,0,0,0.82) 100%), radial-gradient(circle at 62% 28%, rgba(166,255,122,0.22), transparent 28%), radial-gradient(circle at 30% 30%, rgba(160,80,255,0.12), transparent 24%)",
  },

  kvContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    minHeight: 640,
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "36px 28px 30px",
  },

  kvMini: {
    marginBottom: 10,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 6,
    fontSize: 12,
    textTransform: "lowercase",
  },

  kvTitle: {
    margin: "0 0 8px",
    fontSize: 64,
    lineHeight: 1,
    fontWeight: 900,
    color: "#f8f8f8",
    textShadow: "0 0 12px rgba(255,255,255,0.12), 0 0 24px rgba(169,85,247,0.16)",
  },

  kvLead: {
    marginBottom: 16,
    color: "#d1d5db",
    fontSize: 16,
    letterSpacing: 2,
  },

  kvText: {
    maxWidth: 620,
    margin: "0 0 22px",
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.9,
    fontSize: 15,
  },

  kvWarning: {
    marginTop: 8,
    marginBottom: 18,
    color: "#fca5a5",
    fontSize: 12,
    letterSpacing: 1.5,
  },

  genderRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },

  genderBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },

  genderBtnActive: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(248,113,113,0.44)",
    background: "linear-gradient(135deg, rgba(127,29,29,0.82), rgba(60,7,83,0.7))",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },

  horrorStartBtn: {
    width: "100%",
    maxWidth: 420,
    padding: "18px 18px",
    borderRadius: 16,
    border: "1px solid rgba(248,113,113,0.44)",
    background: "linear-gradient(135deg, rgba(127,29,29,0.82), rgba(60,7,83,0.7))",
    color: "#fff",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 4,
    marginTop: 4,
    boxShadow: "0 0 28px rgba(239,68,68,0.12)",
  },

  card: {
    maxWidth: 1100,
    margin: "0 auto",
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 20px 60px rgba(0,0,0,0.38), 0 0 40px rgba(239,68,68,0.06)",
    position: "relative",
    zIndex: 1,
    backdropFilter: "blur(4px)",
  },

  badge: {
    display: "inline-block",
    marginBottom: 12,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(239,68,68,0.16)",
    color: "#fecaca",
    fontSize: 12,
    letterSpacing: 1,
  },

  titleLarge: {
    margin: "0 0 18px",
    fontSize: 34,
    lineHeight: 1.25,
    fontWeight: 900,
    color: "#fff4f4",
    textShadow: "0 0 10px rgba(239,68,68,0.14)",
  },

  progressRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
    flexWrap: "wrap",
  },

  progressText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  progressBar: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginBottom: 18,
    border: "1px solid rgba(255,255,255,0.08)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, rgba(239,68,68,0.95), rgba(168,85,247,0.95))",
  },

  questionVisual: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    minHeight: 160,
    display: "flex",
    alignItems: "flex-end",
    padding: 20,
    marginBottom: 20,
    border: "1px solid rgba(255,255,255,0.12)",
  },

  questionVisualNoise: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 15% 15%, rgba(255,255,255,0.15), transparent 20%), radial-gradient(circle at 75% 35%, rgba(255,255,255,0.08), transparent 24%)",
    opacity: 0.65,
  },

  questionEmoji: {
    position: "absolute",
    right: 18,
    top: 14,
    fontSize: 34,
    opacity: 0.9,
  },

  questionTitleWrap: {
    position: "relative",
    zIndex: 1,
  },

  questionTitle: {
    fontSize: 26,
    fontWeight: 900,
    marginBottom: 4,
  },

  questionTag: {
    fontSize: 12,
    letterSpacing: 2,
    opacity: 0.8,
    textTransform: "uppercase",
  },

  stack: {
    display: "grid",
    gap: 14,
  },

  btn: {
    width: "100%",
    textAlign: "left",
    display: "flex",
    gap: 14,
    alignItems: "center",
    padding: "18px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1.6,
  },

  optionIndex: {
    minWidth: 36,
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    height: 36,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
  },

  hero: {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    padding: "28px 24px",
    marginBottom: 20,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
  },

  heroNoise: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), transparent 20%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.08), transparent 20%)",
    opacity: 0.7,
  },

  heroChip: {
    position: "relative",
    zIndex: 1,
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.2)",
    fontSize: 12,
    letterSpacing: 1.4,
    marginBottom: 12,
  },

  heroName: {
    position: "relative",
    zIndex: 1,
    fontSize: 32,
    lineHeight: 1.15,
    fontWeight: 900,
    marginBottom: 8,
  },

  heroMix: {
    position: "relative",
    zIndex: 1,
    fontSize: 16,
    opacity: 0.92,
    marginBottom: 4,
  },

  heroPercent: {
    position: "relative",
    zIndex: 1,
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 8,
  },

  heroSub: {
    position: "relative",
    zIndex: 1,
    fontSize: 14,
    opacity: 0.88,
    lineHeight: 1.6,
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.8fr)",
    gap: 20,
  },

  resultMainCol: {
    minWidth: 0,
  },

  resultSideCol: {
    minWidth: 0,
    display: "grid",
    gap: 16,
    alignContent: "start",
  },

  generateBtn: {
    width: "100%",
    padding: "18px 18px",
    borderRadius: 16,
    border: "1px solid rgba(248,113,113,0.44)",
    background: "linear-gradient(135deg, rgba(127,29,29,0.82), rgba(60,7,83,0.7))",
    color: "#fff",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 16,
  },

  loading: {
    padding: 18,
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    marginBottom: 16,
    lineHeight: 1.7,
  },

  errorText: {
    padding: 16,
    borderRadius: 16,
    background: "rgba(239,68,68,0.14)",
    color: "#fecaca",
    border: "1px solid rgba(239,68,68,0.3)",
    marginBottom: 16,
    lineHeight: 1.7,
  },

  box: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#fecaca",
    letterSpacing: 1,
    marginBottom: 12,
  },

  resultImage: {
    width: "100%",
    display: "block",
    borderRadius: 16,
    objectFit: "cover",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  resultText: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.9,
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },

  axisCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: 18,
  },

  axisList: {
    display: "grid",
    gap: 10,
  },

  axisRow: {
    display: "grid",
    gridTemplateColumns: "110px minmax(0,1fr) 40px",
    gap: 10,
    alignItems: "center",
  },

  axisLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
  },

  axisTrack: {
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  axisFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, rgba(239,68,68,0.95), rgba(168,85,247,0.95))",
  },

  axisValue: {
    fontSize: 12,
    textAlign: "right",
    color: "rgba(255,255,255,0.85)",
  },

  tagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  tag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: 12,
    fontWeight: 700,
  },

  metaStack: {
    display: "grid",
    gap: 10,
  },

  metaItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 8,
  },

  metaLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
  },

  metaValue: {
    color: "white",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "right",
  },

  actionGrid: {
    display: "grid",
    gap: 14,
    marginTop: 8,
  },

  actionBtn: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 800,
  },

  row: {
    display: "flex",
    justifyContent: "center",
    marginTop: 18,
  },

  btnGhost: {
    padding: "14px 20px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },

  captureStage: {
    position: "fixed",
    left: -99999,
    top: 0,
    width: 1080,
    height: 1350,
    opacity: 1,
    pointerEvents: "none",
    overflow: "hidden",
  },

  captureFixed: {
    width: 1080,
    height: 1350,
    background:
      "radial-gradient(circle at top, #2d0712 0%, #13040b 24%, #0a0e18 58%, #020617 100%)",
    color: "white",
    padding: 48,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontFamily: "Arial, sans-serif",
  },

  captureHeader: {
    marginBottom: 20,
  },

  captureBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(239,68,68,0.16)",
    color: "#fecaca",
    fontSize: 18,
    marginBottom: 14,
    fontWeight: 700,
  },

  captureTitle: {
    fontSize: 48,
    fontWeight: 900,
    lineHeight: 1.08,
    marginBottom: 10,
  },

  captureSub: {
    fontSize: 22,
    opacity: 0.88,
  },

  captureMainGrid: {
    display: "grid",
    gridTemplateColumns: "520px minmax(0, 1fr)",
    gap: 28,
    alignItems: "stretch",
    flex: 1,
  },

  captureImagePanel: {
    borderRadius: 28,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  },

  captureImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  captureImagePlaceholder: {
    fontSize: 24,
    opacity: 0.55,
    letterSpacing: 2,
  },

  captureTextPanel: {
    display: "grid",
    gap: 14,
    alignContent: "start",
  },

  captureMiniSection: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
  },

  captureMiniLabel: {
    color: "#fecaca",
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 10,
    letterSpacing: 1,
  },

  captureMiniBody: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.35,
  },

  captureSummary: {
    fontSize: 22,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.9)",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },

  captureAxisTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },

  captureAxisTag: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: 16,
    fontWeight: 700,
  },

  captureFooter: {
    marginTop: 24,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },

  captureFooterBlock: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
    minHeight: 138,
  },

  captureFooterText: {
    fontSize: 20,
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.9)",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },
};