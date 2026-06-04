"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

type GradientType = "linear" | "radial";
type RadialShape = "circle" | "ellipse";

let stopIdCounter = 0;
function nextStopId(): string {
  stopIdCounter += 1;
  return `stop-${stopIdCounter}`;
}

export function CssGradientGeneratorTool() {
  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [radialShape, setRadialShape] = useState<RadialShape>("circle");
  const [stops, setStops] = useState<ColorStop[]>([
    { id: nextStopId(), color: "#3B82F6", position: 0 },
    { id: nextStopId(), color: "#8B5CF6", position: 100 },
  ]);
  const { copied, handleCopy } = useCopyState();

  const addStop = useCallback(() => {
    const lastPos = stops[stops.length - 1]?.position ?? 100;
    const newPos = Math.min(100, lastPos);
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
    setStops((prev) => [...prev, { id: nextStopId(), color: randomColor, position: newPos }]);
  }, [stops]);

  const removeStop = useCallback((id: string) => {
    setStops((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const updateStop = useCallback((id: string, field: keyof ColorStop, value: number | string) => {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }, []);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.position - b.position),
    [stops]
  );

  const cssCode = useMemo(() => {
    const colorStops = sortedStops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    if (gradientType === "linear") {
      return `background: linear-gradient(${angle}deg, ${colorStops});`;
    }
    return `background: radial-gradient(${radialShape}, ${colorStops});`;
  }, [gradientType, angle, radialShape, sortedStops]);

  const previewStyle = useMemo(() => {
    const colorStops = sortedStops
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    if (gradientType === "linear") {
      return { background: `linear-gradient(${angle}deg, ${colorStops})` };
    }
    return { background: `radial-gradient(${radialShape}, ${colorStops})` };
  }, [gradientType, angle, radialShape, sortedStops]);

  return (
    <div className="space-y-4">
      {/* Preview */}
      <Card>
        <CardContent className="p-4">
          <div
            className="w-full h-48 rounded-lg border border-border"
            style={previewStyle}
          />
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* Type selector */}
          <div className="space-y-2">
            <Label className="text-sm">渐变类型</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={gradientType === "linear" ? "default" : "outline"}
                onClick={() => setGradientType("linear")}
              >
                线性渐变
              </Button>
              <Button
                size="sm"
                variant={gradientType === "radial" ? "default" : "outline"}
                onClick={() => setGradientType("radial")}
              >
                径向渐变
              </Button>
            </div>
          </div>

          {/* Angle (linear) */}
          {gradientType === "linear" && (
            <div className="space-y-2">
              <Label className="text-sm">角度: {angle}°</Label>
              <Slider
                value={[angle]}
                onValueChange={(v) => { if (typeof v !== "number") setAngle(v[0]); }}
                min={0}
                max={360}
                step={1}
              />
            </div>
          )}

          {/* Radial shape */}
          {gradientType === "radial" && (
            <div className="space-y-2">
              <Label className="text-sm">形状</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={radialShape === "circle" ? "default" : "outline"}
                  onClick={() => setRadialShape("circle")}
                >
                  圆形
                </Button>
                <Button
                  size="sm"
                  variant={radialShape === "ellipse" ? "default" : "outline"}
                  onClick={() => setRadialShape("ellipse")}
                >
                  椭圆
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Color stops */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">色标</Label>
            <Button size="sm" variant="outline" onClick={addStop}>
              <Plus className="h-4 w-4 mr-1" /> 添加色标
            </Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-auto custom-scrollbar">
            {stops.map((stop) => (
              <div key={stop.id} className="flex items-center gap-2">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateStop(stop.id, "color", e.target.value)}
                  className="h-8 w-8 rounded border border-border cursor-pointer shrink-0"
                />
                <div className="flex-1">
                  <Input
                    value={stop.color}
                    onChange={(e) => updateStop(stop.id, "color", e.target.value)}
                    className="font-mono text-xs h-8"
                  />
                </div>
                <div className="w-24 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={stop.position}
                    onChange={(e) =>
                      updateStop(stop.id, "position", Math.max(0, Math.min(100, Number(e.target.value))))
                    }
                    className="font-mono text-xs h-8"
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeStop(stop.id)}
                  disabled={stops.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">CSS 代码</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(cssCode)}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "已复制" : "复制"}
          </Button>
        </div>
        <Card>
          <CardContent className="p-3">
            <pre className="text-sm font-mono whitespace-pre-wrap break-all">
              {cssCode}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
