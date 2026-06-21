"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Info } from "lucide-react";

// 中国 2026 七级超额累进税率表
const TAX_BRACKETS = [
  { upper: 36000, rate: 0.03, quickDeduction: 0 },
  { upper: 144000, rate: 0.10, quickDeduction: 2520 },
  { upper: 300000, rate: 0.20, quickDeduction: 16920 },
  { upper: 420000, rate: 0.25, quickDeduction: 31920 },
  { upper: 660000, rate: 0.30, quickDeduction: 52920 },
  { upper: 960000, rate: 0.35, quickDeduction: 85920 },
  { upper: Infinity, rate: 0.45, quickDeduction: 181920 },
];

// 专项附加扣除标准（2026）
const SPECIAL_DEDUCTIONS = [
  { key: "childEducation", label: "子女教育", amount: 2000, unit: "元/月/每个子女" },
  { key: "continuingEducation", label: "继续教育", amount: 400, unit: "元/月" },
  { key: "mortgageInterest", label: "住房贷款利息", amount: 1000, unit: "元/月" },
  { key: "rent", label: "住房租金", amount: 1500, unit: "元/月（一线城市）", options: [800, 1100, 1500] },
  { key: "elderlySupport", label: "赡养老人", amount: 2000, unit: "元/月" },
  { key: "infantCare", label: "3岁以下婴幼儿照护", amount: 2000, unit: "元/月/每个婴幼儿" },
];

interface MonthlyRow {
  month: number;
  gross: number;
  socialInsurance: number;
  specialDeduction: number;
  cumulativeTaxable: number;
  cumulativeTax: number;
  monthlyTax: number;
  netPay: number;
}

function calcYearTax(
  monthlySalary: number,
  socialInsuranceMonthly: number,
  specialMonthly: number,
  threshold: number = 5000,
  bonusAmount: number = 0,
  bonusMonth: number = 12
): { annualTax: number; annualNet: number; effectiveRate: number; rows: MonthlyRow[] } {
  let cumulativeTaxable = 0;
  let cumulativeTax = 0;
  let prevCumulativeTax = 0;
  const rows: MonthlyRow[] = [];

  for (let m = 1; m <= 12; m++) {
    let gross = monthlySalary;
    if (m === bonusMonth && bonusAmount > 0) {
      gross += bonusAmount;
    }
    cumulativeTaxable += gross - socialInsuranceMonthly - specialMonthly - threshold;
    if (cumulativeTaxable < 0) cumulativeTaxable = 0;

    // 找适用税率
    let rate = 0;
    let qd = 0;
    for (const b of TAX_BRACKETS) {
      if (cumulativeTaxable <= b.upper) {
        rate = b.rate;
        qd = b.quickDeduction;
        break;
      }
    }

    cumulativeTax = cumulativeTaxable * rate - qd;
    if (cumulativeTax < 0) cumulativeTax = 0;
    const monthlyTax = cumulativeTax - prevCumulativeTax;
    prevCumulativeTax = cumulativeTax;

    rows.push({
      month: m,
      gross,
      socialInsurance: socialInsuranceMonthly,
      specialDeduction: specialMonthly,
      cumulativeTaxable: Math.round(cumulativeTaxable * 100) / 100,
      cumulativeTax: Math.round(cumulativeTax * 100) / 100,
      monthlyTax: Math.round(monthlyTax * 100) / 100,
      netPay: Math.round((gross - socialInsuranceMonthly - monthlyTax) * 100) / 100,
    });
  }

  const annualTax = Math.round(cumulativeTax * 100) / 100;
  const annualGross = monthlySalary * 12 + bonusAmount;
  const annualNet = annualGross - socialInsuranceMonthly * 12 - annualTax;

  return {
    annualTax,
    annualNet: Math.round(annualNet * 100) / 100,
    effectiveRate: annualGross > 0 ? Math.round((annualTax / annualGross) * 10000) / 100 : 0,
    rows,
  };
}

// 社保公积金计算（北京/上海 参考）
function calcSocialInsurance(monthlyBase: number, city: "beijing" | "shanghai" | "custom", customRate: number) {
  const rates: Record<string, number> = {
    beijing: 0.222,
    shanghai: 0.175,
  };
  const rate = city === "custom" ? customRate / 100 : rates[city];
  return {
    personal: Math.round(monthlyBase * rate * 100) / 100,
    rate: city === "custom" ? customRate : rates[city] * 100,
  };
}

