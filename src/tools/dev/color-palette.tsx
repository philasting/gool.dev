"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Palette } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/** HSL 转 RGB */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
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

/** Hex 转 HSL */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;

  return { h, s, l };
}

/** RGB 转 Hex */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

interface ColorSwatch {
  hex: string;
  label: string;
}

/** 生成配色方案 */
function generatePalettes(baseHex: string): Record<string, ColorSwatch[]> {
  const { h, s, l } = hexToHsl(baseHex);

  // 互补色
  const complementary: ColorSwatch[] = [
    { hex: baseHex, label: "主色" },
    { hex: rgbToHex(...Object.values(hslToRgb((h + 180) % 360, s, l)) as [number, number, number]), label: "互补色" },
  ];

  // 类似色
  const analogous: ColorSwatch[] = [
    { hex: rgbToHex(...Object.values(hslToRgb((h - 30 + 360) % 360, s, l)) as [number, number, number]), label: "类似色 -30°" },
    { hex: baseHex, label: "主色" },
    { hex: rgbToHex(...Object.values(hslToRgb((h + 30) % 360, s, l)) as [number, number, number]), label: "类似色 +30°" },
  ];

  // 三角色
  const triadic: ColorSwatch[] = [
    { hex: baseHex, label: "主色" },
    { hex: rgbToHex(...Object.values(hslToRgb((h + 120) % 360, s, l)) as [number, number, number]), label: "三角色 +120°" },
    { hex: rgbToHex(...Object.values(hslToRgb((h + 240) % 360, s, l)) as [number, number, number]), label: "三角色 +240°" },
  ];

  // 分裂互补色
  const splitComplementary: ColorSwatch[] = [
    { hex: baseHex, label: "主色" },
    { hex: rgbToHex(...Object.values(hslToRgb((h + 150) % 360, s, l)) as [number, number, number]), label: "分裂互补 +150°" },
    { hex: rgbToHex(...Object.values(hslToRgb((h + 210) % 360, s, l)) as [number, number, number]), label: "分裂互补 +210°" },
  ];

  // 单色系
  const monochromatic: ColorSwatch[] = [
    { hex: rgbToHex(...Object.values(hslToRgb(h, s, Math.min(l + 0.3, 0.95))) as [number, number, number]), label: "浅色" },
    { hex: rgbToHex(...Object.values(hslToRgb(h, s, Math.min(l + 0.15, 0.85))) as [number, number, number]), label: "偏浅" },
    { hex: baseHex, label: "主色" },
    { hex: rgbToHex(...Object.values(hslToRgb(h, s, Math.max(l - 0.15, 0.1))) as [number, number, number]), label: "偏深" },
    { hex: rgbToHex(...Object.values(hslToRgb(h, s, Math.max(l - 0.3, 0.05))) as [number, number, number]), label: "深色" },
  ];

  return { complementary, analogous, triadic, splitComplementary, monochromatic };
}

function ColorSwatchCard({ swatch, onCopy, copiedHex }: { swatch: ColorSwatch; onCopy: (hex: string) => void; copiedHex: string }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onCopy(swatch.hex)}
    >
      <div
        className="h-16 rounded-t-lg"
        style={{ backgroundColor: swatch.hex }}
      />
      <CardContent className="p-2 text-center">
        <p className="text-xs font-mono font-semibold">{swatch.hex.toUpperCase()}</p>
        <p className="text-xs text-muted-foreground">{swatch.label}</p>
        {copiedHex === swatch.hex && (
          <Check className="h-3 w-3 mx-auto text-green-600 mt-0.5" />
        )}
      </CardContent>
    </Card>
  );
}

export function ColorPaletteTool() {
  const [baseColor, setBaseColor] = useState("#3B82F6");
  const [palettes, setPalettes] = useState<Record<string, ColorSwatch[]> | null>(null);
  const [copiedHex, setCopiedHex] = useState("");

  const handleGenerate = useCallback(() => {
    setPalettes(generatePalettes(baseColor));
  }, [baseColor]);

  const handleCopy = async (hex: string) => {
    await copyToClipboard(hex.toUpperCase());
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(""), 2000);
  };

  const paletteNames: Record<string, string> = {
    complementary: "互补色",
    analogous: "类似色",
    triadic: "三角色",
    splitComplementary: "分裂互补色",
    monochromatic: "单色系",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>主色</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="h-10 w-10 rounded border cursor-pointer"
            />
            <Input
              value={baseColor}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) setBaseColor(v);
              }}
              className="w-28 font-mono"
              placeholder="#3B82F6"
            />
          </div>
        </div>
        <Button onClick={handleGenerate} size="sm">
          <Palette className="h-4 w-4 mr-1" /> 生成配色方案
        </Button>
      </div>

      {palettes && (
        <div className="space-y-6">
          {/* 色环可视化 */}
          <div className="flex justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {Array.from({ length: 12 }, (_, i) => {
                const angle = i * 30;
                const rad = (angle - 90) * (Math.PI / 180);
                const x1 = 100 + 70 * Math.cos(rad);
                const y1 = 100 + 70 * Math.sin(rad);
                const x2 = 100 + 90 * Math.cos(rad);
                const y2 = 100 + 90 * Math.sin(rad);
                const segmentColor = rgbToHex(
                  ...Object.values(hslToRgb(angle, 0.8, 0.5)) as [number, number, number]
                );
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={segmentColor}
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                );
              })}
              {/* 主色指示点 */}
              {(() => {
                const { h } = hexToHsl(baseColor);
                const rad = (h - 90) * (Math.PI / 180);
                const cx = 100 + 80 * Math.cos(rad);
                const cy = 100 + 80 * Math.sin(rad);
                return (
                  <circle cx={cx} cy={cy} r={6} fill="white" stroke={baseColor} strokeWidth="3" />
                );
              })()}
              {/* 互补色指示点 */}
              {(() => {
                const { h } = hexToHsl(baseColor);
                const rad = ((h + 180) - 90) * (Math.PI / 180);
                const cx = 100 + 80 * Math.cos(rad);
                const cy = 100 + 80 * Math.sin(rad);
                const compHex = rgbToHex(
                  ...Object.values(hslToRgb((h + 180) % 360, 0.8, 0.5)) as [number, number, number]
                );
                return (
                  <circle cx={cx} cy={cy} r={6} fill="white" stroke={compHex} strokeWidth="3" />
                );
              })()}
              <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            </svg>
          </div>

          {Object.entries(palettes).map(([key, swatches]) => (
            <div key={key} className="space-y-2">
              <h3 className="text-sm font-semibold">{paletteNames[key]}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {swatches.map((swatch) => (
                  <ColorSwatchCard
                    key={swatch.hex + swatch.label}
                    swatch={swatch}
                    onCopy={handleCopy}
                    copiedHex={copiedHex}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
