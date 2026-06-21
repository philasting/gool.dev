"use client";

import { useState, useCallback } from "react";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Sparkles, BookOpen, Heart, Star, Moon, Sun, Cloud, Eye } from "lucide-react";

// ═══════════════════════════════════════════
// 塔罗牌数据库（78张完整版）
// ═══════════════════════════════════════════

const MAJOR_ARCANA = [
  { id: 0,  name: "愚者",   nameEn: "The Fool",      emoji: "🃏", element: "风", meaning: "新的开始、天真、自由",
    upright: "新的冒险即将开始，保持开放心态，相信直觉，勇敢迈出第一步。",
    reversed: "鲁莽行事、缺乏计划、不计后果。需要更谨慎地评估风险。" },
  { id: 1,  name: "魔术师", nameEn: "The Magician",  emoji: "🎩", element: "风", meaning: "创造力、意志力、技能",
    upright: "你拥有实现目标所需的一切资源和能力，现在是行动的最佳时机。",
    reversed: "才能被浪费、欺骗、操控他人。需要诚实地运用自己的能力。" },
  { id: 2,  name: "女祭司", nameEn: "The High Priestess", emoji: "🌙", element: "水", meaning: "直觉、潜意识、内在智慧",
    upright: "倾听内心的声音，相信直觉。答案就在你内心深处，需要静心聆听。",
    reversed: "忽视直觉、表面认知、信息隐藏。需要深入探索被忽略的内在真相。" },
  { id: 3,  name: "女皇",   nameEn: "The Empress",   emoji: "👸", element: "土", meaning: "丰收、母性、感官愉悦",
    upright: "创造力的高峰，项目或关系将结出硕果。享受生活中的美好事物。",
    reversed: "创意枯竭、过度依赖、空虚。需要重新连接创造力的源头。" },
  { id: 4,  name: "皇帝",   nameEn: "The Emperor",   emoji: "👑", element: "火", meaning: "权威、结构、控制",
    upright: "建立秩序和结构，以稳健的领导力推进目标。理性决策胜过情感。",
    reversed: "专制、控制欲过强、僵化。需要平衡权威与弹性。" },
  { id: 5,  name: "教皇",   nameEn: "The Hierophant", emoji: "⛪", element: "土", meaning: "传统、信仰、指引",
    upright: "寻求传统智慧和精神指引，遵循经过时间考验的价值观念。",
    reversed: "挑战传统、非正统、打破规则。需要找到适合自己的精神道路。" },
  { id: 6,  name: "恋人",   nameEn: "The Lovers",    emoji: "💑", element: "风", meaning: "爱情、选择、和谐",
    upright: "重要的选择即将到来，倾听内心的声音。爱情和伙伴关系将带来成长。",
    reversed: "关系失衡、价值冲突、不诚实。需要重新审视自己的真实需求。" },
  { id: 7,  name: "战车",   nameEn: "The Chariot",   emoji: "🏆", element: "水", meaning: "意志力、胜利、决心",
    upright: "以坚定的意志克服障碍，胜利在望。控制情绪，专注目标向前冲。",
    reversed: "失控、方向迷失、侵略性。需要重新掌握生活的方向盘。" },
  { id: 8,  name: "力量",   nameEn: "Strength",      emoji: "🦁", element: "火", meaning: "勇气、耐心、内在力量",
    upright: "以温柔而坚定的力量面对挑战。真正的力量来自于内心的平静与自信。",
    reversed: "自我怀疑、软弱、不安全感。需要重新连接内在的勇气泉源。" },
  { id: 9,  name: "隐士",   nameEn: "The Hermit",    emoji: "🏔️", element: "土", meaning: "内省、寻求真理、独处",
    upright: "暂时退隐，向内寻找答案。独处不是孤独，而是与更高自我对话的时间。",
    reversed: "孤立、逃避社交、偏执。需要平衡独处与适当的社会连接。" },
  { id: 10, name: "命运之轮", nameEn: "Wheel of Fortune", emoji: "☸️", element: "火", meaning: "命运转变、机遇、周期",
    upright: "局势即将转变，好运降临。接受生命的自然循环，把握转机的时刻。",
    reversed: "坏运气、抵抗变化、失控。需要以平常心面对生命的起伏。" },
  { id: 11, name: "正义",   nameEn: "Justice",      emoji: "⚖️", element: "风", meaning: "公正、真相、因果",
    upright: "公正的力量在运作，你的行为将带来相应的结果。保持诚实和平衡。",
    reversed: "不公正、逃避责任、偏见。需要勇敢面对真相，承担应有的责任。" },
  { id: 12, name: "倒吊人", nameEn: "The Hanged Man", emoji: "🙃", element: "水", meaning: "牺牲、新视角、等待",
    upright: "暂停行动，从新的角度看待问题。有时候'不作为'是最好的行动。",
    reversed: "拖延、自私、无谓的牺牲。需要停止等待，采取实际行动。" },
  { id: 13, name: "死神",   nameEn: "Death",         emoji: "💀", element: "水", meaning: "结束、转变、重生",
    upright: "旧有的模式即将结束，为新生腾出空间。接受转变，这是成长的必经之路。",
    reversed: "抗拒变化、执念、无法放下。需要勇敢地告别过去，迎接新生。" },
  { id: 14, name: "节制",   nameEn: "Temperance",   emoji: "🌈", element: "火", meaning: "平衡、耐心、适度",
    upright: "在生活的各个领域寻找平衡。耐心和适度将带来长久的和谐。",
    reversed: "极端、过度、失衡。需要重新调整生活的重心和节奏。" },
  { id: 15, name: "恶魔",   nameEn: "The Devil",     emoji: "😈", element: "土", meaning: "束缚、诱惑、物质主义",
    upright: "检视生活中令你上瘾或感到束缚的事物。认识到枷锁是可以打开的。",
    reversed: "解放、打破束缚、面对恐惧。你已经准备好释放那些不再服务你的事物。" },
  { id: 16, name: "塔",     nameEn: "The Tower",     emoji: "⚡", element: "火", meaning: "突变、觉醒、解放",
    upright: "突如其来的变化将打破旧有的结构。虽然痛苦，但这是重建更稳固基础的机会。",
    reversed: "避免灾难、恐惧变化、延迟的崩塌。需要主动释放，而不是等待被迫改变。" },
  { id: 17, name: "星星",   nameEn: "The Star",      emoji: "⭐", element: "风", meaning: "希望、灵感、宁静",
    upright: "希望之光指引着前方的道路。保持信心，宇宙的祝福正在降临。",
    reversed: "失望、缺乏信心、悲观。需要重新连接内在的希望之光。" },
  { id: 18, name: "月亮",   nameEn: "The Moon",      emoji: "🌕", element: "水", meaning: "幻觉、恐惧、潜意识",
    upright: "事物并非表面所见，信任直觉来穿越迷雾。这是面对深层恐惧的时刻。",
    reversed: "恐惧消散、真相大白、释放困惑。迷雾正在散去，清晰度即将到来。" },
  { id: 19, name: "太阳",   nameEn: "The Sun",       emoji: "☀️", element: "火", meaning: "快乐、成功、活力",
    upright: "光明和喜悦照耀着你的人生。这是成功、快乐和充满活力的最佳时期。",
    reversed: "暂时的阴影、过度乐观、延迟的成功。需要保持信心，阳光终将穿透云层。" },
  { id: 20, name: "审判",   nameEn: "Judgement",    emoji: "📯", element: "火", meaning: "觉醒、重生、使命召唤",
    upright: "一种更高的召唤正在响起，回顾过去，从中学习，准备迎接人生新的篇章。",
    reversed: "自我怀疑、逃避使命、不原谅自己。需要倾听内心的召唤，相信自己值得重生。" },
  { id: 21, name: "世界",   nameEn: "The World",     emoji: "🌍", element: "土", meaning: "完成、整合、成就",
    upright: "一个完整周期的圆满结束。你已经整合了所有的经验，准备好进入更高层次的旅程。",
    reversed: "未完成、延迟成功、缺乏闭环。需要完成未竟之事，才能真正地向前迈进。" },
];

