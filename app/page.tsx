"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import ShareCard, { getTypeLabel } from "@/app/components/ShareCard";
import { toPng } from "html-to-image";



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
type ViewMode = "intro" | "diagnosis" | "result" | "card";
type Gender = "male" | "female" | "other";
type ResultMode = "single" | "dominant-dual" | "balanced-dual";
type Rarity = "R" | "SR" | "SSR" | "UR";
type QuestionVariant = "A" | "B" | "C";

type QuestionOption = {
  label: string;
  score: Partial<AxisScores>;
};

type QuestionGroupId =
  | "alone-quality"
  | "help-seeking"
  | "distance"
  | "after"
  | "loneliness-response"
  | "trust-speed"
  | "intuition-discomfort"
  | "evidence-need"
  | "action"
  | "risk"
  | "chance"
  | "conflict"
  | "support"
  | "emotion"
  | "decision"
  | "relation"
  | "stress"
  | "self"
  | "value"
  | "style";

type Question = {
  id: string;
  category: Category;
  visualEmoji: string;
  visualTitle: string;
  visualTag: string;
  text: string;
  colors: [string, string];
  options: QuestionOption[];
  groupId: QuestionGroupId;
  variant: QuestionVariant;
};

const QUESTION_GROUP_ORDER: QuestionGroupId[] = [
  "alone-quality",
  "help-seeking",
  "distance",
  "after",
  "loneliness-response",
  "trust-speed",
  "intuition-discomfort",
  "evidence-need",
  "action",
  "risk",
  "chance",
  "conflict",
  "support",
  "emotion",
  "decision",
  "relation",
  "stress",
  "self",
  "value",
  "style",
];


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

const AXIS_WEIGHT: AxisScores = {
  passion: 1.05,
  caution: 0.97,
  intuition: 1.12,
  reality: 1.08,
  attachment: 0.85,
  independence: 1.03,
};

function applyAxisWeight(scores: AxisScores): AxisScores {
  return {
    passion: Number((scores.passion * AXIS_WEIGHT.passion).toFixed(2)),
    caution: Number((scores.caution * AXIS_WEIGHT.caution).toFixed(2)),
    intuition: Number((scores.intuition * AXIS_WEIGHT.intuition).toFixed(2)),
    reality: Number((scores.reality * AXIS_WEIGHT.reality).toFixed(2)),
    attachment: Number((scores.attachment * AXIS_WEIGHT.attachment).toFixed(2)),
    independence: Number((scores.independence * AXIS_WEIGHT.independence).toFixed(2)),
  };
}




const q = (
  id: string,
  category: Category,
  visualEmoji: string,
  visualTitle: string,
  visualTag: string,
  text: string,
  colors: [string, string],
  options: QuestionOption[],
  groupId: QuestionGroupId,
  variant: QuestionVariant
): Question => ({
  id,
  category,
  visualEmoji,
  visualTitle,
  visualTag,
  text,
  colors,
  options,
  groupId,
  variant,
});

