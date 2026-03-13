"use client";

import React, { useMemo, useState } from "react";

const USE_MOCK = false;
const RESULT_API_URL = "/api/generate-result";
const IMAGE_API_URL = "/api/generate-image";

const AXES = ["passion", "caution", "intuition", "reality", "attachment", "independence"] as const;
type AxisKey = (typeof AXES)[number];
type AxisScores = Record<AxisKey, number>;
type Category = "basic" | "subconscious" | "romance" | "social";
type ViewMode = "intro" | "diagnosis" | "result";

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

type TypeDef = {
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
  introHint?: string;
};

type RankedType = TypeDef & { score: number };

type GenerateResultPayload = {
  first: RankedType;
  second: RankedType;
  percentages: { p1: number; p2: number };
  axis: AxisScores;
  gender: Gender;
};

type Gender = "male" | "female" | "other";

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
): Question => ({ category, visualEmoji, visualTitle, visualTag, text, colors, options });

const questions: Question[] = [
  q("basic", "👣", "ぬめる足音", "振り返るか、見なかったことにするか", "夜道を歩いていると後ろから湿った足音がついてくる。あなたならどうする？", ["#14532d", "#111827"], [
    { label: "振り返って正体を確認する", score: { caution: 4, reality: 2 } },
    { label: "気のせいとしてそのまま歩く", score: { reality: 5 } },
    { label: "怖くなって早歩きで逃げる", score: { caution: 5 } },
    { label: "人ではない気配を感じ取ろうとする", score: { intuition: 5, passion: 1 } },
    { label: "『誰？』って普通に聞いてみる", score: { passion: 2, intuition: 2 } },
  ]),
  q("basic", "🚪", "半開きの扉", "閉めたはずのものが少しだけ開いている", "帰宅すると閉めたはずの扉が数センチだけ開いていた。最初の反応は？", ["#1e3a8a", "#111827"], [
    { label: "中を確認しにいく", score: { reality: 3, caution: 2 } },
    { label: "家鳴りや風だと処理する", score: { reality: 5 } },
    { label: "一度その場で様子を見る", score: { caution: 4 } },
    { label: "空気の違和感を先に読む", score: { intuition: 4, caution: 1 } },
  ]),
  q("basic", "☎️", "午前2時の着信", "出るか、調べるか、無視するか", "知らない番号から深夜に電話。画面には番号だけ。あなたはどうする？", ["#7c3aed", "#111827"], [
    { label: "とりあえず出てしまう", score: { passion: 3, intuition: 1 } },
    { label: "番号を検索してから判断する", score: { reality: 5, caution: 1 } },
    { label: "怪しいので出ない", score: { caution: 5 } },
    { label: "通知だけ見て放置する", score: { independence: 4 } },
    { label: "一回だけ『もしもし？』って言う", score: { passion: 2, reality: 1 } },
  ]),
  q("basic", "🏚️", "古い屋敷", "ワクワクか、警戒か", "古い洋館に入ることになった。最初に心が動くのはどれ？", ["#374151", "#111827"], [
    { label: "探検したくて少しワクワクする", score: { passion: 5 } },
    { label: "危ない場所がないか先に見る", score: { caution: 3, reality: 2 } },
    { label: "空気の重さや気配が気になる", score: { intuition: 5 } },
    { label: "必要以上に深入りしない", score: { independence: 4, reality: 1 } },
    { label: "とりあえず『お邪魔します』と言う", score: { passion: 2, attachment: 1 } },
  ]),
  q("subconscious", "🪞", "笑う鏡", "現実か都市伝説か", "鏡を見ると一瞬だけ自分が違う表情をしていた気がした。あなたはどう受け取る？", ["#831843", "#111827"], [
    { label: "疲れてるだけだと思って終わらせる", score: { reality: 5 } },
    { label: "もう一回見て確かめる", score: { caution: 4 } },
    { label: "今日は鏡を避けておく", score: { caution: 5 } },
    { label: "逆に少し面白く感じる", score: { intuition: 3, passion: 2 } },
  ]),
  q("subconscious", "👁️", "視線の正体", "気のせいで済ませるか、拾うか", "暗闇で、誰かに見られている気がする。あなたはどうする？", ["#1d4ed8", "#111827"], [
    { label: "気のせいで終わらせる", score: { reality: 5 } },
    { label: "視線の主を探す", score: { caution: 3, reality: 1 } },
    { label: "普通に怖いので離れる", score: { caution: 5 } },
    { label: "見えないものの気配を読む", score: { intuition: 5 } },
  ]),
  q("subconscious", "🚇", "暗いトンネル", "出口の見えない場所で本性が出る", "長くて暗いトンネルを歩いている。前の方に誰かの影が見えた。あなたはどうする？", ["#1f2937", "#020617"], [
    { label: "距離を保って様子を見る", score: { caution: 4, reality: 1 } },
    { label: "追いついて話しかける", score: { passion: 3, attachment: 2 } },
    { label: "嫌な感じがして引き返す", score: { caution: 5 } },
    { label: "正体が気になって近づく", score: { intuition: 5 } },
    { label: "とりあえず『すみませーん』って言う", score: { passion: 2, intuition: 1 } },
  ]),
  q("subconscious", "🏪", "深夜のコンビニ", "ありふれた場所ほど怖い", "深夜のコンビニで、たった一人の客がずっとあなたを見ている。あなたは？", ["#0ea5e9", "#111827"], [
    { label: "気にしない", score: { independence: 4, reality: 1 } },
    { label: "店員の近くへ行く", score: { caution: 5 } },
    { label: "見返して反応を見る", score: { passion: 3, reality: 1 } },
    { label: "店を出る", score: { caution: 4, independence: 1 } },
    { label: "とりあえず会釈する", score: { attachment: 2, passion: 1 } },
  ]),
  q("romance", "📸", "百枚の執着", "愛と監視は紙一重", "好きな人があなたの写真を100枚保存していた。どう感じる？", ["#4c1d95", "#111827"], [
    { label: "少し嬉しい。愛が濃い", score: { attachment: 5 } },
    { label: "普通に怖い", score: { caution: 5 } },
    { label: "理由を聞いてから判断したい", score: { reality: 5 } },
    { label: "そこまでいくと逆に面白い", score: { passion: 5 } },
  ]),
  q("romance", "🫀", "永遠の愛", "ロマンか、都市伝説か", "恋人が『永遠に一緒だよね？』と言ってきた。あなたは？", ["#9f1239", "#111827"], [
    { label: "嬉しいし、わりと好き", score: { attachment: 5 } },
    { label: "ロマンとして受け取る", score: { passion: 5 } },
    { label: "少し怖くて身構える", score: { caution: 5 } },
    { label: "今は流して様子を見る", score: { reality: 5 } },
  ]),
  q("romance", "📩", "3日間の未読", "連絡が来ない時の本音が出る", "好きな人から3日連絡が来ない。あなたの反応は？", ["#1d4ed8", "#111827"], [
    { label: "不安でかなり気になる", score: { attachment: 5 } },
    { label: "何かあったかもしれないと警戒する", score: { caution: 5 } },
    { label: "忙しいだけかと現実的に考える", score: { reality: 5 } },
    { label: "自分の時間を優先して待つ", score: { independence: 5 } },
  ]),
  q("romance", "🔥", "恋の点火", "好きになる速度で本質が出る", "人を好きになる時、あなたに近いのは？", ["#dc2626", "#111827"], [
    { label: "一気に気持ちが燃え上がる", score: { passion: 5 } },
    { label: "少しずつ安心が増える", score: { attachment: 5 } },
    { label: "まず相手をかなり観察する", score: { caution: 4, reality: 1 } },
    { label: "距離感が合うかを最優先する", score: { independence: 5 } },
  ]),
  q("romance", "🩸", "嫉妬の気配", "平然としてるか、内側で燃えるか", "好きな人が別の誰かと楽しそうにしている。あなたは？", ["#7f1d1d", "#111827"], [
    { label: "表では平気なふりをする", score: { caution: 3, attachment: 2 } },
    { label: "ちょっと不機嫌になる", score: { passion: 4, attachment: 1 } },
    { label: "距離を取って冷静になる", score: { independence: 5 } },
    { label: "状況を観察して判断する", score: { reality: 5 } },
  ]),
  q("romance", "🕯️", "夜の約束", "守るか、忘れるか、重くなるか", "好きな人との約束が曖昧なまま流れそう。あなたは？", ["#6b21a8", "#111827"], [
    { label: "ちゃんと確認したい", score: { attachment: 4, reality: 1 } },
    { label: "向こうから言うまで待つ", score: { caution: 3, independence: 2 } },
    { label: "ちょっと拗ねる", score: { passion: 4 } },
    { label: "覚えておいて後で効く", score: { caution: 2, attachment: 3 } },
  ]),
  q("social", "🤝", "信頼のスピード", "心を開くのに必要なもの", "初対面の人に対して近いのは？", ["#065f46", "#111827"], [
    { label: "わりとすぐ打ち解ける", score: { passion: 4 } },
    { label: "まず相手をよく見る", score: { caution: 5 } },
    { label: "会話の筋や一貫性を見る", score: { reality: 5 } },
    { label: "直感で合う合わないを決める", score: { intuition: 5 } },
  ]),
  q("social", "🧩", "秘密の扱い", "人の本音にどう向き合うか", "誰かから重い秘密を打ち明けられた。あなたは？", ["#6d28d9", "#111827"], [
    { label: "とにかく受け止めたい", score: { attachment: 5 } },
    { label: "本当かどうか慎重に考える", score: { caution: 4, reality: 1 } },
    { label: "整理して意味を理解したい", score: { reality: 5 } },
    { label: "少し距離を取りつつ見守る", score: { independence: 5 } },
  ]),
  q("social", "⚔️", "対立の場面", "ぶつかった時の本音が出る", "誰かと意見がぶつかった時、あなたはどうなりやすい？", ["#991b1b", "#111827"], [
    { label: "感情が先に出てしまう", score: { passion: 5 } },
    { label: "相手を警戒して硬くなる", score: { caution: 5 } },
    { label: "話の筋を整理して返す", score: { reality: 5 } },
    { label: "距離を取って冷ます", score: { independence: 5 } },
  ]),
  q("social", "🫂", "付き合い方", "広くか、深くか、自由か", "人付き合いで一番近いのは？", ["#d97706", "#111827"], [
    { label: "深く濃い関係が好き", score: { attachment: 5 } },
    { label: "刺激がある人間関係が好き", score: { passion: 5 } },
    { label: "安心できる少人数がいい", score: { caution: 3, attachment: 1 } },
    { label: "干渉しすぎない自由な関係がいい", score: { independence: 5 } },
  ]),
  q("social", "🪤", "空気の罠", "気まずさにどう反応するか", "場の空気が急に変になった時、あなたは？", ["#0f172a", "#334155"], [
    { label: "何が起きたかすぐ探る", score: { caution: 4, intuition: 1 } },
    { label: "とりあえず笑って流す", score: { passion: 4 } },
    { label: "観察して安全策を取る", score: { reality: 5 } },
    { label: "自分は巻き込まれないようにする", score: { independence: 5 } },
  ]),
  q("social", "📦", "抱え込み体質", "言うか、飲むか、沈めるか", "嫌だったことがあっても、あなたはどうしがち？", ["#4338ca", "#111827"], [
    { label: "わりとその場で言う", score: { passion: 5 } },
    { label: "しばらく様子を見る", score: { caution: 4 } },
    { label: "頭で整理してから話す", score: { reality: 5 } },
    { label: "自分の中に沈める", score: { attachment: 2, independence: 3 } },
  ]),
  q("basic", "🌧️", "雨の帰り道", "濡れてでも進むか、避けるか", "急な雨。傘は一本しかない。あなたなら？", ["#0f766e", "#111827"], [
    { label: "誰かと一緒に入る", score: { attachment: 4, passion: 1 } },
    { label: "とりあえず走る", score: { passion: 5 } },
    { label: "雨宿りして様子を見る", score: { caution: 5 } },
    { label: "濡れても平気で進む", score: { independence: 5 } },
  ]),
  q("basic", "📞", "非通知の留守電", "聞く勇気があるか", "非通知から留守電が入っていた。あなたは？", ["#be123c", "#111827"], [
    { label: "すぐ聞く", score: { passion: 3, caution: 1 } },
    { label: "内容を想像してから聞く", score: { intuition: 4 } },
    { label: "しばらく放置", score: { independence: 4 } },
    { label: "怪しいので消したい", score: { caution: 5 } },
  ]),
  q("subconscious", "🕳️", "覗いてはいけない穴", "好奇心か自己防衛か", "見てはいけないと分かっているのに気になるものがある。あなたは？", ["#111827", "#3f3f46"], [
    { label: "結局見る", score: { passion: 3, intuition: 2 } },
    { label: "かなり気になるけど我慢する", score: { caution: 5 } },
    { label: "見る価値があるか考える", score: { reality: 5 } },
    { label: "最初から近づかない", score: { independence: 5 } },
  ]),
  q("romance", "💬", "既読の温度差", "言葉より間を読むか", "好きな人の返信が短い時、まず何を感じる？", ["#9333ea", "#111827"], [
    { label: "何か悪かったかなと思う", score: { attachment: 5 } },
    { label: "忙しいだけだと考える", score: { reality: 5 } },
    { label: "少し冷める", score: { independence: 4, caution: 1 } },
    { label: "逆に気になって燃える", score: { passion: 5 } },
  ]),
  q("social", "🫥", "人の裏側", "気づくか、見ないふりか", "誰かの表情の違和感に気づいた時、あなたは？", ["#1e293b", "#111827"], [
    { label: "すぐ気づいてしまう", score: { intuition: 4, attachment: 1 } },
    { label: "でもあえて触れない", score: { caution: 4, independence: 1 } },
    { label: "理由を考える", score: { reality: 5 } },
    { label: "空気を変えようとする", score: { passion: 4 } },
  ]),
];

