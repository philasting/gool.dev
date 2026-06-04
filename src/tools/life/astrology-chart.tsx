"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Sun, Moon, Sunrise } from "lucide-react";

interface ZodiacInfo {
  name: string;
  nameEn: string;
  symbol: string;
  element: string;
  elementSymbol: string;
  ruler: string;
  dateRange: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  traits: string[];
  luckyNumbers: number[];
  luckyColor: string;
  compatibility: string[];
}

const ZODIAC_DATA: ZodiacInfo[] = [
  {
    name: "白羊座", nameEn: "Aries", symbol: "♈", element: "火", elementSymbol: "🔥",
    ruler: "火星", dateRange: "3/21 - 4/19", startMonth: 3, startDay: 21, endMonth: 4, endDay: 19,
    traits: ["热情", "冲动", "勇敢", "直率", "行动力强"],
    luckyNumbers: [1, 9], luckyColor: "红色", compatibility: ["狮子座", "射手座", "双子座"],
  },
  {
    name: "金牛座", nameEn: "Taurus", symbol: "♉", element: "土", elementSymbol: "🌍",
    ruler: "金星", dateRange: "4/20 - 5/20", startMonth: 4, startDay: 20, endMonth: 5, endDay: 20,
    traits: ["稳重", "务实", "耐心", "固执", "享受生活"],
    luckyNumbers: [2, 6], luckyColor: "绿色", compatibility: ["处女座", "摩羯座", "巨蟹座"],
  },
  {
    name: "双子座", nameEn: "Gemini", symbol: "♊", element: "风", elementSymbol: "💨",
    ruler: "水星", dateRange: "5/21 - 6/21", startMonth: 5, startDay: 21, endMonth: 6, endDay: 21,
    traits: ["机智", "善变", "好奇", "灵活", "善于沟通"],
    luckyNumbers: [3, 5], luckyColor: "黄色", compatibility: ["天秤座", "水瓶座", "白羊座"],
  },
  {
    name: "巨蟹座", nameEn: "Cancer", symbol: "♋", element: "水", elementSymbol: "💧",
    ruler: "月亮", dateRange: "6/22 - 7/22", startMonth: 6, startDay: 22, endMonth: 7, endDay: 22,
    traits: ["温柔", "敏感", "顾家", "情绪化", "直觉强"],
    luckyNumbers: [2, 7], luckyColor: "银色", compatibility: ["天蝎座", "双鱼座", "金牛座"],
  },
  {
    name: "狮子座", nameEn: "Leo", symbol: "♌", element: "火", elementSymbol: "🔥",
    ruler: "太阳", dateRange: "7/23 - 8/22", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22,
    traits: ["自信", "大方", "领导力", "骄傲", "慷慨"],
    luckyNumbers: [1, 5], luckyColor: "金色", compatibility: ["白羊座", "射手座", "天秤座"],
  },
  {
    name: "处女座", nameEn: "Virgo", symbol: "♍", element: "土", elementSymbol: "🌍",
    ruler: "水星", dateRange: "8/23 - 9/22", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22,
    traits: ["细致", "完美主义", "实际", "挑剔", "分析力强"],
    luckyNumbers: [3, 6], luckyColor: "灰色", compatibility: ["金牛座", "摩羯座", "天蝎座"],
  },
  {
    name: "天秤座", nameEn: "Libra", symbol: "♎", element: "风", elementSymbol: "💨",
    ruler: "金星", dateRange: "9/23 - 10/23", startMonth: 9, startDay: 23, endMonth: 10, endDay: 23,
    traits: ["优雅", "公正", "犹豫", "社交", "追求和谐"],
    luckyNumbers: [4, 6], luckyColor: "粉色", compatibility: ["双子座", "水瓶座", "狮子座"],
  },
  {
    name: "天蝎座", nameEn: "Scorpio", symbol: "♏", element: "水", elementSymbol: "💧",
    ruler: "冥王星", dateRange: "10/24 - 11/22", startMonth: 10, startDay: 24, endMonth: 11, endDay: 22,
    traits: ["神秘", "专注", "占有欲强", "洞察力", "意志坚定"],
    luckyNumbers: [2, 4], luckyColor: "深红色", compatibility: ["巨蟹座", "双鱼座", "处女座"],
  },
  {
    name: "射手座", nameEn: "Sagittarius", symbol: "♐", element: "火", elementSymbol: "🔥",
    ruler: "木星", dateRange: "11/23 - 12/21", startMonth: 11, startDay: 23, endMonth: 12, endDay: 21,
    traits: ["乐观", "自由", "冒险", "直率", "哲学"],
    luckyNumbers: [3, 9], luckyColor: "紫色", compatibility: ["白羊座", "狮子座", "天秤座"],
  },
  {
    name: "摩羯座", nameEn: "Capricorn", symbol: "♑", element: "土", elementSymbol: "🌍",
    ruler: "土星", dateRange: "12/22 - 1/19", startMonth: 12, startDay: 22, endMonth: 1, endDay: 19,
    traits: ["踏实", "有野心", "自律", "保守", "责任感"],
    luckyNumbers: [4, 8], luckyColor: "棕色", compatibility: ["金牛座", "处女座", "天蝎座"],
  },
  {
    name: "水瓶座", nameEn: "Aquarius", symbol: "♒", element: "风", elementSymbol: "💨",
    ruler: "天王星", dateRange: "1/20 - 2/18", startMonth: 1, startDay: 20, endMonth: 2, endDay: 18,
    traits: ["独立", "创新", "人道主义", "叛逆", "理性"],
    luckyNumbers: [4, 7], luckyColor: "蓝色", compatibility: ["双子座", "天秤座", "射手座"],
  },
  {
    name: "双鱼座", nameEn: "Pisces", symbol: "♓", element: "水", elementSymbol: "💧",
    ruler: "海王星", dateRange: "2/19 - 3/20", startMonth: 2, startDay: 19, endMonth: 3, endDay: 20,
    traits: ["浪漫", "敏感", "想象力丰富", "多愁善感", "富有同情心"],
    luckyNumbers: [3, 7], luckyColor: "海蓝色", compatibility: ["巨蟹座", "天蝎座", "金牛座"],
  },
];

