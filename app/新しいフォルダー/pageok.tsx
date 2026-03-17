"use client";
import React, { useMemo, useState } from "react";

const USE_MOCK = false;
const RESULT_API_URL = "/api/generate-result";
const IMAGE_API_URL = "/api/generate-image";

const AXES = ["passion", "caution", "intuition", "reality", "attachment", "independence"] as const;
type AxisKey = (typeof AXES)[number];
type AxisScores = Record<AxisKey, number>;
type Category = "basic" | "subconscious" | "romance" | "social";
type ViewMode = "diagnosis" | "catalog";

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
};

type CatalogEntry = {
  shortDescription: string;
  origin: string;
  era: string;
  famousEpisode: string;
  dangerLevel: string;
  habitat: string;
  imagePrompt: string;
  compatibleNames: string[];
  fusionTraits: string[];
  fusionBase: string;
  fusionAccent: string;
};

type RankedType = TypeDef & { score: number };

type GenerateResultPayload = {
  first: RankedType;
  second: RankedType;
  percentages: { p1: number; p2: number };
  axis: AxisScores;
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
];

const types: TypeDef[] = [
  { name: "花子さん", vibe: "執着と警戒が極端に強い怪談型", axis: { passion: 40, caution: 96, intuition: 70, reality: 35, attachment: 92, independence: 12 }, colors: ["#7c3aed", "#111827"], publicMask: "静かで落ち着いて見えるのにかなり慎重。", innerCore: "一度大事認定した相手には強く残り続けます。", risk: "警戒が強すぎると一人でホラー演出を始めがち。", gift: "違和感や本音を察知する力が高いです。" },
  { name: "人面犬", vibe: "感情と勢いで突っ走る暴走型", axis: { passion: 96, caution: 20, intuition: 40, reality: 18, attachment: 86, independence: 20 }, colors: ["#ea580c", "#111827"], publicMask: "感情がわかりやすく存在感が急に大きくなります。", innerCore: "好きも嫌いも強く、止まりにくい熱量を持ちます。", risk: "好意がそのまま圧になることがあります。", gift: "感情を隠さない分、記憶に残る魅力があります。" },
  { name: "モスマン", vibe: "直感と予兆に支配される予感型", axis: { passion: 72, caution: 38, intuition: 96, reality: 16, attachment: 52, independence: 44 }, colors: ["#dc2626", "#312e81"], publicMask: "意味深な空気に敏感で、少しロマン寄り。", innerCore: "理屈より気配や予感で動くことが多いです。", risk: "怪しい相手を美化しやすいです。", gift: "空気の変化を早く拾える感受性があります。" },
  { name: "ビッグフット", vibe: "超現実派の安定型", axis: { passion: 30, caution: 26, intuition: 18, reality: 96, attachment: 48, independence: 82 }, colors: ["#0f766e", "#111827"], publicMask: "変な空気にも巻き込まれにくい安定感。", innerCore: "感情で暴走するより現実で処理したいタイプです。", risk: "冷静すぎて反応が薄く見られることがあります。", gift: "壊れにくい関係を作るのが得意です。" },
  { name: "口裂け女", vibe: "愛と執着が暴走する依存型", axis: { passion: 86, caution: 62, intuition: 36, reality: 20, attachment: 98, independence: 8 }, colors: ["#b91c1c", "#111827"], publicMask: "特別扱いにとても敏感なタイプ。", innerCore: "曖昧にされるのが苦手で愛されたい気持ちが強い。", risk: "温度差がそのまま恐怖演出になります。", gift: "薄い関係では終わらない本気の向き合い方。" },
  { name: "ツチノコ", vibe: "本音を見せないミステリアス型", axis: { passion: 42, caution: 72, intuition: 78, reality: 50, attachment: 38, independence: 66 }, colors: ["#65a30d", "#111827"], publicMask: "謎めいていて何を考えているかわかりにくい。", innerCore: "かなり慎重で本音を簡単に明かしません。", risk: "沈黙だけで相手に怪談を作らせます。", gift: "流されずに見極める力があります。" },
  { name: "雪女", vibe: "静かな冷気をまとうクール距離型", axis: { passion: 28, caution: 66, intuition: 74, reality: 62, attachment: 18, independence: 92 }, colors: ["#60a5fa", "#0f172a"], publicMask: "落ち着いて見えるけど少し冷たい距離感。", innerCore: "内面は繊細で、許した相手には静かな優しさ。", risk: "感情を抑えすぎて読めない人に見られがち。", gift: "透明感と冷静さが魅力になります。" },
  { name: "ネッシー", vibe: "静かで深すぎる深層心理型", axis: { passion: 38, caution: 64, intuition: 88, reality: 40, attachment: 54, independence: 60 }, colors: ["#0369a1", "#111827"], publicMask: "穏やかに見えて感情を表に出しません。", innerCore: "内側はかなり深く、簡単には底を見せないタイプ。", risk: "本音を沈めすぎて読まれにくい。", gift: "静かな包容力で関係を育てられます。" },
  { name: "チュパカブラ", vibe: "衝動と本能の捕食型", axis: { passion: 98, caution: 28, intuition: 46, reality: 10, attachment: 60, independence: 50 }, colors: ["#991b1b", "#111827"], publicMask: "欲しいものには一直線。", innerCore: "考える前に動く本能型です。", risk: "勢いで進んで急停止することがあります。", gift: "停滞した空気を一気に変える行動力。" },
  { name: "天狗", vibe: "孤高でプライドの高い支配型", axis: { passion: 62, caution: 36, intuition: 52, reality: 66, attachment: 10, independence: 98 }, colors: ["#9a3412", "#111827"], publicMask: "自立していて近寄りがたい強さがあります。", innerCore: "自分の軸とペースを守りたい気持ちがかなり強い。", risk: "必要とされてるのか相手が不安になりやすいです。", gift: "依存しない強さが魅力になります。" },
  { name: "河童", vibe: "観察と皮肉の分析型", axis: { passion: 50, caution: 56, intuition: 64, reality: 70, attachment: 28, independence: 72 }, colors: ["#0891b2", "#111827"], publicMask: "観察力が高く、少し皮肉っぽい。", innerCore: "感情より分析が先に動きやすいタイプ。", risk: "見抜きすぎてロマンスを削りがち。", gift: "裏側に気づける鋭さとユーモア。" },
  { name: "鵺", vibe: "混沌で正体不明のカオス型", axis: { passion: 70, caution: 70, intuition: 84, reality: 22, attachment: 46, independence: 48 }, colors: ["#4f46e5", "#111827"], publicMask: "つかみどころがなく、人によって見え方が変わります。", innerCore: "自分でも感情を説明しきれないことがあります。", risk: "本音が見えなくなって関係がカオス化しやすい。", gift: "唯一無二の魅力で惹きつけます。" },
  { name: "座敷童", vibe: "安心感を与える守護型", axis: { passion: 34, caution: 18, intuition: 40, reality: 72, attachment: 96, independence: 24 }, colors: ["#d97706", "#111827"], publicMask: "一緒にいると落ち着く柔らかさ。", innerCore: "安心できる関係と居場所を大切にします。", risk: "優しさが自然すぎていい人止まりになりがち。", gift: "人の緊張を解く空気を作れます。" },
  { name: "海坊主", vibe: "静かな狂気を秘めた深海型", axis: { passion: 60, caution: 68, intuition: 74, reality: 34, attachment: 78, independence: 22 }, colors: ["#0f766e", "#172554"], publicMask: "静かで重心が低く、あまり騒がない。", innerCore: "信頼した相手に対してはかなり重くなります。", risk: "重さが見えにくく気づいた時には沈ませがち。", gift: "強い絆を築く本気の深さ。" },
  { name: "一つ目小僧", vibe: "観察力が異常に高い分析型", axis: { passion: 24, caution: 82, intuition: 66, reality: 94, attachment: 20, independence: 68 }, colors: ["#a16207", "#111827"], publicMask: "冷静でよく見ている人という印象。", innerCore: "違和感やズレをかなり細かく拾います。", risk: "恋愛なのに監査みたいになりやすい。", gift: "危険回避能力がかなり高いです。" },
  { name: "ぬらりひょん", vibe: "空気を支配するマイペース型", axis: { passion: 44, caution: 42, intuition: 80, reality: 78, attachment: 22, independence: 74 }, colors: ["#475569", "#111827"], publicMask: "自然に場へ入り込み、なぜか中心にいる。", innerCore: "人に合わせているようで自分のペースを崩しません。", risk: "自然すぎる支配で相手のペースを奪いがち。", gift: "どこでも居場所を作る適応力。" },
];

