"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Star, Sun, Moon, Sparkles, Heart, Briefcase, Cloud } from "lucide-react";

// 十二星座数据
const HOROSCOPE_DATA = [
  { name: "白羊座", emoji: "🏈", symbol: "♈", start: [3, 21], end: [4, 19], element: "火", ruler: "火星" },
  { name: "金牛座", emoji: "🐂", symbol: "♉", start: [4, 20], end: [5, 20], element: "土", ruler: "金星" },
  { name: "双子座", emoji: "👯", symbol: "♊", start: [5, 21], end: [6, 21], element: "风", ruler: "水星" },
  { name: "巨蟹座", emoji: "🦀", symbol: "♋", start: [6, 22], end: [7, 22], element: "水", ruler: "月亮" },
  { name: "狮子座", emoji: "🦁", symbol: "♌", start: [7, 23], end: [8, 22], element: "火", ruler: "太阳" },
  { name: "处女座", emoji: "👧", symbol: "♍", start: [8, 23], end: [9, 22], element: "土", ruler: "水星" },
  { name: "天秤座", emoji: "⚖️", symbol: "♎", start: [9, 23], end: [10, 23], element: "风", ruler: "金星" },
  { name: "天蝎座", emoji: "🦂", symbol: "♏", start: [10, 24], end: [11, 22], element: "水", ruler: "冥王星" },
  { name: "射手座", emoji: "🏹", symbol: "♐", start: [11, 23], end: [12, 21], element: "火", ruler: "木星" },
  { name: "摩羯座", emoji: "🐐", symbol: "♑", start: [12, 22], end: [1, 19], element: "土", ruler: "土星" },
  { name: "水瓶座", emoji: "🏺", symbol: "♒", start: [1, 20], end: [2, 18], element: "风", ruler: "天王星" },
  { name: "双鱼座", emoji: "🐟", symbol: "♓", start: [2, 19], end: [3, 20], element: "水", ruler: "海王星" },
];

// 星座配对数据
const COMPATIBILITY_MAP: Record<string, { best: string[]; good: string[]; bad: string[] }> = {
  "白羊座": { best: ["狮子座", "射手座"], good: ["双子座", "水瓶座"], bad: ["摩羯座", "巨蟹座"] },
  "金牛座": { best: ["处女座", "摩羯座"], good: ["巨蟹座", "双鱼座"], bad: ["水瓶座", "狮子座"] },
  "双子座": { best: ["天秤座", "水瓶座"], good: ["白羊座", "狮子座"], bad: ["处女座", "双鱼座"] },
  "巨蟹座": { best: ["天蝎座", "双鱼座"], good: ["金牛座", "处女座"], bad: ["白羊座", "天秤座"] },
  "狮子座": { best: ["白羊座", "射手座"], good: ["双子座", "天秤座"], bad: ["金牛座", "天蝎座"] },
  "处女座": { best: ["金牛座", "摩羯座"], good: ["巨蟹座", "天蝎座"], bad: ["双子座", "射手座"] },
  "天秤座": { best: ["双子座", "水瓶座"], good: ["狮子座", "射手座"], bad: ["摩羯座", "巨蟹座"] },
  "天蝎座": { best: ["巨蟹座", "双鱼座"], good: ["处女座", "摩羯座"], bad: ["狮子座", "水瓶座"] },
  "射手座": { best: ["白羊座", "狮子座"], good: ["天秤座", "水瓶座"], bad: ["处女座", "双鱼座"] },
  "摩羯座": { best: ["金牛座", "处女座"], good: ["天蝎座", "双鱼座"], bad: ["白羊座", "天秤座"] },
  "水瓶座": { best: ["双子座", "天秤座"], good: ["白羊座", "射手座"], bad: ["金牛座", "天蝎座"] },
  "双鱼座": { best: ["巨蟹座", "天蝎座"], good: ["金牛座", "摩羯座"], bad: ["双子座", "射手座"] },
};

// 运势模板（随机生成，每次刷新不同）
function getRandomFortune(type: string): string {
  const fortunes: Record<string, string[]> = {
    love: [
      "爱情运势上扬，单身者有机会遇到心仪对象",
      "感情中出现小波折，需要多一些沟通理解",
      "情侣关系稳定，彼此默契度提升",
      "今天适合表达心意，勇敢说出你的想法",
    ],
    career: [
      "工作状态极佳，效率颇高，适合处理重要任务",
      "职场中有贵人相助，难题迎刃而解",
      "今日宜静不宜动，避免冲动决策",
      "创意灵感涌现，适合头脑风暴",
    ],
    wealth: [
      "财运平稳，投资需谨慎，不宜冒进",
      "有意外之财，但需理性对待",
      "今日适合做财务规划，审视支出",
      "偏财运不错，可小试手气",
    ],
    health: [
      "精力充沛，适合运动锻炼",
      "注意休息，避免过度劳累",
      "饮食宜清淡，肠胃需要呵护",
      "睡眠质量不错，精神状态佳",
    ],
    luck: [
      "幸运色：蓝色，幸运数字：7",
      "幸运色：红色，幸运数字：3",
      "幸运色：绿色，幸运数字：9",
      "幸运色：黄色，幸运数字：5",
    ],
  };
  const arr = fortunes[type] || fortunes.love;
  return arr[Math.floor(Math.random() * arr.length)];
}

