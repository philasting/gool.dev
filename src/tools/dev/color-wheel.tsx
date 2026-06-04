"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface HSLColor {
  h: number;
  s: number;
  l: number;
}

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

function hslToRgb(h: number, s: number, l: number): RGBColor {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1: number, g1: number, b1: number;
  if (h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): RGBColor | null {
  const match = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

function rgbToHsl(r: number, g: number, b: number): HSLColor {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

interface HarmonyColor {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  label: string;
}

function generateHarmonies(h: number, s: number, l: number): Record<string, HarmonyColor[]> {
  const makeColor = (hue: number, label: string): HarmonyColor => {
    const hueNorm = ((hue % 360) + 360) % 360;
    const rgb = hslToRgb(hueNorm, s / 100, l / 100);
    return {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      rgb,
      hsl: { h: hueNorm, s, l },
      label,
    };
  };

  return {
    complementary: [
      makeColor(h, "主色"),
      makeColor(h + 180, "互补色"),
    ],
    analogous: [
      makeColor(h - 30, "类似色 -30°"),
      makeColor(h, "主色"),
      makeColor(h + 30, "类似色 +30°"),
    ],
    triadic: [
      makeColor(h, "主色"),
      makeColor(h + 120, "三角色 +120°"),
      makeColor(h + 240, "三角色 +240°"),
    ],
    splitComplementary: [
      makeColor(h, "主色"),
      makeColor(h + 150, "分裂互补 +150°"),
      makeColor(h + 210, "分裂互补 +210°"),
    ],
  };
}

function ColorWheelCanvas({
  selectedHue,
  onSelectHue,
}: {
  selectedHue: number;
  onSelectHue: (hue: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 280;
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius - 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;

    for (let angle = 0; angle < 360; angle += 0.5) {
      const startAngle = ((angle - 90) * Math.PI) / 180;
      const endAngle = ((angle + 1 - 90) * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = `hsl(${angle}, 80%, 50%)`;
      ctx.fill();
    }

    const rad = ((selectedHue - 90) * Math.PI) / 180;
    const midR = (outerRadius + innerRadius) / 2;
    const px = cx + midR * Math.cos(rad);
    const py = cy + midR * Math.sin(rad);
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = `hsl(${selectedHue}, 80%, 50%)`;
    ctx.stroke();
  }, [selectedHue]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = size / 2;
      const cy = size / 2;
      const midR = (outerRadius + innerRadius) / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= innerRadius - 10 && dist <= outerRadius + 10) {
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (angle < 0) angle += 360;
        onSelectHue(Math.round(angle) % 360);
      }
    },
    [onSelectHue]
  );

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onClick={handleClick}
      className="cursor-crosshair mx-auto"
    />
  );
}

const HARMONY_NAMES: Record<string, string> = {
  complementary: "互补色",
  analogous: "类似色",
  triadic: "三角配色",
  splitComplementary: "分裂互补",
};

export function ColorWheelTool() {
  const [selectedHsl, setSelectedHsl] = useState<HSLColor>({ h: 210, s: 80, l: 50 });
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const harmonies = generateHarmonies(selectedHsl.h, selectedHsl.s, selectedHsl.l);

  const currentRgb = hslToRgb(selectedHsl.h, selectedHsl.s / 100, selectedHsl.l / 100);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);

  const handleCopy = async (hex: string) => {
    await copyToClipboard(hex.toUpperCase());
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleHexInput = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setSelectedHsl(hsl);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <ColorWheelCanvas
          selectedHue={selectedHsl.h}
          onSelectHue={(h) => setSelectedHsl((prev) => ({ ...prev, h }))}
        />

        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-lg border border-border shrink-0"
              style={{ backgroundColor: currentHex }}
            />
            <div className="space-y-1">
              <p className="font-mono text-sm font-semibold">{currentHex.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">
                rgb({currentRgb.r}, {currentRgb.g}, {currentRgb.b})
              </p>
              <p className="text-xs text-muted-foreground">
                hsl({selectedHsl.h}°, {selectedHsl.s}%, {selectedHsl.l}%)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(currentHex)}
            >
              {copiedHex === currentHex ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">H (色相)</Label>
              <input
                type="range"
                min={0}
                max={360}
                value={selectedHsl.h}
                onChange={(e) => setSelectedHsl((p) => ({ ...p, h: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">{selectedHsl.h}°</span>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">S (饱和度)</Label>
              <input
                type="range"
                min={0}
                max={100}
                value={selectedHsl.s}
                onChange={(e) => setSelectedHsl((p) => ({ ...p, s: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">{selectedHsl.s}%</span>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">L (明度)</Label>
              <input
                type="range"
                min={0}
                max={100}
                value={selectedHsl.l}
                onChange={(e) => setSelectedHsl((p) => ({ ...p, l: Number(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">{selectedHsl.l}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">HEX 输入</Label>
            <input
              type="color"
              value={currentHex}
              onChange={(e) => handleHexInput(e.target.value)}
              className="h-8 w-full rounded border cursor-pointer"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="complementary">
        <TabsList className="w-full justify-start">
          {Object.entries(HARMONY_NAMES).map(([key, name]) => (
            <TabsTrigger key={key} value={key}>{name}</TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(harmonies).map(([key, colors]) => (
          <TabsContent key={key} value={key}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colors.map((color) => (
                <Card
                  key={color.hex + color.label}
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                  onClick={() => handleCopy(color.hex)}
                >
                  <div
                    className="h-14"
                    style={{ backgroundColor: color.hex }}
                  />
                  <CardContent className="p-2 text-center space-y-0.5">
                    <p className="text-xs font-medium">{color.label}</p>
                    <p className="text-xs font-mono">{color.hex.toUpperCase()}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      hsl({color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%)
                    </p>
                    {copiedHex === color.hex && (
                      <Badge variant="secondary" className="text-[10px]">已复制</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