const urbanLegendCatalog: Record<string, CatalogEntry> = {
  "花子さん": { shortDescription: "学校のトイレに現れるとされる日本の有名な怪談。", origin: "日本", era: "戦後〜昭和後期", famousEpisode: "3番目のトイレで呼ぶと返事がある話が有名。", dangerLevel: "中", habitat: "学校 / トイレ / 校舎", imagePrompt: "hanako-san inspired urban legend character, ghost school girl, pale skin, wet black hair, old school bathroom atmosphere, creepy cute, cinematic japanese horror portrait", compatibleNames: ["座敷童", "ネッシー", "雪女"], fusionTraits: ["long wet black hair", "school ghost aura", "red skirt uniform", "bathroom horror mood"], fusionBase: "ghost school girl", fusionAccent: "clingy eerie presence" },
  "人面犬": { shortDescription: "人の顔を持つ犬が高速道路などを走るという日本の都市伝説。", origin: "日本", era: "1990年代", famousEpisode: "深夜の道路で人面の犬が走る目撃談で知られる。", dangerLevel: "低〜中", habitat: "道路 / 高速道路 / 深夜の街", imagePrompt: "jinmenken inspired urban legend character, uncanny human-faced dog, streetlight glow, realistic fur, creepy cute, cinematic japanese urban horror portrait", compatibleNames: ["チュパカブラ", "ぬらりひょん", "モスマン"], fusionTraits: ["human-like face", "dog ears", "streetlight glow", "wild grin"], fusionBase: "human faced dog creature", fusionAccent: "chaotic emotional energy" },
  "モスマン": { shortDescription: "赤い目と大きな翼を持つアメリカの未確認生物。", origin: "アメリカ", era: "1960年代", famousEpisode: "ポイントプレザントでの連続目撃で有名。", dangerLevel: "中", habitat: "橋 / 森 / 夜空", imagePrompt: "mothman inspired urban legend character, glowing red eyes, tattered wings, night fog, creepy cute, cinematic horror portrait", compatibleNames: ["雪女", "ツチノコ", "ネッシー"], fusionTraits: ["glowing red eyes", "dark wings", "night fog", "omen aura"], fusionBase: "winged cryptid figure", fusionAccent: "prophetic romantic darkness" },
  "ビッグフット": { shortDescription: "北米で語られる巨大な毛むくじゃらの人型未確認生物。", origin: "北米", era: "20世紀以降", famousEpisode: "巨大な足跡と有名映像記録で知られる。", dangerLevel: "低", habitat: "山 / 森 / 雪原", imagePrompt: "bigfoot inspired urban legend character, towering forest creature, gentle but eerie, damp fur, creepy cute, cinematic portrait", compatibleNames: ["座敷童", "雪女", "河童"], fusionTraits: ["towering furry body", "forest mist", "broad silhouette", "gentle monster face"], fusionBase: "forest giant creature", fusionAccent: "stable grounded presence" },
  "口裂け女": { shortDescription: "『私きれい？』と問いかける日本の有名都市伝説。", origin: "日本", era: "1970年代", famousEpisode: "マスクの女性が問いかける怪談として有名。", dangerLevel: "高", habitat: "夕方の道 / 住宅街 / 学校帰り", imagePrompt: "kuchisake-onna inspired urban legend character, eerie beautiful woman with mask and scissors, japanese horror street night, creepy cute, cinematic portrait", compatibleNames: ["花子さん", "座敷童", "ネッシー"], fusionTraits: ["beautiful eerie woman", "surgical mask", "silver scissors", "obsessive gaze"], fusionBase: "beautiful horror woman", fusionAccent: "intense possessive charm" },
  "ツチノコ": { shortDescription: "胴が太く短い蛇のような姿で語られる日本の未確認生物。", origin: "日本", era: "古くから伝承", famousEpisode: "山中で見つかった、跳ねたなどの話題で有名。", dangerLevel: "低", habitat: "山 / 森 / 草むら", imagePrompt: "tsuchinoko inspired urban legend creature, mysterious fat snake cryptid, japanese folklore forest mood, creepy cute, cinematic portrait", compatibleNames: ["モスマン", "河童", "雪女"], fusionTraits: ["round snake body", "subtle scales", "small suspicious eyes", "forest cryptid vibe"], fusionBase: "fat cryptid snake", fusionAccent: "mysterious unreadable aura" },
  "雪女": { shortDescription: "雪山や吹雪の夜に現れるとされる日本の妖怪。", origin: "日本", era: "江戸時代から有名", famousEpisode: "吹雪の夜に旅人の前へ現れる話で知られる。", dangerLevel: "中〜高", habitat: "雪山 / 吹雪 / 寒村", imagePrompt: "yuki-onna inspired urban legend character, eerie beautiful woman, pale skin, icy breath, long dark hair, subtle frost, creepy cute, cinematic japanese horror portrait", compatibleNames: ["ネッシー", "天狗", "座敷童"], fusionTraits: ["pale icy skin", "frost breath", "snow particles", "cold elegant gaze"], fusionBase: "icy spirit woman", fusionAccent: "cool distant beauty" },
  "ネッシー": { shortDescription: "スコットランドのネス湖に棲むとされる世界的に有名な未確認生物。", origin: "スコットランド", era: "20世紀に有名化", famousEpisode: "ネス湖の有名写真と多数の目撃談で知られる。", dangerLevel: "低", habitat: "湖 / 水辺 / 霧の深い場所", imagePrompt: "nessie inspired urban legend character, deep lake creature vibe, elegant dark water aura, creepy cute, cinematic portrait", compatibleNames: ["雪女", "花子さん", "座敷童"], fusionTraits: ["dark lake ripples", "long neck silhouette", "deep water glow", "calm abyss aura"], fusionBase: "lake cryptid figure", fusionAccent: "deep silent emotional weight" },
  "チュパカブラ": { shortDescription: "家畜の血を吸うと噂される中南米の未確認生物。", origin: "中南米", era: "1990年代", famousEpisode: "血を抜かれた家畜の報告で有名。", dangerLevel: "高", habitat: "農村 / 荒野 / 夜の牧場", imagePrompt: "chupacabra inspired urban legend creature, feral but stylish horror beast, glowing eyes, creepy cute, cinematic portrait", compatibleNames: ["人面犬", "モスマン", "ぬらりひょん"], fusionTraits: ["spiky back", "feral claws", "predator eyes", "wild beast posture"], fusionBase: "feral cryptid beast", fusionAccent: "impulsive predatory energy" },
  "天狗": { shortDescription: "長い鼻や赤い顔で知られる日本の山の妖怪。", origin: "日本", era: "中世以降", famousEpisode: "山伏のような姿で人を惑わす存在として有名。", dangerLevel: "中", habitat: "山 / 神社 / 深い森", imagePrompt: "tengu inspired urban legend character, elegant red mask yokai, mountain wind, creepy cute, cinematic japanese folklore portrait", compatibleNames: ["雪女", "河童", "ぬらりひょん"], fusionTraits: ["red tengu mask", "wind swept hair", "mountain aura", "proud posture"], fusionBase: "mountain yokai warrior", fusionAccent: "proud solitary charisma" },
  "河童": { shortDescription: "頭の皿や甲羅を持つ、日本の川や沼の妖怪。", origin: "日本", era: "古くから全国で伝承", famousEpisode: "川へ引きずり込む話やきゅうり好きで有名。", dangerLevel: "中", habitat: "川 / 沼 / 水辺", imagePrompt: "kappa inspired urban legend character, sly river yokai, clever expression, creepy cute, cinematic japanese folklore portrait", compatibleNames: ["天狗", "ぬらりひょん", "ツチノコ"], fusionTraits: ["river creature skin", "dish-like head detail", "mischievous smile", "wet river mood"], fusionBase: "clever river yokai", fusionAccent: "observant sarcastic vibe" },
  "鵺": { shortDescription: "複数の動物が混ざった姿で語られる日本の怪物。", origin: "日本", era: "平安時代から有名", famousEpisode: "夜な夜な不気味な声を上げ帝を悩ませた怪物。", dangerLevel: "高", habitat: "宮中 / 山 / 夜空", imagePrompt: "nue inspired urban legend chimera character, surreal hybrid yokai, eerie smoke, creepy cute, cinematic fantasy horror portrait", compatibleNames: ["モスマン", "ツチノコ", "ぬらりひょん"], fusionTraits: ["chimera hybrid details", "smoke aura", "beastlike silhouette", "unreadable expression"], fusionBase: "chaotic chimera yokai", fusionAccent: "unpredictable mixed energy" },
  "座敷童": { shortDescription: "家に幸運をもたらすとされる日本の子どもの妖怪。", origin: "日本", era: "東北地方を中心に古くから伝承", famousEpisode: "見かけた家は栄えるが去ると衰えるとされる。", dangerLevel: "低", habitat: "古い家 / 座敷 / 旅館", imagePrompt: "zashiki-warashi inspired urban legend character, gentle childlike yokai aura, warm room glow, creepy cute, cinematic portrait", compatibleNames: ["花子さん", "雪女", "ビッグフット"], fusionTraits: ["warm room glow", "child spirit aura", "soft smile", "protective presence"], fusionBase: "guardian spirit child", fusionAccent: "warm safe atmosphere" },
  "海坊主": { shortDescription: "海に現れる巨大な黒い坊主頭の妖怪。", origin: "日本", era: "江戸時代から有名", famousEpisode: "柄杓を要求し船を沈める怪談で知られる。", dangerLevel: "高", habitat: "海 / 沖 / 嵐の夜", imagePrompt: "umibozu inspired urban legend character, dark sea yokai silhouette, deep ocean aura, creepy cute, cinematic portrait", compatibleNames: ["ネッシー", "花子さん", "雪女"], fusionTraits: ["ocean shadow silhouette", "storm sea spray", "deep blue glow", "massive quiet presence"], fusionBase: "deep sea shadow yokai", fusionAccent: "heavy silent intensity" },
  "一つ目小僧": { shortDescription: "一つ目を持つ子どもの姿で語られる日本の妖怪。", origin: "日本", era: "江戸時代の絵巻にも登場", famousEpisode: "夜道や寺で不意に現れて人を驚かせる話で知られる。", dangerLevel: "低", habitat: "寺 / 夜道 / 古い家", imagePrompt: "hitotsume-kozo inspired urban legend character, one-eyed yokai child, eerie but cute, lantern light, cinematic portrait", compatibleNames: ["河童", "ビッグフット", "ぬらりひょん"], fusionTraits: ["single large eye", "lantern light", "small monk robe", "careful watcher vibe"], fusionBase: "one-eyed yokai child", fusionAccent: "precise analytical gaze" },
  "ぬらりひょん": { shortDescription: "人の家へ勝手に上がり込み主人のように振る舞う日本の妖怪。", origin: "日本", era: "江戸時代の絵巻や後世の創作", famousEpisode: "夕方に家へ上がり込みくつろぐ妖怪として有名。", dangerLevel: "低〜中", habitat: "古い家 / 夕暮れ / 町", imagePrompt: "nurarihyon inspired urban legend character, elegant old yokai gentleman silhouette, sly smile, drifting smoke, creepy cute, cinematic portrait", compatibleNames: ["河童", "人面犬", "雪女"], fusionTraits: ["elegant old yokai silhouette", "sly smile", "drifting smoke", "quiet dominance"], fusionBase: "elegant yokai gentleman", fusionAccent: "subtle controlling aura" },
};

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
  const a = Math.exp((firstScore + diff * 1.2) / 2.5);
  const b = Math.exp(Math.max(0, secondScore - diff * 0.1) / 2.5);
  const total = a + b || 1;
  const p1 = Math.max(55, Math.min(97, Math.round((a / total) * 100)));
  return { p1, p2: 100 - p1 };
}

