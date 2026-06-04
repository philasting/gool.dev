"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Download, Trash2 } from "lucide-react";

type BlurMode = "gaussian" | "mosaic";

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageBlurTool() {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<BlurMode>("gaussian");
  const [intensity, setIntensity] = useState(10);
  const [mosaicSize, setMosaicSize] = useState(10);
  const [useRegion, setUseRegion] = useState(false);
  const [region, setRegion] = useState<SelectionRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Region selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{ x: number; y: number } | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgDims({ width: img.naturalWidth, height: img.naturalHeight });
      setRegion({ x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  }, []);

  const applyEffect = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw original
    ctx.drawImage(img, 0, 0);

    if (useRegion) {
      // Apply effect only to selected region
      const { x, y, width, height } = region;
      const safeX = Math.max(0, Math.round(x));
      const safeY = Math.max(0, Math.round(y));
      const safeW = Math.min(Math.round(width), img.naturalWidth - safeX);
      const safeH = Math.min(Math.round(height), img.naturalHeight - safeY);

      if (safeW <= 0 || safeH <= 0) return;

      // Get region image data
      const imageData = ctx.getImageData(safeX, safeY, safeW, safeH);

      // Create temp canvas for the region
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = safeW;
      tempCanvas.height = safeH;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;
      tempCtx.putImageData(imageData, 0, 0);

      // Apply blur to temp canvas
      if (mode === "gaussian") {
        tempCtx.filter = `blur(${intensity}px)`;
        tempCtx.drawImage(tempCanvas, 0, 0);
        tempCtx.filter = "none";
      } else {
        applyMosaic(tempCtx, safeW, safeH, mosaicSize);
      }

      // Draw back
      ctx.drawImage(tempCanvas, safeX, safeY);
    } else {
      // Apply to entire image
      if (mode === "gaussian") {
        ctx.filter = `blur(${intensity}px)`;
        ctx.drawImage(img, 0, 0);
        ctx.filter = "none";
      } else {
        applyMosaic(ctx, img.naturalWidth, img.naturalHeight, mosaicSize);
      }
    }

    setPreviewUrl(canvas.toDataURL("image/png"));
  }, [mode, intensity, mosaicSize, useRegion, region]);

  /** Apply mosaic effect to canvas context */
  function applyMosaic(ctx: CanvasRenderingContext2D, w: number, h: number, blockSize: number) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const size = Math.max(1, blockSize);

    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        let r = 0, g = 0, b = 0, count = 0;
        for (let dy = 0; dy < size && y + dy < h; dy++) {
          for (let dx = 0; dx < size && x + dx < w; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        for (let dy = 0; dy < size && y + dy < h; dy++) {
          for (let dx = 0; dx < size && x + dx < w; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = fileName.replace(/\.\w+$/, "_blurred.png");
    a.click();
  }, [previewUrl, fileName]);

  const handleClear = useCallback(() => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc("");
    setFileName("");
    setPreviewUrl("");
    imgRef.current = null;
  }, [imageSrc]);

  // Handle mouse events for region selection on preview canvas
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!useRegion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = imgDims.width / rect.width;
      const scaleY = imgDims.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setSelectStart({ x, y });
      setIsSelecting(true);
    },
    [useRegion, imgDims]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isSelecting || !selectStart) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = imgDims.width / rect.width;
      const scaleY = imgDims.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      setRegion({
        x: Math.min(selectStart.x, x),
        y: Math.min(selectStart.y, y),
        width: Math.abs(x - selectStart.x),
        height: Math.abs(y - selectStart.y),
      });
    },
    [isSelecting, selectStart, imgDims]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectStart(null);
  }, []);

  // Draw region overlay on preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imageSrc || !imgRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imgRef.current;
    // Scale preview
    const maxW = 600;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (useRegion && region.width > 0 && region.height > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(region.x * scale, region.y * scale, region.width * scale, region.height * scale);
      ctx.drawImage(
        img,
        region.x, region.y, region.width, region.height,
        region.x * scale, region.y * scale, region.width * scale, region.height * scale
      );
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(region.x * scale, region.y * scale, region.width * scale, region.height * scale);
    }
  }, [imageSrc, useRegion, region, imgDims]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {!imageSrc && (
        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) loadImage(e.dataTransfer.files[0]);
          }}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">点击或拖拽图片到此处上传</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadImage(e.target.files[0])}
          />
        </div>
      )}

      {imageSrc && (
        <>
          <Tabs value={mode} onValueChange={(v) => setMode(v as BlurMode)}>
            <TabsList>
              <TabsTrigger value="gaussian">高斯模糊</TabsTrigger>
              <TabsTrigger value="mosaic">马赛克</TabsTrigger>
            </TabsList>
            <TabsContent value="gaussian" className="pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">模糊强度</Label>
                  <span className="text-sm font-mono text-primary">{intensity}px</span>
                </div>
                <Slider
                  value={[intensity]}
                  onValueChange={(v) => setIntensity(Array.isArray(v) ? v[0] : v)}
                  min={1}
                  max={50}
                  step={1}
                />
              </div>
            </TabsContent>
            <TabsContent value="mosaic" className="pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">马赛克大小</Label>
                  <span className="text-sm font-mono text-primary">{mosaicSize}px</span>
                </div>
                <Slider
                  value={[mosaicSize]}
                  onValueChange={(v) => setMosaicSize(Array.isArray(v) ? v[0] : v)}
                  min={2}
                  max={50}
                  step={1}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={useRegion}
                onChange={(e) => setUseRegion(e.target.checked)}
                className="rounded border-input"
              />
              框选区域模糊
            </label>
          </div>

          {useRegion && (
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-2">在下方图片上拖拽选择要模糊的区域</p>
                <div className="space-y-1">
                  <Label className="text-xs">区域位置 (手动输入)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      type="number"
                      placeholder="X"
                      value={region.x || ""}
                      onChange={(e) => setRegion((r) => ({ ...r, x: Number(e.target.value) || 0 }))}
                      className="h-7 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Y"
                      value={region.y || ""}
                      onChange={(e) => setRegion((r) => ({ ...r, y: Number(e.target.value) || 0 }))}
                      className="h-7 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="宽"
                      value={region.width || ""}
                      onChange={(e) => setRegion((r) => ({ ...r, width: Number(e.target.value) || 0 }))}
                      className="h-7 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="高"
                      value={region.height || ""}
                      onChange={(e) => setRegion((r) => ({ ...r, height: Number(e.target.value) || 0 }))}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview canvas with region selection */}
          <div className="flex justify-center">
            <canvas
              ref={previewCanvasRef}
              className="max-w-full rounded-lg border border-border cursor-crosshair"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={applyEffect} disabled={!imageSrc}>
              应用效果
            </Button>
            {previewUrl && (
              <Button variant="secondary" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> 下载
              </Button>
            )}
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>

          {previewUrl && (
            <Card>
              <CardContent className="p-3">
                <span className="text-sm font-medium">效果预览</span>
                <div className="flex justify-center mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="效果预览" className="max-h-80 rounded-lg border border-border object-contain" />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
