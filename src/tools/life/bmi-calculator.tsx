"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BmiCategory {
  label: string;
  min: number;
  max: number;
  color: string;
  textColor: string;
}

const BMI_CATEGORIES: BmiCategory[] = [
  { label: "偏瘦", min: 0, max: 18.5, color: "#3b82f6", textColor: "text-blue-600" },
  { label: "正常", min: 18.5, max: 24, color: "#22c55e", textColor: "text-green-600" },
  { label: "偏胖", min: 24, max: 28, color: "#f59e0b", textColor: "text-amber-600" },
  { label: "肥胖", min: 28, max: 32, color: "#ef4444", textColor: "text-red-500" },
  { label: "重度肥胖", min: 32, max: 60, color: "#991b1b", textColor: "text-red-800" },
];

type UnitSystem = "metric" | "imperial";

function calcBmi(height: number, weight: number, system: UnitSystem): number {
  if (system === "imperial") {
    // height in inches, weight in pounds
    return (weight / (height * height)) * 703;
  }
  // height in cm
  const heightM = height / 100;
  return weight / (heightM * heightM);
}

function getCategory(bmi: number): BmiCategory {
  return BMI_CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ?? BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}

export function BmiCalculatorTool() {
  const [system, setSystem] = useState<UnitSystem>("metric");
  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("65");
  const [heightIn, setHeightIn] = useState("67");
  const [weightLb, setWeightLb] = useState("143");

  const height = system === "metric" ? Number(heightCm) : Number(heightIn);
  const weight = system === "metric" ? Number(weightKg) : Number(weightLb);

  const bmiResult = useMemo(() => {
    if (!height || !weight || height <= 0 || weight <= 0) return null;
    const bmi = calcBmi(height, weight, system);
    if (Number.isNaN(bmi) || !Number.isFinite(bmi)) return null;
    return bmi;
  }, [height, weight, system]);

  const category = bmiResult !== null ? getCategory(bmiResult) : null;

  // Ideal weight range (BMI 18.5 - 24) for metric
  const idealRange = useMemo(() => {
    if (system === "metric" && Number(heightCm) > 0) {
      const h = Number(heightCm) / 100;
      const min = (18.5 * h * h).toFixed(1);
      const max = (24 * h * h).toFixed(1);
      return `${min} - ${max} kg`;
    }
    if (system === "imperial" && Number(heightIn) > 0) {
      const h = Number(heightIn);
      const min = ((18.5 * h * h) / 703).toFixed(1);
      const max = ((24 * h * h) / 703).toFixed(1);
      return `${min} - ${max} lb`;
    }
    return "";
  }, [heightCm, heightIn, system]);

  // BMI bar position (0-100%)
  const barPosition = useMemo(() => {
    if (bmiResult === null) return 0;
    // Map BMI 10-40 to 0-100%
    const clamped = Math.max(10, Math.min(40, bmiResult));
    return ((clamped - 10) / 30) * 100;
  }, [bmiResult]);

  return (
    <div className="space-y-4">
      <Tabs value={system} onValueChange={(v) => setSystem(v as UnitSystem)}>
        <TabsList className="w-full">
          <TabsTrigger value="metric" className="flex-1">公制 (cm/kg)</TabsTrigger>
          <TabsTrigger value="imperial" className="flex-1">英制 (in/lb)</TabsTrigger>
        </TabsList>

        <TabsContent value="metric" className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">身高 (cm)</Label>
              <Input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                min={50}
                max={300}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">体重 (kg)</Label>
              <Input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                min={10}
                max={500}
                className="h-9"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="imperial" className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">身高 (英寸)</Label>
              <Input
                type="number"
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
                min={20}
                max={120}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">体重 (磅)</Label>
              <Input
                type="number"
                value={weightLb}
                onChange={(e) => setWeightLb(e.target.value)}
                min={20}
                max={1100}
                className="h-9"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {bmiResult !== null && category && (
        <>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-center space-y-1">
                <p className="text-4xl font-bold">{bmiResult.toFixed(1)}</p>
                <p className={`text-lg font-semibold ${category.textColor}`}>{category.label}</p>
              </div>

              {/* BMI range visualization */}
              <div className="space-y-1">
                <div className="relative h-6 rounded-full overflow-hidden flex">
                  {BMI_CATEGORIES.map((cat, i) => {
                    const widthPct = ((cat.max - cat.min) / 30) * 100;
                    return (
                      <div
                        key={i}
                        className="h-full flex items-center justify-center text-[10px] text-white font-medium"
                        style={{ width: `${widthPct}%`, backgroundColor: cat.color }}
                      >
                        {cat.label}
                      </div>
                    );
                  })}
                </div>
                {/* Indicator */}
                <div className="relative h-4">
                  <div
                    className="absolute -translate-x-1/2 -top-1 transition-all duration-300"
                    style={{ left: `${barPosition}%` }}
                  >
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-foreground" />
                  </div>
                </div>
              </div>

              {idealRange && (
                <div className="text-center text-sm text-muted-foreground">
                  理想体重范围：{idealRange}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>* BMI 分类标准参照中国成人标准</p>
            <p>偏瘦: BMI &lt; 18.5 | 正常: 18.5 ≤ BMI &lt; 24 | 偏胖: 24 ≤ BMI &lt; 28 | 肥胖: 28 ≤ BMI &lt; 32 | 重度肥胖: BMI ≥ 32</p>
          </div>
        </>
      )}

      {bmiResult === null && (height > 0 || weight > 0) && (
        <p className="text-sm text-destructive text-center">请输入有效的身高和体重</p>
      )}
    </div>
  );
}