const SUIT_INFO = {
  cups:    { name: "圣杯", nameEn: "Cups",    element: "水", emoji: "🏆", color: "text-blue-500",  meaning: "情感、直觉、关系" },
  pentacles: { name: "星币", nameEn: "Pentacles", element: "土", emoji: "🪙", color: "text-emerald-500", meaning: "物质、财富、身体" },
  swords:   { name: "宝剑", nameEn: "Swords",   element: "风", emoji: "⚔️", color: "text-yellow-500", meaning: "思维、沟通、挑战" },
  wands:    { name: "权杖", nameEn: "Wands",    element: "火", emoji: "🪄", color: "text-red-500",   meaning: "行动、创意、激情" },
};

const MINOR_UPRIGHT = {
  cups: {
    1:  "新的情感开始，直觉涌现，爱在心中流淌。",
    2:  "伙伴关系的加深，相互理解和支持。",
    3:  "友谊和社群的庆祝，值得感恩的相聚。",
    4:  "在宁静中沉思，需要暂时退隐恢复能量。",
    5:  "失落和悲伤的情绪，允许自己感受并疗愈。",
    6:  "童年回忆或纯真的礼物，简单而珍贵。",
    7:  "幻想和想象力的驰骋，创意的源泉。",
    8:  "离开舒适区追寻更高理想，勇敢迈出一步。",
    9:  "情感上的满足和富足，愿望正在实现。",
    10: "家庭和谐与幸福，情感的圆满归宿。",
    page:  "情感上的新消息或邀请，以开放的心迎接。",
    knight:"跟随内心的热情行动，浪漫和冒险的旅程。",
    queen: "以同理心和温柔引导情感，深度的直觉智慧。",
    king: "情感成熟与包容，以稳重的方式表达爱。",
  },
  pentacles: {
    1:  "物质上的新机会，财务或健康的新起点。",
    2:  "在多个责任间寻找平衡，灵活应对变化。",
    3:  "团队合作带来成果，协同创造的价值。",
    4:  "守护已有资源，但需警惕过度吝啬。",
    5:  "财务上的困难时期，但这是暂时的。",
    6:  "慷慨地给予和接受，财富的流通带来更多。",
    7:  "耐心等待投资的回报，成果需要时间成熟。",
    8:  "通过持续努力精进技能，工匠精神的价值。",
    9:  "物质上的丰裕和享受，努力换来的成果。",
    10: "传承和家族财富，物质安全的长久保障。",
    page:  "学习实用技能或获得财务机会的新消息。",
    knight:"稳步前进实现物质目标，可靠的执行者。",
    queen: "以实际和滋养的方式管理资源，丰盛的给予者。",
    king: "财务上的成熟和成功，稳健的物质基础。",
  },
  swords: {
    1:  "清晰的思维穿透迷雾，真理之剑带来洞察。",
    2:  "两难的选择，需要理性分析而非逃避。",
    3:  "心碎和痛苦，但这是愈合过程的开始。",
    4:  "从混乱中寻求休息，但需要警惕过度孤立。",
    5:  "冲突或失败，承认错误并从中学习。",
    6:  "经过困难后找到出路，希望在前方。",
    7:  "以策略取胜，智胜过蛮力。",
    8:  "感到受困但束缚多是心智层面的，可以突破。",
    9:  "严重的焦虑或噩梦，需要面对内心的恐惧。",
    10: "痛苦的终结，最黑暗的时刻已过。",
    page:  "新的想法或需要理性分析的消息到来。",
    knight:"快速思维和直接沟通，但可能过于尖锐。",
    queen: "以清晰和客观的视角看待问题，独立的思考者。",
    king: "权威性的思维和决策，理性领导的力量。",
  },
  wands: {
    1:  "灵感的火花点燃，新项目的激情开始。",
    2:  "制定计划并准备行动，两个机会需要选择。",
    3:  "拓展视野，旅行或学习带来成长。",
    4:  "庆祝成就，但警惕安于现状失去动力。",
    5:  "竞争和挑战，以积极态度面对良性竞争。",
    6:  "公开认可和成功，你的努力被看见和赞赏。",
    7:  "面对挑战不退缩，坚持立场保卫自己的创意。",
    8:  "快速进展和积极行动，动力十足地推进计划。",
    9:  "为目标做坚实的准备，基础打牢即将起航。",
    10:  "责任的重担，但也意味着你被信赖和需要。",
    page:  "创意的新火花，一个令人兴奋的想法或消息。",
    knight:"迅速行动追逐梦想，充满激情和冒险精神。",
    queen: "以自信和独立的方式推进创意，富有魅力。",
    king: "远见卓识的领导力，将创意转化为现实。",
  },
};