const types: TypeDef[] = [
  { name: "花子さん", vibe: "執着と警戒が極端に強い怪談型", axis: { passion: 40, caution: 96, intuition: 70, reality: 35, attachment: 92, independence: 12 }, colors: ["#7c3aed", "#111827"], publicMask: "静かで落ち着いて見えるのに、相手の温度差には異常に敏感。", innerCore: "大事だと思った相手の言葉や態度を、忘れたふりでずっと持ち続けます。", risk: "不安になると確認したい気持ちが増え、相手からすると静かな圧になります。", gift: "違和感や嘘にかなり早く気づける、怖いほど鋭い観察力。", scaryTitle: "静かに記憶してくる花子さん型", loveWarning: "優しく見えて、恋愛になると記憶力と執着が急に伸びる。" },
  { name: "人面犬", vibe: "感情と勢いで突っ走る暴走型", axis: { passion: 96, caution: 20, intuition: 40, reality: 18, attachment: 86, independence: 20 }, colors: ["#ea580c", "#111827"], publicMask: "感情が顔にも行動にも出やすく、好き嫌いがわかりやすい。", innerCore: "刺さった相手には一直線で、迷いより勢いが勝ちやすいです。", risk: "好意がそのまま圧になって、相手がついて来れなくなることがあります。", gift: "空気を一気に変える熱量があり、忘れられない存在になりやすい。", scaryTitle: "熱量で追い詰める人面犬型", loveWarning: "好意は強いけど、温度差があると一人だけ恋愛ホラーになる。" },
  { name: "モスマン", vibe: "直感と予兆に支配される予感型", axis: { passion: 72, caution: 38, intuition: 96, reality: 16, attachment: 52, independence: 44 }, colors: ["#dc2626", "#312e81"], publicMask: "意味深な空気や、言葉にならない違和感にやたら強い。", innerCore: "理屈よりも『なんとなく嫌な予感』『運命っぽさ』で動きます。", risk: "怪しい相手を運命だと勘違いしやすく、危険をロマンに変換しがち。", gift: "誰よりも早く空気の異変を察知する、予兆センサーの強さ。", scaryTitle: "予感で恋を壊すモスマン型", loveWarning: "運命に弱いから、危ない恋にも意味を見つけてしまう。" },
  { name: "ビッグフット", vibe: "超現実派の安定型", axis: { passion: 30, caution: 26, intuition: 18, reality: 96, attachment: 48, independence: 82 }, colors: ["#0f766e", "#111827"], publicMask: "変な空気にも巻き込まれにくく、落ち着いていて地に足がついている。", innerCore: "感情で暴走するより、現実的に見て続くかどうかを判断します。", risk: "冷静すぎて、相手からすると温度が低く見えることがあります。", gift: "壊れにくい関係を作る安定感と、無駄にブレない強さ。", scaryTitle: "感情を踏み潰すビッグフット型", loveWarning: "ちゃんとしてるけど、相手のロマンを静かに殺しがち。" },
  { name: "口裂け女", vibe: "愛と執着が暴走する依存型", axis: { passion: 86, caution: 62, intuition: 36, reality: 20, attachment: 98, independence: 8 }, colors: ["#b91c1c", "#111827"], publicMask: "特別扱いへの反応が大きく、愛されているかをかなり見ています。", innerCore: "曖昧にされるのが苦手で、好きになるほど確認したくなります。", risk: "相手の態度が少しでも変わると、不安がそのまま怖さになります。", gift: "薄い関係で終わらず、本気で深く向き合う強さがある。", scaryTitle: "愛が濃すぎる口裂け女型", loveWarning: "好きになると優しさより確認欲求が前に出やすい。" },
  { name: "ツチノコ", vibe: "本音を見せないミステリアス型", axis: { passion: 42, caution: 72, intuition: 78, reality: 50, attachment: 38, independence: 66 }, colors: ["#65a30d", "#111827"], publicMask: "何を考えているのか読ませず、距離感の作り方がうまい。", innerCore: "かなり慎重で、簡単には自分の本音を明かしません。", risk: "黙っているだけで相手に怪談を作らせる、無自覚な怖さがあります。", gift: "流されず見極める目があり、軽いノリに飲まれにくい。", scaryTitle: "沈黙で不安を育てるツチノコ型", loveWarning: "脈ありかどうか分からなさすぎて相手をじわじわ狂わせる。" },
  { name: "雪女", vibe: "静かな冷気をまとうクール距離型", axis: { passion: 28, caution: 66, intuition: 74, reality: 62, attachment: 18, independence: 92 }, colors: ["#60a5fa", "#0f172a"], publicMask: "綺麗に見えても近づきにくく、距離感がかなりはっきりしている。", innerCore: "内側は繊細ですが、簡単に触れさせない冷たさも持っています。", risk: "冷静に見えて、突然すっと気持ちを切る怖さがあります。", gift: "ベタつかない美しさと、静かな余裕が強い魅力になる。", scaryTitle: "急に冷える雪女型", loveWarning: "重い相手を見ると、気配を残さず温度を切る。" },
  { name: "ネッシー", vibe: "静かで深すぎる深層心理型", axis: { passion: 38, caution: 64, intuition: 88, reality: 40, attachment: 54, independence: 60 }, colors: ["#0369a1", "#111827"], publicMask: "穏やかで静か。でも底が見えない。", innerCore: "感情を表に出さないだけで、内側ではかなり深く揺れています。", risk: "本音を沈めすぎて、相手が何を考えているか分からなくなります。", gift: "静かに相手を包み込むような、深い余韻を残せる。", scaryTitle: "底が見えないネッシー型", loveWarning: "静かだから安全そうに見えて、実は感情が深すぎる。" },
  { name: "チュパカブラ", vibe: "衝動と本能の捕食型", axis: { passion: 98, caution: 28, intuition: 46, reality: 10, attachment: 60, independence: 50 }, colors: ["#991b1b", "#111827"], publicMask: "欲しいものには一直線で、熱量がすぐに行動へ出る。", innerCore: "考える前に動く、本能優先の恋愛をしやすいです。", risk: "盛り上がるのは早いのに、荒れ方も派手になりやすい。", gift: "停滞した空気を一気に変える、危険なくらいの引力。", scaryTitle: "本能で噛みに来るチュパカブラ型", loveWarning: "刺さったら早い。早いけど荒い。" },
  { name: "天狗", vibe: "孤高でプライドの高い支配型", axis: { passion: 62, caution: 36, intuition: 52, reality: 66, attachment: 10, independence: 98 }, colors: ["#9a3412", "#111827"], publicMask: "自立していて強く見え、簡単には迎合しない。", innerCore: "自分のペースと尊厳を守る気持ちがかなり強いです。", risk: "必要とされているかより、邪魔されていないかを先に見がち。", gift: "依存しない強さがあり、対等な関係では圧倒的に魅力的。", scaryTitle: "主導権を渡さない天狗型", loveWarning: "好きでも自分のペースは崩さないから相手が不安になる。" },
  { name: "河童", vibe: "観察と皮肉の分析型", axis: { passion: 50, caution: 56, intuition: 64, reality: 70, attachment: 28, independence: 72 }, colors: ["#0891b2", "#111827"], publicMask: "よく見ていて、冗談っぽく核心を刺すことがある。", innerCore: "感情より先に分析が働くので、恋愛でも冷静さを保ちやすいです。", risk: "見抜きすぎて、相手の夢やロマンまで削りがち。", gift: "裏側に気づける鋭さと、ズレを見逃さない知性。", scaryTitle: "見抜きすぎる河童型", loveWarning: "嘘には強いけど、相手の幻想も平気で壊す。" },
  { name: "鵺", vibe: "混沌で正体不明のカオス型", axis: { passion: 70, caution: 70, intuition: 84, reality: 22, attachment: 46, independence: 48 }, colors: ["#4f46e5", "#111827"], publicMask: "人によって見え方が全く変わる、不思議な混沌さを持つ。", innerCore: "自分でも感情の理由を説明しきれず、気持ちが急に変わることがある。", risk: "恋愛が始まる時も壊れる時も、相手に理由が見えない怖さがある。", gift: "唯一無二の引力があり、一度ハマると記憶に残り続ける。", scaryTitle: "読めなさで支配する鵺型", loveWarning: "理由のない熱と冷えで相手を混乱させる。" },
  { name: "座敷童", vibe: "安心感を与える守護型", axis: { passion: 34, caution: 18, intuition: 40, reality: 72, attachment: 96, independence: 24 }, colors: ["#d97706", "#111827"], publicMask: "一緒にいると落ち着く、柔らかい安心感がある。", innerCore: "安心できる関係や居場所を何より大切にします。", risk: "優しさが自然すぎて、都合よく扱われると静かに傷みます。", gift: "人の緊張を解き、長く残る安心を作れる。", scaryTitle: "優しさが重くなる座敷童型", loveWarning: "癒し系に見えて、愛情は想像よりずっと深い。" },
  { name: "海坊主", vibe: "静かな狂気を秘めた深海型", axis: { passion: 60, caution: 68, intuition: 74, reality: 34, attachment: 78, independence: 22 }, colors: ["#0f766e", "#172554"], publicMask: "静かで重心が低く、必要以上に騒がない。", innerCore: "信頼した相手には深く入り込み、感情の重さもかなり強い。", risk: "表面が静かなぶん、重さに気づいた時にはもう逃げにくい。", gift: "軽く終わらない深い絆を作れる、本気の強さ。", scaryTitle: "静かに沈める海坊主型", loveWarning: "大人しく見えて、恋愛になると深海レベルで重い。" },
  { name: "一つ目小僧", vibe: "観察力が異常に高い分析型", axis: { passion: 24, caution: 82, intuition: 66, reality: 94, attachment: 20, independence: 68 }, colors: ["#a16207", "#111827"], publicMask: "冷静でよく見ている人、という印象を与えやすい。", innerCore: "違和感やズレを細かく拾うので、恋愛でも見逃しが少ないです。", risk: "恋愛なのに監査みたいになり、相手が息苦しくなることがある。", gift: "危険回避能力が高く、怪しい相手に飲まれにくい。", scaryTitle: "監視精度が高すぎる一つ目小僧型", loveWarning: "安心はするけど、全部見られてる感じがちょっと怖い。" },
  { name: "ぬらりひょん", vibe: "空気を支配するマイペース型", axis: { passion: 44, caution: 42, intuition: 80, reality: 78, attachment: 22, independence: 74 }, colors: ["#475569", "#111827"], publicMask: "自然に場へ入り込み、気づけば空気を持っていく。", innerCore: "人に合わせているようで、自分のペースは絶対に崩しません。", risk: "支配している自覚なく、相手の生活リズムまで飲み込みがち。", gift: "どこでも居場所を作り、気づけば中心になる適応力。", scaryTitle: "静かに侵食するぬらりひょん型", loveWarning: "自然体で距離を詰めて、気づけば相手の日常に居座る。" },
];