export function IncomeTaxCalculatorTool() {
  const [monthlySalary, setMonthlySalary] = useState(20000);
  const [city, setCity] = useState<"beijing" | "shanghai" | "custom">("beijing");
  const [customSIRate, setCustomSIRate] = useState(22);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [bonusMonth, setBonusMonth] = useState(12);
  const [childCount, setChildCount] = useState(0);
  const [useMortgage, setUseMortgage] = useState(false);
  const [rentAmount, setRentAmount] = useState(0);
  const [elderlyCount, setElderlyCount] = useState(0);
  const [infantCount, setInfantCount] = useState(0);
  const [continuingEd, setContinuingEd] = useState(false);

  const si = calcSocialInsurance(monthlySalary, city, customSIRate);

  const specialTotal = useMemo(() => {
    let total = 0;
    if (childCount > 0) total += childCount * 2000;
    if (continuingEd) total += 400;
    if (useMortgage) total += 1000;
    if (rentAmount > 0) total += rentAmount;
    if (elderlyCount > 0) total += Math.min(elderlyCount, 2) * 2000;
    if (infantCount > 0) total += infantCount * 2000;
    return total;
  }, [childCount, continuingEd, useMortgage, rentAmount, elderlyCount, infantCount]);

  const result = useMemo(
    () => calcYearTax(monthlySalary, si.personal, specialTotal, 5000, bonusAmount, bonusMonth),
    [monthlySalary, si.personal, specialTotal, bonusAmount, bonusMonth]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-blue-500" />
            工资与社保
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>税前月薪 (元)</Label>
            <Input type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>社保城市</Label>
            <div className="flex gap-1 mt-1">
              {(["beijing", "shanghai", "custom"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`px-2 py-1 text-xs rounded border ${
                    city === c ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {c === "beijing" ? "北京" : c === "shanghai" ? "上海" : "自定义"}
                </button>
              ))}
            </div>
          </div>
          {city === "custom" && (
            <div>
              <Label>自缴比例 (%)</Label>
              <Input type="number" value={customSIRate} onChange={(e) => setCustomSIRate(Number(e.target.value) || 0)} />
            </div>
          )}
          <div>
            <Label>月缴社保 (个人)</Label>
            <Input value={`¥${si.personal.toLocaleString()} (${si.rate}%)`} disabled />
          </div>
          <div>
            <Label>年终奖 (元, 0=无)</Label>
            <Input type="number" value={bonusAmount} onChange={(e) => setBonusAmount(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>年终奖发放月份</Label>
            <Input type="number" min={1} max={12} value={bonusMonth} onChange={(e) => setBonusMonth(Number(e.target.value) || 12)} />
          </div>
        </CardContent>
      </Card>

      {/* 专项附加扣除 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">专项附加扣除</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label>子女教育 (每个 ¥2000/月)</Label>
            <Input type="number" min={0} max={10} value={childCount} onChange={(e) => setChildCount(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>婴幼儿照护 (每个 ¥2000/月)</Label>
            <Input type="number" min={0} max={10} value={infantCount} onChange={(e) => setInfantCount(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label>继续教育</Label>
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => setContinuingEd(!continuingEd)}
                className={`px-3 py-1 text-xs rounded border ${
                  continuingEd ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {continuingEd ? "¥400/月 ✓" : "无"}
              </button>
            </div>
          </div>
          <div>
            <Label>住房贷款利息</Label>
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => setUseMortgage(!useMortgage)}
                className={`px-3 py-1 text-xs rounded border ${
                  useMortgage ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {useMortgage ? "¥1000/月 ✓" : "无"}
              </button>
            </div>
          </div>
          <div>
            <Label>住房租金 (元/月)</Label>
            <select
              value={rentAmount}
              onChange={(e) => setRentAmount(Number(e.target.value))}
              className="w-full mt-1 px-2 py-1.5 text-sm border rounded"
            >
              <option value={0}>无</option>
              <option value={800}>¥800（小城市）</option>
              <option value={1100}>¥1100（中等城市）</option>
              <option value={1500}>¥1500（一线城市）</option>
            </select>
          </div>
          <div>
            <Label>赡养老人 (每个 ¥2000/月, 最多2人)</Label>
            <Input type="number" min={0} max={2} value={elderlyCount} onChange={(e) => setElderlyCount(Number(e.target.value) || 0)} />
          </div>
          <div className="flex items-end pb-2">
            <p className="text-xs text-muted-foreground">
              专项扣除合计: <span className="font-bold text-primary">¥{specialTotal.toLocaleString()}/月</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 结果汇总 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">年税后收入</p>
            <p className="text-2xl font-bold text-emerald-600">¥{result.annualNet.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">年个人所得税</p>
            <p className="text-2xl font-bold text-red-500">¥{result.annualTax.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">实际税率</p>
            <p className="text-2xl font-bold text-amber-600">{result.effectiveRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">月均税后</p>
            <p className="text-2xl font-bold text-blue-600">¥{Math.round(result.annualNet / 12).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* 月度明细 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">月度扣税明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">月份</th>
                  <th className="text-right py-2">税前</th>
                  <th className="text-right py-2">社保</th>
                  <th className="text-right py-2">累计应税</th>
                  <th className="text-right py-2">当月个税</th>
                  <th className="text-right py-2">税后实发</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.month} className="border-b hover:bg-muted/30">
                    <td className="py-2 font-medium">{row.month}月</td>
                    <td className="text-right py-2">¥{row.gross.toLocaleString()}</td>
                    <td className="text-right py-2">-¥{row.socialInsurance.toLocaleString()}</td>
                    <td className="text-right py-2">¥{row.cumulativeTaxable.toLocaleString()}</td>
                    <td className="text-right py-2 text-red-500">-¥{row.monthlyTax.toLocaleString()}</td>
                    <td className="text-right py-2 font-medium">¥{row.netPay.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>基于中国2026年个人所得税法：起征点¥5000，七级超额累进税率 3%-45%。社保比例因城市而异（北京22.2%、上海17.5%）。专项附加扣除为2026年现行标准。</span>
      </div>
    </div>
  );
}
