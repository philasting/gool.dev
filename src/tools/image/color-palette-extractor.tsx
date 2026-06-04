"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Upload, Pipette, Copy, Check } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

interface ColorSwatch {
  hex: string;
  r: number;
  g: number;
  b: number;
  percentage: number;
}

/** Simple color quantization using median cut algorithm */
function extractColors(imageData: ImageData, numColors: number): ColorSwatch[] {
  const data = imageData.data;
  const totalPixels = data.length / 4;

  // Collect all pixels (sample for performance)
  const step = Math.max(1, Math.floor(totalPixels / 50000));
  const pixels: [number, number, number][] = [];

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue; // Skip transparent
    pixels.push([r, g, b]);
  }

  if (pixels.length === 0) return [];

  // Median cut
  function medianCut(pixelList: [number, number, number][], depth: number): [number, number, number][] {
    if (depth === 0 || pixelList.length === 0) {
      // Average the colors in this bucket
      let rSum = 0, gSum = 0, bSum = 0;
      for (const [r, g, b] of pixelList) {
        rSum += r;
        gSum += g;
        bSum += b;
      }
      const n = pixelList.length || 1;
      return [[Math.round(rSum / n), Math.round(gSum / n), Math.round(bSum / n)]];
    }

    // Find the channel with the greatest range
    let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
    for (const [r, g, b] of pixelList) {
      rMin = Math.min(rMin, r); rMax = Math.max(rMax, r);
      gMin = Math.min(gMin, g); gMax = Math.max(gMax, g);
      bMin = Math.min(bMin, b); bMax = Math.max(bMax, b);
    }

    const rRange = rMax - rMin;
    const gRange = gMax - gMin;
    const bRange = bMax - bMin;

    let sortChannel: number;
    if (rRange >= gRange && rRange >= bRange) sortChannel = 0;
    else if (gRange >= rRange && gRange >= bRange) sortChannel = 1;
    else sortChannel = 2;

    pixelList.sort((a, b) => a[sortChannel] - b[sortChannel]);

    const mid = Math.floor(pixelList.length / 2);
    const left = pixelList.slice(0, mid);
    const right = pixelList.slice(mid);

    return [
      ...medianCut(left, depth - 1),
      ...medianCut(right, depth - 1),
    ];
  }

  const depth = Math.ceil(Math.log2(numColors));
  const centroids = medianCut(pixels, depth);

  // Count how many pixels belong to each centroid (nearest centroid assignment)
  const counts = new Array(centroids.length).fill(0);

  for (const [pr, pg, pb] of pixels) {
    let minDist = Infinity;
    let closest = 0;
    for (let i = 0; i < centroids.length; i++) {
      const dr = pr - centroids[i][0];
      const dg = pg - centroids[i][1];
      const db = pb - centroids[i][2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    counts[closest]++;
  }

  // Sort by frequency
  const swatches: ColorSwatch[] = centroids
    .map(([r, g, b], i) => ({
      hex: "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join(""),
      r,
      g,
      b,
      percentage: Math.round((counts[i] / pixels.length) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return swatches.slice(0, numColors);
}

export function ColorPaletteExtractorTool() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [numColors, setNumColors] = useState(6);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setSwatches([]);
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
      if (!ctx) throw new Error("Canvas not available");

      // Resize for performance
      const maxDim = 300;
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const colors = extractColors(imageData, numColors);
      setSwatches(colors);
    } catch (err) {
      console.error("Color extraction failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, numColors]);

  const handleCopyColor = useCallback(async (hex: string, index: number) => {
    await copyToClipboard(hex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

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
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="flex items-center justify-between">
              <Label>提取颜色数</Label>
              <span className="text-sm font-mono text-primary">{numColors}</span>
            </div>
            <Slider
              value={[numColors]}
              onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setNumColors(val); }}
              min={3}
              max={12}
              step={1}
            />
          </div>
          <Button onClick={processImage} disabled={isProcessing}>
            <Pipette className="h-4 w-4 mr-1" />
            {isProcessing ? "提取中..." : "提取配色"}
          </Button>
        </div>
      )}

      {swatches.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <Label className="text-sm font-medium">提取的色板</Label>

            {/* Large swatches */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {swatches.map((swatch, idx) => (
                <div
                  key={idx}
                  className="rounded-lg overflow-hidden border border-border cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCopyColor(swatch.hex, idx)}
                  title="点击复制颜色值"
                >
                  <div
                    className="h-20"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <div className="p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-medium">{swatch.hex.toUpperCase()}</span>
                      {copiedIndex === idx ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      RGB({swatch.r}, {swatch.g}, {swatch.b}) · {swatch.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CSS variables output */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">CSS 变量</Label>
              <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto">
{`:root {
${swatches.map((s, i) => `  --color-${i + 1}: ${s.hex};`).join("\n")}
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {!imageUrl && (
        <div className="text-center text-muted-foreground py-8">
          <Pipette className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">上传图片提取主色调色板</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
