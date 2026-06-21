"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 十二生肖数据
const ZODIAC_DATA = [
  { idx: 0, animal: "鼠", emoji: "🐭", years: [1900,1912,1924,1936,1948,1960,1972,1984,1996,2008,2020,2032] as number[] },
  { idx: 1, animal: "牛", emoji: "🐮", years: [1901,1913,1925,1937,1949,1961,1973,1985,1997,2009,2021,2033] as number[] },
  { idx: 2, animal: "虎", emoji: "🐯", years: [1902,1914,1926,1938,1950,1962,1974,1986,1998,2010,2022,2034] as number[] },
  { idx: 3, animal: "兔", emoji: "🐰", years: [1903,1915,1927,1939,1951,1963,1975,1987,1999,2011,2023,2035] as number[] },
  { idx: 4, animal: "龙", emoji: "🐲", years: [1904,1916,1928,1940,1952,1964,1976,1988,2000,2012,2024,2036] as number[] },
  { idx: 5, animal: "蛇", emoji: "🐍", years: [1905,1917,1929,1941,1953,1965,1977,1989,2001,2013,2025,2037] as number[] },
  { idx: 6, animal: "马", emoji: "🐴", years: [1906,1918,1930,1942,1954,1966,1978,1990,2002,2014,2026,2038] as number[] },
  { idx: 7, animal: "羊", emoji: "🐑", years: [1907,1919,1931,1943,1955,1967,1979,1991,2003,2015,2027,2039] as number[] },
  { idx: 8, animal: "猴", emoji: "🐵", years: [1908,1920,1932,1944,1956,1968,1980,1992,2004,2016,2028,2040] as number[] },
  { idx: 9, animal: "鸡", emoji: "🐔", years: [1909,1921,1933,1945,1957,1969,1981,1993,2005,2017,2029,2041] as number[] },
  { idx: 10, animal: "狗", emoji: "🐶", years: [1910,1922,1934,1946,1958,1970,1982,1994,2006,2018,2030,2042] as number[] },
  { idx: 11, animal: "猪", emoji: "🐷", years: [1911,1923,1935,1947,1959,1971,1983,1995,2007,2019,2031,2043] as number[] },
];

const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const ZODIAC_PERSONALITY: Record<string, { trait: string; lucky: string; element: string }> = {
  "鼠": { trait: "机智灵活，善于交际，适应力强", lucky: "牛、龙、猴", element: "水" },
  "牛": { trait: "踏实肯干，坚韧不拔，值得信赖", lucky: "鼠、蛇、鸡", element: "土" },
  "虎": { trait: "勇敢自信，富有冒险精神", lucky: "马、狗、猪", element: "木" },
  "兔": { trait: "温柔善良，谨慎细心，人缘好", lucky: "羊、猪、狗", element: "木" },
  "龙": { trait: "气势磅礴，富有领导力，理想主义", lucky: "鼠、猴、鸡", element: "土" },
  "蛇": { trait: "聪明睿智，直觉敏锐，神秘优雅", lucky: "牛、鸡、猴", element: "火" },
  "马": { trait: "热情奔放，积极向上，喜欢自由", lucky: "虎、羊、狗", element: "火" },
  "羊": { trait: "温文尔雅，艺术天赋，善解人意", lucky: "兔、马、猪", element: "土" },
  "猴": { trait: "聪明伶俐，机智灵活，善于模仿", lucky: "鼠、龙、蛇", element: "金" },
  "鸡": { trait: "勤奋守时，注重细节，自信果断", lucky: "牛、龙、蛇", element: "金" },
  "狗": { trait: "忠诚正直，富有正义感，值得信赖", lucky: "虎、兔、马", element: "土" },
  "猪": { trait: "真诚善良，乐观豁达，福气满满", lucky: "虎、兔、羊", element: "水" },
};

function getZodiac(year: number): typeof ZODIAC_DATA[number] | null {
  if (year < 1900 || year > 2100) return null;
  const idx = (year - 1900) % 12;
  return ZODIAC_DATA[idx];
}

