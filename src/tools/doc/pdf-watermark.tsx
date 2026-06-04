"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { PDFDocument, rgb, degrees } from "pdf-lib";

type WatermarkPosition = "diagonal" | "center" | "custom";

export function PdfWatermarkTool() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(30);
  const [rotation, setRotation] = useState(45);
  const [position, setPosition] = useState<WatermarkPosition>("diagonal");
  const [color, setColor] = useState("#888888");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("请上传 PDF 文件");
      return;
    }
    setPdfFile(file);
    setError("");
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      setPageCount(pdf.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleAddWatermark = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setError("");

    try {
      const buffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont("Helvetica");

      // 解析颜色
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

        let x: number;
        let y: number;

        switch (position) {
          case "diagonal":
            x = (width - textWidth) / 2;
            y = height / 2;
            break;
          case "center":
            x = (width - textWidth) / 2;
            y = height / 2;
            break;
          case "custom":
            x = width / 2;
            y = height / 2;
            break;
          default:
            x = (width - textWidth) / 2;
            y = height / 2;
        }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: position === "center" ? degrees(0) : degrees(rotation),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(/\.pdf$/i, "_watermarked.pdf");
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`添加水印失败：${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPdfFile(null);
    setPageCount(0);
    setError("");
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
        <p className="text-sm text-muted-foreground">点击或拖拽 PDF 文件到此处</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {pdfFile && (
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{pdfFile.name}</p>
              <p className="text-xs text-muted-foreground">{pageCount} 页</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>水印文字</Label>
          <Input
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="CONFIDENTIAL"
          />
        </div>
        <div className="space-y-2">
          <Label>位置</Label>
          <Select value={position} onValueChange={(v) => setPosition(v as WatermarkPosition)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diagonal">对角线</SelectItem>
              <SelectItem value="center">居中</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>字体大小</Label>
          <span className="text-sm font-mono text-primary">{fontSize}</span>
        </div>
        <Slider
          value={[fontSize]}
          onValueChange={(v) => setFontSize(Array.isArray(v) ? v[0] : v)}
          min={12}
          max={120}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>透明度</Label>
          <span className="text-sm font-mono text-primary">{opacity}%</span>
        </div>
        <Slider
          value={[opacity]}
          onValueChange={(v) => setOpacity(Array.isArray(v) ? v[0] : v)}
          min={5}
          max={100}
          step={5}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>旋转角度</Label>
          <span className="text-sm font-mono text-primary">{rotation}°</span>
        </div>
        <Slider
          value={[rotation]}
          onValueChange={(v) => setRotation(Array.isArray(v) ? v[0] : v)}
          min={-90}
          max={90}
          step={5}
        />
      </div>

      <div className="space-y-2">
        <Label>水印颜色</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 rounded border cursor-pointer"
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-28 h-8 font-mono"
          />
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={handleAddWatermark} size="sm" disabled={!pdfFile || loading}>
          <Download className="h-4 w-4 mr-1" /> {loading ? "处理中..." : "添加水印并下载"}
        </Button>
        <Button onClick={handleClear} variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-1" /> 清空
        </Button>
      </div>
    </div>
  );
}