const MINOR_REVERS = {
  cups: {
    1:  "情感阻塞，无法接受爱。", 2:  "关系失衡，沟通不畅。", 3:  "过度社交，缺乏深度。",
    4:  "孤立，不愿走出舒适区。", 5:  "走出悲伤，开始愈合。", 6:  "过度怀旧，不愿成长。",
    7:  "幻想破灭，需要落地。", 8:  "害怕未知，不敢改变。", 9:  "物质替代情感，内心空虚。",
    10: "家庭冲突，情感断裂。",
    page:"情感不成熟，消息延迟。", knight:"情感不稳定，行动鲁莽。",
    queen:"情感操控，过度依赖。", king:"情感封闭，无法表达爱。" },
  pentacles: {
    1:  "财务机会流失，拖延。", 2:  "财务失衡， juggling 过度。", 3:  "团队合作失败，成果延迟。",
    4:  "过度吝啬或浪费极端。", 5:  "财务好转，走出困境。", 6:  "债务，给予带有条件。",
    7:  "急于求成，耐心不足。", 8:  "缺乏激情，机械工作。", 9:  "过度消费，财务不稳。",
    10: "财务损失，传承断裂。",
    page:"学习分心，机会未把握。", knight:"进度缓慢，缺乏动力。",
    queen:"过度控制，忽视他人。", king:"财务鲁莽，投资风险。" },
  swords: {
    1:  "思维混乱，真相被遮蔽。", 2:  "逃避决定，陷入僵局。", 3:  "从痛苦中学习，愈合开始。",
    4:  "恢复社交，不再孤立。", 5:  "从失败中站起，接受教训。", 6:  "困于过去，不愿前进。",
    7:  "策略失败，需要新思路。", 8:  "自我解放，突破限制。", 9:  "恐惧消散，焦虑减轻。",
    10: "痛苦结束，新的开始。",
    page:"思维不成熟，消息有误。", knight:"鲁莽言论，缺乏考虑。",
    queen:"冷酷无情，过度批判。", king:"滥用权力，决策武断。" },
  wands: {
    1:  "灵感枯竭，延迟开始。", 2:  "计划冲突，难以抉择。", 3:  "旅程延迟，视野受限。",
    4:  "不安于现状，寻找新挑战。", 5:  "避免冲突，丧失机会。", 6:  "成功带来嫉妒，认可过度。",
    7:  "放弃立场，被他人超越。", 8:  "进展停滞，失去动力。", 9:  "准备不足，焦虑等待。",
    10: "过度承担，压力山大。",
    page:"延迟行动，想法未落实。", knight:"方向分散，缺乏聚焦。",
    queen:"自信不足，创意受阻。", king:"愿景模糊，领导乏力。" },
};

