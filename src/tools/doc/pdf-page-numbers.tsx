"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, Trash2, Hash, FileText } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type PageNumberPosition = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";

export function PdfPageNumbersTool() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const [startNumber, setStartNumber] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [color, setColor] = useState("#000000");
  const [format, setFormat] = useState("number");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const handleAddPageNumbers = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setError("");

    try {
      const buffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Parse color
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;

      pages.forEach((page, i) => {
        const pageNum = i + startNumber;

        // Skip first page if enabled
        if (skipFirst && i === 0) return;

        const { width, height } = page.getSize();

        // Format page number text
        let text = "";
        switch (format) {
          case "number":
            text = `${prefix}${pageNum}${suffix}`;
            break;
          case "dash":
            text = `${prefix}-${pageNum}-${suffix}`;
            break;
          case "slash":
            text = `${prefix}${pageNum}/${pages.length}${suffix}`;
            break;
          case "page-of":
            text = `${prefix}${pageNum} / ${pages.length}${suffix}`;
            break;
          default:
            text = `${prefix}${pageNum}${suffix}`;
        }

        const textWidth = font.widthOfTextAtSize(text, fontSize);

        let x: number;
        let y: number;

        // Calculate x position
        if (position.includes("left")) {
          x = 40;
        } else if (position.includes("right")) {
          x = width - textWidth - 40;
        } else {
          x = (width - textWidth) / 2;
        }

        // Calculate y position
        if (position.includes("top")) {
          y = height - 30;
        } else {
          y = 30;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(/\.pdf$/i, "_numbered.pdf");
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`添加页码失败：${(e as Error).message}`);
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
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                <p className="text-xs text-muted-foreground">{pageCount} 页</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {pdfFile && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>页码位置</Label>
              <Select value={position} onValueChange={(v) => setPosition(v as PageNumberPosition)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-center">底部居中</SelectItem>
                  <SelectItem value="bottom-right">底部右下</SelectItem>
                  <SelectItem value="bottom-left">底部左下</SelectItem>
                  <SelectItem value="top-center">顶部居中</SelectItem>
                  <SelectItem value="top-right">顶部右上</SelectItem>
                  <SelectItem value="top-left">顶部左上</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>页码格式</Label>
              <Select value={format} onValueChange={(v) => { if (v !== null) setFormat(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">1, 2, 3...</SelectItem>
                  <SelectItem value="dash">-1-, -2-, -3-...</SelectItem>
                  <SelectItem value="slash">1/10, 2/10...</SelectItem>
                  <SelectItem value="page-of">1 / 10, 2 / 10...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>起始页码</Label>
              <Input
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label>字号颜色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-8 rounded border cursor-pointer shrink-0"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-28 h-8 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>字号大小</Label>
              <span className="text-sm font-mono text-primary">{fontSize}px</span>
            </div>
            <Slider
              value={[fontSize]}
              onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setFontSize(val); }}
              min={8}
              max={36}
              step={1}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>前缀文本</Label>
              <Input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="例如：第"
              />
            </div>
            <div className="space-y-2">
              <Label>后缀文本</Label>
              <Input
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="例如：页"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={skipFirst}
              onChange={(e) => setSkipFirst(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm">跳过首页（不在首页添加页码）</span>
          </label>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button onClick={handleAddPageNumbers} disabled={loading} className="w-full">
            {loading ? "处理中..." : (
              <>
                <Hash className="h-4 w-4 mr-2" /> 添加页码并下载
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