function getGanZhiYear(year: number): string {
  const ganIdx = (year - 4) % 10;
  const zhiIdx = (year - 4) % 12;
  return TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx];
}

// 生肖配对（三合、六合、相冲）
const COMPATIBILITY: Record<string, { best: string[]; good: string[]; bad: string[] }> = {
  "鼠": { best: ["龙", "猴"], good: ["牛"], bad: ["马"] },
  "牛": { best: ["蛇", "鸡"], good: ["鼠"], bad: ["羊"] },
  "虎": { best: ["马", "狗"], good: ["猪"], bad: ["猴"] },
  "兔": { best: ["羊", "猪"], good: ["狗"], bad: ["鸡"] },
  "龙": { best: ["鼠", "猴"], good: ["鸡"], bad: ["狗"] },
  "蛇": { best: ["牛", "鸡"], good: ["猴"], bad: ["猪"] },
  "马": { best: ["虎", "狗"], good: ["羊"], bad: ["鼠"] },
  "羊": { best: ["兔", "猪"], good: ["马"], bad: ["牛"] },
  "猴": { best: ["鼠", "龙"], good: ["蛇"], bad: ["虎"] },
  "鸡": { best: ["牛", "蛇"], good: ["龙"], bad: ["兔"] },
  "狗": { best: ["虎", "马"], good: ["兔"], bad: ["龙"] },
  "猪": { best: ["兔", "羊"], good: ["虎"], bad: ["蛇"] },
};