function getZodiacByDate(month: number, day: number): ZodiacInfo {
  for (const z of ZODIAC_DATA) {
    if (z.startMonth === z.endMonth) {
      if (month === z.startMonth && day >= z.startDay && day <= z.endDay) return z;
    } else if (z.startMonth > z.endMonth) {
      // Capricorn: Dec 22 - Jan 19
      if ((month === z.startMonth && day >= z.startDay) || (month === z.endMonth && day <= z.endDay)) return z;
    } else {
      if ((month === z.startMonth && day >= z.startDay) || (month === z.endMonth && day <= z.endDay)) return z;
    }
  }
  return ZODIAC_DATA[0];
}

// Simple moon sign estimation based on approximate lunar cycles
function estimateMoonSign(day: number): ZodiacInfo {
  // Very simplified: Moon stays ~2.5 days in each sign
  const index = Math.floor(((day - 1) % 30) / 2.5) % 12;
  return ZODIAC_DATA[index];
}

const ELEMENT_COLORS: Record<string, string> = {
  "火": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  "土": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "风": "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  "水": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

const ELEMENT_BG: Record<string, string> = {
  "火": "#FEE2E2",
  "土": "#FEF3C7",
  "风": "#E0F2FE",
  "水": "#DBEAFE",
};

export function AstrologyChartTool() {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [birthPlace, setBirthPlace] = useState("east");

  const result = useMemo(() => {
    if (!birthDate) return null;
    const [year, month, day] = birthDate.split("-").map(Number);
    if (!year || !month || !day) return null;

    const sunSign = getZodiacByDate(month, day);

    // Estimate moon sign based on approximate lunar day
    const daysSinceEpoch = Math.floor(new Date(year, month - 1, day).getTime() / 86400000);
    const moonSign = estimateMoonSign(daysSinceEpoch % 30);

    // Estimate rising sign based on birth time (simplified)
    const [hours] = birthTime.split(":").map(Number);
    const risingIndex = Math.floor((hours + 6) / 2) % 12;
    const risingSign = ZODIAC_DATA[risingIndex];

    return { sunSign, moonSign, risingSign };
  }, [birthDate, birthTime]);

  const elementColor = result?.sunSign ? ELEMENT_COLORS[result.sunSign.element] || "" : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>出生日期</Label>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>出生时间</Label>
          <Input
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>出生地区</Label>
          <Select value={birthPlace} onValueChange={(v) => { if (v !== null) setBirthPlace(v); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="east">东半球</SelectItem>
              <SelectItem value="west">西半球</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!result && (
        <div className="text-center py-8 text-muted-foreground">
          <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">请输入出生日期查看星座信息</p>
        </div>
      )}

      {result && (
        <>
          {/* Sun Sign Card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                    {result.sunSign.symbol}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{result.sunSign.name}</h3>
                    <p className="text-sm text-muted-foreground">{result.sunSign.nameEn} · {result.sunSign.dateRange}</p>
                  </div>
                </div>
                <Badge variant="outline" className={elementColor}>
                  {result.sunSign.elementSymbol} {result.sunSign.element}象星座
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">守护星</span>
                  <p className="font-medium mt-0.5">{result.sunSign.ruler}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">幸运色</span>
                  <p className="font-medium mt-0.5">{result.sunSign.luckyColor}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">幸运数字</span>
                  <p className="font-medium mt-0.5">{result.sunSign.luckyNumbers.join(", ")}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">最佳配对</span>
                  <p className="font-medium mt-0.5">{result.sunSign.compatibility.slice(0, 2).join("、")}</p>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">性格特质</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {result.sunSign.traits.map((trait) => (
                    <Badge key={trait} variant="secondary" className="text-xs">{trait}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Astrology Chart SVG */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                星盘示意
              </div>
              <div className="flex justify-center">
                <svg viewBox="0 0 300 300" width="300" height="300" className="max-w-full">
                  {/* Outer circle */}
                  <circle cx="150" cy="150" r="140" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                  <circle cx="150" cy="150" r="110" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15" />
                  <circle cx="150" cy="150" r="80" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" />

                  {/* 12 house lines */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    const x1 = 150 + 140 * Math.cos(angle);
                    const y1 = 150 + 140 * Math.sin(angle);
                    const x2 = 150 + 80 * Math.cos(angle);
                    const y2 = 150 + 80 * Math.sin(angle);
                    return (
                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                    );
                  })}

                  {/* Zodiac symbols around the wheel */}
                  {ZODIAC_DATA.map((z, i) => {
                    const angle = (i * 30 + 15 - 90) * (Math.PI / 180);
                    const x = 150 + 125 * Math.cos(angle);
                    const y = 150 + 125 * Math.sin(angle);
                    const isSunSign = z.name === result.sunSign.name;
                    const isMoonSign = z.name === result.moonSign.name;
                    const isRisingSign = z.name === result.risingSign.name;
                    return (
                      <g key={z.name}>
                        {isSunSign && (
                          <circle cx={x} cy={y} r="14" fill="hsl(var(--primary))" opacity="0.15" />
                        )}
                        <text
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="12"
                          fill={isSunSign ? "hsl(var(--primary))" : isMoonSign ? "#8B5CF6" : isRisingSign ? "#F59E0B" : "currentColor"}
                          opacity={isSunSign || isMoonSign || isRisingSign ? 1 : 0.4}
                          fontWeight={isSunSign || isMoonSign || isRisingSign ? "bold" : "normal"}
                        >
                          {z.symbol}
                        </text>
                      </g>
                    );
                  })}

                  {/* Sun indicator */}
                  {(() => {
                    const sunIndex = ZODIAC_DATA.findIndex((z) => z.name === result.sunSign.name);
                    const angle = (sunIndex * 30 + 15 - 90) * (Math.PI / 180);
                    const x = 150 + 95 * Math.cos(angle);
                    const y = 150 + 95 * Math.sin(angle);
                    return (
                      <g>
                        <circle cx={x} cy={y} r="8" fill="hsl(var(--primary))" opacity="0.9" />
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white">☉</text>
                      </g>
                    );
                  })()}

                  {/* Moon indicator */}
                  {(() => {
                    const moonIndex = ZODIAC_DATA.findIndex((z) => z.name === result.moonSign.name);
                    const angle = (moonIndex * 30 + 15 - 90) * (Math.PI / 180);
                    const x = 150 + 95 * Math.cos(angle);
                    const y = 150 + 95 * Math.sin(angle);
                    return (
                      <g>
                        <circle cx={x} cy={y} r="8" fill="#8B5CF6" opacity="0.9" />
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white">☽</text>
                      </g>
                    );
                  })()}

                  {/* Rising indicator */}
                  {(() => {
                    const risingIndex = ZODIAC_DATA.findIndex((z) => z.name === result.risingSign.name);
                    const angle = (risingIndex * 30 + 15 - 90) * (Math.PI / 180);
                    const x = 150 + 95 * Math.cos(angle);
                    const y = 150 + 95 * Math.sin(angle);
                    return (
                      <g>
                        <circle cx={x} cy={y} r="8" fill="#F59E0B" opacity="0.9" />
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white">ASC</text>
                      </g>
                    );
                  })()}

                  {/* Center text */}
                  <text x="150" y="142" textAnchor="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--primary))">
                    {result.sunSign.symbol}
                  </text>
                  <text x="150" y="162" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">
                    {result.sunSign.name}
                  </text>
                </svg>
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                  太阳星座
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  月亮星座
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  上升星座
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Moon & Rising Sign */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Moon className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">月亮星座（估算）</span>
                </div>
                <div className="text-2xl mb-1">{result.moonSign.symbol} {result.moonSign.name}</div>
                <p className="text-xs text-muted-foreground">
                  月亮星座反映内在情感，此为简化估算，精确计算需完整出生时间与经纬度
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sunrise className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">上升星座（估算）</span>
                </div>
                <div className="text-2xl mb-1">{result.risingSign.symbol} {result.risingSign.name}</div>
                <p className="text-xs text-muted-foreground">
                  上升星座反映外在形象，此为简化估算，精确计算需完整出生信息
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            * 占星结果仅供参考娱乐，月亮星座与上升星座为简化算法估算
          </p>
        </>
      )}
    </div>
  );
}
