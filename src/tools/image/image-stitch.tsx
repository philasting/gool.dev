"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Trash2, GripVertical, X } from "lucide-react";

type StitchDirection = "horizontal" | "vertical";
type AlignMode = "start" | "center" | "end";

interface ImageItem {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
}

export function ImageStitchTool() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [direction, setDirection] = useState<StitchDirection>("horizontal");
  const [align, setAlign] = useState<AlignMode>("center");
  const [gap, setGap] = useState(0);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    const newItems: ImageItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const url = URL.createObjectURL(file);
      const dims = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = url;
      });
      newItems.push({ id: `img-${Date.now()}-${Math.random()}`, file, url, ...dims });
    }
    setImages((prev) => [...prev, ...newItems]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const stitchImages = useCallback(() => {
    if (images.length < 2) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (direction === "horizontal") {
      const totalWidth = images.reduce((sum, img) => sum + img.width, 0) + gap * (images.length - 1);
      const maxHeight = Math.max(...images.map((img) => img.height));
      canvas.width = totalWidth;
      canvas.height = maxHeight;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let x = 0;
      for (const item of images) {
        const img = new Image();
        img.src = item.url;
        let y = 0;
        if (align === "center") y = (maxHeight - item.height) / 2;
        else if (align === "end") y = maxHeight - item.height;
        ctx.drawImage(img, x, y, item.width, item.height);
        x += item.width + gap;
      }
    } else {
      const maxWidth = Math.max(...images.map((img) => img.width));
      const totalHeight = images.reduce((sum, img) => sum + img.height, 0) + gap * (images.length - 1);
      canvas.width = maxWidth;
      canvas.height = totalHeight;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let y = 0;
      for (const item of images) {
        const img = new Image();
        img.src = item.url;
        let x = 0;
        if (align === "center") x = (maxWidth - item.width) / 2;
        else if (align === "end") x = maxWidth - item.width;
        ctx.drawImage(img, x, y, item.width, item.height);
        y += item.height + gap;
      }
    }

    setPreviewUrl(canvas.toDataURL("image/png"));
  }, [images, direction, align, gap, bgColor]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "stitched.png";
    a.click();
  }, [previewUrl]);

  const handleClear = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setPreviewUrl("");
  }, [images]);

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽多张图片到此处上传</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <>
          <div className="space-y-3">
            {images.map((item, idx) => (
              <Card key={item.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.file.name} className="h-10 w-14 object-cover rounded border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">{item.width} x {item.height}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeImage(item.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">拼接方向</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as StitchDirection)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">横向拼接</SelectItem>
                  <SelectItem value="vertical">纵向拼接</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">对齐方式</Label>
              <Select value={align} onValueChange={(v) => setAlign(v as AlignMode)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">{direction === "horizontal" ? "顶部对齐" : "左对齐"}</SelectItem>
                  <SelectItem value="center">居中对齐</SelectItem>
                  <SelectItem value="end">{direction === "horizontal" ? "底部对齐" : "右对齐"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">间距 (px)</Label>
              <Input
                type="number"
                value={gap}
                onChange={(e) => setGap(Math.max(0, Number(e.target.value) || 0))}
                min={0}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">背景色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-8 w-8 rounded border border-input cursor-pointer"
                />
                <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 flex-1" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={stitchImages} disabled={images.length < 2}>
              拼接图片
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </>
      )}

      {previewUrl && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">拼接结果</span>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> 下载
              </Button>
            </div>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="拼接结果" className="max-h-80 rounded-lg border border-border object-contain" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