type Suit = keyof typeof SUIT_INFO;
type Rank = 1|2|3|4|5|6|7|8|9|10|"page"|"knight"|"queen"|"king";

interface TarotCard {
  id: number;
  name: string;
  nameEn: string;
  emoji: string;
  suit?: Suit;
  rank?: Rank;
  element: string;
  meaning: string;
  upright: string;
  reversed: string;
}

function buildDeck(): TarotCard[] {
  const deck: TarotCard[] = [...MAJOR_ARCANA];
  let id = 22;
  for (const [suit, info] of Object.entries(SUIT_INFO)) {
    const ranks: Rank[] = [1,2,3,4,5,6,7,8,9,10,"page","knight","queen","king"];
    for (const rank of ranks) {
      deck.push({
        id,
        name: `${info.name}${rank === "page" ? "侍从" : rank === "knight" ? "骑士" : rank === "queen" ? "王后" : rank === "king" ? "国王" : rank}`,
        nameEn: `${info.nameEn} ${rank}`,
        emoji: info.emoji,
        suit: suit as Suit,
        rank,
        element: info.element,
        meaning: info.meaning,
        upright: (MINOR_UPRIGHT as any)[suit][String(rank)],
        reversed: (MINOR_REVERS as any)[suit][String(rank)],
      });
      id++;
    }
  }
  return deck;
}

const FULL_DECK = buildDeck();

// ═══════════════════════════════════════════
// 牌阵定义
// ═══════════════════════════════════════════

