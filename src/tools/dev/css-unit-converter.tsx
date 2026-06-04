"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

type CssUnit = "px" | "rem" | "em" | "vw" | "vh" | "pt" | "%";

const UNITS: CssUnit[] = ["px", "rem", "em", "vw", "vh", "pt", "%"];

const UNIT_LABELS: Record<CssUnit, string> = {
  px: "px",
  rem: "rem",
  em: "em",
  vw: "vw",
  vh: "vh",
  pt: "pt",
  "%": "% (相对父元素宽度)",
};

/** Convert a value from any unit to px */
function toPx(
  value: number,
  unit: CssUnit,
  rootFontSize: number,
  viewportWidth: number,
  viewportHeight: number,
  parentWidth: number
): number {
  switch (unit) {
    case "px":
      return value;
    case "rem":
      return value * rootFontSize;
    case "em":
      return value * rootFontSize; // simplified: em same as rem for root context
    case "vw":
      return (value / 100) * viewportWidth;
    case "vh":
      return (value / 100) * viewportHeight;
    case "pt":
      return value * (96 / 72);
    case "%":
      return (value / 100) * parentWidth;
    default:
      return value;
  }
}

/** Convert px to target unit */
function fromPx(
  pxValue: number,
  targetUnit: CssUnit,
  rootFontSize: number,
  viewportWidth: number,
  viewportHeight: number,
  parentWidth: number
): number {
  switch (targetUnit) {
    case "px":
      return pxValue;
    case "rem":
      return pxValue / rootFontSize;
    case "em":
      return pxValue / rootFontSize;
    case "vw":
      return (pxValue / viewportWidth) * 100;
    case "vh":
      return (pxValue / viewportHeight) * 100;
    case "pt":
      return pxValue * (72 / 96);
    case "%":
      return (pxValue / parentWidth) * 100;
    default:
      return pxValue;
  }
}

function formatNumber(n: number): string {
  if (!isFinite(n)) return "—";
  if (Number.isInteger(n)) return n.toString();
  // Up to 6 decimal places, strip trailing zeros
  return parseFloat(n.toFixed(6)).toString();
}

export function CssUnitConverterTool() {
  const [inputValue, setInputValue] = useState("16");
  const [inputUnit, setInputUnit] = useState<CssUnit>("px");
  const [rootFontSize, setRootFontSize] = useState("16");
  const [viewportWidth, setViewportWidth] = useState("1920");
  const [viewportHeight, setViewportHeight] = useState("1080");
  const [parentWidth, setParentWidth] = useState("1200");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const root = parseFloat(rootFontSize) || 16;
  const vw = parseFloat(viewportWidth) || 1920;
  const vh = parseFloat(viewportHeight) || 1080;
  const pw = parseFloat(parentWidth) || 1200;
  const val = parseFloat(inputValue) || 0;

  const conversions = useMemo(() => {
    const pxValue = toPx(val, inputUnit, root, vw, vh, pw);
    const result: Record<CssUnit, string> = {} as Record<CssUnit, string>;
    for (const u of UNITS) {
      if (u === inputUnit) {
        result[u] = formatNumber(val);
      } else {
        result[u] = formatNumber(fromPx(pxValue, u, root, vw, vh, pw));
      }
    }
    return result;
  }, [val, inputUnit, root, vw, vh, pw]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Input section */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-sm">数值</Label>
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="font-mono"
                placeholder="输入数值"
              />
            </div>
            <div className="w-28">
              <Label className="text-sm">单位</Label>
              <Select
                value={inputUnit}
                onValueChange={(v) => setInputUnit(v as CssUnit)}
              >
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u} className="font-mono">
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion results */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-semibold mb-3">转换结果</h3>
          {UNITS.filter((u) => u !== inputUnit).map((u) => (
            <div
              key={u}
              className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0"
            >
              <span className="text-xs font-semibold w-8 shrink-0 text-muted-foreground">
                {u}
              </span>
              <code className="flex-1 text-sm font-mono bg-muted px-2 py-1 rounded">
                {conversions[u]}
                {u}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() =>
                  handleCopy(`${conversions[u]}${u}`, u)
                }
              >
                {copiedField === u ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Base values */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold mb-2">基准值设置</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">
                根字号 (root font-size)
              </Label>
              <Input
                type="number"
                value={rootFontSize}
                onChange={(e) => setRootFontSize(e.target.value)}
                className="font-mono text-sm"
                min={1}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                视口宽度 (px)
              </Label>
              <Input
                type="number"
                value={viewportWidth}
                onChange={(e) => setViewportWidth(e.target.value)}
                className="font-mono text-sm"
                min={1}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                视口高度 (px)
              </Label>
              <Input
                type="number"
                value={viewportHeight}
                onChange={(e) => setViewportHeight(e.target.value)}
                className="font-mono text-sm"
                min={1}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                父元素宽度 (px)
              </Label>
              <Input
                type="number"
                value={parentWidth}
                onChange={(e) => setParentWidth(e.target.value)}
                className="font-mono text-sm"
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
