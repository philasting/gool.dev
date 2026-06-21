"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, Info, TrendingUp, Calendar } from "lucide-react";

// 2026年6月参考利率
const BANK_RATES: { bank: string; demand: number; threeMonth: number; sixMonth: number; oneYear: number; twoYear: number; threeYear: number; fiveYear: number }[] = [
  { bank: "工商银行", demand: 0.10, threeMonth: 1.05, sixMonth: 1.25, oneYear: 1.45, twoYear: 1.65, threeYear: 1.95, fiveYear: 2.00 },
  { bank: "建设银行", demand: 0.10, threeMonth: 1.05, sixMonth: 1.25, oneYear: 1.45, twoYear: 1.65, threeYear: 1.95, fiveYear: 2.00 },
  { bank: "农业银行", demand: 0.10, threeMonth: 1.05, sixMonth: 1.25, oneYear: 1.45, twoYear: 1.65, threeYear: 1.95, fiveYear: 2.00 },
  { bank: "中国银行", demand: 0.10, threeMonth: 1.05, sixMonth: 1.25, oneYear: 1.45, twoYear: 1.65, threeYear: 1.95, fiveYear: 2.00 },
  { bank: "招商银行", demand: 0.10, threeMonth: 1.05, sixMonth: 1.25, oneYear: 1.50, twoYear: 1.70, threeYear: 2.00, fiveYear: 2.05 },
  { bank: "兴业银行", demand: 0.10, threeMonth: 1.10, sixMonth: 1.30, oneYear: 1.55, twoYear: 1.75, threeYear: 2.05, fiveYear: 2.10 },
  { bank: "民生银行", demand: 0.10, threeMonth: 1.10, sixMonth: 1.30, oneYear: 1.55, twoYear: 1.75, threeYear: 2.05, fiveYear: 2.10 },
  { bank: "微众银行", demand: 0.15, threeMonth: 1.30, sixMonth: 1.55, oneYear: 1.80, twoYear: 2.10, threeYear: 2.45, fiveYear: 2.50 },
  { bank: "网商银行", demand: 0.15, threeMonth: 1.25, sixMonth: 1.50, oneYear: 1.75, twoYear: 2.00, threeYear: 2.35, fiveYear: 2.40 },
];

const TERMS = [
  { key: "demand" as const, label: "活期" },
  { key: "threeMonth" as const, label: "3个月" },
  { key: "sixMonth" as const, label: "6个月" },
  { key: "oneYear" as const, label: "1年" },
  { key: "twoYear" as const, label: "2年" },
  { key: "threeYear" as const, label: "3年" },
  { key: "fiveYear" as const, label: "5年" },
];

export function DepositRateComparisonTool() {
  const [principal, setPrincipal] = useState(100000);
  const [selectedTerm, setSelectedTerm] = useState<typeof TERMS[number]["key"]>("oneYear");

  // 找到该期限最高利率
  const bestRate = useMemo(() => {
    let max = 0;
    let bank = "";
    BANK_RATES.forEach((b) => {
      if (b[selectedTerm] > max) { max = b[selectedTerm]; bank = b.bank; }
    });
    return { rate: max, bank };
  }, [selectedTerm]);

  // 各银行该期限收益
  const rows = useMemo(
    () =>
      BANK_RATES.map((b) => {
        const rate = b[selectedTerm];
        const years = selectedTerm === "demand" ? 1 : (selectedTerm === "threeMonth" ? 0.25 : selectedTerm === "sixMonth" ? 0.5 : selectedTerm === "oneYear" ? 1 : selectedTerm === "twoYear" ? 2 : selectedTerm === "threeYear" ? 3 : 5);
        const interest = Math.round(principal * (rate / 100) * years * 100) / 100;
        return { bank: b.bank, rate, interest, years };
      })
      .sort((a, b) => b.interest - a.interest),
    [principal, selectedTerm]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5 text-amber-500" />
            存款参数
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>存款本金 (元)</Label>
            <Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value) || 0)} />
          </div>
          <div className="col-span-2">
            <Label>存款期限</Label>
            <div className="flex gap-1 mt-1 flex-wrap">
              {TERMS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSelectedTerm(t.key)}
                  className={`px-3 py-1 text-xs rounded border ${
                    selectedTerm === t.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 最优利率 */}
      <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">🏆 当前最优利率</p>
              <p className="text-3xl font-bold text-emerald-600">{bestRate.rate}%</p>
              <p className="text-xs text-muted-foreground mt-1">{bestRate.bank}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">预期收益</p>
              <p className="text-2xl font-bold text-emerald-600">
                ¥{rows[0]?.interest.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 银行对比表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            银行利率对比
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">银行</th>
                  <th className="text-right py-2">利率</th>
                  <th className="text-right py-2">期限(年)</th>
                  <th className="text-right py-2">预期利息</th>
                  <th className="text-right py-2">本息合计</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.bank}
                    className={`border-b hover:bg-muted/30 ${
                      i === 0 ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                    }`}
                  >
                    <td className="py-2 font-medium">
                      {row.bank}
                      {i === 0 && <span className="ml-2 text-xs text-emerald-600">🏆 最优</span>}
                    </td>
                    <td className="text-right py-2 font-medium">{row.rate}%</td>
                    <td className="text-right py-2 text-muted-foreground">{row.years}</td>
                    <td className="text-right py-2 text-emerald-600">+¥{row.interest.toLocaleString()}</td>
                    <td className="text-right py-2 font-medium">¥{(principal + row.interest).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 全期限利率一览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            各期限利率总览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">银行</th>
                  {TERMS.map((t) => (
                    <th key={t.key} className="text-right py-2">{t.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BANK_RATES.map((row) => (
                  <tr key={row.bank} className="border-b hover:bg-muted/30">
                    <td className="py-2 font-medium">{row.bank}</td>
                    {TERMS.map((t) => (
                      <td
                        key={t.key}
                        className={`text-right py-2 ${
                          row[t.key] === bestRate.rate && t.key === selectedTerm
                            ? "text-emerald-600 font-bold"
                            : ""
                        }`}
                      >
                        {row[t.key]}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>利率数据为2026年6月参考值，实际利率以各银行网点公告为准。互联网银行存款利率通常高于传统银行。存款保险制度保障50万元以内本息安全。</span>
      </div>
    </div>
  );
}
