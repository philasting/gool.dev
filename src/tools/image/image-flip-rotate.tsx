"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Download, Trash2, FlipHorizontal, FlipVertical, RotateCw, RotateCcw } from "lucide-react";

type FlipRotateAction = "flipH" | "flipV" | "rotateCW" | "rotateCCW" | "rotate180" | "custom";

export function ImageFlipRotateTool() {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [customAngle, setCustomAngle] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      renderPreview(img, 0, false, false);
    };
    img.src = url;
  }, []);

  const renderPreview = useCallback(
    (img: HTMLImageElement, rot: number, fh: boolean, fv: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const radians = (rot * Math.PI) / 180;
      const isRotated90 = Math.abs(rot % 180) === 90;

      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const outW = isRotated90 ? srcH : srcW;
      const outH = isRotated90 ? srcW : srcH;

      canvas.width = outW;
      canvas.height = outH;

      ctx.clearRect(0, 0, outW, outH);
      ctx.save();
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate(radians);
      ctx.scale(fh ? -1 : 1, fv ? -1 : 1);
      ctx.drawImage(img, -srcW / 2, -srcH / 2, srcW, srcH);
      ctx.restore();

      setPreviewUrl(canvas.toDataURL("image/png"));
    },
    []
  );

  const applyAction = useCallback(
    (action: FlipRotateAction) => {
      const img = imgRef.current;
      if (!img) return;

      let newRotation = rotation;
      let newFlipH = flipH;
      let newFlipV = flipV;

      switch (action) {
        case "flipH":
          newFlipH = !flipH;
          break;
        case "flipV":
          newFlipV = !flipV;
          break;
        case "rotateCW":
          newRotation = (rotation + 90) % 360;
          break;
        case "rotateCCW":
          newRotation = (rotation - 90 + 360) % 360;
          break;
        case "rotate180":
          newRotation = (rotation + 180) % 360;
          break;
        case "custom":
          newRotation = customAngle % 360;
          break;
      }

      setRotation(newRotation);
      setFlipH(newFlipH);
      setFlipV(newFlipV);
      renderPreview(img, newRotation, newFlipH, newFlipV);
    },
    [rotation, flipH, flipV, customAngle, renderPreview]
  );

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    const ext = fileName.split(".").pop() || "png";
    a.download = fileName.replace(`.${ext}`, `_edited.png`);
    a.click();
  }, [previewUrl, fileName]);

  const handleClear = useCallback(() => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc("");
    setFileName("");
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCustomAngle(0);
    setPreviewUrl("");
    imgRef.current = null;
  }, [imageSrc]);

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
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => applyAction("flipH")} variant={flipH ? "default" : "outline"}>
              <FlipHorizontal className="h-4 w-4 mr-1" /> 水平翻转
            </Button>
            <Button size="sm" onClick={() => applyAction("flipV")} variant={flipV ? "default" : "outline"}>
              <FlipVertical className="h-4 w-4 mr-1" /> 垂直翻转
            </Button>
            <Button size="sm" onClick={() => applyAction("rotateCW")}>
              <RotateCw className="h-4 w-4 mr-1" /> 顺时针90°
            </Button>
            <Button size="sm" onClick={() => applyAction("rotateCCW")}>
              <RotateCcw className="h-4 w-4 mr-1" /> 逆时针90°
            </Button>
            <Button size="sm" onClick={() => applyAction("rotate180")}>
              <RotateCw className="h-4 w-4 mr-1" /> 旋转180°
            </Button>
          </div>

          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">自定义角度</Label>
              <Input
                type="number"
                value={customAngle}
                onChange={(e) => setCustomAngle(Number(e.target.value) || 0)}
                placeholder="0-360"
                className="w-24 h-8"
              />
            </div>
            <Button size="sm" onClick={() => applyAction("custom")}>
              应用角度
            </Button>
          </div>

          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  旋转: {rotation}° | 水平翻转: {flipH ? "是" : "否"} | 垂直翻转: {flipV ? "是" : "否"}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {previewUrl && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="max-h-80 rounded-lg border border-border object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