const questionPool: Question[] = [


q(
  "q1a",
  "self",
  "🌘",
  "ひとり時間",
  "alone-core",
  "ひとりの時間が続いた日、気づくとどんな行動をしている？",
  ["#141e30", "#243b55"],
  [
    { label: "誰かに連絡して予定を入れる", score: { attachment: 3 } },
    { label: "少し寂しくなって、軽く誰かに連絡する", score: { attachment: 2 } },
    { label: "一人でやりたいことに集中する", score: { independence: 3 } },
    { label: "特に何も感じずいつも通り過ごす", score: { reality: 2 } }
  ],
  "alone-quality",
  "A"
),
q(
  "q1b",
  "self",
  "🛋️",
  "休日",
  "alone-holiday",
  "予定のない休日、どんなふうに過ごしていることが多い？",
  ["#232526", "#414345"],
  [
    { label: "誰かを誘って外に出る", score: { attachment: 3 } },
    { label: "誰かと少し話してから動き始める", score: { attachment: 2 } },
    { label: "一人で外に出て好きに過ごす", score: { independence: 3 } },
    { label: "家で静かに一人で過ごす", score: { reality: 2 } }
  ],
  "alone-quality",
  "B"
),

q(
  "q1c",
  "emotion",
  "📵",
  "無連絡",
  "alone-silence",
  "しばらく誰とも話していない、、、どんな行動を取りがち？",
  ["#0f2027", "#2c5364"],
  [
    { label: "自分から誰かに話しかける", score: { attachment: 3 } },
    { label: "最近話していた人のこと思い浮かべる", score: { attachment: 2 } },
    { label: "特に気にしないでそのまま過ごす", score: { independence: 3 } },
    { label: "自分からは誰にも連絡しない", score: { reality: 2 } }
  ],
  "alone-quality",
  "C"
),
q(
  "q2a",
  "social",
  "🫂",
  "相談",
  "help-seek",
  "仕事や作業でミスをした、まずどんな行動を取ることが多い？",
  ["#1f1c2c", "#928dab"],
  [
    { label: "すぐ誰かに状況を伝える", score: { attachment: 3 } },
    { label: "一度整理してから人に伝える", score: { attachment: 2 } },
    { label: "まず自分で調べて対応する", score: { independence: 3 } },
    { label: "人に頼らず自分で解決する", score: { reality: 2 } }
  ],
  "help-seeking",
  "A"
),
q(
  "q2b",
  "emotion",
  "🫣",
  "弱音",
  "help-vulnerability",
  "気分が落ちているとき、自然とどうやって気持ちを整える？",
  ["#232526", "#000000"],
  [
    { label: "誰かにそのまま話す", score: { attachment: 3 } },
    { label: "少しだけ話して軽く共有する", score: { attachment: 2 } },
    { label: "一人で整理して気持ちを落ち着かせる", score: { independence: 3 } },
    { label: "誰にも話さずそのまま過ごす", score: { reality: 2 } }
  ],
  "help-seeking",
  "B"
),
q(
  "q2c",
  "self",
  "🤝",
  "頼る感覚",
  "help-sense",
  "自分でできるか微妙な作業があるとき、あなたはどうする？",
  ["#141e30", "#243b55"],
  [
    { label: "すぐ詳しい人に相談する", score: { attachment: 3 } },
    { label: "少しやってみてから相談する", score: { attachment: 2 } },
    { label: "まず自分で最後までやってみる", score: { independence: 3 } },
    { label: "やり方を変えながらそのまま進める", score: { reality: 2 } }
  ],
  "help-seeking",
  "C"
),
q(
  "q3a",
  "social",
  "🤝",
  "距離感",
  "distance-approach",
  "気になる人と話すとき、自然とどんなふうに距離を縮める？",
  ["#141e30", "#243b55"],
  [
    { label: "自分から話して距離を縮める", score: { attachment: 3 } },
    { label: "相手の様子を見ながら話す", score: { attachment: 2 } },
    { label: "流れにまかせて自然に会話する", score: { independence: 3 } },
    { label: "必要以上に踏み込まない", score: { reality: 2 } }
  ],
  "distance",
  "A"
),
q(
  "q3b",
  "social",
  "🧍",
  "接し方",
  "distance-style",
  "まだ距離がある相手と話すとき、どんな接し方になりやすい？",
  ["#232526", "#414345"],
  [
    { label: "自分から話題を出す", score: { attachment: 3 } },
    { label: "相手に合わせて会話を広げる", score: { attachment: 2 } },
    { label: "必要なことだけ話す", score: { independence: 3 } },
    { label: "自分からはあまり話さない", score: { reality: 2 } }
  ],
  "distance",
  "B"
),
q(
  "q3c",
  "social",
  "📏",
  "距離調整",
  "distance-adjust",
  "相手との距離が少し近いと感じたとき、どう調整することが多い？",
  ["#0f2027", "#2c5364"],
  [
    { label: "さりげなく距離を取る", score: { independence: 3 } },
    { label: "関わる量を少し減らす", score: { independence: 2 } },
    { label: "様子を見ながらそのまま関わる", score: { attachment: 2 } },
    { label: "特に変えずそのまま接する", score: { attachment: 3 } }
  ],
  "distance",
  "C"
),

q(
  "q4a",
  "emotion",
  "💔",
  "別れ後",
  "after-break",
  "関係が終わったあと、どんな行動を取りがち？",
  ["#232526", "#000000"],
  [
    { label: "時間をあけずに連絡することがある", score: { attachment: 3 } },
    { label: "特に用事がなくてもやり取りを続ける", score: { attachment: 2 } },
    { label: "連絡はしないが思い出すことはある", score: { independence: 3 } },
    { label: "そのまま連絡を取らずに終える", score: { reality: 2 } }
  ],
  "after",
  "A"
),

q(
  "q4b",
  "emotion",
  "🧠",
  "引きずり",
  "after-memory",
  "別れた相手、その人のことをどう思い返すことが多い？",
  ["#141e30", "#243b55"],
  [
    { label: "まだその人のことを考えることが多い", score: { attachment: 3 } },
    { label: "きっかけがあると思い出す", score: { attachment: 2 } },
    { label: "普段はほとんど思い出さない", score: { independence: 3 } },
    { label: "思い出さないようにする", score: { reality: 2 } }
  ],
  "after",
  "B"
),

q(
  "q4c",
  "emotion",
  "🔁",
  "関係の終わり方",
  "after-relation",
  "関係が終わりそうだと感じたとき、あなたはどうする？",
  ["#0f2027", "#2c5364"],
  [
    { label: "自分から関係を戻そうとする", score: { attachment: 3 } },
    { label: "完全には切らずやり取りを続ける", score: { attachment: 2 } },
    { label: "流れに任せてそのまま離れる", score: { independence: 3 } },
    { label: "自分からはっきり終わらせる", score: { reality: 2 } }
  ],
  "after",
  "C"
),

q(
  "q5a",
  "emotion",
  "🌫️",
  "寂しさ",
  "lonely-core",
  "強い寂しさを感じたとき、どんな行動を取りやすい？",
  ["#1f1c2c", "#928dab"],
  [
    { label: "友人や身近な人を誘う", score: { attachment: 3 } },
    { label: "誰かに話しかける", score: { attachment: 2 } },
    { label: "一人で別のことをして気をそらす", score: { independence: 3 } },
    { label: "特になにもしない", score: { reality: 2 } }
  ],
  "loneliness-response",
  "A"
),

q(
  "q5b",
  "emotion",
  "📝",
  "感情処理",
  "lonely-process",
  "気分が落ちたとき、どうやって気持ちを整えることが多い？",
  ["#232526", "#414345"],
  [
    { label: "誰かに話して整理する", score: { attachment: 3 } },
    { label: "紙やメモに書いて整理する", score: { attachment: 2 } },
    { label: "一人で考えて落ち着くのを待つ", score: { independence: 3 } },
    { label: "別の予定を入れて切り替える", score: { reality: 2 } }
  ],
  "loneliness-response",
  "B"
),

q(
  "q5c",
  "emotion",
  "🌙",
  "孤独耐性",
  "lonely-tolerance",
  "一人の時間が長くなったとき、自然と取る行動は？",
  ["#0f2027", "#203a43"],
  [
    { label: "誰かと話すきっかけを探す", score: { attachment: 3 } },
    { label: "少し気になるがそのまま過ごす", score: { attachment: 2 } },
    { label: "特に困らず普段どおり過ごす", score: { independence: 3 } },
    { label: "むしろ一人の方が落ち着く", score: { reality: 2 } }
  ],
  "loneliness-response",
  "C"
),

q(
  "q6a",
  "social",
  "🫱",
  "信頼",
  "trust-core",
  "初めて会う人と話すとき、どんなふうに接することが多い？",
  ["#141e30", "#243b55"],
  [
    { label: "自分から話して打ち解ける", score: { attachment: 3 } },
    { label: "普通に話しながら相手を見る", score: { attachment: 2 } },
    { label: "少し様子を見てから話す", score: { independence: 3 } },
    { label: "最初は距離を保って接する", score: { caution: 2 } }
  ],
  "trust-speed",
  "A"
),
q(
  "q6b",
  "social",
  "👤",
  "初対面",
  "trust-firstimpression",
  "初対面で相手をどう見ることが多い？",
  ["#232526", "#414345"],
  [
    { label: "まず好意的に受け取る", score: { attachment: 3 } },
    { label: "特に決めつけず普通に接する", score: { attachment: 2 } },
    { label: "少し警戒して様子を見る", score: { independence: 3 } },
    { label: "言い方や表情まで細かく見る", score: { caution: 2 } }
  ],
  "trust-speed",
  "B"
),
q(
  "q6c",
  "emotion",
  "🪨",
  "裏切り",
  "trust-betrayal",
  "信頼していた人に裏切られた、どんな反応になりやすい？",
  ["#0f2027", "#000000"],
  [
    { label: "かなり引きずってしまう", score: { attachment: 3 } },
    { label: "理由を考えて相手の行動を振り返る", score: { attachment: 2 } },
    { label: "今後の付き合い方だけ決めて切り替える", score: { independence: 3 } },
    { label: "その人とは距離を取る", score: { caution: 2 } }
  ],
  "trust-speed",
  "C"
),

q(
  "q7a",
  "social",
  "👁️",
  "違和感",
  "intuition-core",
  "相手の言動に少し違和感を覚えたとき、どんな行動を取りやすい？",
  ["#141e30", "#243b55"],
  [
    { label: "その場で少し距離を取る", score: { intuition: 3 } },
    { label: "様子を見ながらそのまま話す", score: { intuition: 2 } },
    { label: "何が引っかかったか確かめる", score: { reality: 3 } },
    { label: "特に気にしない", score: { caution: 2 } }
  ],
  "intuition-discomfort",
  "A"
),
q(
  "q7b",
  "social",
  "🧩",
  "引っかかり",
  "intuition-feel",
  "初対面で『なんとなく合わないかも』、自然と取る行動は？",
  ["#232526", "#414345"],
  [
    { label: "自分からはあまり関わらないようにする", score: { intuition: 3 } },
    { label: "距離は変えずに少し様子を見る", score: { intuition: 2 } },
    { label: "会話や態度を見て判断し直す", score: { reality: 3 } },
    { label: "印象だけでは決めず普通に接する", score: { caution: 2 } }
  ],
  "intuition-discomfort",
  "B"
),

q(
  "q7c",
  "self",
  "🫧",
  "直感使用率",
  "intuition-usage",
  "日常のちょっとした選択で、どんな決め方をすることが多い？",
  ["#0f2027", "#2c5364"],
  [
    { label: "最初にいいと思った方を選ぶ", score: { intuition: 3 } },
    { label: "迷ったときだけ感覚で決める", score: { intuition: 2 } },
    { label: "比べられる材料を見て決める", score: { reality: 3 } },
    { label: "理由が決まるまで選ばない", score: { caution: 2 } }
  ],
  "intuition-discomfort",
  "C"
),
q(
  "q8a",
  "self",
  "📚",
  "根拠",
  "evidence-core",
  "何かを決めるとき、自然とどの進め方に近い？",
  ["#232526", "#414345"],
  [
    { label: "感覚で決めてから動く", score: { intuition: 3 } },
    { label: "ざっくり理由があれば決める", score: { intuition: 2 } },
    { label: "納得できる理由をそろえて決める", score: { reality: 3 } },
    { label: "根拠が足りないと決めない", score: { caution: 2 } }
  ],
  "evidence-need",
  "A"
),
q(
  "q8b",
  "self",
  "🗣️",
  "説明",
  "evidence-explain",
  "自分の選択を人に説明するとき、どんな伝え方になりやすい？",
  ["#0f2027", "#203a43"],
  [
    { label: "理由はうまく言えないが感覚で選ぶことがある", score: { intuition: 3 } },
    { label: "大まかな理由だけ伝える", score: { intuition: 2 } },
    { label: "順番に説明する", score: { reality: 3 } },
    { label: "説明できない選択はあまりしない", score: { caution: 2 } }
  ],
  "evidence-need",
  "B"
),
q(
  "q8c",
  "self",
  "⚙️",
  "判断材料",
  "evidence-balance",
  "初めて会う人を判断するとき、どこで判断する？",
  ["#141e30", "#243b55"],
  [
    { label: "第一印象で方向を決める", score: { intuition: 3 } },
    { label: "少し様子を見てから判断する", score: { intuition: 2 } },
    { label: "言い方や行動を見て判断する", score: { reality: 3 } },
    { label: "何回か会ってから決める", score: { caution: 2 } }
  ],
  "evidence-need",
  "C"
),
q(
  "q9a",
  "self",
  "⚡",
  "初動",
  "action-start",
  "やってみたいことができたとき、まずどう動く？",
  ["#141e30","#243b55"],
  [
    { label: "思いついた瞬間に始める", score: { passion: 3 } },
    { label: "少しだけ試して、続けるか様子を見る", score: { passion: 2 } },
    { label: "必要な情報を調べてから始める", score: { caution: 3 } },
    { label: "すぐには始めず、まず様子を見る", score: { reality: 2 } }
  ],
  "action",
  "A"
),

q(
  "q9b",
  "self",
  "🧪",
  "試し方",
  "action-trial",
  "新しいことに挑戦するとき、どんな始め方が多い？",
  ["#232526","#414345"],
  [
    { label: "最初からしっかり取り組む", score: { passion: 3 } },
    { label: "軽く触ってみて、続けるか決める", score: { passion: 2 } },
    { label: "やり方や手順を調べてから始める", score: { caution: 3 } },
    { label: "失敗しにくい安全な方法を選んで始める", score: { reality: 2 } }
  ],
  "action",
  "B"
),
q(
  "q9c",
  "self",
  "🪜",
  "進め方",
  "action-process",
  "やることが決まったあと、どんな進め方になる？",
  ["#0f2027","#2c5364"],
  [
    { label: "集中して一気に進める", score: { passion: 3 } },
    { label: "やりながら考えて調整する", score: { passion: 2 } },
    { label: "手順を決めて順番に進める", score: { caution: 3 } },
    { label: "状況に合わせてやり方を変えながら進める", score: { reality: 2 } }
  ],
  "action",
  "C"
),

q(
  "q10a",
  "self",
  "⚖️",
  "リスク",
  "risk-core",
  "リスクがある選択をするとき、どんな判断になりやすい？",
  ["#232526","#414345"],
  [
    { label: "気にせず挑戦してみる", score: { passion: 3 } },
    { label: "条件を決めて、その範囲で挑戦する", score: { passion: 2 } },
    { label: "リスクとメリットを計算して決める", score: { caution: 3 } },
    { label: "もっと安全な方法がないか探す", score: { reality: 2 } }
  ],
  "risk",
  "A"
),


q(
  "q10b",
  "self",
  "🧮",
  "判断基準",
  "risk-judge",
  "迷ったとき、どんな基準で決めることが多い？",
  ["#141e30","#243b55"],
  [
    { label: "とりあえずやってみて判断する", score: { passion: 3 } },
    { label: "できそうなら進める", score: { passion: 2 } },
    { label: "条件を整理してから決める", score: { caution: 3 } },
    { label: "リスクが減るまで待つ", score: { reality: 2 } }
  ],
  "risk",
  "B"
),



q(
  "q10c",
  "self",
  "🔀",
  "選択",
  "risk-choice",
  "先が見えない道を進むとき、どんな選び方をする？",
  ["#0f2027","#2c5364"],
  [
    { label: "気にせずまっすぐ進む", score: { passion: 3 } },
    { label: "感覚で方向を決める", score: { intuition: 3 } },
    { label: "周りの情報を集めてから進む方向を決める", score: { caution: 3 } },
    { label: "無理に進まず、別の道がないか探す", score: { reality: 2 } }
  ],
  "risk",
  "C"
),



q(
  "q11a",
  "self",
  "🚀",
  "チャンス",
  "chance-core",
  "今だな”って空気を感じたとき、まずどう動く？",
  ["#141e30","#243b55"],
  [
    { label: "すぐに動く", score: { passion: 3 } },
    { label: "できる範囲で動き始める", score: { passion: 2 } },
    { label: "条件を見てから動く", score: { caution: 3 } },
    { label: "様子を見てから決める", score: { reality: 2 } }
  ],
  "chance",
  "A"
),

q(
  "q11b",
  "self",
  "📈",
  "機会",
  "chance-use",
  "良さそうな機会がふっと転がってきたとき、どうする？",
  ["#232526","#414345"],
  [
    { label: "迷わず参加する", score: { passion: 3 } },
    { label: "できる範囲で関わる", score: { passion: 2 } },
    { label: "条件を確認してから決める", score: { caution: 3 } },
    { label: "見送ることも多い", score: { reality: 2 } }
  ],
  "chance",
  "B"
),

q(
  "q11c",
  "self",
  "🎯",
  "動き方",
  "chance-style",
  "チャンスを活かすとき、あなたはどう動く？",
  ["#0f2027","#2c5364"],
  [
    { label: "自分から取りに行く", score: { passion: 3 } },
    { label: "流れに乗って動く", score: { intuition: 3 } },
    { label: "準備を整えてから動く", score: { caution: 3 } },
    { label: "無理に取りに行かない", score: { reality: 2 } }
  ],
  "chance",
  "C"
),



q(
  "q12a",
  "social",
  "⚡",
  "衝突",
  "conflict-core",
  "意見がぶつかったとき、あなたはどんな“最初の一手”を打つ？",
  ["#232526","#000000"],
  [
    { label: "その場で自分の意見をはっきり言う", score: { passion: 3 } },
    { label: "主導して話をまとめようとする", score: { passion: 2 } },
    { label: "順番に整理して話す", score: { caution: 3 } },
    { label: "自分の意見は控えめにする", score: { attachment: 2 } }
  ],
  "conflict",
  "A"
),


q(
  "q12b",
  "social",
  "🗣️",
  "話し方",
  "conflict-style",
  "ちょっと空気がピリついてる場面、どんな話し方になる？",
  ["#141e30","#243b55"],
  [
    { label: "気にせず意見を言い切る", score: { passion: 3 } },
    { label: "相手の反応を見ながら伝える", score: { attachment: 2 } },
    { label: "言い方を選んで丁寧に伝える", score: { caution: 3 } },
    { label: "必要なことだけ伝える", score: { reality: 2 } }
  ],
  "conflict",
  "B"
),

q(
  "q12c",
  "social",
  "🧊",
  "対応",
  "conflict-response",
  "衝突が起きたあと、どんな“距離の取り方”をしがち？",
  ["#0f2027","#2c5364"],
  [
    { label: "すぐに関係を戻そうとする", score: { attachment: 3 } },
    { label: "少し時間をおいてから話す", score: { caution: 3 } },
    { label: "必要なことだけ整理して話す", score: { reality: 2 } },
    { label: "相手と距離を取る", score: { independence: 3 } }
  ],
  "conflict",
  "C"
),

q(
  "q13a",
  "social",
  "🤝",
  "頼り方",
  "support-core",
  "ちょっと困ったとき、あなたはどんな“助けの求め方”をする？",
  ["#232526","#414345"],
  [
    { label: "すぐに誰かに相談する", score: { attachment: 3 } },
    { label: "必要な部分だけ助けてもらう", score: { attachment: 2 } },
    { label: "まずは自分でやってみる", score: { independence: 3 } },
    { label: "人には頼らない", score: { reality: 2 } }
  ],
  "support",
  "A"
),


q(
  "q13b",
  "social",
  "🧩",
  "助け方",
  "support-style",
  "後輩が困っているのを見かけたとき、あなたはどうする？",
  ["#141e30","#243b55"],
  [
    { label: "すぐに声をかけて一緒に解決する", score: { attachment: 3 } },
    { label: "『大丈夫？』と声を掛ける", score: { attachment: 2 } },
    { label: "状況を見て、必要なら手伝うと伝える", score: { caution: 3 } },
    { label: "まずは見守って、求められたら助ける", score: { independence: 3 } }
  ],
  "support",
  "B"
),


q(
  "q13c",
  "social",
  "🫥",
  "見せない弱さ",
  "vulnerability",
  "好きな人の前でしんどい時、自分の弱さはどう出る？",
  ["#7c3aed", "#ec4899"],
  [
    { label: "隠しきれず、わかってほしくて態度に出る", score: { attachment: 3, passion: 1 } },
    { label: "やんわり伝えるが、重くならないように抑える", score: { attachment: 2, caution: 1 } },
    { label: "言葉にして伝える前に、自分の中で整理する", score: { independence: 2, reality: 1 } },
    { label: "なるべく見せず、普段どおりに振る舞う", score: { reality: 2, caution: 1 } },
  ],
  "support",
  "C"
),





q(
  "q14a",
  "self",
  "🌧️",
  "感情",
  "emotion-core",
  "気持ちが沈んでしまった日、あなたはまずどうする？",
  ["#232526","#414345"],
  [
    { label: "誰かに話して気持ちを軽くする", score: { attachment: 3 } },
    { label: "落ち込んだ原因を自分で分析する", score: { caution: 3 } },
    { label: "一人で静かに過ごして気持ちを落ち着かせる", score: { independence: 3 } },
    { label: "別の予定や行動で気分を切り替える", score: { reality: 2 } }
  ],
  "emotion",
  "A"
),

q(
  "q14b",
  "self",
  "🔥",
  "切り替え",
  "emotion-switch",
  "気持ちを切り替えたい、あなたが押しがちな“スイッチ”はどれ？",
  ["#141e30","#243b55"],
  [
    { label: "人と話して気分を変える", score: { attachment: 3 } },
    { label: "好きなことをして流れを変える", score: { passion: 2 } },
    { label: "状況を整理して落ち着かせる", score: { caution: 3 } },
    { label: "時間を置いて自然に戻す", score: { reality: 2 } }
  ],
  "emotion",
  "B"
),

q(
  "q14c",
  "self",
  "🧘",
  "心の扱い方",
  "emotion-handle",
  "誰かに短所を指摘されたとき、あなたはどう気持ちを立て直す？",
  ["#0f2027","#2c5364"],
  [
    { label: "すぐ誰かに話して、気持ちを吐き出す", score: { attachment: 3 } },
    { label: "言われた内容を整理して、必要な部分だけ受け取る", score: { caution: 3 } },
    { label: "一人になって距離を置き、静かに落ち着く", score: { independence: 3 } },
    { label: "『まあいっか』と気にしないようにする", score: { reality: 2 } }
  ],
  "emotion",
  "C"
),





q(
  "q15a",
  "self",
  "🧭",
  "決断",
  "decision-core",
  "大事な選択を迫られたとき、あなたはどう決める？",
  ["#232526","#414345"],
  [
    { label: "自分の“好き・嫌い”で選ぶ", score: { passion: 3 } },
    { label: "理由はないけど“こっちだ”と直感で決める", score: { intuition: 3 } },
    { label: "条件を整理して、最も合理的な方を選ぶ", score: { caution: 3 } },
    { label: "無理のない方・現実的な方を選ぶ", score: { reality: 2 } }
  ],
  "decision",
  "A"
),

q(
  "q15b",
  "self",
  "📌",
  "優先順位",
  "decision-priority",
  "予定が重なったとき、あなたの優先順位は？",
  ["#141e30","#243b55"],
  [
    { label: "行きたい方・楽しそうな方を優先する", score: { passion: 3 } },
    { label: "必要な方・外せない方を優先する", score: { reality: 2 } },
    { label: "時間・重要度・順番を整理して決める", score: { caution: 3 } },
    { label: "そのときの流れや勘で決める", score: { intuition: 3 } }
  ],
  "decision",
  "B"
),

q(
  "q15c",
  "self",
  "🛣️",
  "選択の傾向",
  "decision-style",
  "休日の過ごし方で迷ったとき、あなたは何で決める？",
  ["#0f2027","#2c5364"],
  [
    { label: "ワクワクする方・気分が乗る方を選ぶ", score: { passion: 3 } },
    { label: "体力や時間など、無理のない方を選ぶ", score: { reality: 2 } },
    { label: "予定や優先度を整理して、最適な方を選ぶ", score: { caution: 3 } },
    { label: "その瞬間の勘や流れで決める", score: { intuition: 3 } }
  ],
  "decision",
  "C"
),


q(
  "q16a",
  "social",
  "🔓",
  "心を開く速さ",
  "opening-up",
  "気になる相手に、素の自分を見せるのはどんな時？",
  ["#7c3aed", "#ec4899"],
  [
    { label: "惹かれたら、わりとすぐ素が出る", score: { attachment: 3, passion: 1 } },
    { label: "安心できそうなら、少しずつ見せていく", score: { attachment: 2, caution: 1 } },
    { label: "見せたい気持ちはあっても、まだ様子を見る", score: { independence: 2, caution: 1 } },
    { label: "ちゃんと信頼するまでは、あまり見せない", score: { reality: 2, caution: 1 } },
  ],
  "relation",
  "A"
),



q(
  "q16b",
  "social",
  "🌿",
  "関係の深まり",
  "relation-deepen",
  "仲良くなってきた頃、あなたの“距離の取り方”は？",
  ["#141e30","#243b55"],
  [
    { label: "一気に距離が近くなり、よく連絡を取るようになる", score: { attachment: 3 } },
    { label: "相手のペースを見ながら、少しずつ距離を縮める", score: { attachment: 2 } },
    { label: "仲良くなっても、一定の距離感は保つ", score: { independence: 3 } },
    { label: "必要なときだけ連絡を取る程度にとどめる", score: { reality: 2 } }
  ],
  "relation",
  "B"
),


q(
  "q16c",
  "social",
  "🌙",
  "疲れた日",
  "relation-tired",
  "ちょっと疲れている日に、人から誘われたらどうする？",
  ["#0f2027","#2c5364"],
  [
    { label: "無理してでも行って、相手を優先する", score: { attachment: 3 } },
    { label: "相手との関係性を見て、行くかどうか決める", score: { attachment: 2 } },
    { label: "断って一人で休む", score: { independence: 3 } },
    { label: "別日にしてもらうなど、現実的に調整する", score: { caution: 3 } }
  ],
  "relation",
  "C"
),

q(
  "q17a",
  "self",
  "⏳",
  "ストレス反応",
  "stress-busy",
  "忙しさで余裕がなくなったとき、あなたはどうする？",
  ["#232526","#414345"],
  [
    { label: "誰かに相談して助けを求める", score: { attachment: 3 } },
    { label: "気分転換をはさんでリセットする", score: { passion: 2 } },
    { label: "今やる事を整理して優先順位をつけ直す", score: { caution: 3 } },
    { label: "一人で黙々と片付ける", score: { independence: 3 } }
  ],
  "stress",
  "A"
),

q(
  "q17b",
  "self",
  "🌀",
  "ストレス反応",
  "stress-plan",
  "予定が急に崩れたとき、あなたはどう対処する？",
  ["#141e30","#243b55"],
  [
    { label: "誰かに話して気持ちを整える", score: { attachment: 3 } },
    { label: "別の楽しみを作って切り替える", score: { passion: 2 } },
    { label: "新しい予定を組み直す", score: { caution: 3 } },
    { label: "ひとまず一人になって落ち着く", score: { independence: 3 } }
  ],
  "stress",
  "B"
),

q(
  "q17c",
  "self",
  "⚡",
  "ストレス反応",
  "stress-trouble",
  "思わぬトラブルが起きたとき、あなたはまず何をする？",
  ["#0f2027","#2c5364"],
  [
    { label: "周りに助けを求める", score: { attachment: 3 } },
    { label: "気持ちを切り替えて動き出す", score: { passion: 2 } },
    { label: "状況を整理して対処法を考える", score: { caution: 3 } },
    { label: "一人で静かに状況を確認する", score: { independence: 3 } }
  ],
  "stress",
  "C"
),

q(
  "q18a",
  "self",
  "🌥️",
  "自己管理",
  "self-low",
  "やる気が出ない日に、あなたはどう動く？",
  ["#232526","#414345"],
  [
    { label: "誰かと話して気持ちを上げる", score: { attachment: 3 } },
    { label: "好きなことをして気分を上げる", score: { passion: 2 } },
    { label: "やるべきことを小さく分けて進める", score: { caution: 3 } },
    { label: "今日は休むと決めて一人で過ごす", score: { independence: 3 } }
  ],
  "self",
  "A"
),

q(
  "q18b",
  "self",
  "🛏️",
  "自己管理",
  "self-rhythm",
  "生活リズムが乱れたとき、あなたはどう立て直す？",
  ["#141e30","#243b55"],
  [
    { label: "誰かに相談してアドバイスをもらう", score: { attachment: 3 } },
    { label: "気分転換して流れを変える", score: { passion: 2 } },
    { label: "計画を立て直して整える", score: { caution: 3 } },
    { label: "一人で静かにリズムを整える", score: { independence: 3 } }
  ],
  "self",
  "B"
),

q(
  "q18c",
  "self",
  "📚",
  "自己管理",
  "self-task",
  "やるべきことが溜まったとき、あなたはどう片付ける？",
  ["#0f2027","#2c5364"],
  [
    { label: "誰かに話して気持ちを軽くしてから動く", score: { attachment: 3 } },
    { label: "勢いで一気に片付ける", score: { passion: 2 } },
    { label: "優先順位をつけて順番に処理する", score: { caution: 3 } },
    { label: "一人で集中できる環境を作る", score: { independence: 3 } }
  ],
  "self",
  "C"
),

q(
  "q19a",
  "self",
  "💎",
  "価値観",
  "value-core",
  "日常で“これだけは大事にしたい”と思うものは？",
  ["#232526","#414345"],
  [
    { label: "人とのつながりや関係性", score: { attachment: 3 } },
    { label: "楽しさ・ワクワク感", score: { passion: 2 } },
    { label: "安定・安心できる環境", score: { caution: 3 } },
    { label: "自分の時間・自由さ", score: { independence: 3 } }
  ],
  "value",
  "A"
),

q(
  "q19b",
  "self",
  "🧱",
  "価値観",
  "value-boundary",
  "人付き合いで“ここだけは譲れない”ポイントは？",
  ["#141e30","#243b55"],
  [
    { label: "気持ちを大切にしてくれること", score: { attachment: 3 } },
    { label: "楽しくいられること", score: { passion: 2 } },
    { label: "約束やルールを守ること", score: { caution: 3 } },
    { label: "距離感を尊重してくれること", score: { independence: 3 } }
  ],
  "value",
  "B"
),

q(
  "q19c",
  "self",
  "🤝",
  "価値観",
  "value-need",
  "人に求めるものとして、一番近いのは？",
  ["#0f2027","#2c5364"],
  [
    { label: "気持ちを共有できること", score: { attachment: 3 } },
    { label: "一緒に楽しめること", score: { passion: 2 } },
    { label: "安心して任せられること", score: { caution: 3 } },
    { label: "お互いに自由でいられること", score: { independence: 3 } }
  ],
  "value",
  "C"
),


q(
  "q20a",
  "self",
  "🚀",
  "行動スタイル",
  "style-start",
  "新しいことを始めるとき、あなたはどう動く？",
  ["#232526","#414345"],
  [
    { label: "誰かと一緒に始めると安心する", score: { attachment: 3 } },
    { label: "勢いでまずやってみる", score: { passion: 2 } },
    { label: "情報を集めて準備してから動く", score: { caution: 3 } },
    { label: "一人で静かに始める方がやりやすい", score: { independence: 3 } }
  ],
  "style",
  "A"
),

q(
  "q20b",
  "self",
  "🧩",
  "行動スタイル",
  "style-multi",
  "やりたいことが複数あるとき、あなたはどう決める？",
  ["#141e30","#243b55"],
  [
    { label: "誰かに相談して決める", score: { attachment: 3 } },
    { label: "一番ワクワクするものを選ぶ", score: { passion: 2 } },
    { label: "優先順位をつけて順番に進める", score: { caution: 3 } },
    { label: "気分が向いたものから始める", score: { intuition: 3 } }
  ],
  "style",
  "B"
),

q(
  "q20c",
  "self",
  "🧹",
  "行動スタイル",
  "style-avoid",
  "やりたくないことに向き合うとき、あなたはどう動く？",
  ["#0f2027","#2c5364"],
  [
    { label: "誰かに愚痴って気持ちを軽くしてから取りかかる", score: { attachment: 3 } },
    { label: "勢いで一気に終わらせる", score: { passion: 2 } },
    { label: "手順を決めて少しずつ進める", score: { caution: 3 } },
    { label: "一人で集中できる環境を作って向き合う", score: { independence: 3 } }
  ],
  "style",
  "C"
), 
];