function normalizeAxisScores(axis: AxisScores): AxisScores {
  const maxValue = Math.max(...AXES.map((k) => axis[k]), 1);
  const result = {} as AxisScores;
  AXES.forEach((key) => {
    result[key] = Math.round((axis[key] / maxValue) * 100);
  });
  return result;
}

function similarity(user: AxisScores, target: AxisScores): number {
  let diff = 0;
  AXES.forEach((k) => {
    diff += Math.pow(Math.abs(user[k] - target[k]), 1.15);
  });
  return Math.max(0, Math.min(100, 100 - diff / 8.2));
}

function topTwoBlend(firstScore: number, secondScore: number) {
  const diff = Math.max(0, firstScore - secondScore);
  const a = Math.exp((firstScore + diff * 1.25) / 2.5);
  const b = Math.exp(Math.max(0, secondScore - diff * 0.12) / 2.5);
  const total = a + b || 1;
  const p1 = Math.max(55, Math.min(97, Math.round((a / total) * 100)));
  return { p1, p2: 100 - p1 };
}

function buildFusionPrompt(first: TypeDef, second: TypeDef, p1: number, p2: number) {
  return `creepy cute japanese urban legend fusion portrait, ${first.name} ${p1}% and ${second.name} ${p2}%, realistic horror photo, cinematic lighting, detailed face, dark atmosphere, subtle romance mood, eerie but beautiful, main color from ${first.colors[0]}, shadow influence from ${second.colors[0]}, social media cover image, 1:1 composition`;
}

