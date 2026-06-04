"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, Upload, User } from "lucide-react";
import { toast } from "sonner";

/** Photo size presets in mm → pixels at 300 DPI */
const PHOTO_SIZES: Record<string, { label: string; widthMm: number; heightMm: number; wPx: number; hPx: number }> = {
  "1inch": { label: "一寸 (25×35mm)", widthMm: 25, heightMm: 35, wPx: 295, hPx: 413 },
  "2inch": { label: "二寸 (35×49mm)", widthMm: 35, heightMm: 49, wPx: 413, hPx: 579 },
  "small1": { label: "小一寸 (22×32mm)", widthMm: 22, heightMm: 32, wPx: 260, hPx: 378 },
};

/** Background colors */
const BG_COLORS: Record<string, { label: string; color: string }> = {
  red: { label: "红色", color: "#FF0000" },
  blue: { label: "蓝色", color: "#438EDB" },
  white: { label: "白色", color: "#FFFFFF" },
};

/**
 * Simple tolerance-based background replacement.
 * Detects pixels similar to a reference color and replaces them.
 */
function replaceBackground(
  imageData: ImageData,
  bgColor: string,
  tolerance: number
): ImageData {
  const result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  // Parse target bg color
  const bgR = parseInt(bgColor.slice(1, 3), 16);
  const bgG = parseInt(bgColor.slice(3, 5), 16);
  const bgB = parseInt(bgColor.slice(5, 7), 16);

  // Sample the border pixels to detect the current background color
  // Use corners and edges as reference
  const d = imageData.data;
  const w = imageData.width;
  const h = imageData.height;

  let sumR = 0, sumG = 0, sumB = 0, count = 0;
  const sampleBorder = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    sumR += d[idx];
    sumG += d[idx + 1];
    sumB += d[idx + 2];
    count++;
  };

  // Sample corners and edges
  for (let x = 0; x < Math.min(20, w); x++) {
    sampleBorder(x, 0);
    sampleBorder(x, Math.min(10, h - 1));
  }
  for (let y = 0; y < Math.min(20, h); y++) {
    sampleBorder(0, y);
    sampleBorder(Math.min(10, w - 1), y);
  }

  const refR = Math.round(sumR / count);
  const refG = Math.round(sumG / count);
  const refB = Math.round(sumB / count);

  // Replace similar pixels
  const tolSq = tolerance * tolerance;
  for (let i = 0; i < result.data.length; i += 4) {
    const dr = result.data[i] - refR;
    const dg = result.data[i + 1] - refG;
    const db = result.data[i + 2] - refB;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq <= tolSq) {
      result.data[i] = bgR;
      result.data[i + 1] = bgG;
      result.data[i + 2] = bgB;
      // Keep alpha
    }
  }

  return result;
}

