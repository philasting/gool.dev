"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Heart } from "lucide-react";

interface LifeStats {
  livedYears: number;
  livedMonths: number;
  livedWeeks: number;
  livedDays: number;
  totalYears: number;
  totalWeeks: number;
  remainYears: number;
  remainMonths: number;
  remainWeeks: number;
  remainDays: number;
  percentLived: number;
}

function calculateLifeStats(birthDate: string, lifeExpectancy: number): LifeStats | null {
  const birth = new Date(birthDate);
  const now = new Date();

  if (isNaN(birth.getTime()) || birth > now) return null;

  const deathDate = new Date(birth);
  deathDate.setFullYear(deathDate.getFullYear() + lifeExpectancy);

  const livedMs = now.getTime() - birth.getTime();
  const totalMs = deathDate.getTime() - birth.getTime();

  const livedDays = Math.floor(livedMs / (1000 * 60 * 60 * 24));
  const livedWeeks = Math.floor(livedDays / 7);
  const livedMonths = Math.floor(livedDays / 30.44);
  const livedYears = Math.floor(livedDays / 365.25);

  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);

  const remainDays = totalDays - livedDays;
  const remainWeeks = Math.floor(remainDays / 7);
  const remainMonths = Math.floor(remainDays / 30.44);
  const remainYears = Math.floor(remainDays / 365.25);

  const percentLived = Math.min(100, (livedMs / totalMs) * 100);

  return {
    livedYears,
    livedMonths,
    livedWeeks,
    livedDays,
    totalYears: lifeExpectancy,
    totalWeeks,
    remainYears,
    remainMonths,
    remainWeeks,
    remainDays,
    percentLived,
  };
}

export function LifeProgressTool() {
  const [birthDate, setBirthDate] = useState("1995-01-01");
  const [lifeExpectancy, setLifeExpectancy] = useState(80);

  const stats = useMemo(
    () => calculateLifeStats(birthDate, lifeExpectancy),
    [birthDate, lifeExpectancy]
  );

  // Life grid data (52 weeks per row × lifeExpectancy rows)
  const gridData = useMemo(() => {
    if (!stats) return [];
    const weeks = [];
    for (let week = 0; week < stats.totalWeeks; week++) {
      weeks.push(week < stats.livedWeeks);
    }
    return weeks;
  }, [stats]);

  // Current year progress
  const yearProgress = useMemo(() => {
    const birth = new Date(birthDate);
    const now = new Date();
    if (isNaN(birth.getTime())) return 0;
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    return ((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100;
  }, [birthDate]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>出生日期</Label>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>预期寿命</Label>
            <span className="text-sm font-mono text-primary">{lifeExpectancy} 岁</span>
          </div>
          <Slider
            value={[lifeExpectancy]}
            onValueChange={(v) => setLifeExpectancy(Array.isArray(v) ? v[0] : v)}
            min={50}
            max={120}
            step={1}
          />
        </div>
      </div>

      {stats && (
        <>
          {/* Circular progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted/30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 85}`}
                      strokeDashoffset={`${2 * Math.PI * 85 * (1 - stats.percentLived / 100)}`}
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {stats.percentLived.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">人生已过</span>
                  </div>
                </div>

                <div className="mt-3 text-sm text-muted-foreground">
                  {stats.livedYears} 岁 · 今年已过 {yearProgress.toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.livedYears}</p>
                <p className="text-xs text-muted-foreground">已活年数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.remainYears}</p>
                <p className="text-xs text-muted-foreground">剩余年数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.livedMonths.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">已活月数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.remainMonths.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">剩余月数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.livedWeeks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">已活周数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.remainWeeks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">剩余周数</p>
              </CardContent>
            </Card>
            <Card className="col-span-2">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.livedDays.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">已活天数</p>
              </CardContent>
            </Card>
          </div>

          {/* Life grid (each cell = 1 week) */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">生命格子图</p>
                <p className="text-xs text-muted-foreground">每格 = 1周，{stats.totalWeeks} 格 = {lifeExpectancy} 年</p>
              </div>

              <div className="flex gap-3 text-xs text-muted-foreground mb-1">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
                  已过
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-muted/30" />
                  剩余
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-flex flex-col gap-0.5" style={{ minWidth: "max-content" }}>
                  {Array.from({ length: lifeExpectancy }, (_, yearIdx) => {
                    const rowStart = yearIdx * 52;
                    const rowEnd = rowStart + 52;
                    const weekCells = gridData.slice(rowStart, rowEnd);

                    return (
                      <div key={yearIdx} className="flex gap-0.5">
                        {weekCells.map((lived, weekIdx) => (
                          <div
                            key={weekIdx}
                            className="w-2.5 h-2.5 rounded-[1px]"
                            style={{
                              backgroundColor: lived
                                ? `hsl(var(--primary))`
                                : "hsl(var(--muted) / 0.3)",
                            }}
                            title={`${yearIdx + 1}岁 第${weekIdx + 1}周`}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                行 = 年龄（1-{lifeExpectancy}），列 = 周数（1-52）
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {!stats && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">请输入出生日期查看你的人生进度</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