function buildSystemPrompt() {
  return `あなたは少し意地悪で観察力の高い恋愛診断師です。固定キャラ説明をそのまま並べるのではなく、合成された最終タイプとして自然に書いてください。ユーザーの性別に合わせて語尾や見られ方のニュアンスを少し変えてください。少し怖く、少しコミカルで、でも当たっていてゾクッとする文にしてください。必ず次の見出しを順番どおりに入れてください。
【第一印象】
【裏の顔】
【恋愛するとこうなる】
【正直めんどくさい所】
【でもハマる理由】`;
}

function buildUserPrompt(first: RankedType, second: RankedType, p1: number, p2: number, axis: AxisScores, gender: Gender) {
  return `都市伝説占いの最終結果文を書いてください。

対象の性別: ${gender === "male" ? "男性" : gender === "female" ? "女性" : "指定なし"}
第一タイプ: ${first.name}
第二タイプ: ${second.name}
割合: ${p1}% / ${p2}%

第一タイプの怖さ: ${first.loveWarning}
第二タイプの怖さ: ${second.loveWarning}
主タイトル候補: ${first.scaryTitle}

心理傾向:
passion: ${axis.passion}
caution: ${axis.caution}
intuition: ${axis.intuition}
reality: ${axis.reality}
attachment: ${axis.attachment}
independence: ${axis.independence}

条件:
- 日本語
- 恋愛メイン
- 少し怖い
- 少し意地悪
- 少しコミカル
- 具体的な恋愛描写
- 700〜1100文字
- 固定文っぽくしない
- 相手がゾクッとする表現を少し入れる
- 性別に応じて、恋愛で見られ方の言い回しを少し変える`;
}

