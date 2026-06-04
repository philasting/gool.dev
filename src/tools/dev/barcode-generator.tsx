"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Download } from "lucide-react";

/**
 * Code 128 B encoding table
 * Each entry: [value, pattern (bars: 1=narrow, 2=wide), character]
 */
const CODE128B_CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

// Code 128 B encoding patterns (6 bars per symbol: 3 black, 3 white, alternating)
// Each number represents the width of a bar (1-4 units)
const CODE128B_PATTERNS: number[][] = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
  [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
  [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
  [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
  [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
  [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
  [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
  [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
  [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
  [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
  [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
  [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
  [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
  [2,1,1,2,3,2],[2,3,3,1,1,1,2],
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/** Get Code 128 B value for a character */
function getCode128BValue(char: string): number {
  const idx = CODE128B_CHARS.indexOf(char);
  if (idx === -1) return -1;
  return idx + 32; // Code 128 B starts at space (ASCII 32)
}

/** Calculate check digit */
function calculateCheckDigit(values: number[]): number {
  let sum = values[0]; // start code
  for (let i = 1; i < values.length; i++) {
    sum += values[i] * i;
  }
  return sum % 103;
}

/** Render Code 128 B barcode to canvas */
function renderBarcode(
  canvas: HTMLCanvasElement,
  text: string,
  barWidth: number,
  barHeight: number,
  showText: boolean
): void {
  if (!text) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Encode
  const startValue = START_CODE_B;
  const charValues: number[] = [startValue];
  for (const ch of text) {
    const val = getCode128BValue(ch);
    if (val === -1) continue;
    charValues.push(val);
  }

  const checkDigit = calculateCheckDigit(charValues);
  charValues.push(checkDigit);
  charValues.push(STOP_CODE);

  // Build bar pattern
  const bars: number[] = [];
  for (const val of charValues) {
    const pattern = CODE128B_PATTERNS[val];
    if (pattern) {
      for (const width of pattern) {
        bars.push(width);
      }
    }
  }

  const totalWidth = bars.reduce((sum, b) => sum + b, 0) * barWidth + barWidth * 2; // quiet zones
  const textHeight = showText ? 24 : 0;
  const height = barHeight + textHeight;

  canvas.width = totalWidth;
  canvas.height = height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalWidth, height);

  // Draw bars
  let x = barWidth; // quiet zone
  let isBlack = true;
  for (const width of bars) {
    if (isBlack) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, 0, width * barWidth, barHeight);
    }
    x += width * barWidth;
    isBlack = !isBlack;
  }

  // Draw text below
  if (showText) {
    ctx.fillStyle = "#000000";
    ctx.font = `${Math.max(12, barWidth * 4)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(text, totalWidth / 2, barHeight + 4);
  }
}

export function BarcodeGeneratorTool() {
  const [text, setText] = useState("Hello-123");
  const [barWidth, setBarWidth] = useState(2);
  const [barHeight, setBarHeight] = useState(100);
  const [showText, setShowText] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;
    renderBarcode(canvas, text, barWidth, barHeight, showText);
  }, [text, barWidth, barHeight, showText]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `barcode-${text || "code128"}.png`;
    a.click();
  }, [text]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">输入文本（仅 ASCII 可打印字符）</Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Hello-123"
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">条宽: {barWidth}px</Label>
              <Input
                type="range"
                min={1}
                max={4}
                value={barWidth}
                onChange={(e) => setBarWidth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">高度: {barHeight}px</Label>
              <Input
                type="range"
                min={50}
                max={200}
                value={barHeight}
                onChange={(e) => setBarHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="show-text"
              checked={showText}
              onCheckedChange={setShowText}
            />
            <Label htmlFor="show-text" className="text-sm cursor-pointer">显示文字</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} size="sm" disabled={!text.trim()}>
              生成条形码
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" /> 下载 PNG
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">预览</Label>
          <Card>
            <CardContent className="p-4 flex items-center justify-center min-h-[200px]">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
