"use client";

import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Sparkles, Trophy, ArrowRight } from "lucide-react";

// ═══════════════════════════════════════════
// 十二星座数据
// ═══════════════════════════════════════════

const ZODIAC_LIST = [
  { name: "白羊座", symbol: "♈", emoji: "🔥", date: "3.21-4.19",  element: "火", ruler: "火星" },
  { name: "金牛座", symbol: "♉", emoji: "🌍", date: "4.20-5.20",  element: "土", ruler: "金星" },
  { name: "双子座", symbol: "♊", emoji: "💨", date: "5.21-6.21",  element: "风", ruler: "水星" },
  { name: "巨蟹座", symbol: "♋", emoji: "🌙", date: "6.22-7.22",  element: "水", ruler: "月亮" },
  { name: "狮子座", symbol: "♌", emoji: "☀️", date: "7.23-8.22",  element: "火", ruler: "太阳" },
  { name: "处女座", symbol: "♍", emoji: "🌾", date: "8.23-9.22",  element: "土", ruler: "水星" },
  { name: "天秤座", symbol: "♎", emoji: "⚖️", date: "9.23-10.23", element: "风", ruler: "金星" },
  { name: "天蝎座", symbol: "♏", emoji: "🦂", date: "10.24-11.22", element: "水", ruler: "冥王星" },
  { name: "射手座", symbol: "♐", emoji: "🏹", date: "11.23-12.21", element: "火", ruler: "木星" },
  { name: "摩羯座", symbol: "♑", emoji: "🏔️", date: "12.22-1.19",  element: "土", ruler: "土星" },
  { name: "水瓶座", symbol: "♒", emoji: "🌊", date: "1.20-2.18",  element: "风", ruler: "天王星" },
  { name: "双鱼座", symbol: "♓", emoji: "🐟", date: "2.19-3.20",  element: "水", ruler: "海王星" },
];

// 配对评分矩阵（12×12）
const COMPAT_MATRIX: number[][] = [
//  羊  牛  双  蟹  狮  处女 秤  蝎  射手 羯  瓶  鱼
  [90, 65, 85, 70, 95, 60, 80, 55, 90, 60, 85, 75], // 白羊
  [65, 90, 80, 85, 60, 95, 90, 70, 65, 90, 70, 85], // 金牛
  [85, 80, 90, 70, 85, 80, 95, 65, 80, 70, 95, 75], // 双子
  [70, 85, 70, 90, 75, 90, 85, 95, 60, 80, 75, 95], // 巨蟹
  [95, 60, 85, 75, 90, 65, 80, 90, 95, 55, 85, 70], // 狮子
  [60, 95, 80, 90, 65, 90, 80, 85, 70, 95, 75, 80], // 处女
  [80, 90, 95, 85, 80, 80, 90, 70, 85, 75, 90, 75], // 天秤
  [55, 70, 65, 95, 90, 85, 70, 90, 75, 85, 85, 90], // 天蝎
  [90, 65, 80, 60, 95, 70, 85, 75, 90, 60, 85, 70], // 射手
  [60, 90, 70, 80, 55, 95, 75, 85, 60, 90, 80, 85], // 摩羯
  [85, 70, 95, 75, 85, 75, 90, 85, 85, 80, 90, 80], // 水瓶
  [75, 85, 75, 95, 70, 80, 75, 90, 70, 85, 80, 90], // 双鱼
];

const COMPAT_LABELS = [
  { score: [90, 101], label: "天作之合",  color: "text-pink-500",  emoji: "💖", desc: "你们是彼此的灵魂伴侣，默契十足，相互成就。" },
  { score: [80, 89],  label: "非常般配",  color: "text-red-500",   emoji: "❤️", desc: "你们有很高的契合度，互相理解和支持，关系稳定。" },
  { score: [70, 79],  label: "互相吸引",  color: "text-orange-500", emoji: "💛", desc: "你们之间存在明显的吸引力，需要多一些磨合和包容。" },
  { score: [60, 69],  label: "需要努力",  color: "text-yellow-500", emoji: "💛", desc: "你们性格有差异，需要更多沟通和理解才能走得更远。" },
  { score: [0, 59],   label: "挑战较大",  color: "text-gray-500",  emoji: "🤝", desc: "你们在观念和习惯上有较大差异，但若真心相爱，差异也能成为互补。" },
];

function getCompatInfo(score: number) {
  return COMPAT_LABELS.find(l => score >= l.score[0] && score <= l.score[1])!;
}

// 配对详情
function getPairDetail(aIdx: number, bIdx: number, score: number): string {
  const a = ZODIAC_LIST[aIdx];
  const b = ZODIAC_LIST[bIdx];
  const tips: string[] = [];
  
  // 元素关系
  if (a.element === b.element) {
    tips.push(`同属${a.element}元素，价值观和生活方式高度相似，`);
  } else if (
    (a.element === "火" && ["风"].includes(b.element)) ||
    (a.element === "风" && ["火"].includes(b.element)) ||
    (a.element === "土" && ["水"].includes(b.element)) ||
    (a.element === "水" && ["土"].includes(b.element))
  ) {
    tips.push(`${a.element}与${b.element}相生，彼此促进成长，`);
  } else {
    tips.push(`${a.element}与${b.element}元素不同，需要更多理解和包容，`);
  }

  // 分数建议
  if (score >= 90) {
    tips.push("保持真诚沟通，珍惜这段缘分，共同规划未来。");
  } else if (score >= 70) {
    tips.push("多站在对方角度思考，用耐心和爱心化解分歧。");
  } else {
    tips.push("正视差异，把不同视为学习的机会，磨合是感情的必修课。");
  }

  return tips.join("");
}

