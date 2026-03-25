import React from "react";

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
  score: number;
  scaryTitle: string;
  traits: CharacterTraits;
};

type ShareCardProps = {
  main: RankedType;
  sub?: RankedType;
  goodLabel: string;
  badLabel: string;
  imageUrl?: string;
  gender?: Gender;
  className?: string;
  elements?: string[];
  stats?: { label: string; value: number }[];
  summary?: string;
  title?: string;
  rarityLabel?: string;
};

type Rarity = "N" | "R" | "SR" | "SSR";

type StatItem = {
  label: string;
  value: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function getRarity(totalScore: number): Rarity {
  if (totalScore >= 175) return "SSR";
  if (totalScore >= 145) return "SR";
  if (totalScore >= 115) return "R";
  return "N";
}

function getMixRatio(mainScore: number, subScore: number) {
  const safeMain = Math.max(0, mainScore);
  const safeSub = Math.max(0, subScore);
  const total = safeMain + safeSub;

  if (total <= 0) {
    return { main: 50, sub: 50 };
  }

  const mainRatio = Math.round((safeMain / total) * 100);
  return { main: mainRatio, sub: 100 - mainRatio };
}

function buildCatchCopy(main: RankedType, sub?: RankedType) {
  const line1 = main.scaryTitle || `${main.name}型`;
  const line2 = sub
    ? `${main.traits.emotion} × ${sub.traits.behavior}`
    : `${main.traits.emotion}が強く出やすいタイプ`;

  return [line1, line2];
}

function buildTags(main: RankedType, sub?: RankedType) {
  const tag1 = main.traits.emotion || main.vibe;
  const tag2 = sub?.traits.behavior || main.traits.behavior;
  return [tag1, tag2].filter(Boolean).slice(0, 2);
}

function buildStats(main: RankedType, sub?: RankedType): StatItem[] {
  const base = clamp(main.score);
  const subBoost = clamp((sub?.score ?? Math.max(main.score * 0.72, 12)) * 0.28);

  return [
    {
      label: "情念",
      value: clamp(base),
    },
    {
      label: "存在感",
      value: clamp(base * 0.78 + subBoost * 0.55 + 14),
    },
    {
      label: "執着",
      value: clamp(base * 0.7 + subBoost * 0.9 + 10),
    },
  ];
}

const rarityTheme: Record<
  Rarity,
  {
    card: string;
    badge: string;
    panel: string;
    imageFrame: string;
    overlay?: string;
    overlayTone: string;
  }
> = {
  N: {
    card: "bg-[linear-gradient(180deg,#e8dece_0%,#d8c6ad_100%)] border-[#ad9270] text-[#3d3125] shadow-[0_10px_28px_rgba(95,73,42,0.12)]",
    badge: "bg-[#8d7654] text-[#fff6ea] border-[#7b6545]",
    panel: "bg-[rgba(247,239,226,0.70)] border-[#bda98a]",
    imageFrame: "bg-[linear-gradient(180deg,#ddd0bb_0%,#ccb79a_100%)] border-[#9b8768]",
    overlayTone: "bg-[rgba(31,20,30,0,18)]",
  },
  R: {
    card: "bg-[linear-gradient(180deg,#eee3d3_0%,#dbc7b0_100%)] border-[#9b8768] text-[#392d23] shadow-[0_12px_30px_rgba(98,74,45,0.16)]",
    badge: "bg-[#6f7e8d] text-white border-[#576574] shadow-sm",
    panel: "bg-[rgba(246,238,225,0.68)] border-[#b6a388]",
    imageFrame: "bg-[linear-gradient(180deg,#ddd0bc_0%,#cdb697_100%)] border-[#8c7b63]",
    overlayTone: "bg-[rgba(31,20,30,0,18)]",
  },
  SR: {
    card: "bg-[linear-gradient(180deg,#f1e3cd_0%,#e0c49d_55%,#d2ae7f_100%)] border-[#b8792d] text-[#2d2018] shadow-[0_16px_42px_rgba(120,76,24,0.24)]",
    badge: "bg-[linear-gradient(180deg,#fffdf8_0%,#f3eadc_100%)] text-[#8f1d2d] border-[#d8a24f] shadow-[0_0_14px_rgba(255,220,150,0.22)]",
    panel: "bg-[rgba(255,245,228,0.62)] border-[#cd9a52]",
    imageFrame: "bg-[linear-gradient(180deg,#e8cfac_0%,#d8b382_100%)] border-[#bf7e2b] shadow-[0_0_20px_rgba(255,220,150,0.12)]",
    overlay:
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-[28px] before:bg-[radial-gradient(circle_at_top,rgba(255,255,245,0.22),transparent_34%),linear-gradient(118deg,transparent_16%,rgba(255,255,255,0.24)_34%,rgba(255,245,220,0.14)_44%,transparent_58%)] before:opacity-90",
    overlayTone: "bg-[rgba(31,20,30,0,18)]",
  },
  SSR: {
    card: "bg-[linear-gradient(180deg,#2d1d2a_0%,#171016_100%)] border-[#e0b84f] text-[#fff1dd] shadow-[0_0_30px_rgba(224,184,79,0.20)]",
    badge: "bg-[linear-gradient(180deg,#7b35f0_0%,#4b1fa1_100%)] text-[#fff8ec] border-[#f0ca6a] shadow-[0_0_18px_rgba(240,202,106,0.30)]",
    panel: "bg-[rgba(255,244,220,0.12)] border-[rgba(240,202,106,0.54)]",
    imageFrame: "bg-[linear-gradient(180deg,#3a2632_0%,#231720_100%)] border-[#ddb24a] shadow-[0_0_24px_rgba(240,202,106,0.14)]",
    overlay:
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-[28px] before:bg-[radial-gradient(circle_at_top,rgba(188,128,255,0.26),transparent_34%),radial-gradient(circle_at_bottom,rgba(255,140,120,0.14),transparent_30%)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[28px] after:bg-[linear-gradient(120deg,transparent_18%,rgba(255,255,255,0.12)_38%,transparent_58%)]",
    overlayTone: "bg-[rgba(31,20,30,0,18)]",
  },
};

const rarityBackgroundMap: Record<Rarity, string> = {
  N: "/card-bg/n.png",
  R: "/card-bg/r.png",
  SR: "/card-bg/sr.png",
  SSR: "/card-bg/ssr.png",
};

const backgroundOpacityMap: Record<Rarity, string> = {
  N: "opacity-60",
  R: "opacity-70",
  SR: "opacity-80",
  SSR: "opacity-95",
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function ShareCard({
  main,
  sub,
  goodLabel,
  badLabel,
  imageUrl,
  className,
  elements = [],
  stats,
  summary,
  title,
  rarityLabel,
}: ShareCardProps) {
  const ratio = getMixRatio(main.score, sub?.score ?? 0);
  const rarity = rarityLabel ?? getRarity(main.score + (sub?.score ?? 0));
  const displayTitle = sub ? `${main.name}×${sub.name}` : main.name;



  const theme = rarityTheme[rarity];
  const backgroundImageUrl = rarityBackgroundMap[rarity];
  const tags = elements.length > 0 ? elements.slice(0, 2) : buildTags(main, sub);

  const derivedStats = buildStats(main, sub);
  const displayStats = stats && stats.length > 0 ? stats : derivedStats;

  const [line1, line2] = buildCatchCopy(main, sub);

  return (
    <section
      className={cx(
        "relative w-[320px] min-h-[580px] overflow-hidden rounded-[28px] border-[2px] p-4 after:pointer-events-none after:absolute after:inset-[6px] after:rounded-[22px] after:border after:border-white/10",
        theme.card,
        theme.overlay,
        className
      )}
    >
      <div
        className={cx(
          "absolute inset-0 bg-cover bg-center",
          backgroundOpacityMap[rarity]
        )}
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      />

     <div className={cx("absolute inset-0", theme.overlayTone)} />

      <div className="relative z-10 flex flex-col gap-2">


<header className="flex items-start justify-between gap-3">
 <div className="min-w-0 flex-1 pt-1">
    <div className="pl-12 text-center text-[11px] font-semibold tracking-[0.16em] text-white">

      都市伝説図鑑カード
    </div>
   <h2 className="mt-3 pr-16 text-[20px] font-black leading-none tracking-tight text-[#2c2118] [text-shadow:_-1px_-1px_0_rgba(255,255,255,0.9),1px_-1px_0_rgba(255,255,255,0.9),-1px_1px_0_rgba(255,255,255,0.9),1px_1px_0_rgba(255,255,255,0.9)]">
  {displayTitle}
</h2>
    <div className="mt-1.5 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className={cx(
            "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-[1px]",
            theme.panel
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  </div>

  <div
    className={cx(
      "shrink-0 rounded-full border px-3 py-1 text-[12px] font-black tracking-wide",
      theme.badge
    )}
  >
    {rarity}
  </div>
</header>
    


<div className="relative mt-2">


      


        <div className="mx-auto flex h-[214px] w-[75%] items-center justify-center overflow-hidden rounded-[16px] border-[3.0px] border-white/80">

            {imageUrl ? (
              <img
                src={imageUrl}
                alt={displayTitle}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-black/10 text-sm font-semibold opacity-60">
                image preview
              </div>
            )}
          </div>

          {rarity === "SSR" && (
            <>
              <span className="pointer-events-none absolute top-3 left-3 h-2 w-2 rounded-full bg-white/90 blur-sm" />
              <span className="pointer-events-none absolute top-5 right-4 h-2.5 w-2.5 rounded-full bg-pink-200/75 blur-[3px]" />
              <span className="pointer-events-none absolute bottom-4 left-6 h-1.5 w-1.5 rounded-full bg-yellow-200/80 blur-[2px]" />
              <span className="pointer-events-none absolute right-10 bottom-8 h-1.5 w-1.5 rounded-full bg-white/70 blur-[2px]" />
            </>
          )}
        </div>

 <div className="mt-1 text-[13px] font-semibold tracking-wide text-[#3a2c20] [text-shadow:_-1px_-1px_0_rgba(255,255,255,0.78),1px_-1px_0_rgba(255,255,255,0.78),-1px_1px_0_rgba(255,255,255,0.78),1px_1px_0_rgba(255,255,255,0.78)]">
  <span className="font-black">{main.name} {ratio.main}%</span>
  {sub ? <span className="opacity-90"> × {sub.name} {ratio.sub}%</span> : null}
</div>



        <div className="mt-1 grid grid-cols-3 gap-2">
          {displayStats.map((item) => (
            <div
              key={item.label}
              className={cx(
                "rounded-[12px] border px-2 py-0.3 text-center backdrop-blur-[1px]",
                theme.panel
              )}
            >
              <div className="text-[10px] font-semibold tracking-wide opacity-55">
                {item.label}
              </div>
              <div className="mt-1 text-[19px] font-black leading-none opacity-85">
                {item.value}
              </div>
            </div>
          ))}
        </div>

<div
  className={cx(
    "mt-2 rounded-[14px] border px-3 py-2.5 shadow-sm backdrop-blur-[1px]",
    theme.panel
  )}
>

    <div className="flex items-center gap-3">
    <div className="text-[10px] font-bold tracking-[0.14em] opacity-70">
      特性
    </div>
   <p className="text-[15px] font-semibold leading-none opacity-85">{line1}</p>
  </div>

  <p className="mt-2 whitespace-pre-line text-[13px] font-medium leading-snug opacity-80">
    {summary ?? line2}
  </p>
</div>


 





        <div className="mt-1 grid grid-cols-2 gap-2">
          <div
            className={cx(
              "rounded-[12px] border px-2 py-1.5 text-[11px] font-semibold backdrop-blur-[1px]",
              theme.panel
            )}
          >
            <span className="opacity-65">相性◎ </span>
            <span className="font-black">{goodLabel}</span>
          </div>
          <div
            className={cx(
              "rounded-[12px] border px-2 py-1.5 text-[11px] font-semibold backdrop-blur-[1px]",
              theme.panel
            )}
          >
            <span className="opacity-65">相性× </span>
            <span className="font-black">{badLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function getTypeLabel(labelOrId?: string) {
  if (!labelOrId) return "不明";

  const TYPE_LABEL: Record<string, string> = {
    kuchisake: "口裂け女",
    hanako: "花子さん",
    sadako: "貞子",
    yukionna: "雪女",
    kijo: "鬼女",
    hitotsume: "一つ目小僧",
    rokuro: "ろくろ首",
    noppera: "のっぺらぼう",
    zashiki: "座敷童",
    nurarihyon: "ぬらりひょん",
    kappa: "河童",
    tengu: "天狗",
  };

  return TYPE_LABEL[labelOrId] ?? labelOrId;
}