function buildFusionPrompt(first: TypeDef, second: TypeDef, p1: number, p2: number) {
  const a = urbanLegendCatalog[first.name];
  const b = urbanLegendCatalog[second.name];
  return `creepy cute japanese urban legend character fusion, ${first.name} ${p1}% and ${second.name} ${p2}%, ${a.fusionBase} as main appearance, subtle influence of ${second.name}, main traits: ${a.fusionTraits.join(", ")}, secondary traits: ${b.fusionTraits.join(", ")}, mood accent: ${b.fusionAccent}, stylized character design, slightly spooky but cute, dark fantasy atmosphere, soft horror lighting, centered portrait, high detail, social media friendly, 1:1 composition`;
}

function buildSystemPrompt() {
  return `あなたは少し意地悪で観察力の高い恋愛診断師です。ユーザーが「当たってる…でもちょっとムカつく」と感じる恋愛診断結果を書いてください。トーンは少し意地悪、少し怖い、でも面白く、恋愛にリアル。必ず次の見出しを順番どおりに入れてください。\n【第一印象】\n【裏の顔】\n【恋愛するとこうなる】\n【正直めんどくさい所】\n【でもハマる理由】`;
}

function buildUserPrompt(first: RankedType, second: RankedType, p1: number, p2: number, axis: AxisScores) {
  return `都市伝説恋愛診断の結果を書いてください。\n\n第一キャラ: ${first.name}\n第二キャラ: ${second.name}\n割合: ${p1}% / ${p2}%\n\n心理傾向:\npassion: ${axis.passion}\ncaution: ${axis.caution}\nintuition: ${axis.intuition}\nreality: ${axis.reality}\nattachment: ${axis.attachment}\nindependence: ${axis.independence}\n\n${first.name}の特徴:\n${first.publicMask}\n${first.innerCore}\n\n${second.name}の特徴:\n${second.publicMask}\n${second.innerCore}\n\n条件:\n- 日本語\n- 恋愛メイン\n- 少しディスる\n- でも最後は魅力で締める\n- 600〜900文字\n- 具体的な恋愛描写を入れる`;
}

