"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Home } from "lucide-react";

type RepaymentMethod = "equal_installment" | "equal_principal";

interface MonthlyDetail {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

/** 等额本息：M = P × r × (1+r)^n / ((1+r)^n - 1) */
function calcEqualInstallment(
  principal: number,
  annualRate: number,
  years: number
): { monthlyPayment: number; totalInterest: number; totalPayment: number; details: MonthlyDetail[] } {
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  const P = principal;

  if (monthlyRate === 0) {
    const monthlyPayment = P / n;
    return {
      monthlyPayment,
      totalInterest: 0,
      totalPayment: P,
      details: Array.from({ length: n }, (_, i) => ({
        month: i + 1,
        payment: monthlyPayment,
        principal: monthlyPayment,
        interest: 0,
        remaining: P - monthlyPayment * (i + 1),
      })),
    };
  }

  const monthlyPayment = P * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1);
  const totalPayment = monthlyPayment * n;
  const totalInterest = totalPayment - P;

  let remaining = P;
  const details: MonthlyDetail[] = [];
  for (let i = 1; i <= n; i++) {
    const interest = remaining * monthlyRate;
    const principalPart = monthlyPayment - interest;
    remaining -= principalPart;
    if (remaining < 0) remaining = 0;
    details.push({
      month: i,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPart * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
    });
  }

  return { monthlyPayment, totalInterest, totalPayment, details };
}

/** 等额本金 */
function calcEqualPrincipal(
  principal: number,
  annualRate: number,
  years: number
): { firstPayment: number; lastPayment: number; totalInterest: number; totalPayment: number; details: MonthlyDetail[] } {
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  const P = principal;
  const monthlyPrincipal = P / n;

  let remaining = P;
  let totalInterest = 0;
  const details: MonthlyDetail[] = [];

  for (let i = 1; i <= n; i++) {
    const interest = remaining * monthlyRate;
    const payment = monthlyPrincipal + interest;
    remaining -= monthlyPrincipal;
    if (remaining < 0) remaining = 0;
    totalInterest += interest;
    details.push({
      month: i,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(monthlyPrincipal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
    });
  }

  return {
    firstPayment: details[0].payment,
    lastPayment: details[details.length - 1].payment,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round((P + totalInterest) * 100) / 100,
    details,
  };
}

function formatMoney(value: number): string {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function MortgageCalculatorTool() {
  const [principal, setPrincipal] = useState("1000000");
  const [years, setYears] = useState("30");
  const [annualRate, setAnnualRate] = useState("3.45");
  const [method, setMethod] = useState<RepaymentMethod>("equal_installment");
  const [result, setResult] = useState<{
    monthlyPayment?: number;
    firstPayment?: number;
    lastPayment?: number;
    totalInterest: number;
    totalPayment: number;
    details: MonthlyDetail[];
  } | null>(null);

  const handleCalculate = () => {
    const P = parseFloat(principal);
    const Y = parseInt(years, 10);
    const R = parseFloat(annualRate);

    if (!P || !Y || isNaN(R) || P <= 0 || Y <= 0) return;

    if (method === "equal_installment") {
      const calc = calcEqualInstallment(P, R, Y);
      setResult({
        monthlyPayment: Math.round(calc.monthlyPayment * 100) / 100,
        totalInterest: Math.round(calc.totalInterest * 100) / 100,
        totalPayment: Math.round(calc.totalPayment * 100) / 100,
        details: calc.details,
      });
    } else {
      const calc = calcEqualPrincipal(P, R, Y);
      setResult({
        firstPayment: calc.firstPayment,
        lastPayment: calc.lastPayment,
        totalInterest: calc.totalInterest,
        totalPayment: calc.totalPayment,
        details: calc.details,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>贷款总额（元）</Label>
          <Input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="1000000"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>贷款年限（年）</Label>
          <Input
            type="number"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            placeholder="30"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>年利率（%）</Label>
          <Input
            type="number"
            step="0.01"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            placeholder="3.45"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>还款方式</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as RepaymentMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equal_installment">等额本息</SelectItem>
              <SelectItem value="equal_principal">等额本金</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleCalculate} size="sm">
        <Calculator className="h-4 w-4 mr-1" /> 计算
      </Button>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {method === "equal_installment" && result.monthlyPayment !== undefined && (
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">月供金额</p>
                  <p className="text-lg font-bold text-primary">
                    {formatMoney(result.monthlyPayment)}
                  </p>
                </CardContent>
              </Card>
            )}
            {method === "equal_principal" && result.firstPayment !== undefined && result.lastPayment !== undefined && (
              <>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">首月月供</p>
                    <p className="text-lg font-bold text-primary">
                      {formatMoney(result.firstPayment)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">末月月供</p>
                    <p className="text-lg font-bold text-primary">
                      {formatMoney(result.lastPayment)}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">总利息</p>
                <p className="text-lg font-bold text-yellow-600">
                  {formatMoney(result.totalInterest)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">还款总额</p>
                <p className="text-lg font-bold">
                  {formatMoney(result.totalPayment)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              还款明细（前 12 期）
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-left font-semibold">期数</th>
                    <th className="py-2 px-2 text-right font-semibold">月供（元）</th>
                    <th className="py-2 px-2 text-right font-semibold">本金（元）</th>
                    <th className="py-2 px-2 text-right font-semibold">利息（元）</th>
                    <th className="py-2 px-2 text-right font-semibold">剩余（元）</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.slice(0, 12).map((d) => (
                    <tr key={d.month} className="border-b border-border/50">
                      <td className="py-1.5 px-2">{d.month}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{formatMoney(d.payment)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{formatMoney(d.principal)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-yellow-600">{formatMoney(d.interest)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{formatMoney(d.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.details.length > 12 && (
              <p className="text-xs text-muted-foreground">
                共 {result.details.length} 期，仅显示前 12 期
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
