"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ArrowRightLeft } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface CssMapping {
  cssPattern: RegExp;
  transform: (match: RegExpMatchArray) => string;
}

function pxToRem(px: number): string {
  const rem = px / 16;
  if (Number.isInteger(rem)) return `${rem}`;
  return `${rem}`;
}

function pxToTailwindSpacing(px: number): string | null {
  const spacingMap: Record<number, string> = {
    0: "0", 1: "px", 2: "0.5", 4: "1", 5: "1.5", 6: "1.5", 8: "2",
    10: "2.5", 12: "3", 14: "3.5", 16: "4", 20: "5", 24: "6",
    28: "7", 32: "8", 36: "9", 40: "10", 44: "11", 48: "12",
    52: "13", 56: "14", 60: "15", 64: "16", 72: "18", 80: "20",
    96: "24", 112: "28", 128: "32", 144: "36", 160: "40",
    176: "44", 192: "48", 208: "52", 224: "56", 240: "60",
    256: "64", 288: "72", 320: "80", 384: "96",
  };
  if (px in spacingMap) return spacingMap[px];
  return null;
}

function pxToBorderRadius(px: number): string | null {
  const map: Record<number, string> = {
    0: "none", 2: "sm", 4: "", 6: "md", 8: "lg", 12: "xl",
    16: "2xl", 24: "3xl", 9999: "full",
  };
  if (px in map) return map[px];
  return null;
}

function fontSizeToTailwind(px: number): string | null {
  const map: Record<number, string> = {
    12: "xs", 14: "sm", 16: "base", 18: "lg", 20: "xl",
    24: "2xl", 30: "3xl", 36: "4xl", 48: "5xl", 60: "6xl",
    72: "7xl", 96: "8xl", 128: "9xl",
  };
  return map[px] ?? null;
}

function fontWeightToTailwind(weight: number | string): string | null {
  const map: Record<string, string> = {
    "100": "thin", "200": "extralight", "300": "light", "400": "normal",
    "500": "medium", "600": "semibold", "700": "bold", "800": "extrabold",
    "900": "black",
  };
  return map[String(weight)] ?? null;
}

function lineHeightToTailwind(value: string): string | null {
  const map: Record<string, string> = {
    "1": "none", "1.25": "tight", "1.375": "snug",
    "1.5": "normal", "1.625": "relaxed", "2": "loose",
  };
  return map[value] ?? null;
}

function letterSpacingToTailwind(value: string): string | null {
  const map: Record<string, string> = {
    "-0.05em": "tighter", "-0.025em": "tight", "0em": "normal",
    "0.025em": "wide", "0.05em": "wider", "0.1em": "widest",
  };
  return map[value] ?? null;
}

function colorToTailwind(color: string): string | null {
  const namedColors: Record<string, string> = {
    "transparent": "transparent", "currentColor": "current",
    "#000000": "black", "#000": "black",
    "#ffffff": "white", "#fff": "white",
    "#f3f4f6": "gray-100", "#e5e7eb": "gray-200",
    "#d1d5db": "gray-300", "#9ca3af": "gray-400",
    "#6b7280": "gray-500", "#4b5563": "gray-600",
    "#374151": "gray-700", "#1f2937": "gray-800",
    "#111827": "gray-900",
    "#ef4444": "red-500", "#dc2626": "red-600",
    "#f97316": "orange-500", "#ea580c": "orange-600",
    "#eab308": "yellow-500", "#ca8a04": "yellow-600",
    "#22c55e": "green-500", "#16a34a": "green-600",
    "#3b82f6": "blue-500", "#2563eb": "blue-600",
    "#8b5cf6": "violet-500", "#7c3aed": "violet-600",
    "#ec4899": "pink-500", "#db2777": "pink-600",
  };
  const normalized = color.trim().toLowerCase().replace(/\s+/g, "");
  return namedColors[normalized] ?? null;
}