function buildMockResult(first: RankedType, second: RankedType, p1: number, p2: number, axis: AxisScores, gender: Gender) {
  const intense = axis.attachment >= axis.independence ? "相手の温度差を静かに記憶していく" : "平気そうな顔で一歩引いて支配権を渡さない";
  const secondLine = second.loveWarning;
  const genderLine = gender === "male"
    ? "一見すると余裕がありそうに見えるのに、内側では想像以上に執着が深いタイプとして出やすいです。"
    : gender === "female"
    ? "柔らかく見えても、感情の持ち方がかなり濃く、曖昧さに対して静かに怖くなるタイプとして出やすいです。"
    : "性別の印象に縛られず、外から見える顔と内側の濃さにかなり差があるタイプとして出やすいです。";
  return `【第一印象】
あなたは最初から露骨に怖い人には見えません。むしろ落ち着いていて、ちゃんとしていて、少し近寄りがたいけど綺麗にまとまっている印象を持たれやすいです。ただ、それは入口の話です。今回の結果は ${first.name} ${p1}% × ${second.name} ${p2}%。表向きは静かでも、中身は普通よりずっと濃い。近づくほど安全そうには見えなくなるタイプです。${genderLine}

【裏の顔】
本音では ${first.innerCore} そこへ ${second.innerCore} も混ざるので、あなたは ${intense} 人です。しかも厄介なのは、その重さや鋭さをわざわざ説明しないこと。だから相手は最初『やさしそう』『普通そう』と思って近づくのに、後から『あれ、この人ぜんぜん普通じゃない』と気づきます。${secondLine}

【恋愛するとこうなる】
恋愛になると、あなたはかなり分かりやすく二層構造です。最初は様子を見る。けれど刺さった相手には、返信の速さ、会話のトーン、前に言っていた小さな約束まで、思った以上に覚えています。好きなうちは深いし、優しいし、相手にちゃんと合わせることもできます。でも曖昧にされた瞬間から少し空気が変わる。笑っていても、内側では静かに記録が始まっている感じです。しかも自分ではそこまで大げさなことをしているつもりがないので、相手だけがじわじわ『あれ、思ったより重いかも』となりやすい。ここ、ちょっと面白いけど普通に怖いところです。

【正直めんどくさい所】
正直めんどくさいのは、自分ではそこまで怖いことをしている自覚が薄いところです。確認したい、知りたい、見抜きたい、忘れたくない。その気持ちが自然すぎて、相手からすると『え、そこまで見てたの？』『まだ覚えてるの？』になりやすい。しかも怒鳴るより黙る方が怖いタイプなので、空気だけが重くなっていくことがあります。笑顔のままちょっと圧があるの、かなり怪談です。相手が油断した頃にだけ温度差へ反応するので、なおさら怖い。

【でもハマる理由】
それでもあなたが強いのは、薄く終わらないからです。${first.gift} 表面だけの会話で終わらず、相手の中にちゃんと爪痕を残す。怖いのに気になる。重いのに、なぜか切れない。軽く消費されない濃さがあるから、恋愛ではわりと危険なくらい印象に残ります。たぶんあなたは、優しいだけの人よりずっと、後を引く人です。しかもその後味がじわじわ効いてくるタイプなので、別れた後の方が怖いまであります。`;
}

