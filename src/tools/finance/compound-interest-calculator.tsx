"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, PiggyBank, Calendar, DollarSign } from "lucide-react";

interface YearRow {
  year: number;
  startAmount: number;
  contribution: number;
  interest: number;
  endAmount: number;
}

function calcCompound(
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number,
  compoundFreq: number
): { final: number; totalContribution: number; totalInterest: number; rows: YearRow[] } {
  const ratePerPeriod = annualRate / 100 / compoundFreq;
  const periods = years * compoundFreq;
  const monthlyContribPerPeriod = monthlyContribution * (12 / compoundFreq);

  let balance = principal;
  let totalContribution = principal;
  const rows: YearRow[] = [];

  for (let y = 1; y <= years; y++) {
    const startAmount = balance;
    let yearContribution = 0;
    let yearInterest = 0;
    for (let p = 0; p < compoundFreq; p++) {
      const contrib = monthlyContribPerPeriod;
      balance += contrib;
      yearContribution += contrib;
      const interest = balance * ratePerPeriod;
      balance += interest;
      yearInterest += interest;
    }
    totalContribution += yearContribution;
    rows.push({
      year: y,
      startAmount: Math.round(startAmount * 100) / 100,
      contribution: Math.round(yearContribution * 100) / 100,
      interest: Math.round(yearInterest * 100) / 100,
      endAmount: Math.round(balance * 100) / 100,
    });
  }

  return {
    final: Math.round(balance * 100) / 100,
    totalContribution: Math.round(totalContribution * 100) / 100,
    totalInterest: Math.round((balance - totalContribution) * 100) / 100,
    rows,
  };
}

const COMPOUND_OPTIONS = [
  { value: 1, label: "按年" },
  { value: 4, label: "按季" },
  { value: 12, label: "按月" },
  { value: 365, label: "按日" },
];

export function CompoundInterestCalculatorTool() {
  const [principal, setPrincipal] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(5000);
  const [annualRate, setAnnualRate] = useState(4);
  const [years, setYears] = useState(20);
  const [compoundFreq, setCompoundFreq] = useState(12);

  const result = useMemo(
    () => calcCompound(principal, monthlyContribution, annualRate, years, compoundFreq),
    [principal, monthlyContribution, annualRate, years, compoundFreq]
  );

  return (
    <div className="space-y-6">
      {/* 输入区 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            复利计算参数
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label>初始本金 (元)</Label>
            <Input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>月定投额 (元)</Label>
            <Input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>年化收益率 (%)</Label>
            <Input
              type="number"
              value={annualRate}
              step="0.1"
              onChange={(e) => setAnnualRate(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>投资年限</Label>
            <Input
              type="number"
              value={years}
              onChange={(e) => setYears(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div>
            <Label>复利频率</Label>
            <div className="flex gap-1 mt-1">
              {COMPOUND_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={compoundFreq === opt.value ? "default" : "outline"}
                  onClick={() => setCompoundFreq(opt.value)}
                  className="text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 结果汇总 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-xs text-muted-foreground">最终资产</p>
            <p className="text-2xl font-bold text-emerald-600">
              ¥{result.final.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <PiggyBank className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-muted-foreground">累计投入</p>
            <p className="text-2xl font-bold text-blue-600">
              ¥{result.totalContribution.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xs text-muted-foreground">利息收益</p>
            <p className="text-2xl font-bold text-amber-600">
              ¥{result.totalInterest.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 年度明细表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            年度增长明细
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">年份</th>
                  <th className="text-right py-2">年初金额</th>
                  <th className="text-right py-2">年投入</th>
                  <th className="text-right py-2">年收益</th>
                  <th className="text-right py-2">年末金额</th>
                  <th className="text-right py-2">进度</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.year} className="border-b hover:bg-muted/30">
                    <td className="py-2 font-medium">第 {row.year} 年</td>
                    <td className="text-right py-2">¥{row.startAmount.toLocaleString()}</td>
                    <td className="text-right py-2">¥{row.contribution.toLocaleString()}</td>
                    <td className="text-right py-2 text-emerald-600">+¥{row.interest.toLocaleString()}</td>
                    <td className="text-right py-2 font-medium">¥{row.endAmount.toLocaleString()}</td>
                    <td className="text-right py-2">
                      <div className="w-16 h-1.5 bg-muted/30 rounded-full ml-auto overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, (row.endAmount / result.final) * 100)}%` }}
                        />
                      </div>
                    </td>
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
