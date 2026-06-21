"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Gift, PartyPopper, Building, Columns2, Columns3, Layout, ChevronLeft, ChevronRight } from "lucide-react";

type Region = "cn" | "hk" | "sg";

const REGIONS: { id: Region; label: string; flag: string; note: string }[] = [
  { id: "cn",  label: "中国大陆", flag: "🇨🇳", note: "以国务院公告为准" },
  { id: "hk",  label: "中国香港", flag: "🏙️", note: "以政府宪报为准" },
  { id: "sg",  label: "新加坡",   flag: "🇸🇬", note: "以MOM公告为准" },
];

const CURRENT_YEAR = new Date().getFullYear(); // 2026

interface HolidayData {
  name: string;
  month: number;  // 1-based
  day: number;
  emoji: string;
}

interface HolidayItem {
  name: string;
  date: Date;
  daysLeft: number;
  region: Region;
  emoji: string;
}

// ─── 数据源 (以 2026 年为基准) ──────────────────────────

const DATA_2026: Record<Region, HolidayData[]> = {
  cn: [
    { name: "元旦",     month: 1,  day: 1,  emoji: "🎆" },
    { name: "春节",     month: 2,  day: 17, emoji: "🧧" },
    { name: "清明节",   month: 4,  day: 5,  emoji: "🌿" },
    { name: "劳动节",   month: 5,  day: 1,  emoji: "💪" },
    { name: "端午节",   month: 6,  day: 19, emoji: "🐉" },
    { name: "中秋节",   month: 10, day: 4,  emoji: "🥮" },
    { name: "国庆节",   month: 10, day: 1,  emoji: "🇨🇳" },
  ],
  hk: [
    { name: "元旦",             month: 1,  day: 1,  emoji: "🎆" },
    { name: "农历年初一",       month: 2,  day: 17, emoji: "🧧" },
    { name: "农历年初二",       month: 2,  day: 18, emoji: "🧧" },
    { name: "农历年初三",       month: 2,  day: 19, emoji: "🧧" },
    { name: "耶稣受难节",       month: 4,  day: 3,  emoji: "✝️" },
    { name: "耶稣受难节翌日",   month: 4,  day: 4,  emoji: "✝️" },
    { name: "清明节",           month: 4,  day: 5,  emoji: "🌿" },
    { name: "复活节星期一",     month: 4,  day: 6,  emoji: "🐣" },
    { name: "劳动节",           month: 5,  day: 1,  emoji: "💪" },
    { name: "佛诞",             month: 5,  day: 15, emoji: "🙏" },
    { name: "端午节",           month: 6,  day: 19, emoji: "🐉" },
    { name: "特区成立纪念日",   month: 7,  day: 1,  emoji: "🏙️" },
    { name: "国庆节",           month: 10, day: 1,  emoji: "🇨🇳" },
    { name: "中秋节翌日",       month: 10, day: 5,  emoji: "🥮" },
    { name: "重阳节",           month: 10, day: 19, emoji: "🏔️" },
    { name: "圣诞节",           month: 12, day: 25, emoji: "🎄" },
    { name: "圣诞节后第一个周日", month: 12, day: 26, emoji: "🎄" },
  ],
  sg: [
    { name: "元旦",             month: 1,  day: 1,  emoji: "🎆" },
    { name: "农历新年",         month: 2,  day: 17, emoji: "🧧" },
    { name: "农历新年翌日",     month: 2,  day: 18, emoji: "🧧" },
    { name: "Hari Raya Puasa",  month: 3,  day: 20, emoji: "🕌" },
    { name: "耶稣受难节",       month: 4,  day: 3,  emoji: "✝️" },
    { name: "劳动节",           month: 5,  day: 1,  emoji: "💪" },
    { name: "卫塞节",           month: 5,  day: 15, emoji: "🙏" },
    { name: "Hari Raya Haji",   month: 5,  day: 27, emoji: "🕋" },
    { name: "国庆日",           month: 8,  day: 9,  emoji: "🇸🇬" },
    { name: "Deepavali",        month: 11, day: 8,  emoji: "🪔" },
    { name: "圣诞节",           month: 12, day: 25, emoji: "🎄" },
  ],
};