// ═══════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════

export function ZodiacPairingTool() {
  const [mode, setMode] = useState<"select" | "result" | "matrix">("select");
  const [aIdx, setAIdx] = useState(-1);
  const [bIdx, setBIdx] = useState(-1);

  const score = aIdx >= 0 && bIdx >= 0 ? COMPAT_MATRIX[aIdx][bIdx] : 0;
  const info = score ? getCompatInfo(score) : null;

  const handleSelect = (idx: number) => {
    if (aIdx === -1 || (aIdx !== -1 && bIdx !== -1)) {
      setAIdx(idx);
      setBIdx(-1);
    } else {
      setBIdx(idx);
      setMode("result");
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle
        icon={<Heart className="w-6 h-6" />}
        title="星座配对"
        subtitle="12×12 配对矩阵 · 天作之合或挑战较大，一看便知"
      />

      {/* 模式切换 */}
      <div className="flex gap-2">
        {[
          { key: "select" as const, label: "两两配对" },
          { key: "matrix" as const, label: "完整矩阵" },
        ].map(m => (
          <Button
            key={m.key}
            variant={mode === m.key ? "default" : "outline"}
            size="sm"
            onClick={() => setMode(m.key)}
          >{m.label}</Button>
        ))}
      </div>

      {/* 两两配对模式 */}
      {mode === "select" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">
              {aIdx >= 0 ? ZODIAC_LIST[aIdx].emoji + ZODIAC_LIST[aIdx].name : "选择第一个星座"}
            </Badge>
            {aIdx >= 0 && bIdx === -1 && <span className="text-sm text-muted-foreground">→ 再选择第二个星座</span>}
            {aIdx >= 0 && bIdx >= 0 && (
              <Badge variant="outline">
                {ZODIAC_LIST[bIdx].emoji + ZODIAC_LIST[bIdx].name}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {ZODIAC_LIST.map((z, i) => (
              <Card
                key={i}
                className={`cursor-pointer transition-all text-center py-2
                  ${aIdx === i ? "border-primary ring-2 ring-primary/30 scale-105" : ""}
                  ${bIdx === i ? "border-pink-500 ring-2 ring-pink-500/30 scale-105" : ""}
                  hover:border-primary/50`}
                onClick={() => handleSelect(i)}
              >
                <CardContent className="p-3">
                  <span className="text-3xl">{z.emoji}</span>
                  <p className="font-semibold text-sm mt-1">{z.name}</p>
                  <p className="text-[10px] text-muted-foreground">{z.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 配对结果 */}
      {mode === "result" && aIdx >= 0 && bIdx >= 0 && info && (
        <div className="space-y-4">
          <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <span className="text-5xl">{ZODIAC_LIST[aIdx].emoji}</span>
                <ArrowRight className={`w-8 h-8 ${info.color}`} />
                <span className="text-5xl">{ZODIAC_LIST[bIdx].emoji}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {ZODIAC_LIST[aIdx].name} × {ZODIAC_LIST[bIdx].name}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-4xl font-bold text-primary">{score}</span>
                  <span className="text-lg text-muted-foreground">分</span>
                </div>
                <Badge className={`mt-2 ${info.color.replace("text-", "bg-")} border-0`}>
                  {info.emoji} {info.label}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{info.desc}</p>
            </CardContent>
          </Card>

          {/* 详细分析 */}
          <Card>
            <CardHeader><CardTitle>详细分析</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-muted-foreground">配对解读</h4>
                <p className="mt-1 leading-relaxed">{getPairDetail(aIdx, bIdx, score)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <h4 className="font-medium text-sm">{ZODIAC_LIST[aIdx].name} 特质</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    元素：{ZODIAC_LIST[aIdx].element} · 守护星：{ZODIAC_LIST[aIdx].ruler}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <h4 className="font-medium text-sm">{ZODIAC_LIST[bIdx].name} 特质</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    元素：{ZODIAC_LIST[bIdx].element} · 守护星：{ZODIAC_LIST[bIdx].ruler}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => { setMode("select"); setAIdx(-1); setBIdx(-1); }} className="w-full">
            重新配对
          </Button>
        </div>
      )}

      {/* 完整矩阵模式 */}
      {mode === "matrix" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              12×12 配对矩阵总览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-1"></th>
                    {ZODIAC_LIST.map(z => (
                      <th key={z.name} className="p-1 text-center">{z.emoji}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ZODIAC_LIST.map((za, i) => (
                    <tr key={za.name}>
                      <td className="p-1 font-medium">{za.emoji} {za.name.slice(0, 2)}</td>
                      {ZODIAC_LIST.map((_, j) => {
                        const s = COMPAT_MATRIX[i][j];
                        const c = s >= 90 ? "bg-pink-500/20 text-pink-600"
                                : s >= 80 ? "bg-red-500/20 text-red-600"
                                : s >= 70 ? "bg-orange-500/20 text-orange-600"
                                : s >= 60 ? "bg-yellow-500/20 text-yellow-600"
                                : "bg-gray-500/20 text-gray-600";
                        return (
                          <td
                            key={j}
                            className={`p-1 text-center rounded cursor-pointer hover:scale-110 transition-transform ${c}`}
                            onClick={() => { setAIdx(i); setBIdx(j); setMode("result"); }}
                          >{s}</td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              点击任意格子查看详细配对分析 · 颜色越深配对度越高
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-center text-muted-foreground">
        ✨ 星座配对仅供娱乐参考，真正的缘分由你们共同创造。
      </p>
    </div>
  );
}