const types: TypeDef[] = [
  {
    id: "kuchisake",
    name: "口裂け女",
    vibe: "答えを求め続ける存在",
    axis: { passion: 42, caution: 88, intuition: 38, reality: 34, attachment: 92, independence: 18 },
    colors: ["#ff416c", "#ff4b2b"],
    publicMask: "魅力的で距離感がうまい",
    innerCore: "曖昧な愛に耐えられない",
    risk: "詮索しすぎる",
    gift: "本音を見抜く",
    scaryTitle: "問い続ける女",
    loveWarning: "答えを求めすぎる",
    traits: { behavior: "反応を確かめる", emotion: "不安と承認欲求", love: "確かめたくなる" },
  },
  {
    id: "hanako",
    name: "花子さん",
    vibe: "静かに残る存在",
    axis: { passion: 28, caution: 58, intuition: 86, reality: 24, attachment: 88, independence: 36 },
    colors: ["#1c1c1c", "#434343"],
    publicMask: "大人しく優しい",
    innerCore: "忘れられるのが怖い",
    risk: "溜め込む",
    gift: "深い共感",
    scaryTitle: "消えない記憶",
    loveWarning: "静かに束縛する",
    traits: { behavior: "静かに残る", emotion: "内向きの執着", love: "言わずに続く" },
  },
  {
    id: "sadako",
    name: "貞子",
    vibe: "忘れられない侵食",
    axis: { passion: 22, caution: 48, intuition: 94, reality: 16, attachment: 82, independence: 24 },
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
    axis: { passion: 14, caution: 62, intuition: 22, reality: 90, attachment: 12, independence: 94 },
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
    axis: { passion: 82, caution: 48, intuition: 20, reality: 64, attachment: 24, independence: 88 },
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
    axis: { passion: 18, caution: 88, intuition: 14, reality: 94, attachment: 18, independence: 56 },
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
    axis: { passion: 18, caution: 92, intuition: 78, reality: 42, attachment: 38, independence: 46 },
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
    axis: { passion: 84, caution: 44, intuition: 34, reality: 26, attachment: 86, independence: 20 },
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
    axis: { passion: 16, caution: 38, intuition: 88, reality: 34, attachment: 16, independence: 90 },
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
    axis: { passion: 34, caution: 34, intuition: 52, reality: 30, attachment: 90, independence: 8 },
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
    axis: { passion: 26, caution: 54, intuition: 74, reality: 62, attachment: 22, independence: 84 },
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
    axis: { passion: 96, caution: 36, intuition: 22, reality: 12, attachment: 90, independence: 10 },
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


function shuffleArray<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickOneQuestionPerGroup(pool: Question[]): Question[] {
  const byGroup = new Map<QuestionGroupId, Question[]>();

  for (const item of pool) {
    const list = byGroup.get(item.groupId) ?? [];
    list.push(item);
    byGroup.set(item.groupId, list);
  }

  const selected: Question[] = [];

  for (const groupId of QUESTION_GROUP_ORDER) {
    const candidates = byGroup.get(groupId) ?? [];

    if (candidates.length === 0) {
      throw new Error(`質問グループが不足しています: ${groupId}`);
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    selected.push(picked);
  }

  return shuffleArray(selected);
}

function normalizeVectorToPercent(axis: AxisScores): AxisScores {
  const sum = AXES.reduce((acc, key) => acc + Math.max(0, axis[key]), 0) || 1;
  const result = { ...ZERO };

  for (const key of AXES) {
    result[key] = Number(((Math.max(0, axis[key]) / sum) * 100).toFixed(2));
  }

  return result;
}




function normalizeUserAxisScores(raw: AxisScores, axisMaxScores: AxisScores): AxisScores {
  const corrected = { ...ZERO };

  for (const key of AXES) {
    const maxScore = axisMaxScores[key] || 1;
    corrected[key] = Number(((raw[key] / maxScore) * 100).toFixed(2));
  }

  return corrected;
}





function normalizeTypeAxisScores(axis: AxisScores): AxisScores {
  const result = { ...ZERO };
  const max = Math.max(...AXES.map((key) => axis[key]), 1);

  for (const key of AXES) {
    result[key] = Number(((axis[key] / max) * 100).toFixed(2));
  }

  return result;
}









function weightedCosineSimilarity(
  user: AxisScores,
  target: AxisScores,
  weights: AxisScores
): number {
  let dot = 0;
  let userNorm = 0;
  let targetNorm = 0;

  for (const key of AXES) {
    const w = weights[key];
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



function topAxisBonus(user: AxisScores, target: AxisScores): number {
  const userTop = getTopAxes(user, 2);
  const targetTop = getTopAxes(target, 2);

  let bonus = 0;
  if (userTop[0] === targetTop[0]) bonus += 2.5;
  if (userTop[1] === targetTop[1]) bonus += 1.5;

  return bonus;
}








function axisDistance(user: AxisScores, target: AxisScores, weights: AxisScores): number {
  let sum = 0;

  for (const key of AXES) {
    const w = weights[key];
    sum += Math.abs(user[key] - target[key]) * w;
  }

  return sum;
}



function similarity(user: AxisScores, target: AxisScores, weights: AxisScores): number {
  const base = weightedCosineSimilarity(user, target, weights);

  const userTop = getTopAxes(user, 2);
  const targetTop = getTopAxes(target, 2);
  const overlap = userTop.filter((axis) => targetTop.includes(axis)).length;
  const overlapBonus = overlap === 2 ? 0.8 : overlap === 1 ? 0.4 : 0;

  const sharpness = getPrimaryAxisGap(user);
  const sharpnessBonus =
    sharpness >= 10 && userTop[0] === targetTop[0] ? 0.4 : 0;

  const topBonus = topAxisBonus(user, target);

  const distance = axisDistance(user, target, weights);
  const distancePenalty = distance * 0.14;

  return Number(
    Math.max(
      0,
      Math.min(100, base + overlapBonus + sharpnessBonus + topBonus - distancePenalty)
    ).toFixed(2)
  );
}



function pickCompatibility(
  user: AxisScores,
  types: TypeDef[],
  weights: AxisScores
) {
  const scored = types.map((t) => {
    const normalizedTypeAxis = normalizeTypeAxisScores(t.axis);
    const dist = axisDistance(user, normalizedTypeAxis, weights);
    return { id: t.id, dist };
  });

  const sorted = [...scored].sort((a, b) => a.dist - b.dist);
  const reverse = [...scored].sort((a, b) => b.dist - a.dist);

  const selfId = sorted[0]?.id;

  const good =
    sorted.find((s) => s.id !== selfId)?.id ??
    sorted[1]?.id ??
    sorted[0]?.id;

  const bad =
    reverse.find((s) => s.id !== selfId)?.id ??
    reverse[1]?.id ??
    reverse[0]?.id;

  return { good, bad };
}

function inferResultMode(firstScore: number, secondScore: number): ResultMode {
  const diff = firstScore - secondScore;
  const bothHigh = firstScore >= 72 && secondScore >= 68;

  if (diff >= 8) return "dominant-dual";
  return bothHigh ? "balanced-dual" : "dominant-dual";
}



function topTwoBlend(firstScore: number, secondScore: number) {
  const diff = Math.max(0, firstScore - secondScore);
  const firstClamped = Math.max(0, Math.min(100, firstScore));

  const diffFactor = Math.min(1, diff / 12);
  const firstFactor = Math.max(0, Math.min(1, (firstClamped - 60) / 40));

  const raw = 60 + diffFactor * 24 + firstFactor * 6;

  const p1 = Math.round(Math.max(60, Math.min(94, raw)));
  return { p1, p2: 100 - p1 };
}





function buildResultName(first: RankedType, second: RankedType, p1: number) {
  if (p1 >= 75) return `${first.name}寄り${second.name}型`;
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


function buildShareSummary(first: RankedType) {
  const source = `${first.name} ${first.publicMask} ${first.innerCore} ${first.traits.behavior} ${first.traits.emotion}`;

  if (/一つ目小僧/.test(source)) {
    return "違和感を先に見抜く。\n感情はほとんど表に出ない。";
  }
  if (/貞子/.test(source)) {
    return "気配で残る。\n深いところに静かに入り込む。";
  }
  if (/口裂け女/.test(source)) {
    return "存在感が強い。\n触れた瞬間に空気を支配する。";
  }
  if (/花子さん/.test(source)) {
    return "静かに潜む。\n気づけば場の中心にいる。";
  }
  if (/雪女/.test(source)) {
    return "温度を見せない。\n近づかずに支配する。";
  }
  if (/鬼女/.test(source)) {
    return "感情が深い。\n一度火がつくと止まらない。";
  }
  if (/ろくろ首/.test(source)) {
    return "静かに見える。\n距離の詰め方が極端。";
  }
  if (/のっぺらぼう/.test(source)) {
    return "感情が読めない。\n不気味な余白だけ残る。";
  }
  if (/座敷童/.test(source)) {
    return "自然に溶け込む。\n静かに影響を残す。";
  }
  if (/ぬらりひょん/.test(source)) {
    return "境界を越えてくる。\n気づけば居場所を奪われる。";
  }
  if (/河童/.test(source)) {
    return "軽く見える。\n裏で流れをずらす。";
  }
  if (/天狗/.test(source)) {
    return "全体を見ている。\n上から空気を動かす。";
  }

  return "感情が残る。\n影響が長く続く。";
}








const CARD_CHARACTER_NAMES = [
  "口裂け女",
  "花子さん",
  "貞子",
  "雪女",
  "鬼女",
  "一つ目小僧",
  "ろくろ首",
  "のっぺらぼう",
  "座敷童",
  "ぬらりひょん",
  "河童",
  "天狗",
] as const;


function pickCardRare(blend: { p1: number; p2: number }): Rarity {
  if (blend.p1 >= 90) return "UR";
  if (blend.p1 >= 83) return "SSR";
  if (blend.p1 >= 70) return "SR";
  return "R";
}



  function pickCardElements(first: RankedType, second?: RankedType) {
const source = `${first.name} ${second?.name ?? ""} ${first.vibe} ${second?.vibe ?? ""} ${first.scaryTitle} ${first.loveWarning}`;
  

  const result: string[] = [];

  if (/口裂け女|鬼女/.test(source)) result.push("存在感");
  if (/貞子|花子さん/.test(source)) result.push("不穏");
  if (/雪女/.test(source)) result.push("冷気");
  if (/一つ目小僧/.test(source)) result.push("観察");
  if (/ろくろ首/.test(source)) result.push("接近");
  if (/のっぺらぼう/.test(source)) result.push("異質");
  if (/座敷童/.test(source)) result.push("干渉");
  if (/ぬらりひょん/.test(source)) result.push("侵食");
  if (/河童/.test(source)) result.push("誘導");
  if (/天狗/.test(source)) result.push("俯瞰");

  if (/鬼女|口裂け女|貞子|ろくろ首/.test(source)) result.push("執着");
  if (/雪女|貞子|花子さん/.test(source)) result.push("静圧");
  if (/一つ目小僧|のっぺらぼう|座敷童/.test(source)) result.push("異質");
  if (/天狗|鬼女/.test(source)) result.push("支配");

  if (result.length < 2) result.push("怪気");
  if (result.length < 2) result.push("概念");

  return [...new Set(result)].slice(0, 2);
}










function extractMatchNames(
  text: string,
  fallback: string,
  excludeNames: string[] = []
) {
  if (!text) return fallback;

  const cleaned = text
    .replace(/[◎○●・]/g, " ")
    .replace(/相性の良い相手|相性の悪い相手|おすすめ|注意|タイプ|なのは|です|である|。|、|，/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const found = CARD_CHARACTER_NAMES.filter(
    (name) => cleaned.includes(name) && !excludeNames.includes(name)
  );

  if (found.length >= 2) return `${found[0]} / ${found[1]}`;
  if (found.length === 1) return found[0];
  return fallback;
}


function pickStats(first: RankedType) {
  const passion = first.axis.passion ?? 0;
  const caution = first.axis.caution ?? 0;
  const intuition = first.axis.intuition ?? 0;
  const attachment = first.axis.attachment ?? 0;
  const independence = first.axis.independence ?? 0;

  const raw = [
    {
      label: "執着度",
      value: attachment * 0.75 + passion * 0.25,
    },
    {
      label: "威圧度",
      value: passion * 0.55 + intuition * 0.45,
    },
    {
      label: "冷淡度",
      value: caution * 0.45 + independence * 0.55,
    },
  ];

  const total = raw.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return [
      { label: "執着度", value: 34 },
      { label: "威圧度", value: 33 },
      { label: "冷淡度", value: 33 },
    ];
  }

  let normalized = raw.map((item) => ({
    ...item,
    value: Math.round((item.value / total) * 100),
  }));

  const diff =
    100 - normalized.reduce((sum, item) => sum + item.value, 0);

  if (diff !== 0) {
    const maxIndex = normalized.reduce(
      (best, item, index, arr) =>
        item.value > arr[best].value ? index : best,
      0
    );
    normalized[maxIndex].value += diff;
  }

  return normalized;
}


function buildCardSummary(first: RankedType, sections: ReturnType<typeof splitSections>) {
  const source = `${first.name} ${first.publicMask} ${first.innerCore} ${first.traits.behavior} ${first.traits.emotion}`;

  if (/一つ目小僧/.test(source)) {
    return "静かに違和感を見抜く観察分析型。感情を表に出さないまま、相手の揺れや空気の綻びを先に察知します。";
  }
  if (/貞子/.test(source)) {
    return "言葉より気配で存在を残す静圧型。距離を詰めずに、相手の深い場所へじわりと入り込みます。";
  }
  if (/口裂け女/.test(source)) {
    return "強い存在感と執着を秘めた高緊張型。感情に触れた瞬間、空気ごと支配するような存在感が立ち上がります。";
  }
  if (/花子さん/.test(source)) {
    return "静けさの奥に不穏さを隠す待機型。目立たないまま場に残り、気づけば空気の中心へ入り込みます。";
  }
  if (/雪女/.test(source)) {
    return "熱を見せずに距離を支配する低温型。近づきすぎないまま、相手の温度だけを静かに奪っていきます。";
  }
  if (/鬼女/.test(source)) {
    return "感情の出力が高い情念型。愛情も怒りも深く、一度火がつくと自分でも抑えにくくなるタイプです。";
  }
  if (/ろくろ首/.test(source)) {
    return "普段は静かでも、意識が向いた瞬間に一気に距離を詰める急接近型。";
  }
  if (/のっぺらぼう/.test(source)) {
    return "感情を読ませずに相手を揺らす無表情型。静かな空白のまま、不気味な印象だけを残します。";
  }
  if (/座敷童/.test(source)) {
    return "穏やかに場へ溶け込みながら、見えない影響を残す干渉型。静かでも無視できない存在です。";
  }
  if (/ぬらりひょん/.test(source)) {
    return "自然に境界を越えて入り込む侵食型。気づいた時には、相手のペースと居場所を奪っています。";
  }
  if (/河童/.test(source)) {
    return "軽さの奥に癖を隠した誘導型。親しみやすさの裏で、相手の注意を静かに逸らしていきます。";
  }
  if (/天狗/.test(source)) {
    return "全体を見渡しながら主導権を取る俯瞰型。近づきすぎずに、上から空気を動かすタイプです。";
  }

  const base = sections.basic || `${first.publicMask}。${first.innerCore}。`;
  return trimForCard(base, 58);

  
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
    hidden: get("【隠れた性格】", "【⚠ 相性の悪い相手】"),
    bad: get("【⚠ 相性の悪い相手】", "【◎ 相性の良い相手】"),
    good: get("【◎ 相性の良い相手】"),
  };
}

const characterAdjustments: Record<string, string> = {
  "口裂け女": "sharp mouth motif, anxious beauty, uneasy smile",
  "花子さん": "school ghost atmosphere, quiet presence, nostalgic eeriness",
  "貞子": "long dark hair, static-like unease, lingering presence",
  "ろくろ首": "stretched-neck creepiness expressed subtly in silhouette or posture",
  "鬼女": "intense rage, strong presence, wild emotional energy",
  "雪女": "cold beauty, stillness, icy elegance",
  "一つ目小僧": "single-eye motif, observant and uncanny",
  "のっぺらぼう": "blank-faced unease, hidden emotion, smooth facial minimalism",
  "ぬらりひょん": "slippery, elusive, refined but uncanny old-spirit feeling",
  "座敷童": "protective domestic spirit, warmth mixed with uncanny childlike presence",
  "河童": "earthy water-creature feeling, practical and rustic yokai details",
  "天狗": "pride, conviction, sharp avian-yokai authority",
};

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


function QuestionVisual({ item }: { item: Question }) {
  if (!item) return null;

  return (
    <div style={styles.visualWrap}>
      <div style={styles.visualEmoji}>{item.visualEmoji}</div>
      <div style={styles.visualTitle}>{item.visualTitle}</div>
      <div style={styles.visualTag}>{item.visualTag}</div>
    </div>
  );
}








function ResultHero({
  first,
  second,
  p1,
  p2,
  resultName,
  imageUrl,
  isMobile,
}: {
  first: RankedType;
  second: RankedType;
  p1: number;
  p2: number;
  resultName: string;
  imageUrl: string;
  isMobile: boolean;
}) {
  return (
    <div
      style={{
        ...styles.resultHero,
        gridTemplateColumns: imageUrl
          ? isMobile
            ? "1fr"
            : "minmax(0, 1fr) minmax(360px, 520px)"
          : "1fr",
        alignItems: "center",
        gap: isMobile ? 20 : 28,
      }}
    >
      <div style={styles.resultHeroText}>
        <div style={styles.resultHeroBadge}>診断結果</div>
        <h2 style={styles.resultHeroTitle}>{resultName}</h2>

        <div style={styles.resultHeroBlend}>
          <span>{first.name}</span>
          <span>{p1}%</span>
          <span>×</span>
          <span>{second.name}</span>
          <span>{p2}%</span>
        </div>

        <p style={styles.resultHeroVibe}>
          {first.vibe}
          {p2 > 0 ? ` × ${second.vibe}` : ""}
        </p>
      </div>

      {imageUrl ? (
        <div
          style={{
            ...styles.resultHeroImageWrap,
            width: "100%",
            maxWidth: isMobile ? "100%" : 520,
            aspectRatio: isMobile ? "4 / 5" : "4 / 5",
            margin: isMobile ? "0 auto" : undefined,
          }}
        >
          <img
            src={imageUrl}
            alt={resultName}
            style={{
              ...styles.resultHeroImage,
              objectFit: "cover",
              objectPosition: "center top",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}









function pickMoveName(first: RankedType, second: RankedType) {
  const source = `${first.name} ${second.name} ${first.traits.behavior} ${first.traits.emotion} ${first.traits.love}`;

  if (/鬼女/.test(source)) return "感情暴走";
  if (/口裂け女/.test(source)) return "無言の威圧";
  if (/花子さん|貞子/.test(source)) return "気配支配";
  if (/雪女/.test(source)) return "温度低下";
  if (/天狗/.test(source)) return "上空監視";
  if (/河童/.test(source)) return "水際誘導";
  if (/一つ目小僧/.test(source)) return "単眼注視";
  if (/ろくろ首/.test(source)) return "異常接近";
  if (/のっぺらぼう/.test(source)) return "無貌の圧";
  if (/座敷童/.test(source)) return "静かな干渉";
  if (/ぬらりひょん/.test(source)) return "日常侵食";
  return "怪異発現";
}




function ShareCardScreen({
  resultName,
  first,
  second,
  blend,
  imageUrl,
  resultText,
  good,
  bad,
  onBack,
  onRestart,
  isMobile,
  cardTrait,
}: {
  resultName: string;
  first: RankedType;
  second?: RankedType;
  blend: { p1: number; p2: number };
  imageUrl: string;
  resultText: string;
  good?: string;
  bad?: string;
  onBack: () => void;
  onRestart: () => void;
  isMobile: boolean;
  cardTrait?: { name: string; body: string };
}) {




  const cardRef = useRef<HTMLDivElement | null>(null);

 






  const sections = splitSections(resultText);
  const rare = pickCardRare(blend);
  const elements = pickCardElements(first, second);
  const stats = pickStats(first);
  const summary = buildCardSummary(first, sections);
  const excludeNames = [first.name, second?.name].filter(Boolean) as string[];

  const goodNames = extractMatchNames(
    sections.good,
    "雪女 / 座敷童",
    excludeNames
  );
  const badNames = extractMatchNames(
    sections.bad,
    "鬼女 / 口裂け女",
    excludeNames
  );

  return (
    <div
      style={{
        ...styles.page,
        padding: isMobile ? 12 : 24,
      }}
    >
      <div style={styles.scanlinesAbsolute} />
      <div style={styles.pageNoiseAbsolute} />

      <div
        style={{
          ...styles.cardScreenWrap,
          maxWidth: 430,
          margin: "0 auto",
        }}
      >
        <div style={styles.cardScreenTopBar}>
          <button style={styles.btnGhost} onClick={onBack}>
            ← 結果へ戻る
          </button>
          <button style={styles.btnGhost} onClick={onRestart}>
            もう一度診断する
          </button>
        </div>

        <div
          ref={cardRef}
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ShareCard
            main={first}
            sub={blend.p2 > 0 ? second : undefined}
            goodLabel={goodNames}
            badLabel={badNames}
            imageUrl={imageUrl}
            elements={elements}
            stats={stats}
            summary={summary}
            title={resultName}
            rarityLabel={rare}
            blendRatio={{ main: blend.p1, sub: blend.p2 }}
            traitName={cardTrait?.name}
            traitBody={cardTrait?.body}
          />
        </div>
      </div>
    </div>
  );
}






















function AxisMeter({ axis }: { axis: AxisScores }) {
  const axisItems: { key: AxisKey; label: string }[] = [
    { key: "passion", label: "情熱性" },
    { key: "caution", label: "慎重性" },
    { key: "intuition", label: "直感性" },
    { key: "reality", label: "現実性" },
    { key: "attachment", label: "愛着性" },
    { key: "independence", label: "自立性" },
  ];

  return (
    <div style={styles.axisCard}>
      <div style={styles.sectionTitle}>6軸バランス</div>

      <div style={styles.axisList}>
        {axisItems.map(({ key, label }) => {
          const value = Math.max(0, Math.min(100, axis[key] ?? 0));

          return (
            <div key={key} style={styles.axisRow}>
              <div style={styles.axisLabel}>{label}</div>

              <div style={styles.axisTrack}>
                <div
                  style={{
                    ...styles.axisFill,
                    width: `${value}%`,
                  }}
                />
              </div>

              <div style={styles.axisValue}>{Math.round(value)}</div>
            </div>
          );
        })}
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
  const rare = pickCardRare(blend);
  const elements = pickCardElements(first, second);
  const stats = pickStats(first);
  const summary = buildCardSummary(first, sections);





  return (
    <div style={styles.captureFixed}>
      <div style={styles.captureHeader}>
        <div style={styles.captureBadge}>診断結果</div>
        <div style={styles.captureTitle}>{resultName}</div>
        <div style={styles.captureSub}>
          {first.name} {blend.p1}% × {second.name} {blend.p2}%
        </div>
      </div>

      <div style={styles.captureMainGrid}>
        <div style={styles.captureImagePanel}>
          {imageUrl ? (
            <img src={imageUrl} alt={resultName} style={styles.captureImage} />
          ) : (
            <div style={styles.captureImagePlaceholder}>NO IMAGE</div>
          )}
        </div>

        <div style={styles.captureTextPanel}>
          <div style={styles.captureMiniSection}>
            <div style={styles.captureMiniLabel}>基本性格</div>
            <div style={styles.captureMiniBody}>{sections.basic || "..."}</div>
          </div>

          <div style={styles.captureMiniSection}>
            <div style={styles.captureMiniLabel}>対人関係</div>
            <div style={styles.captureMiniBody}>
              {sections.relationship || "..."}
            </div>
          </div>

          <div style={styles.captureMiniSection}>
            <div style={styles.captureMiniLabel}>恋愛傾向</div>
            <div style={styles.captureMiniBody}>{sections.love || "..."}</div>
          </div>

          <div style={styles.captureMiniSection}>
            <div style={styles.captureMiniLabel}>主要軸</div>
            <div style={styles.captureAxisTags}>
              {AXES.map((key) => (
                <div key={key} style={styles.captureAxisTag}>
                  {key}: {Math.round(normalizedAxis[key] ?? 0)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.captureFooter}>
        <div style={styles.captureFooterBlock}>
          <div style={styles.captureMiniLabel}>相性の悪い相手</div>
          <div style={styles.captureFooterText}>{sections.bad || "..."}</div>
        </div>

        <div style={styles.captureFooterBlock}>
          <div style={styles.captureMiniLabel}>相性の良い相手</div>
          <div style={styles.captureFooterText}>{sections.good || "..."}</div>
        </div>
      </div>
    </div>
  );
}




async function requestResult(params: {
  main: RankedType;
  sub?: RankedType;
  mode: "single" | "dominant-dual" | "balanced-dual";
  gender: Gender;
  good?: string;
  bad?: string;
}) {
  const { main, sub, mode, good, bad } = params;

  console.log("requestResult payload", { main, sub, mode, good, bad });

  const res = await fetch("/api/generate-result", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      main,
      sub,
      mode,
      good,
      bad,
      useAI: true,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("generate-result error", data);
    throw new Error(data?.error || "結果文の生成に失敗しました");
  }

  return data?.text ?? "";
}







async function requestImage(params: {
  prompt: string;
  first: RankedType;
  second: RankedType;
  blend: { p1: number; p2: number };
  mode: "single" | "dominant-dual" | "balanced-dual";
}) {
  const { prompt, first, second, blend, mode } = params;

  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      first,
      second,
      blend,
      mode,
    }),
  });

  const data = await res.json();

  console.log("requestImage response", data);

  if (!res.ok) {
    throw new Error(data?.error || "画像生成に失敗しました");
  }

  return data?.imageUrl ?? data?.url ?? "";
}


async function requestCardTrait(params: {
  main: RankedType;
  sub?: RankedType;
  blend: { p1: number; p2: number };
  mode: "single" | "dominant-dual" | "balanced-dual";
}) {
  const res = await fetch("/api/generate-card-trait", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "カード特性の生成に失敗しました");
  }

  return {
    name: data?.name ?? "",
    body: data?.body ?? "",
    text: data?.text ?? "",
  };
}


export default function App() {
  const [step, setStep] = useState(0);
  const [axis, setAxis] = useState<AxisScores>({ ...ZERO });
  const [viewMode, setViewMode] = useState<ViewMode>("intro");
  const [gender, setGender] = useState<Gender>("other");
  const [resultText, setResultText] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [cardTrait, setCardTrait] = useState<{ name: string; body: string }>({
    name: "",
    body: "",
  });

  const [lastAnswer, setLastAnswer] = useState<{
    step: number;
    score: Partial<AxisScores>;
  } | null>(null);

  const [canUndo, setCanUndo] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>(() =>
    pickOneQuestionPerGroup(questionPool)
  );

  const cardRef = useRef<HTMLDivElement | null>(null);







  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);







  const current = sessionQuestions[Math.min(step, sessionQuestions.length - 1)];

  const axisMaxScores = useMemo(() => buildAxisMaxScores(sessionQuestions), [sessionQuestions]);

  const axisExposureScores = useMemo(
    () => buildAxisExposureScores(sessionQuestions),
    [sessionQuestions]
  );

  const axisSimilarityWeights = useMemo<AxisScores>(() => {
    const result = { ...ZERO };
    const values = AXES.map((axis) => axisExposureScores[axis] || 1);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    for (const axis of AXES) {
      const exposure = axisExposureScores[axis] || 1;
      result[axis] = Math.sqrt(avg / exposure);
    }

    return result;
  }, [axisExposureScores]);


    const normalizedAxis = useMemo(() => {
    const weightedAxis = applyAxisWeight(axis);
    const weightedAxisMaxScores = applyAxisWeight(axisMaxScores);
    return normalizeUserAxisScores(weightedAxis, weightedAxisMaxScores);
  }, [axis, axisMaxScores]);





  const ranked = useMemo(() => {
    return [...types]
      .map((item) => {
        const normalizedTypeAxis = normalizeTypeAxisScores(item.axis);
        return {
          ...item,
          score: similarity(normalizedAxis, normalizedTypeAxis, axisSimilarityWeights),
        };
      })
      .sort((a, b) => b.score - a.score) as RankedType[];
  }, [normalizedAxis, axisSimilarityWeights]);

  
      const first = ranked[0] ?? ({ ...types[0], score: 50 } as RankedType);
      const second = ranked[1] ?? ({ ...types[1], score: 49 } as RankedType);

      const mode = inferResultMode(first.score, second.score);
      const blend = topTwoBlend(first.score, second.score);

      const imagePrompt = buildFusionPrompt(first, second, blend.p1, blend.p2);
      const resultName = buildResultName(first, second, blend.p1);
      const { good, bad } = pickCompatibility(
  normalizedAxis,
  types,
  axisSimilarityWeights
);
 

  useEffect(() => {
    if (viewMode !== "result") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [viewMode]);





const answer = (score: Partial<AxisScores>) => {
  setLastAnswer({
    step,
    score,
  });
  setCanUndo(true);

  setAxis((prev) => {
    const next = { ...prev };
    for (const key of AXES) {
      next[key] += score[key] ?? 0;
    }
    return next;
  });

  const nextStep = step + 1;

  if (nextStep >= sessionQuestions.length) {
    setViewMode("result");
    return;
  }

  setStep(nextStep);
};

const undoLastAnswer = () => {
  if (!lastAnswer || !canUndo) return;
  if (step < 1 || step > sessionQuestions.length - 1) return;

  setAxis((prev) => {
    const next = { ...prev };
    for (const key of AXES) {
      next[key] -= lastAnswer.score[key] ?? 0;
    }
    return next;
  });

  setStep(lastAnswer.step);
  setCanUndo(false);
};





const restart = () => {
  if (isGenerating) return;

  setAxis({ ...ZERO });
  setStep(0);
  setViewMode("intro");
  setResultText("");
  setImageUrl("");
  setErrorMessage("");
  setIsGenerating(false);
  setLastAnswer(null);
  setCanUndo(false);
  setSessionQuestions(pickOneQuestionPerGroup(questionPool));
};

const generateAll = async () => {
  try {
    setIsGenerating(true);
    setErrorMessage("");
    setImageUrl("");
    setCardTrait({ name: "", body: "" });

    const bad = BAD_MATCH[first.id]?.[0] ?? "kijo";
    const good = GOOD_MATCH[first.id]?.[0] ?? "yukionna";

    const text = await requestResult({
      main: first,
      sub: second,
      mode,
      gender,
      good,
      bad,
    });

    setResultText(text);

    try {
      const trait = await requestCardTrait({
        main: first,
        sub: second,
        blend,
        mode,
      });

      setCardTrait({
        name: trait.name,
        body: trait.body,
      });
    } catch (traitError) {
      console.error(traitError);
      setCardTrait({ name: "", body: "" });
    }

    try {
      const img = await requestImage({
        prompt: imagePrompt,
        first,
        second,
        blend,
        mode,
      });
      setImageUrl(img);
    } catch (imageError) {
      console.error(imageError);
      setImageUrl("");
    }
  } catch (error) {
    setErrorMessage(error instanceof Error ? error.message : "生成に失敗しました。");
  } finally {
    setIsGenerating(false);
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




  if (viewMode === "card") {
    return (
      <ShareCardScreen
        resultName={resultName}
        first={first}
        second={second}
        blend={blend}
        imageUrl={imageUrl}
        resultText={resultText}
        good={good}
        bad={bad}
        onBack={() => setViewMode("result")}
        onRestart={restart}
        isMobile={isMobile}
        cardTrait={cardTrait}
      />
    );
  }












  if (viewMode === "result") {
    const sections = splitSections(resultText);

    return (
      <div
        style={{
          ...styles.page,
          padding: isMobile ? 12 : 24,
        }}
      >
        <div style={styles.scanlinesAbsolute} />
        <div style={styles.pageNoiseAbsolute} />

        <div
          style={{
            ...styles.card,
            padding: isMobile ? 14 : 24,
            borderRadius: isMobile ? 18 : 24,
          }}
        >
          <div style={styles.badge}>診断結果</div>
          <h1
            style={{
              ...styles.titleLarge,
              fontSize: isMobile ? 28 : 34,
              marginBottom: isMobile ? 14 : 18,
            }}
          >
            あなたの都市伝説タイプ
          </h1>

          <ResultHero
            first={first}
            second={second}
            p1={blend.p1}
            p2={blend.p2}
            resultName={resultName}
            imageUrl={imageUrl}
            isMobile={isMobile}
          />

          <div
            style={{
              ...styles.resultGrid,
              gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.15fr) minmax(300px, 0.85fr)",
              gap: isMobile ? 12 : 20,
            }}
          >
            <div
              style={{
                ...styles.resultMainCol,
                minWidth: 0,
              }}
            >
              {!resultText && !isGenerating && (
                <button
                  style={{
                    ...styles.generateBtn,
                    width: "100%",
                    display: "block",
                    writingMode: "horizontal-tb",
                    WebkitWritingMode: "horizontal-tb",
                    textOrientation: "mixed",
                    whiteSpace: "normal",
                    wordBreak: "keep-all",
                    overflowWrap: "break-word",
                    textAlign: "center",
                    lineHeight: 1.5,
                    fontSize: isMobile ? 16 : 18,
                    padding: isMobile ? "16px 14px" : "18px 18px",
                    letterSpacing: isMobile ? "0.02em" : "0.08em",
                  }}
                  onClick={generateAll}
                >
                  あなたの本当の姿を生成する
                </button>
              )}

              {isGenerating && (
                <div style={styles.loading}>あなたの隠された姿を呼び出しています…</div>
              )}
              {errorMessage && <div style={styles.errorText}>{errorMessage}</div>}









              {resultText && (
                <div
                  style={{
                    ...styles.box,
                    padding: isMobile ? "16px 14px" : 20,
                  }}
                >
                  <div style={styles.sectionTitle}>最終結果</div>


                  {[
                    { title: "基本性格", body: sections.basic },
                    { title: "対人関係", body: sections.relationship },
                    { title: "恋愛傾向", body: sections.love },
                    { title: "隠れた性格", body: sections.hidden },
                    { title: "⚠ 相性の悪い相手", body: sections.bad },
                    { title: "◎ 相性の良い相手", body: sections.good },
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

            <div
              style={{
                ...styles.resultSideCol,
                minWidth: 0,
                order: isMobile ? -1 : 0,
              }}
            >
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
              onClick={() => setViewMode("card")}
              disabled={!resultText || !imageUrl}
            >
              共有カードを作る
            </button>
          </div>


          
<div style={styles.row}>
  <button
    style={{
      ...styles.btnGhost,
      opacity: isGenerating ? 0.45 : 1,
      cursor: isGenerating ? "not-allowed" : "pointer",
    }}
    onClick={restart}
    disabled={isGenerating}
  >
    もう一度占う
  </button>
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
            質問 {step + 1} / {sessionQuestions.length}
          </div>
          <div style={styles.progressText}>analysis running...</div>
        </div>

        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${((step + 1) / sessionQuestions.length) * 100}%`,
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


<div style={styles.row}>
  <button
    style={{
      ...styles.btnGhost,
      opacity:
        step >= 1 && step <= sessionQuestions.length - 1 && canUndo ? 1 : 0.45,
      cursor:
        step >= 1 && step <= sessionQuestions.length - 1 && canUndo
          ? "pointer"
          : "not-allowed",
    }}
    onClick={undoLastAnswer}
    disabled={!(step >= 1 && step <= sessionQuestions.length - 1 && canUndo)}
  >
    1問戻る
  </button>
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
    writingMode: "horizontal-tb",
    WebkitWritingMode: "horizontal-tb",
    textOrientation: "mixed",
    textAlign: "left",
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
    writingMode: "horizontal-tb",
    WebkitWritingMode: "horizontal-tb",
    textOrientation: "mixed",
    textAlign: "left",
  },

  resultTextReadable: {
    color: "rgba(255,255,255,0.92)",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
    letterSpacing: "0.01em",
    writingMode: "horizontal-tb",
    WebkitWritingMode: "horizontal-tb",
    textOrientation: "mixed",
    textAlign: "left",
    overflowWrap: "break-word",
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
    fontSize: 24,
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
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  resultSideCol: {
    minWidth: 0,
    display: "grid",
    gap: 12,
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
    writingMode: "horizontal-tb",
    WebkitWritingMode: "horizontal-tb",
    textOrientation: "mixed",
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
    writingMode: "horizontal-tb",
    WebkitWritingMode: "horizontal-tb",
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





cardScreenWrap: {
  width: "100%",
},

cardScreenTopBar: {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
  flexWrap: "wrap",
},

shareCardScreen: {
  background: "linear-gradient(180deg, rgba(20,26,46,0.98) 0%, rgba(10,14,24,0.98) 100%)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 28,
  overflow: "hidden",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
},

shareCardHeader: {
  padding: "18px 18px 8px",
},

shareCardBadge: {
  display: "inline-block",
  fontSize: 11,
  letterSpacing: "0.12em",
  color: "rgba(255,255,255,0.68)",
  marginBottom: 8,
},

shareCardTitle: {
  fontSize: 30,
  fontWeight: 800,
  lineHeight: 1.2,
  marginBottom: 8,
},

shareCardBlend: {
  fontSize: 14,
  color: "rgba(255,255,255,0.78)",
},

shareCardImageWrap: {
  padding: "0 18px",
},

shareCardImage: {
  width: "100%",
  aspectRatio: "3 / 4",
  objectFit: "cover",
  borderRadius: 22,
  display: "block",
  background: "rgba(255,255,255,0.06)",
},

shareCardImageEmpty: {
  width: "100%",
  aspectRatio: "3 / 4",
  borderRadius: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.5)",
},

shareInfoGrid: {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
  padding: 18,
},

shareInfoBox: {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: "14px 14px 12px",
},

shareInfoHeading: {
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(255,255,255,0.72)",
  marginBottom: 8,
},

shareInfoText: {
  fontSize: 14,
  lineHeight: 1.75,
  color: "rgba(255,255,255,0.92)",
},

shareCardFooter: {
  textAlign: "center" as const,
  padding: "0 18px 18px",
  fontSize: 12,
  color: "rgba(255,255,255,0.52)",
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







  visualWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  visualEmoji: {
    fontSize: 40,
  },

  visualTitle: {
    fontSize: 16,
    fontWeight: 700,
  },

  visualTag: {
    fontSize: 12,
    opacity: 0.7,
  },

  resultHero: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 24,
    alignItems: "center",
    padding: 24,
    borderRadius: 24,
    background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  resultHeroText: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  resultHeroBadge: {
    display: "inline-flex",
    alignSelf: "flex-start",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    letterSpacing: "0.08em",
    background: "rgba(255,255,255,0.08)",
  },

  resultHeroTitle: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.2,
    fontWeight: 800,
  },

  resultHeroBlend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    fontSize: 14,
    opacity: 0.9,
  },

  resultHeroVibe: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    opacity: 0.85,
  },




  resultHeroImageWrap: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  resultHeroImage: {  
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center top",
    borderRadius: 24, 
    background: "#f4eedf",
  },
  






  resultHeroImagePlaceholder: {
    minHeight: 320,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    border: "1px dashed rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.55)",
  },




 

  
  yokaiCardOuter: {
    background: "linear-gradient(180deg, #d8ccb4 0%, #b9a483 100%)",
    border: "2px solid rgba(208,188,144,0.95)",
    borderRadius: 26,
    boxShadow: "0 18px 48px rgba(0,0,0,0.28)",
    padding: 6,
  },

  yokaiCardInner: {
    background: "linear-gradient(180deg, #f3ecdf 0%, #e4d7c0 100%)",
    border: "1px solid rgba(104,79,43,0.28)",
    borderRadius: 22,
    overflow: "hidden",
    padding: 14,
    color: "#241b10",
  },

  yokaiHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },

  yokaiMiniLabel: {
    fontSize: 11,
    letterSpacing: "0.12em",
    color: "rgba(64,48,28,0.72)",
    marginBottom: 6,
    fontWeight: 700,
  },

  yokaiTitle: {
    fontSize: 32,
    lineHeight: 1.08,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#20160d",
  },



yokaiRare: {
  minWidth: 72,
  padding: "10px 14px",
  borderRadius: 999,
  background: "linear-gradient(180deg, #a41f35 0%, #6e1022 55%, #4f0b18 100%)",
  color: "#fffaf2",
  fontSize: 16,
  fontWeight: 900,
  textAlign: "center" as const,
  border: "1px solid rgba(255,240,220,0.55)",
  boxShadow:
    "0 6px 18px rgba(110,16,34,0.28), inset 0 1px 0 rgba(255,255,255,0.24)",
  letterSpacing: "0.04em",
},

 






  yokaiElementRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 8,
  },

  yokaiElementChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(76,54,28,0.08)",
    border: "1px solid rgba(76,54,28,0.14)",
    color: "#3e2e1f",
    fontSize: 12,
    fontWeight: 800,
  },

  yokaiBlendLine: {
    fontSize: 13,
    color: "rgba(49,35,20,0.78)",
    marginBottom: 12,
    fontWeight: 700,
  },

  yokaiArtFrameOuter: {
    background: "linear-gradient(180deg, #cab38d 0%, #9e8258 100%)",
    border: "2px solid rgba(138,109,63,0.58)",
    borderRadius: 18,
    padding: 8,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
    marginBottom: 14,
  },

  yokaiArtFrameInner: {
    background: "#efe5d2",
    border: "1px solid rgba(97,75,44,0.24)",
    borderRadius: 14,
    padding: 6,
  },

  yokaiArtImage: {
    width: "100%",
    aspectRatio: "3 / 4",
    objectFit: "cover",
    objectPosition: "center top",
    display: "block",
    borderRadius: 10,
    background: "#d9ccb3",
  },

  yokaiArtEmpty: {
    width: "100%",
    aspectRatio: "3 / 4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    background: "#d9ccb3",
    color: "rgba(36,27,16,0.5)",
    fontWeight: 700,
  },

  yokaiInfoPanel: {
    background: "rgba(255,248,238,0.52)",
    border: "1px solid rgba(88,66,36,0.18)",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
  },

  yokaiSection: {
    padding: "12px 14px",
  },

  yokaiSectionLabel: {
    fontSize: 11,
    letterSpacing: "0.12em",
    color: "rgba(76,54,28,0.72)",
    fontWeight: 800,
    marginBottom: 6,
  },

  yokaiTraitText: {
    fontSize: 17,
    lineHeight: 1.5,
    color: "#20160d",
    fontWeight: 800,
  },

  yokaiSummaryText: {
    fontSize: 14,
    lineHeight: 1.8,
    color: "#2c2218",
    fontWeight: 600,
  },

  yokaiDivider: {
    borderTop: "1px solid rgba(88,66,36,0.14)",
  },

  yokaiMatchLine: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 8,
  },


  yokaiMatchKey: {
    fontSize: 13,
    fontWeight: 900,
    color: "#7a2030",
    whiteSpace: "nowrap" as const,
  },


  yokaiMatchVal: {
    fontSize: 14,
    lineHeight: 1.5,
    color: "#2c2218",
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
  },

 



  yokaiStatRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    padding: "12px 14px 14px",
  },

  yokaiStatBox: {
    background: "rgba(76,54,28,0.06)",
    border: "1px solid rgba(76,54,28,0.12)",
    borderRadius: 14,
    padding: "10px 8px",
    textAlign: "center" as const,
  },

  yokaiStatLabel: {
    fontSize: 11,
    color: "rgba(76,54,28,0.7)",
    fontWeight: 800,
    marginBottom: 6,
    letterSpacing: "0.06em",
  },

  yokaiStatValue: {
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 900,
    color: "#22170d",
  },

  yokaiFooter: {
    textAlign: "center" as const,
    fontSize: 10,
    color: "rgba(64,48,28,0.5)",
    letterSpacing: "0.05em",
    paddingBottom: 2,
  },
  yokaiMatchInline: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },

  yokaiMatchInlineItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },


  yokaiStatRowCompact: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginBottom: 10,
  },

  yokaiStatBoxCompact: {
    background: "rgba(76,54,28,0.06)",
    border: "1px solid rgba(76,54,28,0.12)",
    borderRadius: 12,
    padding: "8px 6px",
    textAlign: "center" as const,
  },

  yokaiStatLabelCompact: {
    fontSize: 10,
    color: "rgba(76,54,28,0.7)",
    fontWeight: 800,
    marginBottom: 4,
    letterSpacing: "0.04em",
  },

  yokaiStatValueCompact: {
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 900,
    color: "#22170d",
  },

  yokaiArtFrameOuterCompact: {
    background: "linear-gradient(180deg, #cab38d 0%, #9e8258 100%)",
    border: "2px solid rgba(138,109,63,0.58)",
    borderRadius: 18,
    padding: 6,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
    marginBottom: 10,
  },

  yokaiArtFrameInnerCompact: {
    background: "#efe5d2",
    border: "1px solid rgba(97,75,44,0.24)",
    borderRadius: 14,
    padding: 4,
  },

  yokaiArtImageCompact: {
    width: "100%",
    aspectRatio: "4 / 5",
    objectFit: "cover",
    objectPosition: "center top",
    display: "block",
    borderRadius: 10,
    background: "#d9ccb3",
  },

  yokaiInfoPanelCompact: {
    background: "rgba(255,248,238,0.52)",
    border: "1px solid rgba(88,66,36,0.18)",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
  },

  yokaiSectionCompact: {
    padding: "10px 12px",
  },

  yokaiTraitTextCompact: {
    fontSize: 15,
    lineHeight: 1.45,
    color: "#20160d",
    fontWeight: 800,
  },

  yokaiSummaryTextCompact: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#2c2218",
    fontWeight: 600,
  },

  yokaiMatchInlineCompact: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "nowrap" as const,
  },

  yokaiMatchInlineItemCompact: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },

  yokaiMatchValCompact: {
    fontSize: 13,
    lineHeight: 1.4,
    color: "#2c2218",
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
  },
yokaiStatRowInline: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 10,
},

yokaiStatInlineItem: {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flex: 1,
  justifyContent: "center",
  background: "rgba(76,54,28,0.06)",
  border: "1px solid rgba(76,54,28,0.12)",
  borderRadius: 10,
  padding: "6px 4px",
},

yokaiStatInlineLabel: {
  fontSize: 11,
  fontWeight: 800,
  color: "rgba(76,54,28,0.7)",
},

yokaiStatInlineValue: {
  fontSize: 18,
  fontWeight: 900,
  color: "#22170d",
},



};