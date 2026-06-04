"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calculator, CalendarDays } from "lucide-react";

type DateUnit = "days" | "months" | "years" | "weeks";

interface DateInterval {
  years: number;
  months: number;
  days: number;
  weeks: number;
  hours: number;
  totalDays: number;
  workDays: number;
}

function calcInterval(start: Date, end: Date): DateInterval {
  const msPerDay = 86400000;
  const msPerHour = 3600000;
  const totalMs = end.getTime() - start.getTime();
  const totalDays = Math.abs(Math.floor(totalMs / msPerDay));
  const hours = Math.abs(Math.floor(totalMs / msPerHour));

  // Calculate years, months, days
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  if (totalMs < 0) {
    years = -years;
    months = -months;
    days = -days;
  }

  const weeks = Math.floor(totalDays / 7);

  // Calculate work days (Mon-Fri)
  let workDays = 0;
  const startDate = new Date(Math.min(start.getTime(), end.getTime()));
  const endDate = new Date(Math.max(start.getTime(), end.getTime()));
  const current = new Date(startDate);
  while (current < endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) workDays++;
    current.setDate(current.getDate() + 1);
  }

  return { years: Math.abs(years), months: Math.abs(months), days: Math.abs(days), weeks, hours, totalDays, workDays };
}

function calcDateOffset(base: Date, amount: number, unit: DateUnit): Date {
  const result = new Date(base);
  switch (unit) {
    case "days":
      result.setDate(result.getDate() + amount);
      break;
    case "weeks":
      result.setDate(result.getDate() + amount * 7);
      break;
    case "months":
      result.setMonth(result.getMonth() + amount);
      break;
    case "years":
      result.setFullYear(result.getFullYear() + amount);
      break;
  }
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
}

function calcWorkDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(Math.min(start.getTime(), end.getTime()));
  const endDate = new Date(Math.max(start.getTime(), end.getTime()));
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function DateCalculatorTool() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [interval, setInterval] = useState<DateInterval | null>(null);

  const [offsetDate, setOffsetDate] = useState("");
  const [offsetAmount, setOffsetAmount] = useState(0);
  const [offsetUnit, setOffsetUnit] = useState<DateUnit>("days");
  const [offsetResult, setOffsetResult] = useState<Date | null>(null);
  const [offsetWorkDays, setOffsetWorkDays] = useState<number | null>(null);

  const handleCalcInterval = useCallback(() => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    setInterval(calcInterval(start, end));
  }, [startDate, endDate]);

  const handleCalcOffset = useCallback(() => {
    if (!offsetDate || offsetAmount === 0) return;
    const base = new Date(offsetDate);
    const result = calcDateOffset(base, offsetAmount, offsetUnit);
    setOffsetResult(result);
    setOffsetWorkDays(calcWorkDaysBetween(base, result));
  }, [offsetDate, offsetAmount, offsetUnit]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="interval">
        <TabsList>
          <TabsTrigger value="interval">日期间隔</TabsTrigger>
          <TabsTrigger value="offset">日期推算</TabsTrigger>
        </TabsList>

        <TabsContent value="interval" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">开始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">结束日期</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
          <Button onClick={handleCalcInterval} disabled={!startDate || !endDate}>
            <Calculator className="h-4 w-4 mr-1" /> 计算
          </Button>

          {interval && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">计算结果</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <ResultItem label="年" value={interval.years} />
                  <ResultItem label="月" value={interval.months} />
                  <ResultItem label="天" value={interval.days} />
                  <ResultItem label="周" value={interval.weeks} />
                  <ResultItem label="总天数" value={interval.totalDays} />
                  <ResultItem label="工作日" value={interval.workDays} />
                  <ResultItem label="总小时" value={interval.hours} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="offset" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">基准日期</Label>
              <Input
                type="date"
                value={offsetDate}
                onChange={(e) => setOffsetDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">数量</Label>
              <Input
                type="number"
                value={offsetAmount}
                onChange={(e) => setOffsetAmount(Number(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">单位</Label>
              <Select value={offsetUnit} onValueChange={(v) => setOffsetUnit(v as DateUnit)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">天</SelectItem>
                  <SelectItem value="weeks">周</SelectItem>
                  <SelectItem value="months">月</SelectItem>
                  <SelectItem value="years">年</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCalcOffset} disabled={!offsetDate || offsetAmount === 0}>
            <CalendarDays className="h-4 w-4 mr-1" /> 推算
          </Button>

          {offsetResult && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold">推算结果</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">目标日期</span>
                    <span className="text-sm font-semibold">{formatDate(offsetResult)}</span>
                  </div>
                  {offsetWorkDays !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">工作日数</span>
                      <span className="text-sm font-semibold">{offsetWorkDays} 天</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResultItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/50">
      <div className="text-lg font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
