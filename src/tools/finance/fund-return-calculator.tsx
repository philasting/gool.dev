"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

interface FundRow {
  year: number;
  startValue: number;
  contribution: number;
  gain: number;
  endValue: number;
  cumulativeReturn: number;
}

function calcFundReturn(
  initial: number,
  monthlyAmount: number,
  annualReturn: number,
  years: number,
  isLumpSum: boolean
): { final: number; totalInvested: number; totalGain: number; cagr: number; rows: FundRow[] } {
  const monthlyRate = annualReturn / 100 / 12;
  let value = initial;
  let totalInvested = initial;
  const rows: FundRow[] = [];

  for (let y = 1; y <= years; y++) {
    const startValue = value;
    let yearContrib = 0;
    for (let m = 0; m < 12; m++) {
      if (!isLumpSum || (isLumpSum && m === 0)) {
        const contrib = isLumpSum && y === 1 ? 0 : (isLumpSum ? 0 : monthlyAmount);
        if (y === 1 && m === 0 && isLumpSum) {
          // no additional for lump sum after initial
        } else if (!isLumpSum) {
          value += monthlyAmount;
          yearContrib += monthlyAmount;
          totalInvested += monthlyAmount;
        }
      }
      value *= (1 + monthlyRate);
    }
    const gain = value - startValue - yearContrib;
    rows.push({
      year: y,
      startValue: Math.round(startValue * 100) / 100,
      contribution: Math.round(yearContrib * 100) / 100,
      gain: Math.round(gain * 100) / 100,
      endValue: Math.round(value * 100) / 100,
      cumulativeReturn: totalInvested > 0 ? Math.round(((value - totalInvested) / totalInvested) * 10000) / 100 : 0,
    });
  }

  const totalGain = value - totalInvested;
  const cagr = years > 0 ? (Math.pow(value / Math.max(1, totalInvested), 1 / years) - 1) * 100 : 0;

  return {
    final: Math.round(value * 100) / 100,
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalGain: Math.round(totalGain * 100) / 100,
    cagr: Math.round(cagr * 100) / 100,
    rows,
  };
}

const SCENARIOS = [
  { label: "保守 (3%)", rate: 3 },
  { label: "稳健 (6%)", rate: 6 },
  { label: "积极 (10%)", rate: 10 },
  { label: "激进 (15%)", rate: 15 },
];

export function FundReturnCalculatorTool() {
  const [initial, setInitial] = useState(10000);
  const [monthlyAmount, setMonthlyAmount] = useState(2000);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [years, setYears] = useState(10);
  const [mode, setMode] = useState<"dca" | "lumpSum">("dca");

  const result = useMemo(
    () => calcFundReturn(initial, monthlyAmount, annualReturn, years, mode === "lumpSum"),
    [initial, monthlyAmount, annualReturn, years, mode]
  );

  // 场景对比
  const scenarios = useMemo(
    () =>
      SCENARIOS.map((s) => ({
        ...s,
        ...calcFundReturn(initial, monthlyAmount, s.rate, years, mode === "lumpSum"),
      })),
    [initial, monthlyAmount, years, mode]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            投资参数
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label>初始投入 (元)</Label>
            <Input type="number" value={initial} onChange={(e) => setInitial(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>{mode === "dca" ? "每月定投 (元)" : "一次性总额 (元)"}</Label>
            <Input
              type="number"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>预期年化 (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>投资年限</Label>
            <Input type="number" min={1} value={years} onChange={(e) => setYears(Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <div>
            <Label>投资方式</Label>
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => setMode("dca")}
                className={`px-3 py-1 text-xs rounded border ${
                  mode === "dca" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                定投
              </button>
              <button
                onClick={() => setMode("lumpSum")}
                className={`px-3 py-1 text-xs rounded border ${
                  mode === "lumpSum" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                一次性
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 结果 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-xs text-muted-foreground">最终资产</p>
            <p className="text-2xl font-bold text-emerald-600">¥{result.final.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">累计投入</p>
            <p className="text-2xl font-bold text-blue-600">¥{result.totalInvested.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            {result.totalGain >= 0 ? (
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            ) : (
              <TrendingDown className="h-5 w-5 mx-auto mb-1 text-red-500" />
            )}
            <p className="text-xs text-muted-foreground">累计收益</p>
            <p className={`text-2xl font-bold ${result.totalGain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {result.totalGain >= 0 ? "+" : ""}¥{result.totalGain.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">年化复合回报</p>
            <p className="text-2xl font-bold text-purple-600">{result.cagr}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 场景对比 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">不同预期收益率对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">收益场景</th>
                  <th className="text-right py-2">最终资产</th>
                  <th className="text-right py-2">累计投入</th>
                  <th className="text-right py-2">累计收益</th>
                  <th className="text-right py-2">总回报率</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s, i) => (
                  <tr key={i} className="border-b hover:bg-muted/30">
                    <td className="py-2 font-medium">{s.label}</td>
                    <td className="text-right py-2">¥{s.final.toLocaleString()}</td>
                    <td className="text-right py-2">¥{s.totalInvested.toLocaleString()}</td>
                    <td className={`text-right py-2 ${s.totalGain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {s.totalGain >= 0 ? "+" : ""}¥{s.totalGain.toLocaleString()}
                    </td>
                    <td className={`text-right py-2 ${s.cagr >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {s.cagr}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 年度明细 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">年度增长明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">年份</th>
                  <th className="text-right py-2">年初净值</th>
                  <th className="text-right py-2">年投入</th>
                  <th className="text-right py-2">年收益</th>
                  <th className="text-right py-2">年末净值</th>
                  <th className="text-right py-2">累计回报</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.year} className="border-b hover:bg-muted/30">
                    <td className="py-2 font-medium">第{row.year}年</td>
                    <td className="text-right py-2">¥{row.startValue.toLocaleString()}</td>
                    <td className="text-right py-2">¥{row.contribution.toLocaleString()}</td>
                    <td className={`text-right py-2 ${row.gain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {row.gain >= 0 ? "+" : ""}¥{row.gain.toLocaleString()}
                    </td>
                    <td className="text-right py-2 font-medium">¥{row.endValue.toLocaleString()}</td>
                    <td className="text-right py-2 text-purple-600">{row.cumulativeReturn}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
