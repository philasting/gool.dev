"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Ruler, Move } from "lucide-react";

type Unit = "cm" | "inch";
type Orientation = "horizontal" | "vertical";
type RulerMode = "ruler" | "measure";

// 1 inch = 2.54 cm
const INCH_TO_CM = 2.54;

// Common screen diagonal sizes for reference
const COMMON_SCREENS = [
  { name: '13.3" 笔记本', diagonal: 13.3 },
  { name: '14" 笔记本', diagonal: 14 },
  { name: '15.6" 笔记本', diagonal: 15.6 },
  { name: '21" 显示器', diagonal: 21 },
  { name: '24" 显示器', diagonal: 24 },
  { name: '27" 显示器', diagonal: 27 },
  { name: '32" 显示器', diagonal: 32 },
];

export function ScreenRulerTool() {
  const [unit, setUnit] = useState<Unit>("cm");
  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [mode, setMode] = useState<RulerMode>("ruler");
  const [screenDiagonal, setScreenDiagonal] = useState(15.6);
  const [customPpi, setCustomPpi] = useState<number | null>(null);
  const [measureStart, setMeasureStart] = useState<number | null>(null);
  const [measureEnd, setMeasureEnd] = useState<number | null>(null);
  const [rulerLength, setRulerLength] = useState(20);
  const rulerRef = useRef<HTMLDivElement>(null);
  const [ppi, setPpi] = useState(96);

  // Calculate PPI from screen diagonal and resolution
  const calculatePpi = useCallback((diagonal: number): number => {
    const dpr = window.devicePixelRatio || 1;
    const screenWidth = window.screen.width * dpr;
    const screenHeight = window.screen.height * dpr;
    const resolutionDiagonal = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
    return resolutionDiagonal / diagonal;
  }, []);

  useEffect(() => {
    if (customPpi && customPpi > 0) {
      setPpi(customPpi);
    } else {
      setPpi(calculatePpi(screenDiagonal));
    }
  }, [screenDiagonal, customPpi, calculatePpi]);

  // Convert physical unit to pixels
  const unitToPixels = (value: number): number => {
    if (unit === "cm") {
      return (value / INCH_TO_CM) * ppi;
    }
    return value * ppi;
  };

  // Convert pixels to physical unit
  const pixelsToUnit = (px: number): number => {
    if (unit === "cm") {
      return (px / ppi) * INCH_TO_CM;
    }
    return px / ppi;
  };

  // Generate ruler tick marks
  const generateTicks = useCallback(() => {
    const ticks: { pos: number; label: string; major: boolean }[] = [];
    const maxVal = rulerLength;

    if (unit === "cm") {
      for (let i = 0; i <= maxVal; i++) {
        // Major tick (full cm)
        ticks.push({ pos: unitToPixels(i), label: String(i), major: true });
        // Minor ticks (mm)
        if (i < maxVal) {
          for (let j = 1; j < 10; j++) {
            ticks.push({
              pos: unitToPixels(i + j / 10),
              label: "",
              major: false,
            });
          }
        }
      }
    } else {
      // Inches: major ticks at each inch, minor at 1/8
      for (let i = 0; i <= maxVal; i++) {
        ticks.push({ pos: unitToPixels(i), label: String(i), major: true });
        if (i < maxVal) {
          for (let j = 1; j < 8; j++) {
            ticks.push({
              pos: unitToPixels(i + j / 8),
              label: j === 4 ? `${i}.5` : "",
              major: j === 4,
            });
          }
        }
      }
    }
    return ticks;
  }, [unit, rulerLength, unitToPixels]);

  const ticks = generateTicks();
  const totalPixels = unitToPixels(rulerLength);

  // Measurement handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode !== "measure") return;
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = orientation === "horizontal" ? e.clientX - rect.left : e.clientY - rect.top;
    setMeasureStart(pos);
    setMeasureEnd(pos);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode !== "measure" || measureStart === null) return;
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = orientation === "horizontal" ? e.clientX - rect.left : e.clientY - rect.top;
    setMeasureEnd(pos);
  };

  const handlePointerUp = () => {
    // Keep the measurement visible
  };

  const measuredValue =
    measureStart !== null && measureEnd !== null
      ? Math.abs(pixelsToUnit(Math.abs(measureEnd - measureStart)))
      : 0;

  return (
    <div className="space-y-4">
      {/* Calibration */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Ruler className="h-4 w-4 text-primary" />
            屏幕校准
          </div>
          <p className="text-xs text-muted-foreground">
            为了显示真实尺寸，需要知道您的屏幕尺寸。选择预设或手动输入对角线尺寸（英寸）。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>屏幕对角线尺寸</Label>
              <Input
                type="number"
                step="0.1"
                min="10"
                max="50"
                value={screenDiagonal}
                onChange={(e) => {
                  setScreenDiagonal(parseFloat(e.target.value) || 15.6);
                  setCustomPpi(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>自定义 PPI（可选）</Label>
              <Input
                type="number"
                step="1"
                min="50"
                max="500"
                placeholder="留空则自动计算"
                value={customPpi ?? ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setCustomPpi(v > 0 ? v : null);
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {COMMON_SCREENS.map((s) => (
              <Button
                key={s.diagonal}
                variant={screenDiagonal === s.diagonal ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setScreenDiagonal(s.diagonal);
                  setCustomPpi(null);
                }}
              >
                {s.name}
              </Button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            计算所得 PPI: <span className="font-mono text-primary">{ppi.toFixed(1)}</span> ·
            DPR: <span className="font-mono">{(window.devicePixelRatio || 1).toFixed(1)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Ruler Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>单位</Label>
          <Tabs value={unit} onValueChange={(v) => setUnit(v as Unit)}>
            <TabsList className="w-full">
              <TabsTrigger value="cm" className="flex-1">厘米</TabsTrigger>
              <TabsTrigger value="inch" className="flex-1">英寸</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="space-y-2">
          <Label>方向</Label>
          <Tabs value={orientation} onValueChange={(v) => setOrientation(v as Orientation)}>
            <TabsList className="w-full">
              <TabsTrigger value="horizontal" className="flex-1">水平</TabsTrigger>
              <TabsTrigger value="vertical" className="flex-1">垂直</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="space-y-2">
          <Label>模式</Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as RulerMode)}>
            <TabsList className="w-full">
              <TabsTrigger value="ruler" className="flex-1">
                <Ruler className="h-3.5 w-3.5 mr-1" /> 标尺
              </TabsTrigger>
              <TabsTrigger value="measure" className="flex-1">
                <Move className="h-3.5 w-3.5 mr-1" /> 测量
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>标尺长度</Label>
          <span className="text-sm font-mono text-primary">{rulerLength} {unit === "cm" ? "cm" : "in"}</span>
        </div>
        <Slider
          value={[rulerLength]}
          onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setRulerLength(val); }}
          min={5}
          max={50}
          step={1}
        />
      </div>

      {/* Measurement result */}
      {mode === "measure" && measuredValue > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">测量结果</span>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {measuredValue.toFixed(2)} {unit === "cm" ? "cm" : "in"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === "measure" && (
        <p className="text-xs text-muted-foreground text-center">
          在标尺上按住鼠标拖拽来测量距离
        </p>
      )}

      {/* Ruler Display */}
      <Card>
        <CardContent className="p-4 overflow-auto">
          <div
            ref={rulerRef}
            className="relative bg-card border border-border rounded-lg cursor-crosshair select-none"
            style={
              orientation === "horizontal"
                ? { width: Math.min(totalPixels, 800), height: 80, overflowX: "auto" }
                : { width: 80, height: Math.min(totalPixels, 500), overflowY: "auto" }
            }
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Ruler SVG */}
            <svg
              width={orientation === "horizontal" ? totalPixels : 80}
              height={orientation === "horizontal" ? 80 : totalPixels}
              className="block"
            >
              {/* Background */}
              <rect
                width={orientation === "horizontal" ? totalPixels : 80}
                height={orientation === "horizontal" ? 80 : totalPixels}
                fill="hsl(var(--card))"
              />

              {/* Ticks */}
              {ticks.map((tick, i) => {
                if (orientation === "horizontal") {
                  if (tick.major) {
                    return (
                      <g key={i}>
                        <line
                          x1={tick.pos}
                          y1={0}
                          x2={tick.pos}
                          y2={35}
                          stroke="currentColor"
                          strokeWidth="1.5"
                          opacity="0.7"
                        />
                        {tick.label && (
                          <text
                            x={tick.pos}
                            y={50}
                            textAnchor="middle"
                            fontSize="11"
                            fill="currentColor"
                            opacity="0.7"
                          >
                            {tick.label}
                          </text>
                        )}
                      </g>
                    );
                  }
                  return (
                    <line
                      key={i}
                      x1={tick.pos}
                      y1={0}
                      x2={tick.pos}
                      y2={18}
                      stroke="currentColor"
                      strokeWidth="0.5"
                      opacity="0.4"
                    />
                  );
                } else {
                  if (tick.major) {
                    return (
                      <g key={i}>
                        <line
                          x1={0}
                          y1={tick.pos}
                          x2={35}
                          y2={tick.pos}
                          stroke="currentColor"
                          strokeWidth="1.5"
                          opacity="0.7"
                        />
                        {tick.label && (
                          <text
                            x={50}
                            y={tick.pos + 4}
                            textAnchor="middle"
                            fontSize="11"
                            fill="currentColor"
                            opacity="0.7"
                          >
                            {tick.label}
                          </text>
                        )}
                      </g>
                    );
                  }
                  return (
                    <line
                      key={i}
                      x1={0}
                      y1={tick.pos}
                      x2={18}
                      y2={tick.pos}
                      stroke="currentColor"
                      strokeWidth="0.5"
                      opacity="0.4"
                    />
                  );
                }
              })}

              {/* Measurement overlay */}
              {mode === "measure" && measureStart !== null && measureEnd !== null && (
                (() => {
                  const start = Math.min(measureStart, measureEnd);
                  const end = Math.max(measureStart, measureEnd);
                  if (orientation === "horizontal") {
                    return (
                      <rect
                        x={start}
                        y={0}
                        width={end - start}
                        height={80}
                        fill="hsl(var(--primary))"
                        opacity="0.15"
                      />
                    );
                  }
                  return (
                    <rect
                      x={0}
                      y={start}
                      width={80}
                      height={end - start}
                      fill="hsl(var(--primary))"
                      opacity="0.15"
                    />
                  );
                })()
              )}
            </svg>
          </div>

          {/* Calibration guide */}
          <div className="mt-3 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">
              💡 校准提示：将一张信用卡（宽 8.56cm / 3.375in）放在屏幕上对比标尺刻度，
              如果不一致，请调整屏幕对角线尺寸或直接输入自定义 PPI。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