// 2027 年数据（固定日期沿用，农历/非常规日期近似）
const DATA_2027: Record<Region, HolidayData[]> = {
  cn: [
    { name: "元旦",     month: 1,  day: 1,  emoji: "🎆" },
    { name: "春节≈",   month: 2,  day: 6,  emoji: "🧧" },
    { name: "清明节",   month: 4,  day: 5,  emoji: "🌿" },
    { name: "劳动节",   month: 5,  day: 1,  emoji: "💪" },
    { name: "端午节≈", month: 6,  day: 10, emoji: "🐉" },
    { name: "中秋节≈", month: 9,  day: 15, emoji: "🥮" },
    { name: "国庆节",   month: 10, day: 1,  emoji: "🇨🇳" },
  ],
  hk: [
    { name: "元旦",             month: 1,  day: 1,  emoji: "🎆" },
    { name: "农历年初一≈",     month: 2,  day: 6,  emoji: "🧧" },
    { name: "农历年初二≈",     month: 2,  day: 7,  emoji: "🧧" },
    { name: "农历年初三≈",     month: 2,  day: 8,  emoji: "🧧" },
    { name: "耶稣受难节≈",     month: 3,  day: 26, emoji: "✝️" },
    { name: "耶稣受难节翌日≈", month: 3,  day: 27, emoji: "✝️" },
    { name: "清明节",           month: 4,  day: 5,  emoji: "🌿" },
    { name: "复活节星期一≈",   month: 3,  day: 29, emoji: "🐣" },
    { name: "劳动节",           month: 5,  day: 1,  emoji: "💪" },
    { name: "佛诞≈",           month: 5,  day: 20, emoji: "🙏" },
    { name: "端午节≈",         month: 6,  day: 10, emoji: "🐉" },
    { name: "特区成立纪念日",   month: 7,  day: 1,  emoji: "🏙️" },
    { name: "国庆节",           month: 10, day: 1,  emoji: "🇨🇳" },
    { name: "中秋节翌日≈",     month: 9,  day: 16, emoji: "🥮" },
    { name: "重阳节≈",         month: 10, day: 10, emoji: "🏔️" },
    { name: "圣诞节",           month: 12, day: 25, emoji: "🎄" },
    { name: "圣诞节后第一个周日", month: 12, day: 26, emoji: "🎄" },
  ],
  sg: [
    { name: "元旦",             month: 1,  day: 1,  emoji: "🎆" },
    { name: "农历新年≈",       month: 2,  day: 6,  emoji: "🧧" },
    { name: "农历新年翌日≈",   month: 2,  day: 7,  emoji: "🧧" },
    { name: "Hari Raya Puasa≈", month: 3,  day: 9,  emoji: "🕌" },
    { name: "耶稣受难节≈",     month: 3,  day: 26, emoji: "✝️" },
    { name: "劳动节",           month: 5,  day: 1,  emoji: "💪" },
    { name: "卫塞节≈",         month: 5,  day: 4,  emoji: "🙏" },
    { name: "Hari Raya Haji≈",  month: 5,  day: 16, emoji: "🕋" },
    { name: "国庆日",           month: 8,  day: 9,  emoji: "🇸🇬" },
    { name: "Deepavali≈",      month: 10, day: 29, emoji: "🪔" },
    { name: "圣诞节",           month: 12, day: 25, emoji: "🎄" },
  ],
};

const YEAR_DATA: Record<number, Record<Region, HolidayData[]>> = {
  2026: DATA_2026,
  2027: DATA_2027,
};

// 可用年份
const AVAILABLE_YEARS = [2026, 2027];

// ─── 计算逻辑 ────────────────────────────────────────────

function getHolidaysForRegion(region: Region, year: number): HolidayItem[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const data = YEAR_DATA[year]?.[region] ?? [];
  const result: HolidayItem[] = [];

  for (const h of data) {
    const d = new Date(year, h.month - 1, h.day);
    // 仅保留所选年份内的假期
    if (d.getFullYear() !== year) continue;

    const diffTime = d.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysLeft >= 0) {
      result.push({ name: h.name, date: d, daysLeft, region, emoji: h.emoji });
    }
  }

  result.sort((a, b) => a.daysLeft - b.daysLeft);
  return result;
}

