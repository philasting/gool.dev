"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";

/** 中国 2024 个税七级超额累进税率表 */
const TAX_BRACKETS = [
  { upper: 36000, rate: 0.03, deduction: 0 },
  { upper: 144000, rate: 0.10, deduction: 2520 },
  { upper: 300000, rate: 0.20, deduction: 16920 },
  { upper: 420000, rate: 0.25, deduction: 31920 },
  { upper: 660000, rate: 0.30, deduction: 52920 },
  { upper: 960000, rate: 0.35, deduction: 85920 },
  { upper: Infinity, rate: 0.45, deduction: 181920 },
];

interface TaxResult {
  taxableIncome: number;
  rate: number;
  deduction: number;
  tax: number;
  afterTax: number;
  bracketIndex: number;
}

function calculateTax(
  monthlySalary: number,
  socialInsurance: number,
  specialDeduction: number,
  threshold: number
): TaxResult {
  const taxableIncome = Math.max(0, monthlySalary - socialInsurance - specialDeduction - threshold);

  let bracketIndex = 0;
  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    if (taxableIncome <= TAX_BRACKETS[i].upper) {
      bracketIndex = i;
      break;
    }
  }

  const bracket = TAX_BRACKETS[bracketIndex];
  const tax = Math.max(0, taxableIncome * bracket.rate - bracket.deduction);
  const afterTax = monthlySalary - socialInsurance - tax;

  return {
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    rate: bracket.rate,
    deduction: bracket.deduction,
    tax: Math.round(tax * 100) / 100,
    afterTax: Math.round(afterTax * 100) / 100,
    bracketIndex,
  };
}

function formatMoney(value: number): string {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function rateLabel(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

export function TaxCalculatorTool() {
  const [salary, setSalary] = useState("15000");
  const [socialInsurance, setSocialInsurance] = useState("2000");
  const [specialDeduction, setSpecialDeduction] = useState("0");
  const [threshold, setThreshold] = useState("5000");
  const [result, setResult] = useState<TaxResult | null>(null);

  const handleCalculate = () => {
    const s = parseFloat(salary) || 0;
    const si = parseFloat(socialInsurance) || 0;
    const sd = parseFloat(specialDeduction) || 0;
    const th = parseFloat(threshold) || 0;
    if (s <= 0) return;
    setResult(calculateTax(s, si, sd, th));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>月收入（元）</Label>
          <Input
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="15000"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>五险一金（元）</Label>
          <Input
            type="number"
            value={socialInsurance}
            onChange={(e) => setSocialInsurance(e.target.value)}
            placeholder="2000"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>专项附加扣除（元）</Label>
          <Input
            type="number"
            value={specialDeduction}
            onChange={(e) => setSpecialDeduction(e.target.value)}
            placeholder="0"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>起征点（元）</Label>
          <Input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="5000"
            className="font-mono"
          />
        </div>
      </div>

      <Button onClick={handleCalculate} size="sm">
        <Calculator className="h-4 w-4 mr-1" /> 计算
      </Button>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">应纳税所得额</p>
                <p className="text-sm font-bold font-mono">{formatMoney(result.taxableIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">适用税率</p>
                <p className="text-sm font-bold text-yellow-600">{rateLabel(result.rate)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">速算扣除数</p>
                <p className="text-sm font-bold font-mono">{formatMoney(result.deduction)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">应缴个税</p>
                <p className="text-sm font-bold text-red-600">{formatMoney(result.tax)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">税后收入</p>
                <p className="text-sm font-bold text-green-600">{formatMoney(result.afterTax)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">七级超额累进税率表</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-left font-semibold">级数</th>
                    <th className="py-2 px-2 text-left font-semibold">应纳税所得额</th>
                    <th className="py-2 px-2 text-right font-semibold">税率</th>
                    <th className="py-2 px-2 text-right font-semibold">速算扣除数</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { level: 1, range: "≤ 36,000", rate: "3%", deduction: "0" },
                    { level: 2, range: "36,000 - 144,000", rate: "10%", deduction: "2,520" },
                    { level: 3, range: "144,000 - 300,000", rate: "20%", deduction: "16,920" },
                    { level: 4, range: "300,000 - 420,000", rate: "25%", deduction: "31,920" },
                    { level: 5, range: "420,000 - 660,000", rate: "30%", deduction: "52,920" },
                    { level: 6, range: "660,000 - 960,000", rate: "35%", deduction: "85,920" },
                    { level: 7, range: "> 960,000", rate: "45%", deduction: "181,920" },
                  ].map((row) => (
                    <tr
                      key={row.level}
                      className={`border-b border-border/50 ${
                        result.bracketIndex === row.level - 1
                          ? "bg-primary/10 font-semibold"
                          : ""
                      }`}
                    >
                      <td className="py-1.5 px-2">{row.level}</td>
                      <td className="py-1.5 px-2 font-mono">{row.range}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{row.rate}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{row.deduction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              * 应纳税所得额 = 月收入 - 五险一金 - 专项附加扣除 - 起征点
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