// 根据生日判断星座
function getHoroscopeByDate(month: number, day: number): typeof HOROSCOPE_DATA[number] | null {
  for (const h of HOROSCOPE_DATA) {
    const [sm, sd] = h.start;
    const [em, ed] = h.end;
    if (
      (month === sm && day >= sd) ||
      (month === em && day <= ed) ||
      (sm > em && (month === sm && day >= sd) || (month === em && day <= ed))
    ) {
      // 特殊处理：摩羯座跨年
      if (h.name === "摩羯座") {
        if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return h;
        continue;
      }
      if (month === sm || month === em) return h;
    }
  }
  return null;
}

export function HoroscopeTool() {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [birthInput, setBirthInput] = useState({ month: "", day: "" });
  const [activeTab, setActiveTab] = useState("today");
  const [fortuneSeed, setFortuneSeed] = useState(0);

  const detectedSign = useMemo(() => {
    const m = parseInt(birthInput.month);
    const d = parseInt(birthInput.day);
    if (isNaN(m) || isNaN(d)) return null;
    return getHoroscopeByDate(m, d);
  }, [birthInput]);

  const displaySign = selectedSign
    ? HOROSCOPE_DATA.find(h => h.name === selectedSign)
    : detectedSign;

  const compatibility = useMemo(() => {
    if (!displaySign) return null;
    return COMPATIBILITY_MAP[displaySign.name] || null;
  }, [displaySign]);

  // 刷新运势
  const refreshFortune = () => setFortuneSeed(s => s + 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：星座选择 */}
        <div className="lg:col-span-1 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">选择星座</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-1.5">
                {HOROSCOPE_DATA.map(h => (
                  <button
                    key={h.name}
                    className={`p-2 rounded-lg text-center text-xs border transition-colors
                      ${selectedSign === h.name ? "bg-primary/10 border-primary font-medium" : "hover:bg-muted/50 bg-background"}
                    `}
                    onClick={() => setSelectedSign(h.name)}
                  >
                    <span className="text-base">{h.emoji}</span>
                    <br />
                    {h.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 生日查询 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">生日查星座</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">月份</Label>
                  <input
                    type="number"
                    className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg bg-background"
                    placeholder="1-12"
                    min={1}
                    max={12}
                    value={birthInput.month}
                    onChange={e => setBirthInput({ ...birthInput, month: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">日期</Label>
                  <input
                    type="number"
                    className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg bg-background"
                    placeholder="1-31"
                    min={1}
                    max={31}
                    value={birthInput.day}
                    onChange={e => setBirthInput({ ...birthInput, day: e.target.value })}
                  />
                </div>
              </div>
              {detectedSign && (
                <div className="p-2 rounded-lg bg-primary/10 text-center">
                  <p className="text-sm">
                    {detectedSign.emoji} 你的星座是：<span className="font-bold">{detectedSign.name}</span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedSign(detectedSign.name)}
                  >
                    查看运势 →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：运势详情 */}
        <div className="lg:col-span-2 space-y-3">
          {!displaySign ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p>请选择一个星座，或输入生日查询</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 星座信息卡 */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-4xl">{displaySign.emoji}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{displaySign.name} {displaySign.symbol}</h3>
                      <p className="text-xs text-muted-foreground">
                        {displaySign.start.join("/")} - {displaySign.end.join("/")}
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px]">{displaySign.element}象</Badge>
                        <Badge variant="outline" className="text-[10px]">守护星：{displaySign.ruler}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={refreshFortune}>
                      🔄 换一换
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 今日运势 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "love", icon: Heart, label: "爱情", color: "text-pink-500" },
                  { key: "career", icon: Briefcase, label: "事业", color: "text-blue-500" },
                  { key: "wealth", icon: Sparkles, label: "财运", color: "text-amber-500" },
                  { key: "health", icon: Cloud, label: "健康", color: "text-green-500" },
                ].map(({ key, icon: Icon, label, color }) => (
                  <Card key={key}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="text-sm font-medium">{label}运势</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {getRandomFortune(key)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 幸运信息 */}
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-2">今日幸运</p>
                  <div className="flex justify-center gap-6">
                    <div>
                      <p className="text-lg font-bold text-primary">{["蓝","红","绿","黄","紫","橙"][fortuneSeed % 6]}</p>
                      <p className="text-[10px] text-muted-foreground">幸运色</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary">{Math.floor(Math.random() * 9) + 1}</p>
                      <p className="text-[10px] text-muted-foreground">幸运数字</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-primary">
                        {["东北","东南","西北","西南","正北","正南"][fortuneSeed % 6]}
                      </p>
                      <p className="text-[10px] text-muted-foreground">幸运方位</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 配对分析 */}
              {compatibility && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{displaySign.name} 配对分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <p className="text-xs text-muted-foreground mb-1">⭐ 最佳配对</p>
                        {compatibility.best.map(b => (
                          <p key={b} className="font-medium text-green-600">{b}</p>
                        ))}
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <p className="text-xs text-muted-foreground mb-1">✅ 不错配对</p>
                        {compatibility.good.map(g => (
                          <p key={g} className="font-medium text-blue-600">{g}</p>
                        ))}
                      </div>
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <p className="text-xs text-muted-foreground mb-1">⚠️ 需磨合</p>
                        {compatibility.bad.map(b => (
                          <p key={b} className="font-medium text-red-600">{b}</p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        * 星座运势内容为娱乐参考，请理性对待，生活还要靠自己努力哦 😊
      </p>
    </div>
  );
}