const SPREADS = [
  {
    id: "single",
    name: "单张牌",
    desc: "快速解答一个问题",
    positions: [{ name: "答案", desc: "当前最核心的能量" }],
  },
  {
    id: "three",
    name: "三张牌",
    desc: "过去·现在·未来",
    positions: [
      { name: "过去", desc: "影响现状的过去因素" },
      { name: "现在", desc: "当前的核心状况" },
      { name: "未来", desc: "可能发展的方向" },
    ],
  },
  {
    id: "celtic",
    name: "凯尔特十字",
    desc: "全方位深度解读（10张牌）",
    positions: [
      { name: "现状", desc: "你目前的情况" },
      { name: "挑战", desc: "面临的阻碍或挑战" },
      { name: "过去", desc: "已经过去的影响因素" },
      { name: "未来", desc: "即将展现的发展" },
      { name: "目标", desc: "你内心真正渴望的" },
      { name: "近未来", desc: "短期内会发生的事" },
      { name: "自我", desc: "你对现状的看法" },
      { name: "环境", desc: "周围环境的影响" },
      { name: "希望/恐惧", desc: "你的期望或担忧" },
      { name: "结果", desc: "最终可能的结果" },
    ],
  },
  {
    id: "relationship",
    name: "感情牌阵",
    desc: "解读感情关系的5个维度",
    positions: [
      { name: "你自己", desc: "你在关系中的状态" },
      { name: "对方", desc: "对方在关系中的状态" },
      { name: "关系现状", desc: "你们目前的关系能量" },
      { name: "挑战", desc: "关系中需要克服的障碍" },
      { name: "结果", desc: "关系可能的发展方向" },
    ],
  },
  {
    id: "career",
    name: "事业牌阵",
    desc: "职业发展的5个关键",
    positions: [
      { name: "现状", desc: "当前的工作状态" },
      { name: "优势", desc: "你的核心竞争力" },
      { name: "挑战", desc: "需要克服的障碍" },
      { name: "建议", desc: "塔罗给你的建议" },
      { name: "结果", desc: "努力后的可能结果" },
    ],
  },
];

// ═══════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════