export function IdPhotoMakerTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sizeKey, setSizeKey] = useState("1inch");
  const [bgKey, setBgKey] = useState("blue");
  const [tolerance, setTolerance] = useState(60);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement("img");
      img.onload = () => {
        sourceImgRef.current = img;
        setSourceImage(ev.target?.result as string);
        setResultUrl(null);
        setOffsetX(0);
        setOffsetY(0);
        setScale(1);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // Re-render preview whenever parameters change
  useEffect(() => {
    if (!sourceImgRef.current) return;
    renderPreview();
  }, [sourceImage, sizeKey, bgKey, tolerance, offsetX, offsetY, scale]);

  const renderPreview = useCallback(() => {
    const img = sourceImgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const size = PHOTO_SIZES[sizeKey];
    canvas.width = size.wPx;
    canvas.height = size.hPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw the source image with offset and scale into a temp canvas first
    // to get ImageData for background replacement
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = size.wPx;
    tempCanvas.height = size.hPx;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Fill with bg color first (for areas not covered by image)
    tempCtx.fillStyle = BG_COLORS[bgKey].color;
    tempCtx.fillRect(0, 0, size.wPx, size.hPx);

    // Calculate image drawing dimensions to cover the canvas
    const imgAspect = img.width / img.height;
    const canvasAspect = size.wPx / size.hPx;
    let drawW: number, drawH: number;

    if (imgAspect > canvasAspect) {
      drawH = size.hPx * scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = size.wPx * scale;
      drawH = drawW / imgAspect;
    }

    const drawX = (size.wPx - drawW) / 2 + offsetX;
    const drawY = (size.hPx - drawH) / 2 + offsetY;

    tempCtx.drawImage(img, drawX, drawY, drawW, drawH);

    // Get image data and replace background
    const imageData = tempCtx.getImageData(0, 0, size.wPx, size.hPx);
    const replaced = replaceBackground(imageData, BG_COLORS[bgKey].color, tolerance);

    ctx.putImageData(replaced, 0, 0);

    setResultUrl(canvas.toDataURL("image/png"));
  }, [sizeKey, bgKey, tolerance, offsetX, offsetY, scale]);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    const size = PHOTO_SIZES[sizeKey];
    link.download = `证件照_${size.label}.png`;
    link.click();
  }, [resultUrl, sizeKey]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {/* Upload */}
      <div className="space-y-2">
        <Label>上传照片</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" /> 选择照片
          </Button>
          {sourceImage && (
            <span className="text-xs text-muted-foreground">
              {sourceImgRef.current?.width} × {sourceImgRef.current?.height}
            </span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {sourceImage && (
        <>
          {/* Size selection */}
          <div className="space-y-2">
            <Label>证件照尺寸</Label>
            <Select value={sizeKey} onValueChange={(v) => { if (v != null) setSizeKey(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PHOTO_SIZES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label} ({val.wPx}×{val.hPx}px)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Background color */}
          <div className="space-y-2">
            <Label>背景颜色</Label>
            <div className="flex gap-2">
              {Object.entries(BG_COLORS).map(([key, val]) => (
                <Button
                  key={key}
                  variant={bgKey === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBgKey(key)}
                  className="flex items-center gap-1.5"
                >
                  <span
                    className="inline-block w-4 h-4 rounded-full border"
                    style={{ backgroundColor: val.color }}
                  />
                  {val.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tolerance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>换底容差</Label>
              <span className="text-sm font-mono text-primary">{tolerance}</span>
            </div>
            <Slider
              value={[tolerance]}
              onValueChange={(v) => setTolerance(Array.isArray(v) ? v[0] : v)}
              min={10}
              max={150}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              值越大，替换范围越大。如果人像边缘被替换，请降低容差。
            </p>
          </div>

          {/* Position and scale */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <p className="text-sm font-medium">调整位置与缩放</p>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">水平偏移</Label>
                  <span className="text-xs font-mono">{offsetX}px</span>
                </div>
                <Slider
                  value={[offsetX]}
                  onValueChange={(v) => setOffsetX(Array.isArray(v) ? v[0] : v)}
                  min={-200}
                  max={200}
                  step={5}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">垂直偏移</Label>
                  <span className="text-xs font-mono">{offsetY}px</span>
                </div>
                <Slider
                  value={[offsetY]}
                  onValueChange={(v) => setOffsetY(Array.isArray(v) ? v[0] : v)}
                  min={-200}
                  max={200}
                  step={5}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">缩放</Label>
                  <span className="text-xs font-mono">{scale.toFixed(2)}x</span>
                </div>
                <Slider
                  value={[scale * 100]}
                  onValueChange={(v) => setScale((Array.isArray(v) ? v[0] : v) / 100)}
                  min={50}
                  max={300}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {resultUrl && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium">预览</p>
                <div className="flex justify-center">
                  <div className="border rounded-lg overflow-hidden inline-block">
                    <img
                      src={resultUrl}
                      alt="证件照预览"
                      style={{ maxHeight: "300px" }}
                      className="h-auto"
                    />
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button onClick={handleDownload} size="sm">
                    <Download className="h-4 w-4 mr-1" /> 下载证件照
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!sourceImage && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">上传照片后，可选择尺寸、底色并调整位置</p>
            <p className="text-xs mt-1">支持 JPG / PNG 格式</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium">证件照制作说明</p>
          <p>• 纯前端 Canvas 实现，照片不会上传到服务器</p>
          <p>• 换底色基于容差匹配，适合纯色背景的证件照</p>
          <p>• 如果原照背景复杂，换底效果可能不理想</p>
          <p>• 建议使用纯色背景（蓝/红/白）的原始照片</p>
        </CardContent>
      </Card>
    </div>
  );
}