function opacityToTailwind(value: string): string | null {
  const map: Record<string, string> = {
    "0": "0", "0.05": "5", "0.1": "10", "0.2": "20",
    "0.25": "25", "0.3": "30", "0.4": "40", "0.5": "50",
    "0.6": "60", "0.7": "70", "0.75": "75", "0.8": "80",
    "0.9": "90", "1": "100",
  };
  return map[value] ?? null;
}

function zIndexToTailwind(value: string): string | null {
  const map: Record<string, string> = {
    "0": "0", "10": "10", "20": "20", "30": "30", "40": "40", "50": "50",
    "auto": "auto",
  };
  return map[value] ?? null;
}

function convertCssLine(line: string): { tailwind: string; matched: boolean; original: string } {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("*/")) {
    return { tailwind: trimmed, matched: false, original: trimmed };
  }

  const colonIdx = trimmed.indexOf(":");
  if (colonIdx === -1) {
    return { tailwind: trimmed, matched: false, original: trimmed };
  }

  const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
  const val = trimmed.slice(colonIdx + 1).replace(/;$/, "").trim().toLowerCase();

  const result = convertProperty(prop, val);
  if (result) {
    return { tailwind: result, matched: true, original: trimmed };
  }
  return { tailwind: trimmed, matched: false, original: trimmed };
}