export function ChineseZodiacTool() {
  const [inputYear, setInputYear] = useState(String(new Date().getFullYear()));
  const [selectedZodiac, setSelectedZodiac] = useState<string | null>(null);
  const [compareZodiac, setCompareZodiac] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("lookup");

  const yearNum = parseInt(inputYear);
  const zodiacResult = useMemo(() => {
    const y = parseInt(inputYear);
    if (isNaN(y) || y < 1900 || y > 2100) return null;
    return getZodiac(y);
  }, [inputYear]);

  const selectedData = useMemo(() => {
    if (!selectedZodiac) return null;
    return ZODIAC_DATA.find(z => z.animal === selectedZodiac) ?? null;
  }, [selectedZodiac]);

  const compatibility = useMemo(() => {
    if (!selectedZodiac) return null;
    return COMPATIBILITY[selectedZodiac] ?? null;
  }, [selectedZodiac]);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lookup">年份查询</TabsTrigger>
          <TabsTrigger value="zodiac">生肖详解</TabsTrigger>
          <TabsTrigger value="compat">配对分析</TabsTrigger>
        </TabsList>

        {/* 年份查询 */}
        <TabsContent value="lookup" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label>输入出生年份</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={inputYear}
                  onChange={e => setInputYear(e.target.value)}
                  placeholder="如：2000"
                  min={1900}
                  max={2100}
                />
              </div>
              {!isNaN(yearNum) && (yearNum < 1900 || yearNum > 2100) && (
                <p className="text-xs text-destructive">请输入 1900-2100 之间的年份</p>
              )}
            </CardContent>
          </Card>

          {zodiacResult && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-5xl mb-2">{zodiacResult.emoji}</p>
                <p className="text-2xl font-bold mb-1">{zodiacResult.animal}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  {inputYear} 年 · {getGanZhiYear(yearNum)}年
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <Badge variant="outline">{ZODIAC_PERSONALITY[zodiacResult.animal]?.element}命</Badge>
                  <Badge variant="outline">五行{zodiacResult.idx + 1}行</Badge>
                </div>
                <p className="text-sm mt-3 text-muted-foreground">
                  {ZODIAC_PERSONALITY[zodiacResult.animal]?.trait}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => { setSelectedZodiac(zodiacResult.animal); setActiveTab("zodiac"); }}
                >
                  查看{zodiacResult.animal}的详细解析 →
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 生肖详解 */}
        <TabsContent value="zodiac" className="space-y-4 mt-4">
          {!selectedZodiac && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {ZODIAC_DATA.map(z => (
                <button
                  key={z.animal}
                  className={`p-3 rounded-lg border text-center hover:bg-primary/5 hover:border-primary/50 transition-colors
                    ${selectedZodiac === z.animal ? "bg-primary/10 border-primary" : "bg-background"}
                  `}
                  onClick={() => setSelectedZodiac(z.animal)}
                >
                  <p className="text-2xl">{z.emoji}</p>
                  <p className="text-sm font-medium">{z.animal}</p>
                </button>
              ))}
            </div>
          )}

          {selectedData && (
            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="text-3xl">{selectedData.emoji}</span>
                <div className="flex-1">
                  <CardTitle>{selectedData.animal}年出生的人</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    最近年份：{selectedData.years.slice(-4).join("、")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedZodiac(null)}>返回</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">性格特点</p>
                    <p className="text-sm">{ZODIAC_PERSONALITY[selectedData.animal]?.trait}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">五行属性</p>
                    <p className="text-sm">{ZODIAC_PERSONALITY[selectedData.animal]?.element}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">幸运配对</p>
                    <p className="text-sm">{ZODIAC_PERSONALITY[selectedData.animal]?.lucky}</p>
                  </div>
                </div>

                {compatibility && (
                  <div>
                    <p className="text-sm font-medium mb-2">生肖配对</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <p className="text-xs text-muted-foreground">三合</p>
                        <p className="font-medium text-green-600">{compatibility.best.join("、")}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <p className="text-xs text-muted-foreground">六合</p>
                        <p className="font-medium text-blue-600">{compatibility.good.join("、")}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <p className="text-xs text-muted-foreground">相冲</p>
                        <p className="font-medium text-red-600">{compatibility.bad.join("、")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 配对分析 */}
        <TabsContent value="compat" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label>选择你的生肖</Label>
              <div className="grid grid-cols-6 gap-1.5">
                {ZODIAC_DATA.map(z => (
                  <button
                    key={z.animal}
                    className={`p-2 rounded-lg text-center text-xs border transition-colors
                      ${selectedZodiac === z.animal ? "bg-primary/10 border-primary font-medium" : "hover:bg-muted/50"}
                    `}
                    onClick={() => setSelectedZodiac(z.animal)}
                  >
                    {z.emoji} {z.animal}
                  </button>
                ))}
              </div>
              <Label>选择对方生肖</Label>
              <div className="grid grid-cols-6 gap-1.5">
                {ZODIAC_DATA.map(z => (
                  <button
                    key={z.animal}
                    className={`p-2 rounded-lg text-center text-xs border transition-colors
                      ${compareZodiac === z.animal ? "bg-primary/10 border-primary font-medium" : "hover:bg-muted/50"}
                    `}
                    onClick={() => setCompareZodiac(z.animal)}
                  >
                    {z.emoji} {z.animal}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedZodiac && compareZodiac && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl mb-2">
                  {ZODIAC_DATA.find(z => z.animal === selectedZodiac)?.emoji}
                  {" ❤️ "}
                  {ZODIAC_DATA.find(z => z.animal === compareZodiac)?.emoji}
                </p>
                <p className="text-lg font-bold mb-1">{selectedZodiac} × {compareZodiac}</p>
                {(() => {
                  const compat = COMPATIBILITY[selectedZodiac];
                  if (!compat) return <p className="text-sm text-muted-foreground">暂无数据</p>;
                  const isBest = compat.best.includes(compareZodiac);
                  const isGood = compat.good.includes(compareZodiac);
                  const isBad = compat.bad.includes(compareZodiac);
                  if (isBest) return <Badge className="bg-green-500">三合/六合 · 天作之合</Badge>;
                  if (isGood) return <Badge className="bg-blue-500">六合 · 相合</Badge>;
                  if (isBad) return <Badge variant="destructive">相冲 · 需多磨合</Badge>;
                  return <Badge variant="outline">中性 · 需要沟通理解</Badge>;
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
