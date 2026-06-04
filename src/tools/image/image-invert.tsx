"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, Trash2 } from "lucide-react";

type InvertMode = "full" | "grayscale" | "selective";

export function ImageInvertTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<InvertMode>("full");
  const [threshold, setThreshold] = useState(128);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setResultUrl(null);
  }, []);

  const processImage = useCallback(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        switch (mode) {
          case "full": {
            // 完全反色
            data[i] = 255 - r;
            data[i + 1] = 255 - g;
            data[i + 2] = 255 - b;
            break;
          }
          case "grayscale": {
            // 灰度反色
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            const inverted = 255 - gray;
            data[i] = inverted;
            data[i + 1] = inverted;
            data[i + 2] = inverted;
            break;
          }
          case "selective": {
            // 选择性反色：仅反色亮度高于阈值的像素
            const brightness = (r + g + b) / 3;
            if (brightness >= threshold) {
              data[i] = 255 - r;
              data[i + 1] = 255 - g;
              data[i + 2] = 255 - b;
            }
            break;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setResultUrl(canvas.toDataURL("image/png"));
    };
    img.src = imageUrl;
  }, [imageUrl, mode, threshold]);

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = fileName.replace(/\.\w+$/, "_inverted.png") || "inverted.png";
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
            <Label>反色模式</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as InvertMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">仅反色</SelectItem>
                <SelectItem value="grayscale">灰度反色</SelectItem>
                <SelectItem value="selective">选择性反色（亮度阈值）</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "selective" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>亮度阈值</Label>
                <span className="text-sm font-mono text-primary">{threshold}</span>
              </div>
              <Slider
                value={[threshold]}
                onValueChange={(v) => setThreshold(Array.isArray(v) ? v[0] : v)}
                min={0}
                max={255}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                仅反色亮度 ≥ {threshold} 的像素
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={processImage} size="sm">
              应用反色
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
              alt="反色预览"
              className="max-w-full max-h-[400px] mx-auto"
            />
          </div>
          <Button onClick={handleDownload} size="sm">
            <Download className="h-4 w-4 mr-1" /> 下载 PNG
          </Button>
        </div>
      )}
    </div>
  );
}