export function TarotDivinationTool() {
  const [step, setStep] = useState<"question" | "spread" | "reading" | "result">("question");
  const [question, setQuestion] = useState("");
  const [spreadId, setSpreadId] = useState("three");
  const [drawnCards, setDrawnCards] = useState<{ card: TarotCard; reversed: boolean; position: string; desc: string }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showResult, setShowResult] = useState<number>(-1);

  const spread = SPREADS.find((s) => s.id === spreadId)!;

  const drawCards = useCallback(() => {
    setIsDrawing(true);
    setShowResult(-1);
    const used = new Set<number>();
    const result: typeof drawnCards = [];
    for (let i = 0; i < spread.positions.length; i++) {
      let idx: number;
      do { idx = Math.floor(Math.random() * FULL_DECK.length); } while (used.has(idx));
      used.add(idx);
      result.push({
        card: FULL_DECK[idx],
        reversed: Math.random() < 0.35,
        position: spread.positions[i].name,
        desc: spread.positions[i].desc,
      });
    }
    setTimeout(() => {
      setDrawnCards(result);
      setIsDrawing(false);
      setStep("result");
      setShowResult(0);
    }, 800);
  }, [spread]);

  const revealNext = () => {
    if (showResult < drawnCards.length - 1) {
      setShowResult(showResult + 1);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle
        icon={<Sparkles className="w-6 h-6" />}
        title="塔罗牌占卜"
        subtitle="78张牌完整数据库 · 5种牌阵 · 正逆位解读"
      />

      {/* 步骤1：输入问题 */}
      {step === "question" && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-purple-500" />
              心中默念你的问题
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              在心中专注你的问题，然后将它写下来。问题越具体，解读越精准。
            </p>
            <textarea
              className="w-full h-24 p-3 rounded-lg border bg-background/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="例如：我接下来三个月的事业发展如何？&#10;例如：这段关系该如何经营？&#10;例如：我应该如何做出这个重要决定？"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={() => setStep("spread")} className="flex-1">
                下一步：选择牌阵
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤2：选择牌阵 */}
      {step === "spread" && (
        <div className="space-y-4">
          <h3 className="font-semibold">选择牌阵</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SPREADS.map((s) => (
              <Card
                key={s.id}
                className={`cursor-pointer transition-all ${spreadId === s.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"}`}
                onClick={() => setSpreadId(s.id)}
              >
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm">{s.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.positions.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{p.name}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("question")}>返回</Button>
            <Button onClick={drawCards} className="flex-1" disabled={isDrawing}>
              {isDrawing ? "洗牌中..." : `开始抽牌（${spread.positions.length}张）`}
            </Button>
          </div>
        </div>
      )}

      {/* 步骤3：抽牌动画 */}
      {step === "reading" && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
            <p>洗牌中，感受牌的能量...</p>
          </CardContent>
        </Card>
      )}

      {/* 步骤4：结果 */}
      {step === "result" && (
        <div className="space-y-6">
          {question && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">你的问题是：</p>
                <p className="font-medium">{question}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drawnCards.map((d, i) => (
              <Card
                key={i}
                className={`transition-all duration-500 cursor-pointer ${i <= showResult ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                onClick={() => { if (i === showResult) revealNext(); }}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{d.position}</Badge>
                    {d.reversed && <Badge variant="destructive" className="text-[10px]">逆位</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <span className="text-4xl">{d.card.emoji}</span>
                    {d.reversed && <span className="text-2xl ml-1">🔻</span>}
                    <h4 className="font-bold mt-1">{d.card.name}</h4>
                    <p className="text-xs text-muted-foreground">{d.card.nameEn}</p>
                  </div>
                  <div className="text-sm leading-relaxed text-muted-foreground">
                    {d.reversed ? d.card.reversed : d.card.upright}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{d.card.element}</Badge>
                    {d.card.suit && (
                      <Badge variant="outline" className={`text-[10px] ${(SUIT_INFO as any)[d.card.suit!]?.color}`}>
                        {(SUIT_INFO as any)[d.card.suit!]?.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {showResult < drawnCards.length - 1 && (
            <Button onClick={revealNext} className="w-full">
              翻开下一张牌
            </Button>
          )}

          {showResult >= drawnCards.length - 1 && (
            <div className="space-y-3">
              <Card className="bg-gradient-to-r from-purple-500/10 to-amber-500/10 border-purple-500/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    综合解读
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    本次占卜中，
                    {drawnCards.filter(d => !d.reversed).length > drawnCards.length / 2
                      ? "正位牌居多，整体能量积极向上，建议大胆行动。"
                      : drawnCards.filter(d => d.reversed).length > drawnCards.length / 2
                      ? "逆位牌居多，提示需要关注内在阻碍，建议先处理未完成的事务。"
                      : "正逆位均衡，事物处于动态平衡中，需要智慧和耐心并重。"}
                    {" "}请记住，塔罗牌提供的是可能性而非定数，真正的力量始终在你手中。✨
                  </p>
                </CardContent>
              </Card>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setStep("question"); setDrawnCards([]); setShowResult(-1); }}>
                  重新占卜
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 牌意速查 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            78张牌意速查
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="major">
            <TabsList className="mb-3">
              <TabsTrigger value="major">大阿卡纳 (22)</TabsTrigger>
              <TabsTrigger value="cups">圣杯</TabsTrigger>
              <TabsTrigger value="pentacles">星币</TabsTrigger>
              <TabsTrigger value="swords">宝剑</TabsTrigger>
              <TabsTrigger value="wands">权杖</TabsTrigger>
            </TabsList>
            <TabsContent value="major">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {MAJOR_ARCANA.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                    <span className="text-lg">{c.emoji}</span>
                    <div>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground ml-1 text-xs">{c.nameEn}</span>
                      <p className="text-xs text-muted-foreground">{c.meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            {Object.entries(SUIT_INFO).map(([suit, info]) => (
              <TabsContent key={suit} value={suit}>
                <p className="text-xs text-muted-foreground mb-2">{info.name} · {info.element} · {info.meaning}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                  {[1,2,3,4,5,6,7,8,9,10,"page","knight","queen","king"].map((r) => {
                    const card = FULL_DECK.find(c => c.suit === suit && c.rank === r)!;
                    return (
                      <div key={String(r)} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                        <span className="text-lg">{info.emoji}</span>
                        <div>
                          <span className="font-medium">{card.name}</span>
                          <p className="text-xs text-muted-foreground line-clamp-2">{card.upright}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        🌟 塔罗牌是一种自我探索的工具，解读仅供参考，真正掌握命运的始终是你自己。
      </p>
    </div>
  );
}