function getNextHoliday(items: HolidayItem[]): HolidayItem | undefined {
  return items[0];
}

function getWeekendCountdown(): { daysLeft: number; isWeekend: boolean } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  let daysToWeekend: number;
  let isWeekend = false;
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    isWeekend = true;
    daysToWeekend = 0;
  } else {
    daysToWeekend = 6 - dayOfWeek;
  }
  return { daysLeft: daysToWeekend, isWeekend };
}

function getYearProgress(selYear: number): number {
  const now = new Date();
  const start = new Date(selYear, 0, 1);
  const end = new Date(selYear + 1, 0, 1);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 10000) / 100));
}

function getDaysLeftInYear(selYear: number): number {
  const now = new Date();
  const end = new Date(selYear + 1, 0, 1);
  const left = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, left);
}

// ─── 子组件 ──────────────────────────────────────────────

function RegionHolidayCard({ holidays, compact, year }: { holidays: HolidayItem[]; compact?: boolean; year: number }) {
  const [showAll, setShowAll] = useState(false);
  const defaultShow = compact ? 4 : 6;
  const display = showAll ? holidays : holidays.slice(0, defaultShow);

  return (
    <div className="divide-y">
      {display.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          {year > CURRENT_YEAR ? "暂无数据" : "今年的假期已全部结束 🎉"}
        </div>
      ) : (
        display.map((h, i) => {
          const progress = Math.min(100, Math.max(0, 100 - (h.daysLeft / 365) * 100));
          const urgency = h.daysLeft <= 7 ? "bg-red-500" : h.daysLeft <= 30 ? "bg-amber-500" : "bg-primary";
          const displayName = h.name.replace(/≈$/, "");
          const isApprox = h.name.endsWith("≈");
          return (
            <div key={i} className="px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base shrink-0">
                {h.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium ${compact ? "max-w-[80px] truncate" : ""}`}>
                    {displayName}
                  </span>
                  {isApprox && (
                    <span className="text-[9px] text-amber-500 font-medium" title="农历日期为近似值">≈</span>
                  )}
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {h.date.getMonth() + 1}/{h.date.getDate()}
                  </Badge>
                </div>
                <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden mt-1">
                  <div className={`h-full transition-all ${urgency}`} style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0 w-10">
                <p className={`text-sm font-bold ${h.daysLeft <= 7 ? "text-red-500" : "text-primary"}`}>
                  {h.daysLeft === 0 ? "今天" : h.daysLeft}
                </p>
                <p className="text-[9px] text-muted-foreground">{h.daysLeft === 0 ? "" : "天"}</p>
              </div>
            </div>
          );
        })
      )}
      {holidays.length > defaultShow && (
        <div className="px-3 py-2">
          <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setShowAll(!showAll)}>
            {showAll ? "收起" : `查看全部 ${holidays.length} 个假期`}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────

export function HolidayCountdownTool() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [activeRegions, setActiveRegions] = useState<Region[]>(["cn"]);
  const [compareMode, setCompareMode] = useState(false);

  const cnHolidays  = useMemo(() => getHolidaysForRegion("cn", selectedYear), [selectedYear]);
  const hkHolidays  = useMemo(() => getHolidaysForRegion("hk", selectedYear), [selectedYear]);
  const sgHolidays  = useMemo(() => getHolidaysForRegion("sg", selectedYear), [selectedYear]);

  const allData = useMemo(() => ({
    cn: cnHolidays, hk: hkHolidays, sg: sgHolidays,
  }), [cnHolidays, hkHolidays, sgHolidays]);

  const primary = activeRegions[0];
  const primaryHolidays = allData[primary];
  const nextHoliday = getNextHoliday(primaryHolidays);

  const weekend = useMemo(() => getWeekendCountdown(), []);
  const yearProgress = useMemo(() => getYearProgress(selectedYear), [selectedYear]);
  const daysLeftInYear = useMemo(() => getDaysLeftInYear(selectedYear), [selectedYear]);

  const isApproxYear = selectedYear > CURRENT_YEAR;
  const yearIdx = AVAILABLE_YEARS.indexOf(selectedYear);

  const canPrev = yearIdx > 0;
  const canNext = yearIdx < AVAILABLE_YEARS.length - 1;

  const prevYear = () => {
    if (canPrev) setSelectedYear(AVAILABLE_YEARS[yearIdx - 1]);
  };
  const nextYear = () => {
    if (canNext) setSelectedYear(AVAILABLE_YEARS[yearIdx + 1]);
  };

  const toggleRegion = (r: Region) => {
    if (!compareMode) {
      setActiveRegions([r]);
      return;
    }
    setActiveRegions(prev => {
      if (prev.includes(r)) {
        if (prev.length <= 1) return prev;
        return prev.filter(x => x !== r);
      }
      return [...prev, r];
    });
  };

  const cycleCompare = () => {
    if (!compareMode) {
      setCompareMode(true);
      setActiveRegions(["cn", "hk"]);
    } else if (activeRegions.length === 2) {
      setActiveRegions(["cn", "hk", "sg"]);
    } else {
      setCompareMode(false);
      setActiveRegions(["cn"]);
    }
  };

  // 对比模式三栏时各区域数量对比
  const totalHolidays = cnHolidays.length + hkHolidays.length + sgHolidays.length;

  return (
    <div className="space-y-4">
      {/* ── 年份 + 区域选择栏 ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 年份切换 */}
        <div className="flex items-center bg-muted/50 rounded-lg">
          <button
            onClick={prevYear}
            disabled={!canPrev}
            className="px-1.5 py-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold px-2 min-w-[44px] text-center tabular-nums select-none">
            {selectedYear}
          </span>
          <button
            onClick={nextYear}
            disabled={!canNext}
            className="px-1.5 py-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 分隔 */}
        <div className="w-px h-6 bg-border" />

        {/* 区域选择 */}
        <div className="flex bg-muted/50 rounded-lg p-0.5 gap-0.5">
          {REGIONS.map((r) => {
            const isActive = activeRegions.includes(r.id);
            const count = allData[r.id].length;
            return (
              <button
                key={r.id}
                onClick={() => toggleRegion(r.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5
                  ${isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <span>{r.flag}</span>
                <span>{r.label}</span>
                <span className={`text-[10px] px-1 rounded ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground/50"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 对比按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={cycleCompare}
          className="h-8 gap-1.5 text-xs"
        >
          {compareMode
            ? activeRegions.length >= 3
              ? <><Columns3 className="h-3.5 w-3.5" /> 退出对比</>
              : <><Columns2 className="h-3.5 w-3.5" /> 三栏对比</>
            : <><Layout className="h-3.5 w-3.5" /> 对比模式</>
          }
        </Button>
      </div>

      {/* ── 近似年份提示 ── */}
      {isApproxYear && (
        <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-1.5 flex items-center gap-1.5">
          <span>⚠️</span>
          <span>{selectedYear} 年农历/宗教节日为近似值，请以官方公告为准</span>
        </div>
      )}

      {/* ── 单区域模式 ── */}
      {!compareMode && (
        <>
          {nextHoliday ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-primary/5 px-6 py-8 text-center relative">
                  <div className="absolute top-3 left-3 flex items-center gap-1">
                    <span>{REGIONS.find(r => r.id === primary)?.flag}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {REGIONS.find(r => r.id === primary)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedYear}年 下一个节假日
                  </p>
                  <p className="text-4xl font-bold text-primary mb-2">
                    {nextHoliday.emoji} {nextHoliday.name.replace(/≈$/, "")}
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{nextHoliday.daysLeft}</p>
                      <p className="text-xs text-muted-foreground">天</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {nextHoliday.date.getMonth() + 1}月{nextHoliday.date.getDate()}日
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {["周日", "周一", "周二", "周三", "周四", "周五", "周六"][nextHoliday.date.getDay()]}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-2xl">🎉</p>
                <p className="text-lg font-semibold text-muted-foreground mt-2">
                  {selectedYear} 年假期已全部结束
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  可以切换到下一年查看
                </p>
              </CardContent>
            </Card>
          )}

          {/* 进度卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{yearProgress}%</p>
                <p className="text-xs text-muted-foreground">{selectedYear}年已过</p>
                <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-primary transition-all" style={{ width: `${yearProgress}%` }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Gift className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{primaryHolidays.length}</p>
                <p className="text-xs text-muted-foreground">{selectedYear}年剩余节假日</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <PartyPopper className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{daysLeftInYear}</p>
                <p className="text-xs text-muted-foreground">{selectedYear}年剩余天数</p>
              </CardContent>
            </Card>
          </div>

          {/* 周末倒计时 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{weekend.isWeekend ? "🎉" : "📅"}</span> 周末倒计时
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weekend.isWeekend ? (
                <div className="text-center py-4">
                  <p className="text-2xl font-bold text-green-500">🎉 周末快乐！</p>
                  <p className="text-sm text-muted-foreground mt-1">好好休息，下周再战</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-primary">{weekend.daysLeft}</p>
                  <p className="text-sm text-muted-foreground">{weekend.daysLeft} 天后到周末</p>
                  <div className="flex justify-center gap-1 mt-3">
                    {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((d, i) => {
                      const now = new Date();
                      const dayIdx = now.getDay();
                      const todayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
                      const isToday = i === todayIdx;
                      const isPast = i < todayIdx;
                      return (
                        <div
                          key={d}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium
                            ${isToday ? "bg-primary text-primary-foreground" : isPast ? "text-muted-foreground/40" : "text-muted-foreground"}
                          `}
                        >
                          {d[0]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── 对比模式 ── */}
      {compareMode && (
        /* 三栏时紧凑，两栏时宽松 */
        <div className={activeRegions.length === 3
          ? "grid grid-cols-1 md:grid-cols-3 gap-2"
          : "grid grid-cols-1 md:grid-cols-2 gap-3"
        }>
          {activeRegions.map((region) => {
            const r = REGIONS.find(x => x.id === region)!;
            const items = allData[region];
            const next = getNextHoliday(items);
            const isCompact = activeRegions.length >= 3;
            return (
              <Card key={region} className="overflow-hidden">
                <CardHeader className={isCompact ? "pb-1.5 pt-2 px-2.5" : "pb-2 pt-3 px-3"}>
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <span>{r.flag}</span> <span className={isCompact ? "text-xs" : ""}>{r.label}</span>
                    <Badge variant="secondary" className="text-[10px] ml-1">{items.length}</Badge>
                  </CardTitle>
                  {next ? (
                    <p className={`text-muted-foreground mt-0.5 ${isCompact ? "text-[10px]" : "text-xs"}`}>
                      🔜 {next.emoji} {next.name.replace(/≈$/, "")}：{next.daysLeft} 天
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-0.5">假期已全部结束</p>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <RegionHolidayCard holidays={items} compact={isCompact} year={selectedYear} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 单区域列表 ── */}
      {!compareMode && (
        <Card>
          <CardHeader className="pb-2 flex-row flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              {REGIONS.find(r => r.id === primary)?.label} · {selectedYear}年
            </CardTitle>
            <span className="text-xs text-muted-foreground">{primaryHolidays.length} 个</span>
          </CardHeader>
          <CardContent className="p-0">
            <RegionHolidayCard holidays={primaryHolidays} year={selectedYear} />
          </CardContent>
        </Card>
      )}

      {/* 底部说明 */}
      <p className="text-xs text-muted-foreground text-center">
        * 节假日数据仅供参考
        {isApproxYear && "（≈ 标记的日期为近似值）"}
        {activeRegions.map(r => {
          const note = REGIONS.find(x => x.id === r)?.note;
          return note ? ` | ${REGIONS.find(x => x.id === r)?.label}：${note}` : "";
        }).join("")}
      </p>
    </div>
  );
}
