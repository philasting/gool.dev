"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Upload, Download, Trash2 } from "lucide-react";

export function PixelArtTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState(8);
  const [showGrid, setShowGrid] = useState(false);
  const [colorLimit, setColorLimit] = useState(0);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setResultUrl(null);
    },
    []
  );

  const processImage = useCallback(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 先缩小到像素化的尺寸
      const smallW = Math.max(1, Math.ceil(img.width / pixelSize));
      const smallH = Math.max(1, Math.ceil(img.height / pixelSize));

      canvas.width = smallW;
      canvas.height = smallH;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, smallW, smallH);

      // 颜色数限制
      if (colorLimit > 0) {
        const imageData = ctx.getImageData(0, 0, smallW, smallH);
        const data = imageData.data;
        const step = Math.max(1, Math.round(256 / colorLimit));
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.round(data[i] / step) * step;
          data[i + 1] = Math.round(data[i + 1] / step) * step;
          data[i + 2] = Math.round(data[i + 2] / step) * step;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // 再放大回原始尺寸
      const outCanvas = document.createElement("canvas");
      const outCtx = outCanvas.getContext("2d");
      if (!outCtx) return;

      outCanvas.width = img.width;
      outCanvas.height = img.height;
      outCtx.imageSmoothingEnabled = false;
      outCtx.drawImage(canvas, 0, 0, img.width, img.height);

      // 绘制网格线
      if (showGrid) {
        outCtx.strokeStyle = "rgba(0,0,0,0.15)";
        outCtx.lineWidth = 1;
        for (let x = 0; x < img.width; x += pixelSize) {
          outCtx.beginPath();
          outCtx.moveTo(x, 0);
          outCtx.lineTo(x, img.height);
          outCtx.stroke();
        }
        for (let y = 0; y < img.height; y += pixelSize) {
          outCtx.beginPath();
          outCtx.moveTo(0, y);
          outCtx.lineTo(img.width, y);
          outCtx.stroke();
        }
      }

      setResultUrl(outCanvas.toDataURL("image/png"));
    };
    img.src = imageUrl;
  }, [imageUrl, pixelSize, showGrid, colorLimit]);

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = fileName.replace(/\.\w+$/, "_pixel.png") || "pixel-art.png";
    a.click();
  };

  const handleClear = () => {
    setImageUrl(null);
    setResultUrl(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽图片到此处上传</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {imageUrl && (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>像素块大小</Label>
              <span className="text-sm font-mono text-primary">{pixelSize}px</span>
            </div>
            <Slider
              value={[pixelSize]}
              onValueChange={(v) => setPixelSize(Array.isArray(v) ? v[0] : v)}
              min={2}
              max={32}
              step={1}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="show-grid" checked={showGrid} onCheckedChange={setShowGrid} />
              <Label htmlFor="show-grid" className="text-sm">
                网格线
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm shrink-0">颜色数限制</Label>
              <Input
                type="number"
                min={0}
                max={256}
                value={colorLimit || ""}
                onChange={(e) => setColorLimit(parseInt(e.target.value) || 0)}
                placeholder="不限"
                className="w-20 h-8"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={processImage} size="sm">
              生成像素画
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-2">
          <Label>预览</Label>
          <div className="border rounded-lg p-2 bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt="像素画预览"
              className="max-w-full max-h-[400px] mx-auto"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <Button onClick={handleDownload} size="sm">
            <Download className="h-4 w-4 mr-1" /> 下载 PNG
          </Button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
