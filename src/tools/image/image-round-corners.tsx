"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download } from "lucide-react";

type BgOption = "transparent" | "white" | "custom";

interface ProcessedImage {
  originalName: string;
  url: string;
  width: number;
  height: number;
}

export function ImageRoundCornersTool() {
  const [radius, setRadius] = useState(15);
  const [bgOption, setBgOption] = useState<BgOption>("transparent");
  const [customColor, setCustomColor] = useState("#000000");
  const [preview, setPreview] = useState<ProcessedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 不可用");

    // Background
    if (bgOption === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bgOption === "custom") {
      ctx.fillStyle = customColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // transparent: default, no fill needed

    // Rounded rectangle clip
    const r = (radius / 100) * Math.min(img.width, img.height);
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(img.width - r, 0);
    ctx.quadraticCurveTo(img.width, 0, img.width, r);
    ctx.lineTo(img.width, img.height - r);
    ctx.quadraticCurveTo(img.width, img.height, img.width - r, img.height);
    ctx.lineTo(r, img.height);
    ctx.quadraticCurveTo(0, img.height, 0, img.height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0);

    const resultUrl = canvas.toDataURL("image/png");
    URL.revokeObjectURL(url);

    setPreview({
      originalName: file.name,
      url: resultUrl,
      width: img.width,
      height: img.height,
    });
  }, [radius, bgOption, customColor]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    try {
      await processImage(file);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview.url;
    const baseName = preview.originalName.replace(/\.[^.]+$/, "");
    a.download = `${baseName}-rounded.png`;
    a.click();
  };

  const handleReprocess = () => {
    if (!preview || !fileInputRef.current?.files?.[0]) return;
    handleFile(fileInputRef.current.files[0]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm">圆角半径</Label>
            <span className="text-xs text-muted-foreground">{radius}%</span>
          </div>
          <Slider
            value={[radius]}
            onValueChange={(v) => { setRadius(Array.isArray(v) ? v[0] : v); handleReprocess(); }}
            min={0}
            max={50}
            step={1}
            className="w-48"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">背景色</Label>
          <Select value={bgOption} onValueChange={(v) => { setBgOption(v as BgOption); handleReprocess(); }}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent">透明</SelectItem>
              <SelectItem value="white">白色</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {bgOption === "custom" && (
          <div className="space-y-1">
            <Label className="text-sm">自定义色</Label>
            <Input
              type="color"
              value={customColor}
              onChange={(e) => { setCustomColor(e.target.value); handleReprocess(); }}
              className="w-10 h-8 p-1 cursor-pointer"
            />
          </div>
        )}
      </div>

      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽图片到此处</p>
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

      {preview && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{preview.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {preview.width} × {preview.height}
                </p>
              </div>
              <Button onClick={handleDownload} size="sm">
                <Download className="h-4 w-4 mr-1" /> 下载 PNG
              </Button>
            </div>
            <div
              className="rounded-lg overflow-hidden border border-border"
              style={{ backgroundColor: bgOption === "transparent" ? "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 0 0 / 16px 16px" : undefined }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt="预览"
                className="max-w-full max-h-[400px] mx-auto object-contain"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
