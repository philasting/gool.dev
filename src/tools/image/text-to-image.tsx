"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Type } from "lucide-react";

type TextAlign = "left" | "center" | "right";

interface TextImageOptions {
  text: string;
  fontSize: number;
  fontColor: string;
  bgColor: string;
  align: TextAlign;
  width: number;
  height: number;
  paddingX: number;
  paddingY: number;
}

export function TextToImageTool() {
  const [options, setOptions] = useState<TextImageOptions>({
    text: "",
    fontSize: 32,
    fontColor: "#000000",
    bgColor: "#ffffff",
    align: "center",
    width: 600,
    height: 400,
    paddingX: 40,
    paddingY: 40,
  });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = options.width;
    canvas.height = options.height;

    // Background
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.fillStyle = options.fontColor;
    ctx.font = `${options.fontSize}px "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif`;
    ctx.textBaseline = "top";
    ctx.textAlign = options.align;

    const lines = options.text.split("\n");
    const lineHeight = options.fontSize * 1.5;
    const contentWidth = options.width - options.paddingX * 2;

    // Word wrap
    const wrappedLines: string[] = [];
    for (const line of lines) {
      if (!line) {
        wrappedLines.push("");
        continue;
      }
      let currentLine = "";
      for (const ch of line) {
        const testLine = currentLine + ch;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > contentWidth && currentLine) {
          wrappedLines.push(currentLine);
          currentLine = ch;
        } else {
          currentLine = testLine;
        }
      }
      wrappedLines.push(currentLine);
    }

    const totalTextHeight = wrappedLines.length * lineHeight;
    let startY = options.paddingY;

    // If content fits, center vertically
    if (totalTextHeight < options.height - options.paddingY * 2) {
      startY = (options.height - totalTextHeight) / 2;
    }

    let xPos = options.paddingX;
    if (options.align === "center") xPos = options.width / 2;
    else if (options.align === "right") xPos = options.width - options.paddingX;

    for (const line of wrappedLines) {
      ctx.fillText(line, xPos, startY);
      startY += lineHeight;
    }

    setPreviewUrl(canvas.toDataURL("image/png"));
  }, [options]);

  useEffect(() => {
    if (options.text) {
      renderCanvas();
    } else {
      setPreviewUrl("");
    }
  }, [options, renderCanvas]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "text-image.png";
    a.click();
  }, [previewUrl]);

  const updateOption = <K extends keyof TextImageOptions>(key: K, value: TextImageOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      <div className="space-y-2">
        <Label>输入文字</Label>
        <Textarea
          value={options.text}
          onChange={(e) => updateOption("text", e.target.value)}
          placeholder="输入要转换为图片的文字...&#10;支持多行文本"
          className="min-h-[120px]"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">字体大小 (px)</Label>
          <Input
            type="number"
            value={options.fontSize}
            onChange={(e) => updateOption("fontSize", Number(e.target.value) || 16)}
            min={8}
            max={200}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">字体颜色</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={options.fontColor}
              onChange={(e) => updateOption("fontColor", e.target.value)}
              className="h-8 w-8 rounded border border-input cursor-pointer"
            />
            <Input value={options.fontColor} onChange={(e) => updateOption("fontColor", e.target.value)} className="h-8 flex-1" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">背景色</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={options.bgColor}
              onChange={(e) => updateOption("bgColor", e.target.value)}
              className="h-8 w-8 rounded border border-input cursor-pointer"
            />
            <Input value={options.bgColor} onChange={(e) => updateOption("bgColor", e.target.value)} className="h-8 flex-1" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">对齐方式</Label>
          <Select value={options.align} onValueChange={(v) => updateOption("align", v as TextAlign)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">左对齐</SelectItem>
              <SelectItem value="center">居中</SelectItem>
              <SelectItem value="right">右对齐</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">宽度 (px)</Label>
          <Input
            type="number"
            value={options.width}
            onChange={(e) => updateOption("width", Number(e.target.value) || 100)}
            min={50}
            max={4096}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">高度 (px)</Label>
          <Input
            type="number"
            value={options.height}
            onChange={(e) => updateOption("height", Number(e.target.value) || 100)}
            min={50}
            max={4096}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">水平内边距 (px)</Label>
          <Input
            type="number"
            value={options.paddingX}
            onChange={(e) => updateOption("paddingX", Number(e.target.value) || 0)}
            min={0}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">垂直内边距 (px)</Label>
          <Input
            type="number"
            value={options.paddingY}
            onChange={(e) => updateOption("paddingY", Number(e.target.value) || 0)}
            min={0}
            className="h-8"
          />
        </div>
      </div>

      {previewUrl && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">预览</span>
              </div>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> 下载 PNG
              </Button>
            </div>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="文字图片预览" className="max-h-80 rounded-lg border border-border" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