function mockResultText(first: RankedType, second: RankedType, p1: number, p2: number, axis: AxisScores) {
  const sharp = axis.caution > axis.passion ? "返信の遅さや言葉の温度差まで拾ってしまう" : "好きになると急に熱量が上がって空気を変える";
  return `【第一印象】\nあなたは最初、かなり普通そうに見えます。落ち着いていて、扱いやすそうで、変に感情をぶつけてこない人だと思われやすいです。ただその印象、だいたい表面だけです。\n\n【裏の顔】\n実際は ${first.name} ${p1}% がかなり強く出ています。${first.innerCore} そこに ${second.name} ${p2}% が混ざるので、${second.innerCore} も普通にあります。つまりあなたは、静かな顔で中身だけ濃いタイプです。\n\n【恋愛するとこうなる】\n恋愛になると、あなたは ${sharp} 人です。しかも表では平気そうに見せるので、相手は後から「思ったより見られてた」と気づきます。いい方向に出ると一途で深い。悪い方向に出ると、静かなのに圧があります。\n\n【正直めんどくさい所】\n面倒なのは、あなたが自分では普通だと思っている所です。普通の顔で記憶力だけ上がるし、普通の声でちょっと重いことを言います。しかも本人はそこまで怖いと思っていません。そこがわりと怖いです。\n\n【でもハマる理由】\nただ、あなたには薄く終わらない魅力があります。${first.gift} だから一度近づいた人ほど、あなたのことを忘れにくい。軽く消費されない感じがある。ちょっと面倒で、ちょっと怖くて、でもなぜか離れがたい。それがあなたです。`;
}