function convertProperty(prop: string, val: string): string | null {
  // Display
  if (prop === "display") {
    const map: Record<string, string> = {
      block: "block", "inline-block": "inline-block", inline: "inline",
      flex: "flex", "inline-flex": "inline-flex", grid: "grid",
      "inline-grid": "inline-grid", hidden: "hidden", none: "hidden",
      "table": "table", "table-row": "table-row", "table-cell": "table-cell",
    };
    return map[val] ? map[val] : null;
  }

  // Position
  if (prop === "position") {
    const map: Record<string, string> = {
      static: "static", fixed: "fixed", absolute: "absolute",
      relative: "relative", sticky: "sticky",
    };
    return map[val] ?? null;
  }

  // Flex direction
  if (prop === "flex-direction") {
    const map: Record<string, string> = {
      row: "flex-row", column: "flex-col", "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
    };
    return map[val] ?? null;
  }

  // Flex wrap
  if (prop === "flex-wrap") {
    const map: Record<string, string> = {
      wrap: "flex-wrap", "wrap-reverse": "flex-wrap-reverse", nowrap: "flex-nowrap",
    };
    return map[val] ?? null;
  }

  // Justify content
  if (prop === "justify-content") {
    const map: Record<string, string> = {
      "flex-start": "justify-start", "flex-end": "justify-end",
      center: "justify-center", "space-between": "justify-between",
      "space-around": "justify-around", "space-evenly": "justify-evenly",
    };
    return map[val] ?? null;
  }

  // Align items
  if (prop === "align-items") {
    const map: Record<string, string> = {
      "flex-start": "items-start", "flex-end": "items-end",
      center: "items-center", baseline: "items-baseline", stretch: "items-stretch",
    };
    return map[val] ?? null;
  }

  // Align self
  if (prop === "align-self") {
    const map: Record<string, string> = {
      auto: "self-auto", "flex-start": "self-start", "flex-end": "self-end",
      center: "self-center", stretch: "self-stretch", baseline: "self-baseline",
    };
    return map[val] ?? null;
  }

  // Flex
  if (prop === "flex") {
    if (val === "1" || val === "1 1 0%") return "flex-1";
    if (val === "auto" || val === "1 1 auto") return "flex-auto";
    if (val === "initial" || val === "0 1 auto") return "flex-initial";
    if (val === "none" || val === "0 0 auto" || val === "0 0 0%") return "flex-none";
    return null;
  }

  if (prop === "flex-grow") {
    if (val === "0") return "grow-0";
    if (val === "1") return "grow";
  }
  if (prop === "flex-shrink") {
    if (val === "0") return "shrink-0";
    if (val === "1") return "shrink";
  }

  // Gap
  if (prop === "gap") {
    const px = parsePx(val);
    if (px !== null) {
      const tw = pxToTailwindSpacing(px);
      if (tw !== null) return `gap-${tw}`;
    }
    return null;
  }
  if (prop === "row-gap" || prop === "gap-row") {
    const px = parsePx(val);
    if (px !== null) {
      const tw = pxToTailwindSpacing(px);
      if (tw !== null) return `gap-y-${tw}`;
    }
    return null;
  }
  if (prop === "column-gap" || prop === "gap-column") {
    const px = parsePx(val);
    if (px !== null) {
      const tw = pxToTailwindSpacing(px);
      if (tw !== null) return `gap-x-${tw}`;
    }
    return null;
  }

  // Padding
  if (prop === "padding") return spacingClass("p", val);
  if (prop === "padding-top") return spacingClass("pt", val);
  if (prop === "padding-bottom") return spacingClass("pb", val);
  if (prop === "padding-left") return spacingClass("pl", val);
  if (prop === "padding-right") return spacingClass("pr", val);
  if (prop === "padding-x" || prop === "padding-inline") return spacingClass("px", val);
  if (prop === "padding-y" || prop === "padding-block") return spacingClass("py", val);

  // Margin
  if (prop === "margin") return spacingClass("m", val);
  if (prop === "margin-top") return spacingClass("mt", val);
  if (prop === "margin-bottom") return spacingClass("mb", val);
  if (prop === "margin-left") return spacingClass("ml", val);
  if (prop === "margin-right") return spacingClass("mr", val);
  if (prop === "margin-x" || prop === "margin-inline") return spacingClass("mx", val);
  if (prop === "margin-y" || prop === "margin-block") return spacingClass("my", val);

  // Width
  if (prop === "width") {
    if (val === "100%") return "w-full";
    if (val === "50%") return "w-1/2";
    if (val === "33.333%" || val === "33.33%") return "w-1/3";
    if (val === "66.667%" || val === "66.66%") return "w-2/3";
    if (val === "25%") return "w-1/4";
    if (val === "75%") return "w-3/4";
    if (val === "auto") return "w-auto";
    if (val === "0px" || val === "0") return "w-0";
    if (val === "100vw") return "w-screen";
    if (val === "min-content") return "w-min";
    if (val === "max-content") return "w-max";
    if (val === "fit-content") return "w-fit";
    const px = parsePx(val);
    if (px !== null) {
      const tw = pxToTailwindSpacing(px);
      if (tw !== null) return `w-${tw}`;
    }
    return null;
  }

  // Height
  if (prop === "height") {
    if (val === "100%") return "h-full";
    if (val === "100vh") return "h-screen";
    if (val === "auto") return "h-auto";
    if (val === "0px" || val === "0") return "h-0";
    if (val === "min-content") return "h-min";
    if (val === "max-content") return "h-max";
    if (val === "fit-content") return "h-fit";
    const px = parsePx(val);
    if (px !== null) {
      const tw = pxToTailwindSpacing(px);
      if (tw !== null) return `h-${tw}`;
    }
    return null;
  }

  // Font size
  if (prop === "font-size") {
    const px = parsePx(val);
    if (px !== null) {
      const tw = fontSizeToTailwind(px);
      if (tw !== null) return `text-${tw}`;
    }
    return null;
  }

  // Font weight
  if (prop === "font-weight") {
    const tw = fontWeightToTailwind(val);
    if (tw !== null) return `font-${tw}`;
    return null;
  }

  // Font family
  if (prop === "font-family") {
    if (val.includes("sans")) return "font-sans";
    if (val.includes("serif")) return "font-serif";
    if (val.includes("mono")) return "font-mono";
    return null;
  }

  // Text align
  if (prop === "text-align") {
    const map: Record<string, string> = {
      left: "text-left", center: "text-center", right: "text-right", justify: "text-justify",
    };
    return map[val] ?? null;
  }

  // Text decoration
  if (prop === "text-decoration") {
    const map: Record<string, string> = {
      underline: "underline", "line-through": "line-through", none: "no-underline",
    };
    return map[val] ?? null;
  }

  // Text transform
  if (prop === "text-transform") {
    const map: Record<string, string> = {
      uppercase: "uppercase", lowercase: "lowercase", capitalize: "capitalize", none: "normal-case",
    };
    return map[val] ?? null;
  }

  // Line height
  if (prop === "line-height") {
    const tw = lineHeightToTailwind(val);
    if (tw !== null) return `leading-${tw}`;
    return null;
  }

  // Letter spacing
  if (prop === "letter-spacing") {
    const tw = letterSpacingToTailwind(val);
    if (tw !== null) return `tracking-${tw}`;
    return null;
  }

  // Color (text / background / border)
  if (prop === "color") {
    const tw = colorToTailwind(val);
    if (tw !== null) return `text-${tw}`;
    return null;
  }

  if (prop === "background-color" || prop === "background") {
    if (val === "transparent") return "bg-transparent";
    if (val === "none") return "bg-none";
    const tw = colorToTailwind(val);
    if (tw !== null) return `bg-${tw}`;
    return null;
  }

  // Border
  if (prop === "border-width") {
    const px = parsePx(val);
    if (px !== null) {
      if (px === 0) return "border-0";
      if (px === 1) return "border";
      if (px === 2) return "border-2";
      if (px === 4) return "border-4";
      if (px === 8) return "border-8";
    }
    return null;
  }

  if (prop === "border-style") {
    const map: Record<string, string> = {
      solid: "border-solid", dashed: "border-dashed", dotted: "border-dotted",
      double: "border-double", none: "border-none", hidden: "border-hidden",
    };
    return map[val] ?? null;
  }

  if (prop === "border-color") {
    const tw = colorToTailwind(val);
    if (tw !== null) return `border-${tw}`;
    return null;
  }

  // Border radius
  if (prop === "border-radius") {
    const px = parsePx(val);
    if (px !== null) {
      const tw = pxToBorderRadius(px);
      if (tw !== null) return tw === "" ? "rounded" : `rounded-${tw}`;
    }
    if (val === "9999px" || val === "50%") return "rounded-full";
    return null;
  }

  // Opacity
  if (prop === "opacity") {
    const tw = opacityToTailwind(val);
    if (tw !== null) return `opacity-${tw}`;
    return null;
  }

  // Overflow
  if (prop === "overflow") {
    const map: Record<string, string> = {
      auto: "overflow-auto", hidden: "overflow-hidden", visible: "overflow-visible", scroll: "overflow-scroll",
    };
    return map[val] ?? null;
  }

  // Cursor
  if (prop === "cursor") {
    const map: Record<string, string> = {
      pointer: "cursor-pointer", auto: "cursor-auto", default: "cursor-default",
      wait: "cursor-wait", text: "cursor-text", move: "cursor-move", "not-allowed": "cursor-not-allowed",
    };
    return map[val] ?? null;
  }

  // Z-index
  if (prop === "z-index") {
    const tw = zIndexToTailwind(val);
    if (tw !== null) return `z-${tw}`;
    return null;
  }

  // Outline
  if (prop === "outline") {
    if (val === "none") return "outline-none";
    return null;
  }

  // Box shadow
  if (prop === "box-shadow") {
    if (val === "none") return "shadow-none";
    if (val.includes("0 1px 2px")) return "shadow-sm";
    if (val.includes("0 1px 3px")) return "shadow";
    if (val.includes("0 4px 6px")) return "shadow-md";
    if (val.includes("0 10px 15px")) return "shadow-lg";
    if (val.includes("0 20px 25px")) return "shadow-xl";
    if (val.includes("0 25px 50px")) return "shadow-2xl";
    return null;
  }

  // Transition
  if (prop === "transition") {
    if (val === "all" || val.includes("all")) return "transition-all";
    if (val === "none") return "transition-none";
    return "transition";
  }

  // White space
  if (prop === "white-space") {
    const map: Record<string, string> = {
      normal: "whitespace-normal", nowrap: "whitespace-nowrap",
      pre: "whitespace-pre", "pre-line": "whitespace-pre-line", "pre-wrap": "whitespace-pre-wrap",
    };
    return map[val] ?? null;
  }

  // Word break
  if (prop === "word-break") {
    if (val === "break-all") return "break-all";
    if (val === "break-word") return "break-words";
    return null;
  }

  // Object fit
  if (prop === "object-fit") {
    const map: Record<string, string> = {
      contain: "object-contain", cover: "object-cover", fill: "object-fill", none: "object-none", "scale-down": "object-scale-down",
    };
    return map[val] ?? null;
  }

  // Pointer events
  if (prop === "pointer-events") {
    if (val === "none") return "pointer-events-none";
    if (val === "auto") return "pointer-events-auto";
    return null;
  }

  // User select
  if (prop === "user-select") {
    const map: Record<string, string> = {
      none: "select-none", text: "select-text", all: "select-all", auto: "select-auto",
    };
    return map[val] ?? null;
  }

  // List style
  if (prop === "list-style-type") {
    if (val === "disc" || val === "none" || val.includes("disc")) return "list-disc";
    if (val === "decimal" || val.includes("decimal")) return "list-decimal";
    if (val === "none") return "list-none";
    return null;
  }

  return null;
}

