"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Laugh } from "lucide-react";

interface TextOverlay {
  text: string;
  position: "top" | "bottom";
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
}

const PRESET_TEMPLATES = [
  { name: "经典表情", label: "经典上下文字" },
  { name: "只有上方", label: "仅上方文字" },
  { name: "只有下方", label: "仅下方文字" },
];

export function MemeMakerTool() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [fontSize, setFontSize] = useState(36);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [template, setTemplate] = useState("经典表情");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Render preview whenever settings change
  useEffect(() => {
    if (!imageUrl) {
      setPreviewUrl("");
      return;
    }

    const renderPreview = async () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to image size (max 800px wide)
      const maxWidth = 800;
      const scale = Math.min(maxWidth / img.naturalWidth, 1);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw text
      const drawMemeText = (text: string, y: number) => {
        if (!text) return;
        const displayText = text.toUpperCase();
        ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        // Word wrap
        const maxWidth = canvas.width - 40;
        const lines: string[] = [];
        let currentLine = "";

        for (const char of displayText) {
          const testLine = currentLine + char;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        let currentY = y;
        for (const line of lines) {
          // Stroke (outline)
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth * 2;
          ctx.lineJoin = "round";
          ctx.strokeText(line, canvas.width / 2, currentY);

          // Fill
          ctx.fillStyle = fontColor;
          ctx.fillText(line, canvas.width / 2, currentY);

          currentY += fontSize + 4;
        }
      };

      // Top text
      if (template !== "只有下方" && topText) {
        drawMemeText(topText, 10);
      }

      // Bottom text
      if (template !== "只有上方" && bottomText) {
        // Measure bottom text height
        ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`;
        const bottomLines: string[] = [];
        let currentLine = "";
        const maxTextWidth = canvas.width - 40;
        for (const char of bottomText.toUpperCase()) {
          const testLine = currentLine + char;
          if (ctx.measureText(testLine).width > maxTextWidth && currentLine.length > 0) {
            bottomLines.push(currentLine);
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) bottomLines.push(currentLine);
        const totalTextHeight = bottomLines.length * (fontSize + 4);
        const bottomY = canvas.height - totalTextHeight - 10;
        drawMemeText(bottomText, Math.max(bottomY, fontSize + 20));
      }

      setPreviewUrl(canvas.toDataURL("image/png"));
    };

    renderPreview().catch(console.error);
  }, [imageUrl, topText, bottomText, fontSize, fontColor, strokeColor, strokeWidth, template]);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setPreviewUrl("");
  }, []);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "meme.png";
    a.click();
  }, [previewUrl]);

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>模板</Label>
              <Select value={template} onValueChange={(v) => { if (v !== null) setTemplate(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_TEMPLATES.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {template !== "只有下方" && (
              <div className="space-y-2">
                <Label>上方文字</Label>
                <Input
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="输入上方文字"
                />
              </div>
            )}

            {template !== "只有上方" && (
              <div className="space-y-2">
                <Label>下方文字</Label>
                <Input
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="输入下方文字"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>字号</Label>
                <span className="text-sm font-mono text-primary">{fontSize}px</span>
              </div>
              <Slider
                value={[fontSize]}
                onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setFontSize(val); }}
                min={16}
                max={72}
                step={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>描边宽度</Label>
                <span className="text-sm font-mono text-primary">{strokeWidth}px</span>
              </div>
              <Slider
                value={[strokeWidth]}
                onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setStrokeWidth(val); }}
                min={0}
                max={8}
                step={1}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>文字颜色</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>描边颜色</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {previewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="表情包预览" className="w-full rounded-lg border border-border" />
                <Button onClick={handleDownload} className="w-full">
                  <Download className="h-4 w-4 mr-1" /> 下载表情包
                </Button>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
                <Laugh className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">正在渲染预览...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!imageUrl && (
        <div className="text-center text-muted-foreground py-8">
          <Laugh className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">上传图片并添加文字，制作表情包</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
