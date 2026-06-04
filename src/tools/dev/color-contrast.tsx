"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Parse color from hex or rgb string */
function parseColor(color: string): RGB | null {
  const trimmed = color.trim();

  // Hex format: #RGB, #RRGGBB
  const hexMatch = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // rgb() format
  const rgbMatch = trimmed.match(
    /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i
  );
  if (rgbMatch) {
    return {
      r: Math.min(255, parseInt(rgbMatch[1], 10)),
      g: Math.min(255, parseInt(rgbMatch[2], 10)),
      b: Math.min(255, parseInt(rgbMatch[3], 10)),
    };
  }

  return null;
}

/** Convert RGB to hex */
function rgbToHex(rgb: RGB): string {
  return (
    "#" +
    [rgb.r, rgb.g, rgb.b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Calculate relative luminance per WCAG 2.0 */
function relativeLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  const r = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const g = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const b = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Calculate contrast ratio between two RGB colors */
function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface WcagResult {
  ratio: number;
  aa: { normal: boolean; large: boolean };
  aaa: { normal: boolean; large: boolean };
}

function evaluateWcag(fg: RGB, bg: RGB): WcagResult {
  const ratio = contrastRatio(fg, bg);
  return {
    ratio,
    aa: {
      normal: ratio >= 4.5,
      large: ratio >= 3,
    },
    aaa: {
      normal: ratio >= 7,
      large: ratio >= 4.5,
    },
  };
}

export function ColorContrastTool() {
  const [fgInput, setFgInput] = useState("#1a1a2e");
  const [bgInput, setBgInput] = useState("#ffffff");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fgRgb = useMemo(() => parseColor(fgInput), [fgInput]);
  const bgRgb = useMemo(() => parseColor(bgInput), [bgInput]);

  const result = useMemo(() => {
    if (!fgRgb || !bgRgb) return null;
    return evaluateWcag(fgRgb, bgRgb);
  }, [fgRgb, bgRgb]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderPassFail = (pass: boolean) => (
    <Badge variant={pass ? "default" : "destructive"} className="text-xs">
      {pass ? "通过" : "未通过"}
    </Badge>
  );

  return (
    <div className="space-y-4">
      {/* Color inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Foreground */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-semibold">前景色</Label>
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-md border border-border"
                  style={{ backgroundColor: fgRgb ? rgbToHex(fgRgb) : fgInput }}
                />
                <input
                  type="color"
                  value={fgRgb ? rgbToHex(fgRgb) : "#000000"}
                  onChange={(e) => setFgInput(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <Input
                value={fgInput}
                onChange={(e) => setFgInput(e.target.value)}
                placeholder="#000000 或 rgb(0,0,0)"
                className="font-mono text-sm"
              />
            </div>
            {fgRgb && (
              <p className="text-xs text-muted-foreground">
                RGB({fgRgb.r}, {fgRgb.g}, {fgRgb.b}) · {rgbToHex(fgRgb)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Background */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-semibold">背景色</Label>
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-md border border-border"
                  style={{ backgroundColor: bgRgb ? rgbToHex(bgRgb) : bgInput }}
                />
                <input
                  type="color"
                  value={bgRgb ? rgbToHex(bgRgb) : "#ffffff"}
                  onChange={(e) => setBgInput(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <Input
                value={bgInput}
                onChange={(e) => setBgInput(e.target.value)}
                placeholder="#ffffff 或 rgb(255,255,255)"
                className="font-mono text-sm"
              />
            </div>
            {bgRgb && (
              <p className="text-xs text-muted-foreground">
                RGB({bgRgb.r}, {bgRgb.g}, {bgRgb.b}) · {rgbToHex(bgRgb)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {fgRgb && bgRgb && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">颜色预览</h3>
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: rgbToHex(bgRgb), color: rgbToHex(fgRgb) }}
              >
                <p className="text-2xl font-bold">Aa</p>
                <p className="text-sm">正常文字示例</p>
              </div>
              <div
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: rgbToHex(fgRgb), color: rgbToHex(bgRgb) }}
              >
                <p className="text-2xl font-bold">Aa</p>
                <p className="text-sm">反色预览</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contrast ratio result */}
      {result && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">对比度</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono">
                  {result.ratio.toFixed(2)}:1
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    handleCopy(`${result.ratio.toFixed(2)}:1`, "ratio")
                  }
                >
                  {copiedField === "ratio" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* WCAG results table */}
            <div className="space-y-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-muted-foreground font-medium">
                      级别
                    </th>
                    <th className="text-center py-2 text-muted-foreground font-medium">
                      正常文字
                    </th>
                    <th className="text-center py-2 text-muted-foreground font-medium">
                      大文字
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">AA (最低要求)</td>
                    <td className="text-center py-2">
                      {renderPassFail(result.aa.normal)}
                    </td>
                    <td className="text-center py-2">
                      {renderPassFail(result.aa.large)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">AAA (增强对比)</td>
                    <td className="text-center py-2">
                      {renderPassFail(result.aaa.normal)}
                    </td>
                    <td className="text-center py-2">
                      {renderPassFail(result.aaa.large)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>· AA 正常文字: 对比度 ≥ 4.5:1</p>
              <p>· AA 大文字 (≥18pt/14pt粗体): 对比度 ≥ 3:1</p>
              <p>· AAA 正常文字: 对比度 ≥ 7:1</p>
              <p>· AAA 大文字: 对比度 ≥ 4.5:1</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!fgRgb && (
        <p className="text-sm text-destructive">前景色格式无效，请使用 HEX 或 rgb() 格式</p>
      )}
      {!bgRgb && (
        <p className="text-sm text-destructive">背景色格式无效，请使用 HEX 或 rgb() 格式</p>
      )}
    </div>
  );
}
