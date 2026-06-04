"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Download, Type, Copy, Check } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type CharsetMode = "standard" | "detailed" | "blocks";

const CHARSETS: Record<CharsetMode, string> = {
  standard: "@%#*+=-:. ",
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  blocks: "█▓▒░ ",
};

const FONT_SIZE_MAP: Record<CharsetMode, number> = {
  standard: 6,
  detailed: 4,
  blocks: 10,
};

export function ImageToAsciiTool() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [asciiArt, setAsciiArt] = useState<string>("");
  const [coloredHtml, setColoredHtml] = useState<string>("");
  const [width, setWidth] = useState(100);
  const [charsetMode, setCharsetMode] = useState<CharsetMode>("standard");
  const [colorMode, setColorMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { copied, handleCopy } = useCopyState();

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setAsciiArt("");
    setColoredHtml("");
  }, []);

  const processImage = useCallback(async () => {
    if (!imageUrl) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // Calculate dimensions based on target width and aspect ratio
      // Characters are roughly 2x taller than wide, so halve the height
      const charWidth = width;
      const charHeight = Math.round((img.naturalHeight / img.naturalWidth) * charWidth * 0.5);
      canvas.width = charWidth;
      canvas.height = charHeight;

      ctx.drawImage(img, 0, 0, charWidth, charHeight);
      const imageData = ctx.getImageData(0, 0, charWidth, charHeight);
      const data = imageData.data;

      const charset = CHARSETS[charsetMode];
      let result = "";
      let htmlResult = "";

      for (let y = 0; y < charHeight; y++) {
        for (let x = 0; x < charWidth; x++) {
          const idx = (y * charWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Calculate grayscale
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const alpha = a / 255;
          const adjustedGray = gray * alpha + 255 * (1 - alpha); // Blend with white bg

          // Map to character
          const charIndex = Math.floor((adjustedGray / 255) * (charset.length - 1));
          const ch = charset[Math.min(charIndex, charset.length - 1)];

          result += ch;

          if (colorMode) {
            htmlResult += `<span style="color:rgb(${r},${g},${b})">${ch === " " ? "&nbsp;" : ch.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
          }
        }
        result += "\n";
        if (colorMode) htmlResult += "<br>";
      }

      setAsciiArt(result);
      if (colorMode) {
        setColoredHtml(htmlResult);
      } else {
        setColoredHtml("");
      }
    } catch (err) {
      console.error("Image to ASCII failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, width, charsetMode, colorMode]);

  const handleDownload = useCallback(() => {
    if (!asciiArt) return;
    const blob = new Blob([asciiArt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascii-art.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [asciiArt]);

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
      >
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽图片到此处</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
      </div>

      {imageUrl && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>宽度（字符数）</Label>
              <span className="text-sm font-mono text-primary">{width}</span>
            </div>
            <Slider
              value={[width]}
              onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setWidth(val); }}
              min={40}
              max={200}
              step={10}
            />
          </div>
          <div className="space-y-2">
            <Label>字符集</Label>
            <Select value={charsetMode} onValueChange={(v) => setCharsetMode(v as CharsetMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">标准</SelectItem>
                <SelectItem value="detailed">精细</SelectItem>
                <SelectItem value="blocks">块状</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Label>彩色模式</Label>
            <Switch checked={colorMode} onCheckedChange={setColorMode} />
          </div>
        </div>
      )}

      {imageUrl && (
        <Button onClick={processImage} disabled={isProcessing}>
          <Type className="h-4 w-4 mr-1" />
          {isProcessing ? "转换中..." : "生成字符画"}
        </Button>
      )}

      {asciiArt && !colorMode && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">ASCII 字符画</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleCopy(asciiArt)}>
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "已复制" : "复制"}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" /> 下载
                </Button>
              </div>
            </div>
            <pre
              className="bg-black text-green-400 rounded-lg p-4 overflow-auto text-left leading-none"
              style={{ fontSize: `${FONT_SIZE_MAP[charsetMode]}px`, lineHeight: 1.1 }}
            >
              {asciiArt}
            </pre>
          </CardContent>
        </Card>
      )}

      {coloredHtml && colorMode && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">彩色字符画</span>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> 下载文本
              </Button>
            </div>
            <div
              className="bg-black rounded-lg p-4 overflow-auto"
              style={{ fontSize: `${FONT_SIZE_MAP[charsetMode]}px`, lineHeight: 1.1 }}
              dangerouslySetInnerHTML={{ __html: coloredHtml }}
            />
          </CardContent>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
