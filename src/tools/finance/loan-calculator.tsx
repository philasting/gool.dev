"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Car, CreditCard, Info } from "lucide-react";

interface MonthlyDetail {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

function calcEqualInstallment(principal: number, annualRate: number, years: number): {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  details: MonthlyDetail[];
} {
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  if (monthlyRate === 0) {
    const mp = principal / n;
    return {
      monthlyPayment: mp,
      totalInterest: 0,
      totalPayment: principal,
      details: Array.from({ length: n }, (_, i) => ({
        month: i + 1, payment: mp, principal: mp, interest: 0, remaining: principal - mp * (i + 1),
      })),
    };
  }
  const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  const details: MonthlyDetail[] = [];
  let remaining = principal;
  let totalInterest = 0;
  for (let i = 1; i <= n; i++) {
    const interest = remaining * monthlyRate;
    const principalPaid = monthlyPayment - interest;
    remaining -= principalPaid;
    totalInterest += interest;
    details.push({
      month: i,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remaining: Math.max(0, Math.round(remaining * 100) / 100),
    });
  }
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round(principal + totalInterest * 100) / 100,
    details,
  };
}

function calcEqualPrincipal(principal: number, annualRate: number, years: number): {
  firstPayment: number;
  lastPayment: number;
  totalInterest: number;
  totalPayment: number;
  details: MonthlyDetail[];
} {
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  const monthlyPrincipal = principal / n;
  const details: MonthlyDetail[] = [];
  let remaining = principal;
  let totalInterest = 0;
  for (let i = 1; i <= n; i++) {
    const interest = remaining * monthlyRate;
    const payment = monthlyPrincipal + interest;
    remaining -= monthlyPrincipal;
    totalInterest += interest;
    details.push({
      month: i,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(monthlyPrincipal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remaining: Math.max(0, Math.round(remaining * 100) / 100),
    });
  }
  return {
    firstPayment: Math.round(details[0].payment * 100) / 100,
    lastPayment: Math.round(details[n - 1].payment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round(principal + totalInterest * 100) / 100,
    details,
  };
}

// 参考利率
const RATE_PRESETS = {
  mortgage: 3.85,
  carLoan: 4.5,
  consumerLoan: 5.6,
};

export function LoanCalculatorTool() {
  const [loanType, setLoanType] = useState<"mortgage" | "carLoan" | "consumerLoan">("mortgage");
  const [principal, setPrincipal] = useState(1000000);
  const [annualRate, setAnnualRate] = useState(RATE_PRESETS.mortgage);
  const [years, setYears] = useState(30);
  const [method, setMethod] = useState<"equal_installment" | "equal_principal">("equal_installment");

  const ei = useMemo(() => calcEqualInstallment(principal, annualRate, years), [principal, annualRate, years]);
  const ep = useMemo(() => calcEqualPrincipal(principal, annualRate, years), [principal, annualRate, years]);

  const activeResult = method === "equal_installment" ? ei : ep;

  const handleTypeChange = (type: "mortgage" | "carLoan" | "consumerLoan") => {
    setLoanType(type);
    setAnnualRate(RATE_PRESETS[type]);
    if (type === "carLoan") setYears(5);
    else if (type === "consumerLoan") setYears(3);
    else setYears(30);
  };

  return (
    <div className="space-y-6">
      {/* 贷款类型 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">贷款类型</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {([
              { key: "mortgage", label: "房贷", icon: Home, rate: RATE_PRESETS.mortgage },
              { key: "carLoan", label: "车贷", icon: Car, rate: RATE_PRESETS.carLoan },
              { key: "consumerLoan", label: "消费贷", icon: CreditCard, rate: RATE_PRESETS.consumerLoan },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => handleTypeChange(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  loanType === t.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                }`}
              >
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
                <span className="text-xs opacity-70">{t.rate}%</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 参数 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">贷款参数</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>贷款总额 (元)</Label>
            <Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>年利率 (%)</Label>
            <Input type="number" step="0.01" value={annualRate} onChange={(e) => setAnnualRate(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>贷款年限</Label>
            <Input type="number" min={1} max={50} value={years} onChange={(e) => setYears(Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <div>
            <Label>还款方式</Label>
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => setMethod("equal_installment")}
                className={`px-2 py-1 text-xs rounded border ${
                  method === "equal_installment" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                等额本息
              </button>
              <button
                onClick={() => setMethod("equal_principal")}
                className={`px-2 py-1 text-xs rounded border ${
                  method === "equal_principal" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                等额本金
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 结果汇总 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              {method === "equal_installment" ? "月供" : "首月还款"}
            </p>
            <p className="text-2xl font-bold text-blue-600">
              ¥{method === "equal_installment"
                ? ei.monthlyPayment.toLocaleString()
                : ep.firstPayment.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">利息总额</p>
            <p className="text-2xl font-bold text-red-500">
              ¥{(activeResult as { totalInterest: number }).totalInterest.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">还款总额</p>
            <p className="text-2xl font-bold text-amber-600">
              ¥{(activeResult as { totalPayment: number }).totalPayment.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">利息占比</p>
            <p className="text-2xl font-bold text-purple-600">
              {principal > 0
                ? Math.round(((activeResult as { totalInterest: number }).totalInterest / (activeResult as { totalPayment: number }).totalPayment) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 两种方式对比 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">等额本息 vs 等额本金 对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">对比维度</th>
                  <th className="text-right py-2">等额本息</th>
                  <th className="text-right py-2">等额本金</th>
                  <th className="text-right py-2">差异</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">月供</td>
                  <td className="text-right py-2 font-medium">¥{ei.monthlyPayment.toLocaleString()}</td>
                  <td className="text-right py-2">¥{ep.firstPayment.toLocaleString()}→¥{ep.lastPayment.toLocaleString()}</td>
                  <td className="text-right py-2 text-muted-foreground">逐月递减</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">利息总额</td>
                  <td className="text-right py-2 text-red-500">¥{ei.totalInterest.toLocaleString()}</td>
                  <td className="text-right py-2 text-emerald-600">¥{ep.totalInterest.toLocaleString()}</td>
                  <td className="text-right py-2 text-emerald-600">
                    省 ¥{Math.round(ei.totalInterest - ep.totalInterest).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2">还款总额</td>
                  <td className="text-right py-2">¥{(principal + ei.totalInterest).toLocaleString()}</td>
                  <td className="text-right py-2">¥{(principal + ep.totalInterest).toLocaleString()}</td>
                  <td className="text-right py-2 text-emerald-600">
                    省 ¥{Math.round(ei.totalInterest - ep.totalInterest).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 前12期明细 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">前12期还款明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">期数</th>
                  <th className="text-right py-2">月供</th>
                  <th className="text-right py-2">本金</th>
                  <th className="text-right py-2">利息</th>
                  <th className="text-right py-2">剩余本金</th>
                </tr>
              </thead>
              <tbody>
                {activeResult.details.slice(0, 12).map((row) => (
                  <tr key={row.month} className="border-b hover:bg-muted/30">
                    <td className="py-2">第{row.month}期</td>
                    <td className="text-right py-2">¥{row.payment.toLocaleString()}</td>
                    <td className="text-right py-2">¥{row.principal.toLocaleString()}</td>
                    <td className="text-right py-2 text-muted-foreground">¥{row.interest.toLocaleString()}</td>
                    <td className="text-right py-2">¥{row.remaining.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            {years * 12 > 12 ? `仅展示前12期，共${years * 12}期` : ""}
          </p>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>利率为参考值（2026年6月市场水平），实际利率以银行审批为准。等额本息月供固定但总利息高；等额本金月供递减但前期还款压力大。</span>
      </div>
    </div>
  );
}
