"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Download, Crop } from "lucide-react";

type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "9:16";

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "free", label: "自由" },
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
];

function getAspectRatioValue(ratio: AspectRatio): number | null {
  switch (ratio) {
    case "1:1": return 1;
    case "4:3": return 4 / 3;
    case "16:9": return 16 / 9;
    case "9:16": return 9 / 16;
    default: return null;
  }
}

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<
    "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null
  >(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Display scale: how the image fits in the container
  const [displayScale, setDisplayScale] = useState(1);
  const [displayOffset, setDisplayOffset] = useState({ x: 0, y: 0 });

  const MAX_CANVAS = 600;

  /** Load image from file */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageSize({ width: img.width, height: img.height });
        setImageUrl(url);

        // Calculate display scale
        const scale = Math.min(MAX_CANVAS / img.width, MAX_CANVAS / img.height, 1);
        setDisplayScale(scale);
        setDisplayOffset({ x: 0, y: 0 });

        // Set initial crop to full image
        setCrop({
          x: 0,
          y: 0,
          width: img.width * scale,
          height: img.height * scale,
        });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  /** Draw canvas */
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageUrl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = img.width * displayScale;
    const ch = img.height * displayScale;
    canvas.width = cw;
    canvas.height = ch;

    // Draw image
    ctx.drawImage(img, 0, 0, cw, ch);

    // Draw dark overlay outside crop area
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    // Top
    ctx.fillRect(0, 0, cw, crop.y);
    // Bottom
    ctx.fillRect(0, crop.y + crop.height, cw, ch - crop.y - crop.height);
    // Left
    ctx.fillRect(0, crop.y, crop.x, crop.height);
    // Right
    ctx.fillRect(crop.x + crop.width, crop.y, cw - crop.x - crop.width, crop.height);

    // Draw crop border
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = "#3B82F6";
    const corners = [
      [crop.x, crop.y],
      [crop.x + crop.width, crop.y],
      [crop.x, crop.y + crop.height],
      [crop.x + crop.width, crop.y + crop.height],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    }

    // Draw edge handles
    ctx.fillStyle = "#60A5FA";
    const edges = [
      [crop.x + crop.width / 2, crop.y],
      [crop.x + crop.width / 2, crop.y + crop.height],
      [crop.x, crop.y + crop.height / 2],
      [crop.x + crop.width, crop.y + crop.height / 2],
    ];
    for (const [ex, ey] of edges) {
      ctx.fillRect(ex - handleSize / 2, ey - handleSize / 2, handleSize, handleSize);
    }
  }, [imageUrl, displayScale, crop]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  /** Determine what part of the crop area the mouse is on */
  const getHitZone = (mx: number, my: number): typeof dragType => {
    const threshold = 10;
    const { x, y, width, height } = crop;

    // Check corners first
    if (Math.abs(mx - x) < threshold && Math.abs(my - y) < threshold) return "nw";
    if (Math.abs(mx - (x + width)) < threshold && Math.abs(my - y) < threshold) return "ne";
    if (Math.abs(mx - x) < threshold && Math.abs(my - (y + height)) < threshold) return "sw";
    if (Math.abs(mx - (x + width)) < threshold && Math.abs(my - (y + height)) < threshold) return "se";

    // Check edges
    if (Math.abs(my - y) < threshold && mx > x && mx < x + width) return "n";
    if (Math.abs(my - (y + height)) < threshold && mx > x && mx < x + width) return "s";
    if (Math.abs(mx - x) < threshold && my > y && my < y + height) return "w";
    if (Math.abs(mx - (x + width)) < threshold && my > y && my < y + height) return "e";

    // Check inside
    if (mx > x && mx < x + width && my > y && my < y + height) return "move";

    return null;
  };

  /** Clamp crop rect within image bounds and apply aspect ratio */
  const clampCrop = (c: CropRect): CropRect => {
    const img = imageRef.current;
    if (!img) return c;
    const maxW = img.width * displayScale;
    const maxH = img.height * displayScale;

    let result = { ...c };

    // Apply aspect ratio
    const ratioVal = getAspectRatioValue(aspectRatio);
    if (ratioVal !== null) {
      // Adjust width/height to match ratio, using the smaller dimension
      const currentRatio = result.width / result.height;
      if (currentRatio > ratioVal) {
        result.width = result.height * ratioVal;
      } else {
        result.height = result.width / ratioVal;
      }
    }

    // Clamp dimensions
    result.width = Math.max(20, Math.min(result.width, maxW));
    result.height = Math.max(20, Math.min(result.height, maxH));

    // Clamp position
    result.x = Math.max(0, Math.min(result.x, maxW - result.width));
    result.y = Math.max(0, Math.min(result.y, maxH - result.height));

    return result;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const zone = getHitZone(mx, my);
    if (!zone) return;

    setIsDragging(true);
    setDragType(zone);
    setDragStart({ x: mx, y: my });
    setCropStart({ ...crop });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Update cursor
    if (!isDragging) {
      const zone = getHitZone(mx, my);
      const cursorMap: Record<string, string> = {
        move: "move",
        nw: "nw-resize",
        ne: "ne-resize",
        sw: "sw-resize",
        se: "se-resize",
        n: "n-resize",
        s: "s-resize",
        w: "w-resize",
        e: "e-resize",
      };
      canvas.style.cursor = zone ? cursorMap[zone] : "crosshair";
      return;
    }

    const dx = mx - dragStart.x;
    const dy = my - dragStart.y;
    const cs = cropStart;
    const img = imageRef.current;
    if (!img) return;
    const maxW = img.width * displayScale;
    const maxH = img.height * displayScale;

    let newCrop = { ...cs };

    switch (dragType) {
      case "move":
        newCrop.x = cs.x + dx;
        newCrop.y = cs.y + dy;
        break;
      case "se":
        newCrop.width = cs.width + dx;
        newCrop.height = cs.height + dy;
        break;
      case "nw":
        newCrop.x = cs.x + dx;
        newCrop.y = cs.y + dy;
        newCrop.width = cs.width - dx;
        newCrop.height = cs.height - dy;
        break;
      case "ne":
        newCrop.y = cs.y + dy;
        newCrop.width = cs.width + dx;
        newCrop.height = cs.height - dy;
        break;
      case "sw":
        newCrop.x = cs.x + dx;
        newCrop.width = cs.width - dx;
        newCrop.height = cs.height + dy;
        break;
      case "n":
        newCrop.y = cs.y + dy;
        newCrop.height = cs.height - dy;
        break;
      case "s":
        newCrop.height = cs.height + dy;
        break;
      case "w":
        newCrop.x = cs.x + dx;
        newCrop.width = cs.width - dx;
        break;
      case "e":
        newCrop.width = cs.width + dx;
        break;
    }

    // Clamp to image bounds
    newCrop.x = Math.max(0, newCrop.x);
    newCrop.y = Math.max(0, newCrop.y);
    newCrop.width = Math.max(20, newCrop.width);
    newCrop.height = Math.max(20, newCrop.height);
    if (newCrop.x + newCrop.width > maxW) {
      newCrop.width = maxW - newCrop.x;
    }
    if (newCrop.y + newCrop.height > maxH) {
      newCrop.height = maxH - newCrop.y;
    }

    setCrop(clampCrop(newCrop));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  /** Crop and download */
  const handleCropDownload = () => {
    const img = imageRef.current;
    if (!img) return;

    // Convert crop coordinates from display space to image space
    const sx = crop.x / displayScale;
    const sy = crop.y / displayScale;
    const sw = crop.width / displayScale;
    const sh = crop.height / displayScale;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cropped-image.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  /** Handle aspect ratio change */
  const handleAspectRatioChange = (value: AspectRatio) => {
    setAspectRatio(value);
    const ratioVal = getAspectRatioValue(value);
    if (ratioVal !== null) {
      setCrop((prev) => clampCrop({ ...prev }));
    }
  };

  return (
    <div className="space-y-4">
      {!imageUrl ? (
        /* Upload area */
        <Card>
          <CardContent className="p-8">
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                点击上传图片或拖拽文件到此处
              </p>
              <p className="text-xs text-muted-foreground">
                支持 JPG、PNG、WEBP 格式
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">裁剪比例</Label>
                  <Select
                    value={aspectRatio}
                    onValueChange={(v) =>
                      handleAspectRatioChange(v as AspectRatio)
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((ar) => (
                        <SelectItem key={ar.value} value={ar.value}>
                          {ar.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground space-x-2">
                  <span>
                    裁剪区域: {Math.round(crop.width / displayScale)}×
                    {Math.round(crop.height / displayScale)} px
                  </span>
                  <span>原图: {imageSize.width}×{imageSize.height} px</span>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" /> 换图
                  </Button>
                  <Button size="sm" onClick={handleCropDownload}>
                    <Download className="h-4 w-4 mr-1" /> 裁剪并下载
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card>
            <CardContent className="p-4 flex justify-center" ref={containerRef}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="max-w-full"
              />
            </CardContent>
          </Card>

          {/* Preview of crop area */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">裁剪预览</h3>
              <div className="flex justify-center bg-muted/30 rounded-lg p-4">
                <canvas
                  ref={(el) => {
                    if (!el || !imageRef.current || !imageUrl) return;
                    const img = imageRef.current;
                    const sx = crop.x / displayScale;
                    const sy = crop.y / displayScale;
                    const sw = crop.width / displayScale;
                    const sh = crop.height / displayScale;
                    const previewMax = 300;
                    const pScale = Math.min(
                      previewMax / sw,
                      previewMax / sh,
                      1
                    );
                    el.width = sw * pScale;
                    el.height = sh * pScale;
                    const ctx = el.getContext("2d");
                    if (ctx) {
                      ctx.drawImage(
                        img,
                        sx,
                        sy,
                        sw,
                        sh,
                        0,
                        0,
                        el.width,
                        el.height
                      );
                    }
                  }}
                  className="max-w-full rounded border border-border"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