function mockImageUrl(first: RankedType, second: RankedType) {
  const text = encodeURIComponent(`${first.name} × ${second.name}`);
  return `https://placehold.co/1024x1024/111827/f8fafc?text=${text}`;
}

async function requestResult(payload: GenerateResultPayload) {
  if (USE_MOCK) return mockResultText(payload.first, payload.second, payload.percentages.p1, payload.percentages.p2, payload.axis);
  const response = await fetch(RESULT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: buildSystemPrompt(), user: buildUserPrompt(payload.first, payload.second, payload.percentages.p1, payload.percentages.p2, payload.axis) }),
  });
  if (!response.ok) throw new Error("結果文の生成に失敗しました。");
  const data = await response.json();
  return data.text as string;
}

async function requestImage(prompt: string, first: RankedType, second: RankedType) {
  if (USE_MOCK) return mockImageUrl(first, second);
  const response = await fetch(IMAGE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error("画像生成に失敗しました。");
  const data = await response.json();
  return data.imageUrl as string;
}

function ResultHero({ first, second, p1, p2 }: { first: RankedType; second: RankedType; p1: number; p2: number }) {
  return (
    <div style={{ ...styles.hero, background: `linear-gradient(135deg, ${first.colors[0]}, ${second.colors[0]})` }}>
      <div style={styles.heroChip}>都市伝説PROFILE</div>
      <div style={styles.heroName}>{first.name}</div>
      <div style={styles.heroMix}>× {second.name}</div>
      <div style={styles.heroPercent}>{p1}% / {p2}%</div>
      <div style={styles.heroSub}>{first.vibe} × {second.vibe}</div>
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

function CatalogDetail({ name, entry, colors, onBack }: { name: string; entry: CatalogEntry; colors: [string, string]; onBack: () => void }) {
  return (
    <div style={styles.stack}>
      <button onClick={onBack} style={styles.secondaryBtn}>← 結果に戻る</button>
      <div style={{ ...styles.hero, background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
        <div style={styles.heroChip}>都市伝説図鑑</div>
        <div style={styles.heroName}>{name}</div>
        <div style={styles.heroSub}>{entry.shortDescription}</div>
      </div>
      <div style={styles.box}><div style={styles.section}>本来の都市伝説説明</div><div>{entry.shortDescription}</div></div>
      <div style={styles.box}><div style={styles.section}>発祥</div><div>{entry.origin}</div></div>
      <div style={styles.box}><div style={styles.section}>広まった時代</div><div>{entry.era}</div></div>
      <div style={styles.box}><div style={styles.section}>有名エピソード</div><div>{entry.famousEpisode}</div></div>
      <div style={styles.box}><div style={styles.section}>危険度</div><div>{entry.dangerLevel}</div></div>
      <div style={styles.box}><div style={styles.section}>出現しやすい場所</div><div>{entry.habitat}</div></div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [axis, setAxis] = useState<AxisScores>({ ...ZERO });
  const [viewMode, setViewMode] = useState<ViewMode>("diagnosis");
  const [selectedLegend, setSelectedLegend] = useState<string | null>(null);
  const [resultText, setResultText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const current = questions[step];
  const normalizedAxis = useMemo(() => normalizeAxisScores(axis), [axis]);
  const ranked = useMemo(() => {
    return [...types]
      .map((item) => ({ ...item, score: similarity(normalizedAxis, item.axis) }))
      .sort((a, b) => b.score - a.score) as RankedType[];
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
    setStep((prev) => prev + 1);
  };

  const restart = () => {
    setAxis({ ...ZERO });
    setStep(0);
    setViewMode("diagnosis");
    setSelectedLegend(null);
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
        requestResult({ first, second, percentages: blend, axis: normalizedAxis }),
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

  if (viewMode === "catalog" && selectedLegend) {
    const type = types.find((item) => item.name === selectedLegend) ?? types[0];
    const entry = urbanLegendCatalog[selectedLegend];
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.badge}>都市伝説図鑑</div>
          <h1 style={styles.title}>キャラ詳細</h1>
          <CatalogDetail name={type.name} entry={entry} colors={type.colors} onBack={() => setViewMode("diagnosis")} />
        </div>
      </div>
    );
  }

  if (step >= questions.length) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.badge}>診断結果</div>
          <h1 style={styles.title}>あなたの都市伝説キャラ</h1>
          <ResultHero first={first} second={second} p1={blend.p1} p2={blend.p2} />

          {!resultText && !isGenerating && (
            <button style={styles.generateBtn} onClick={generateAll}>
              結果文と画像を生成する
            </button>
          )}
          {isGenerating && <div style={styles.loading}>恋愛診断師と都市伝説が現れています…</div>}
          {errorMessage && <div style={styles.errorText}>{errorMessage}</div>}

          {imageUrl && (
            <div style={styles.box}>
              <div style={styles.section}>合成イメージ</div>
              <img src={imageUrl} alt="診断結果イメージ" style={styles.resultImage} />
            </div>
          )}

          {resultText && (
            <div style={styles.box}>
              <div style={styles.section}>診断結果</div>
              <div style={styles.resultText}>{resultText}</div>
            </div>
          )}

          <div style={styles.row}>
            <button style={styles.btn} onClick={restart}>もう一度やる</button>
            <button style={styles.secondaryBtn} onClick={() => { setSelectedLegend(first.name); setViewMode("catalog"); }}>このキャラを図鑑で見る</button>
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
            <button key={`${step}-${index}`} style={styles.btn} onClick={() => answer(option.score)}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at top, #1f2937 0%, #111827 45%, #020617 100%)", color: "white", padding: 24, fontFamily: "Arial, sans-serif" },
  card: { maxWidth: 760, margin: "0 auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" },
  badge: { display: "inline-block", marginBottom: 12, padding: "6px 10px", borderRadius: 999, background: "rgba(239,68,68,0.16)", color: "#fecaca", fontSize: 12 },
  title: { margin: "0 0 20px", fontSize: 30, lineHeight: 1.3 },
  stack: { display: "grid", gap: 12 },
  row: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 },
  btn: { width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.08)", color: "white", textAlign: "left", cursor: "pointer", fontSize: 16 },
  secondaryBtn: { padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", color: "white", cursor: "pointer", fontSize: 15 },
  generateBtn: { width: "100%", padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(254,202,202,0.2)", background: "rgba(239,68,68,0.16)", color: "#fee2e2", cursor: "pointer", fontSize: 16, fontWeight: 700, marginBottom: 14 },
  hero: { padding: 22, borderRadius: 22, border: "1px solid rgba(255,255,255,0.16)", marginBottom: 18, boxShadow: "0 18px 40px rgba(0,0,0,0.28)" },
  heroChip: { display: "inline-block", marginBottom: 10, padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 11, letterSpacing: 0.6 },
  heroName: { fontSize: 34, fontWeight: 800, lineHeight: 1.1 },
  heroMix: { marginTop: 6, fontSize: 24, color: "rgba(255,255,255,0.88)" },
  heroPercent: { marginTop: 10, fontSize: 22, color: "#fca5a5", fontWeight: 800 },
  heroSub: { marginTop: 8, color: "rgba(255,255,255,0.88)", lineHeight: 1.5 },
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
};

/*
Next.js API routes example:

// /app/api/generate-result/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
export async function POST(req: Request) {
  const { system, user } = await req.json();
  const res = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const text = res.output_text;
  return NextResponse.json({ text });
}

// /app/api/generate-image/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
export async function POST(req: Request) {
  const { prompt } = await req.json();
  const img = await client.images.generate({ model: "gpt-image-1", prompt, size: "1024x1024" });
  const b64 = img.data?.[0]?.b64_json;
  return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
}
*/