function mockImageUrl(first: RankedType, second: RankedType) {
  const text = encodeURIComponent(`${first.name} × ${second.name}`);
  return `https://placehold.co/1024x1024/111827/f8fafc?text=${text}`;
}

async function requestResult(payload: GenerateResultPayload) {
  if (USE_MOCK) return buildMockResult(payload.first, payload.second, payload.percentages.p1, payload.percentages.p2, payload.axis, payload.gender);
  const response = await fetch(RESULT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: buildSystemPrompt(),
      user: buildUserPrompt(payload.first, payload.second, payload.percentages.p1, payload.percentages.p2, payload.axis, payload.gender),
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "結果文の生成に失敗しました。");
  return data.text as string;
}

async function requestImage(prompt: string, first: RankedType, second: RankedType) {
  if (USE_MOCK) return mockImageUrl(first, second);
  const response = await fetch(IMAGE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "画像生成に失敗しました。");
  return data.imageUrl as string;
}

function ResultHero({ first, second, p1, p2 }: { first: RankedType; second: RankedType; p1: number; p2: number }) {
  return (
    <div style={{ ...styles.hero, background: `linear-gradient(135deg, ${first.colors[0]}, ${second.colors[0]})` }}>
      <div style={styles.heroChip}>都市伝説占い RESULT</div>
      <div style={styles.heroName}>{first.scaryTitle}</div>
      <div style={styles.heroMix}>{first.name} × {second.name}</div>
      <div style={styles.heroPercent}>{p1}% / {p2}%</div>
      <div style={styles.heroSub}>{first.loveWarning}</div>
    </div>
  );
}