function parsePx(val: string): number | null {
  const match = val.match(/^([0-9]+\.?[0-9]*)px$/);
  if (match) return parseFloat(match[1]);
  const remMatch = val.match(/^([0-9]+\.?[0-9]*)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  return null;
}

function spacingClass(prefix: string, val: string): string | null {
  if (val === "auto") return `${prefix}-auto`;
  if (val === "0" || val === "0px") return `${prefix}-0`;
  const px = parsePx(val);
  if (px !== null) {
    const tw = pxToTailwindSpacing(px);
    if (tw !== null) return `${prefix}-${tw}`;
  }
  return null;
}

export function CssToTailwindTool() {
  const [cssInput, setCssInput] = useState("");
  const { copied, handleCopy } = useCopyState();

  const results = useMemo(() => {
    if (!cssInput.trim()) return [];
    const lines = cssInput.split("\n");
    return lines.map((line) => convertCssLine(line));
  }, [cssInput]);

  const tailwindClasses = useMemo(() => {
    return results
      .filter((r) => r.matched)
      .map((r) => r.tailwind)
      .join(" ");
  }, [results]);

  const unmatchedLines = useMemo(() => {
    return results
      .filter((r) => !r.matched && r.original.trim() && !r.original.trim().startsWith("{") && !r.original.trim().startsWith("}") && !r.original.trim().startsWith("/*"))
      .map((r) => r.original);
  }, [results]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>CSS 代码</Label>
        <Textarea
          value={cssInput}
          onChange={(e) => setCssInput(e.target.value)}
          placeholder={`输入 CSS 代码，例如：\ndisplay: flex;\njustify-content: center;\nalign-items: center;\npadding: 1rem;\nmargin-top: 0.5rem;\nfont-size: 14px;\nbackground-color: #fff;\nborder-radius: 0.25rem;`}
          className="min-h-[200px] font-mono text-sm"
        />
      </div>

      {results.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">转换结果（逐行）</Label>
            </div>
            <div className="space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-mono">
                  <span className="text-muted-foreground shrink-0 w-6 text-right">{i + 1}</span>
                  {r.matched ? (
                    <>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{r.original}</span>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="secondary" className="font-mono text-xs">{r.tailwind}</Badge>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">{r.original}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tailwindClasses && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Tailwind 类名</Label>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(tailwindClasses)}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
            <code className="block text-sm font-mono bg-muted p-2 rounded break-all">
              className="{tailwindClasses}"
            </code>
          </CardContent>
        </Card>
      )}

      {unmatchedLines.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-1">
            <Label className="text-sm text-muted-foreground">未匹配的属性（原样保留）</Label>
            {unmatchedLines.map((line, i) => (
              <code key={i} className="block text-xs font-mono text-muted-foreground">{line}</code>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
