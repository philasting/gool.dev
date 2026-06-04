"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Globe, List, ChevronLeft, ChevronRight } from "lucide-react";

interface Holiday {
  date: string;
  name: string;
  country: string;
  countryCode: string;
  type: string;
}

const COUNTRIES = [
  { code: "CN", name: "中国", flag: "🇨🇳" },
  { code: "US", name: "美国", flag: "🇺🇸" },
  { code: "JP", name: "日本", flag: "🇯🇵" },
  { code: "KR", name: "韩国", flag: "🇰🇷" },
  { code: "GB", name: "英国", flag: "🇬🇧" },
  { code: "FR", name: "法国", flag: "🇫🇷" },
  { code: "DE", name: "德国", flag: "🇩🇪" },
  { code: "AU", name: "澳大利亚", flag: "🇦🇺" },
  { code: "CA", name: "加拿大", flag: "🇨🇦" },
  { code: "IN", name: "印度", flag: "🇮🇳" },
  { code: "BR", name: "巴西", flag: "🇧🇷" },
  { code: "RU", name: "俄罗斯", flag: "🇷🇺" },
];

const HOLIDAYS: Holiday[] = [
  // China
  { date: "2025-01-01", name: "元旦", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-01-28", name: "除夕", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-01-29", name: "春节", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-01-30", name: "春节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-01-31", name: "春节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-02-01", name: "春节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-02-02", name: "春节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-04-04", name: "清明节", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-04-05", name: "清明节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-04-06", name: "清明节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-05-01", name: "劳动节", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-05-02", name: "劳动节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-05-03", name: "劳动节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-05-04", name: "劳动节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-05-05", name: "劳动节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-05-31", name: "端午节", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-06-01", name: "端午节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-06-02", name: "端午节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-10-01", name: "国庆节", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-10-02", name: "国庆节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-10-03", name: "国庆节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-10-04", name: "国庆节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-10-05", name: "国庆节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-10-06", name: "中秋节", country: "中国", countryCode: "CN", type: "公共假期" },
  { date: "2025-10-07", name: "国庆节假期", country: "中国", countryCode: "CN", type: "公共假期" },
  // US
  { date: "2025-01-01", name: "New Year's Day", country: "美国", countryCode: "US", type: "联邦假日" },
  { date: "2025-01-20", name: "Martin Luther King Jr. Day", country: "美国", countryCode: "US", type: "联邦假日" },
  { date: "2025-02-17", name: "Presidents' Day", country: "美国", countryCode: "US", type: "联邦假日" },
  { date: "2025-05-26", name: "Memorial Day", country: "美国", countryCode: "US", type: "联邦假日" },
  { date: "2025-07-04", name: "Independence Day", country: "美国", countryCode: "US", type: "联邦假日" },
  { date: "2025-09-01", name: "Labor Day", country: "美国", countryCode: "US", type: "联邦假日" },
  { date: "2025-10-13", name: "Columbus Day", country: "美国", countryCode: "US", type: "联邦假日" },
  { date: "2025-11-11", name: "Veterans Day", country: "美国", countryCode: "US", type: "联邦假日" },
  { date: "2025-11-27", name: "Thanksgiving Day", country: "美国", countryCode: "US", type: "联邦假日" },
  { date: "2025-12-25", name: "Christmas Day", country: "美国", countryCode: "US", type: "联邦假日" },
  // Japan
  { date: "2025-01-01", name: "元日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-01-13", name: "成人の日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-02-11", name: "建国記念の日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-02-23", name: "天皇誕生日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-03-20", name: "春分の日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-04-29", name: "昭和の日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-05-03", name: "憲法記念日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-05-04", name: "みどりの日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-05-05", name: "こどもの日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-07-21", name: "海の日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-09-15", name: "敬老の日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-09-23", name: "秋分の日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-10-13", name: "体育の日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-11-03", name: "文化の日", country: "日本", countryCode: "JP", type: "祝日" },
  { date: "2025-11-23", name: "勤労感謝の日", country: "日本", countryCode: "JP", type: "祝日" },
  // Korea
  { date: "2025-01-01", name: "새해", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-01-28", name: "설날", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-01-29", name: "설날", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-01-30", name: "설날", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-03-01", name: "삼일절", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-05-05", name: "어린이날", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-06-06", name: "현충일", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-08-15", name: "광복절", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-09-07", name: "추석", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-10-03", name: "개천절", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-10-09", name: "한글날", country: "韩国", countryCode: "KR", type: "공휴일" },
  { date: "2025-12-25", name: "크리스마스", country: "韩国", countryCode: "KR", type: "공휴일" },
  // UK
  { date: "2025-01-01", name: "New Year's Day", country: "英国", countryCode: "GB", type: "Bank Holiday" },
  { date: "2025-04-18", name: "Good Friday", country: "英国", countryCode: "GB", type: "Bank Holiday" },
  { date: "2025-04-21", name: "Easter Monday", country: "英国", countryCode: "GB", type: "Bank Holiday" },
  { date: "2025-05-05", name: "Early May Bank Holiday", country: "英国", countryCode: "GB", type: "Bank Holiday" },
  { date: "2025-05-26", name: "Spring Bank Holiday", country: "英国", countryCode: "GB", type: "Bank Holiday" },
  { date: "2025-08-25", name: "Summer Bank Holiday", country: "英国", countryCode: "GB", type: "Bank Holiday" },
  { date: "2025-12-25", name: "Christmas Day", country: "英国", countryCode: "GB", type: "Bank Holiday" },
  { date: "2025-12-26", name: "Boxing Day", country: "英国", countryCode: "GB", type: "Bank Holiday" },
  // France
  { date: "2025-01-01", name: "Jour de l'An", country: "法国", countryCode: "FR", type: "Jour férié" },
  { date: "2025-04-21", name: "Lundi de Pâques", country: "法国", countryCode: "FR", type: "Jour férié" },
  { date: "2025-05-01", name: "Fête du Travail", country: "法国", countryCode: "FR", type: "Jour férié" },
  { date: "2025-05-08", name: "Victoire 1945", country: "法国", countryCode: "FR", type: "Jour férié" },
  { date: "2025-05-29", name: "Ascension", country: "法国", countryCode: "FR", type: "Jour férié" },
  { date: "2025-06-09", name: "Lundi de Pentecôte", country: "法国", countryCode: "FR", type: "Jour férié" },
  { date: "2025-07-14", name: "Fête nationale", country: "法国", countryCode: "FR", type: "Jour férié" },
  { date: "2025-08-15", name: "Assomption", country: "法国", countryCode: "FR", type: "Jour férié" },
  { date: "2025-11-01", name: "Toussaint", country: "法国", countryCode: "FR", type: "Jour férié" },
  { date: "2025-11-11", name: "Armistice", country: "法国", countryCode: "FR", type: "Jour férié" },
  { date: "2025-12-25", name: "Noël", country: "法国", countryCode: "FR", type: "Jour férié" },
  // Germany
  { date: "2025-01-01", name: "Neujahrstag", country: "德国", countryCode: "DE", type: "Feiertag" },
  { date: "2025-04-18", name: "Karfreitag", country: "德国", countryCode: "DE", type: "Feiertag" },
  { date: "2025-04-21", name: "Ostermontag", country: "德国", countryCode: "DE", type: "Feiertag" },
  { date: "2025-05-01", name: "Tag der Arbeit", country: "德国", countryCode: "DE", type: "Feiertag" },
  { date: "2025-05-29", name: "Christi Himmelfahrt", country: "德国", countryCode: "DE", type: "Feiertag" },
  { date: "2025-06-09", name: "Pfingstmontag", country: "德国", countryCode: "DE", type: "Feiertag" },
  { date: "2025-10-03", name: "Tag der Deutschen Einheit", country: "德国", countryCode: "DE", type: "Feiertag" },
  { date: "2025-12-25", name: "Weihnachtstag", country: "德国", countryCode: "DE", type: "Feiertag" },
  { date: "2025-12-26", name: "2. Weihnachtstag", country: "德国", countryCode: "DE", type: "Feiertag" },
  // Australia
  { date: "2025-01-01", name: "New Year's Day", country: "澳大利亚", countryCode: "AU", type: "Public Holiday" },
  { date: "2025-01-26", name: "Australia Day", country: "澳大利亚", countryCode: "AU", type: "Public Holiday" },
  { date: "2025-03-29", name: "Good Friday", country: "澳大利亚", countryCode: "AU", type: "Public Holiday" },
  { date: "2025-04-25", name: "ANZAC Day", country: "澳大利亚", countryCode: "AU", type: "Public Holiday" },
  { date: "2025-12-25", name: "Christmas Day", country: "澳大利亚", countryCode: "AU", type: "Public Holiday" },
  { date: "2025-12-26", name: "Boxing Day", country: "澳大利亚", countryCode: "AU", type: "Public Holiday" },
  // Canada
  { date: "2025-01-01", name: "New Year's Day", country: "加拿大", countryCode: "CA", type: "Statutory Holiday" },
  { date: "2025-02-17", name: "Family Day", country: "加拿大", countryCode: "CA", type: "Statutory Holiday" },
  { date: "2025-04-18", name: "Good Friday", country: "加拿大", countryCode: "CA", type: "Statutory Holiday" },
  { date: "2025-05-19", name: "Victoria Day", country: "加拿大", countryCode: "CA", type: "Statutory Holiday" },
  { date: "2025-07-01", name: "Canada Day", country: "加拿大", countryCode: "CA", type: "Statutory Holiday" },
  { date: "2025-09-01", name: "Labour Day", country: "加拿大", countryCode: "CA", type: "Statutory Holiday" },
  { date: "2025-10-13", name: "Thanksgiving", country: "加拿大", countryCode: "CA", type: "Statutory Holiday" },
  { date: "2025-12-25", name: "Christmas Day", country: "加拿大", countryCode: "CA", type: "Statutory Holiday" },
  // India
  { date: "2025-01-26", name: "Republic Day", country: "印度", countryCode: "IN", type: "Gazetted Holiday" },
  { date: "2025-08-15", name: "Independence Day", country: "印度", countryCode: "IN", type: "Gazetted Holiday" },
  { date: "2025-10-02", name: "Gandhi Jayanti", country: "印度", countryCode: "IN", type: "Gazetted Holiday" },
  { date: "2025-12-25", name: "Christmas", country: "印度", countryCode: "IN", type: "Gazetted Holiday" },
  // Brazil
  { date: "2025-01-01", name: "Confraternização Universal", country: "巴西", countryCode: "BR", type: "Feriado nacional" },
  { date: "2025-04-21", name: "Tiradentes", country: "巴西", countryCode: "BR", type: "Feriado nacional" },
  { date: "2025-05-01", name: "Dia do Trabalho", country: "巴西", countryCode: "BR", type: "Feriado nacional" },
  { date: "2025-09-07", name: "Independência do Brasil", country: "巴西", countryCode: "BR", type: "Feriado nacional" },
  { date: "2025-11-15", name: "Proclamação da República", country: "巴西", countryCode: "BR", type: "Feriado nacional" },
  { date: "2025-12-25", name: "Natal", country: "巴西", countryCode: "BR", type: "Feriado nacional" },
  // Russia
  { date: "2025-01-01", name: "Новый год", country: "俄罗斯", countryCode: "RU", type: "Праздник" },
  { date: "2025-01-07", name: "Рождество", country: "俄罗斯", countryCode: "RU", type: "Праздник" },
  { date: "2025-02-23", name: "День защитника Отечества", country: "俄罗斯", countryCode: "RU", type: "Праздник" },
  { date: "2025-03-08", name: "Международный женский день", country: "俄罗斯", countryCode: "RU", type: "Праздник" },
  { date: "2025-05-01", name: "Праздник Весны и Труда", country: "俄罗斯", countryCode: "RU", type: "Праздник" },
  { date: "2025-05-09", name: "День Победы", country: "俄罗斯", countryCode: "RU", type: "Праздник" },
  { date: "2025-06-12", name: "День России", country: "俄罗斯", countryCode: "RU", type: "Праздник" },
  { date: "2025-11-04", name: "День народного единства", country: "俄罗斯", countryCode: "RU", type: "Праздник" },
];

const MONTH_NAMES = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function WorldHolidaysTool() {
  const [selectedCountry, setSelectedCountry] = useState("CN");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const filteredHolidays = useMemo(() => {
    return HOLIDAYS.filter(
      (h) => h.countryCode === selectedCountry && h.date.startsWith(String(currentYear))
    );
  }, [selectedCountry, currentYear]);

  const holidaysThisMonth = useMemo(() => {
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    return filteredHolidays.filter((h) => h.date.startsWith(`${currentYear}-${monthStr}`));
  }, [filteredHolidays, currentYear, currentMonth]);

  const holidayDates = useMemo(() => {
    const dates = new Set<string>();
    filteredHolidays.forEach((h) => dates.add(h.date));
    return dates;
  }, [filteredHolidays]);

  const getHolidaysForDate = (day: number): Holiday[] => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filteredHolidays.filter((h) => h.date === dateStr);
  };

  const isHoliday = (day: number): boolean => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidayDates.has(dateStr);
  };

  const countryInfo = COUNTRIES.find((c) => c.code === selectedCountry);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const today = new Date();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>选择国家/地区</Label>
          <Select value={selectedCountry} onValueChange={(v) => { if (v !== null) setSelectedCountry(v); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>查看方式</Label>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "calendar" | "list")}>
            <TabsList className="w-full">
              <TabsTrigger value="calendar" className="flex-1">
                <Calendar className="h-3.5 w-3.5 mr-1" /> 日历
              </TabsTrigger>
              <TabsTrigger value="list" className="flex-1">
                <List className="h-3.5 w-3.5 mr-1" /> 列表
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-3 flex items-center gap-3">
          <Globe className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">
              {countryInfo?.flag} {countryInfo?.name} · {currentYear} 年
            </p>
            <p className="text-xs text-muted-foreground">
              共 {filteredHolidays.length} 个假期
            </p>
          </div>
        </CardContent>
      </Card>

      {viewMode === "calendar" ? (
        <Card>
          <CardContent className="p-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">
                {currentYear} 年 {MONTH_NAMES[currentMonth]}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const holiday = isHoliday(day);
                const isToday =
                  currentYear === today.getFullYear() &&
                  currentMonth === today.getMonth() &&
                  day === today.getDate();
                const dayHolidays = getHolidaysForDate(day);

                return (
                  <div
                    key={day}
                    className={`h-10 rounded-lg flex flex-col items-center justify-center text-xs relative
                      ${holiday ? "bg-primary/10 text-primary font-semibold" : ""}
                      ${isToday ? "ring-1 ring-primary" : ""}
                      ${dayHolidays.length > 0 ? "cursor-pointer" : ""}
                    `}
                    title={dayHolidays.map((h) => h.name).join(", ")}
                  >
                    <span>{day}</span>
                    {holiday && (
                      <span className="w-1 h-1 rounded-full bg-primary absolute bottom-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* This month's holidays */}
            {holidaysThisMonth.length > 0 && (
              <div className="mt-4 pt-3 border-t space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">本月假期</p>
                {holidaysThisMonth.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <span className="font-medium">{h.name}</span>
                    <span className="text-muted-foreground text-xs">{h.date}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredHolidays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                该年度暂无数据
              </div>
            ) : (
              <div className="divide-y">
                {filteredHolidays.map((h, i) => {
                  const d = new Date(h.date);
                  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()];
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{d.getDate()}</span>
                        <span className="text-[10px] text-primary/70">{MONTH_NAMES[d.getMonth()].slice(0, 1)}月</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.date} · {weekday}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{h.type}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        * 假期数据仅供参考，实际日期以各国官方公告为准
      </p>
    </div>
  );
}