function QuestionVisual({ item }: { item: Question }) {
  return (
    <div style={{ ...styles.questionVisual, background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})` }}>
      <div style={styles.questionEmoji}>{item.visualEmoji}</div>
      <div style={styles.questionTitle}>{item.visualTitle}</div>
      <div style={styles.questionTag}>{item.visualTag}</div>
    </div>
  );
}

function IntroCard({ type }: { type: TypeDef }) {
  return (
    <div style={{ ...styles.introCard, background: `linear-gradient(135deg, ${type.colors[0]}, ${type.colors[1]})` }}>
      <div style={styles.introGhostMark}>◐</div>
      <div style={styles.introCardText}>{type.introHint || type.loveWarning}</div>
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

  const current = questions[step];
  const normalizedAxis = useMemo(() => normalizeAxisScores(axis), [axis]);
  const ranked = useMemo(() => {
    return [...types].map((item) => ({ ...item, score: similarity(normalizedAxis, item.axis) })).sort((a, b) => b.score - a.score) as RankedType[];
  }, [normalizedAxis]);

  const first = ranked[0] ?? ({ ...types[0], score: 50 } as RankedType);
  const second = ranked[1] ?? ({ ...types[1], score: 49 } as RankedType);
  const blend = topTwoBlend(first.score, second.score);
  const imagePrompt = buildFusionPrompt(first, second, blend.p1, blend.p2);

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
  };

  const generateAll = async () => {
    try {
      setIsGenerating(true);
      setErrorMessage("");
      const [text, img] = await Promise.all([
        requestResult({ first, second, percentages: blend, axis: normalizedAxis, gender }),
        requestImage(imagePrompt, first, second),
      ]);
      setResultText(text);
      setImageUrl(img);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  if (viewMode === "intro") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.badge}>都市伝説占い</div>
          <h1 style={styles.title}>都市伝説占い</h1>
          <p style={styles.lead}>深夜、誰もいないはずの場所で視線を感じたり、優しさの奥に少しだけ狂気が混ざっている人を見たことはありませんか。都市伝説は、外にいるだけではなく、たぶん人の内側にも潜んでいます。この占いでは、あなたの内に潜む狂気と執着、そして恋をした時に顔を出す危うさを30の質問で暴きます。</p>
          <div style={styles.genderRow}>
            <button style={gender === "male" ? styles.genderBtnActive : styles.genderBtn} onClick={() => setGender("male")}>男性向けでみる</button>
            <button style={gender === "female" ? styles.genderBtnActive : styles.genderBtn} onClick={() => setGender("female")}>女性向けでみる</button>
            <button style={gender === "other" ? styles.genderBtnActive : styles.genderBtn} onClick={() => setGender("other")}>指定しない</button>
          </div>
          <div style={styles.introGrid}>
            {types.slice(0, 10).map((type) => (
              <IntroCard key={type.name} type={type} />
            ))}
          </div>
          <button style={styles.startBtn} onClick={() => setViewMode("diagnosis")}>占いを始める</button>
        </div>
      </div>
    );
  }

  if (viewMode === "result") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.badge}>診断結果</div>
          <h1 style={styles.title}>あなたの都市伝説タイプ</h1>
          <ResultHero first={first} second={second} p1={blend.p1} p2={blend.p2} />
          {!resultText && !isGenerating && <button style={styles.generateBtn} onClick={generateAll}>最後の結果を生成する</button>}
          {isGenerating && <div style={styles.loading}>最後の顔を呼び出しています…</div>}
          {errorMessage && <div style={styles.errorText}>{errorMessage}</div>}
          {imageUrl && (
            <div style={styles.box}>
              <div style={styles.section}>合成された姿</div>
              <img src={imageUrl} alt="診断結果イメージ" style={styles.resultImage} />
            </div>
          )}
          {resultText && (
            <div style={styles.box}>
              <div style={styles.section}>最終結果</div>
              <div style={styles.resultText}>{resultText}</div>
            </div>
          )}
          <div style={styles.row}>
            <button style={styles.btn} onClick={restart}>もう一度占う</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>質問 {step + 1} / {questions.length}</div>
        <QuestionVisual item={current} />
        <h2 style={styles.title}>{current.text}</h2>
        <div style={styles.stack}>
          {current.options.map((option, index) => (
            <button key={`${step}-${index}`} style={styles.btn} onClick={() => answer(option.score)}>{option.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at top, #3a0817 0%, #16060f 22%, #0b1120 54%, #020617 100%)", color: "white", padding: 24, fontFamily: "Arial, sans-serif" },
  card: { maxWidth: 820, margin: "0 auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" },
  badge: { display: "inline-block", marginBottom: 12, padding: "6px 10px", borderRadius: 999, background: "rgba(239,68,68,0.16)", color: "#fecaca", fontSize: 12 },
  title: { margin: "0 0 20px", fontSize: 30, lineHeight: 1.3 },
  lead: { margin: "0 0 18px", color: "rgba(255,255,255,0.86)", lineHeight: 1.9, fontSize: 16 },
  stack: { display: "grid", gap: 12 },
  row: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 },
  btn: { width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.08)", color: "white", textAlign: "left", cursor: "pointer", fontSize: 16 },
  startBtn: { width: "100%", padding: "16px 18px", borderRadius: 16, border: "1px solid rgba(254,202,202,0.2)", background: "linear-gradient(135deg, rgba(239,68,68,0.28), rgba(124,58,237,0.24))", color: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 700, marginTop: 18 },
  generateBtn: { width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(254,202,202,0.2)", background: "rgba(239,68,68,0.16)", color: "#fee2e2", cursor: "pointer", fontSize: 16, fontWeight: 700, marginBottom: 14 },
  genderRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, margin: "0 0 18px" },
  genderBtn: { padding: "12px 10px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontSize: 14 },
  genderBtnActive: { padding: "12px 10px", borderRadius: 14, border: "1px solid rgba(254,202,202,0.22)", background: "rgba(239,68,68,0.18)", color: "#fff", cursor: "pointer", fontSize: 14 },
  hero: { padding: 22, borderRadius: 22, border: "1px solid rgba(255,255,255,0.16)", marginBottom: 18, boxShadow: "0 18px 40px rgba(0,0,0,0.28)" },
  heroChip: { display: "inline-block", marginBottom: 10, padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 11, letterSpacing: 0.6 },
  heroName: { fontSize: 32, fontWeight: 800, lineHeight: 1.15 },
  heroMix: { marginTop: 8, fontSize: 22, color: "rgba(255,255,255,0.92)" },
  heroPercent: { marginTop: 10, fontSize: 22, color: "#fca5a5", fontWeight: 800 },
  heroSub: { marginTop: 8, color: "rgba(255,255,255,0.88)", lineHeight: 1.6 },
  box: { padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 14 },
  section: { fontSize: 14, fontWeight: 700, color: "#fecaca", marginBottom: 10 },
  resultText: { whiteSpace: "pre-line", lineHeight: 1.9, color: "rgba(255,255,255,0.94)", fontSize: 15 },
  questionVisual: { minHeight: 220, borderRadius: 20, marginBottom: 18, border: "1px solid rgba(255,255,255,0.14)", padding: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden" },
  questionEmoji: { position: "absolute", top: 16, left: 18, fontSize: 84, lineHeight: 1 },
  questionTitle: { position: "relative", zIndex: 1, fontSize: 30, fontWeight: 800, marginBottom: 6 },
  questionTag: { position: "relative", zIndex: 1, color: "rgba(255,255,255,0.92)", lineHeight: 1.5, maxWidth: "82%" },
  resultImage: { width: "100%", borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)" },
  loading: { color: "rgba(255,255,255,0.85)", padding: "8px 0 12px" },
  errorText: { color: "#fecaca", lineHeight: 1.7, whiteSpace: "pre-line", marginBottom: 12 },
  introGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 },
  introCard: { minHeight: 124, borderRadius: 18, padding: 16, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 12px 30px rgba(0,0,0,0.35)", position: "relative", overflow: "hidden" },
  introGhostMark: { position: "absolute", right: 14, top: 10, fontSize: 34, opacity: 0.28 },
  introCardText: { fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,0.93)", maxWidth: "82%", marginTop: 24 },
};
