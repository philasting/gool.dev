"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, Trash2, FileImage, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

type OutputFormat = "png" | "jpeg";

interface RenderedPage {
  pageNum: number;
  dataUrl: string;
  width: number;
  height: number;
}

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export function PdfToImageTool() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("请上传 PDF 文件");
      return;
    }
    setPdfFile(file);
    setError("");
    setPages([]);
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setPageCount(pdf.numPages);
    } catch {
      setPageCount(0);
      setError("读取 PDF 失败");
    }
  }, []);

  const renderPages = async () => {
    if (!pdfFile) return;
    setRendering(true);
    setError("");
    setPages([]);

    try {
      const buffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const rendered: RenderedPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const mimeType = format === "png" ? "image/png" : "image/jpeg";
        const jpegQuality = format === "jpeg" ? quality / 100 : undefined;
        const dataUrl = canvas.toDataURL(mimeType, jpegQuality);

        rendered.push({
          pageNum: i,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
        });
      }

      setPages(rendered);
    } catch (e) {
      setError(`渲染失败：${(e as Error).message}`);
    } finally {
      setRendering(false);
    }
  };

  const downloadPage = (page: RenderedPage) => {
    const a = document.createElement("a");
    a.href = page.dataUrl;
    const baseName = pdfFile?.name.replace(/\.pdf$/i, "") ?? "page";
    a.download = `${baseName}_page${page.pageNum}.${format}`;
    a.click();
  };

  const downloadAll = () => {
    pages.forEach((page) => {
      setTimeout(() => downloadPage(page), pages.indexOf(page) * 200);
    });
  };

  const handleClear = () => {
    setPdfFile(null);
    setPageCount(0);
    setPages([]);
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
              <FileImage className="h-5 w-5 text-muted-foreground shrink-0" />
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
              <Label>输出格式</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG（无损）</SelectItem>
                  <SelectItem value="jpeg">JPEG（有损）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>缩放比例</Label>
                <span className="text-sm font-mono text-primary">{scale}x</span>
              </div>
              <Slider
                value={[scale]}
                onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setScale(val); }}
                min={1}
                max={4}
                step={0.5}
              />
            </div>
          </div>

          {format === "jpeg" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>JPEG 质量</Label>
                <span className="text-sm font-mono text-primary">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setQuality(val); }}
                min={10}
                max={100}
                step={5}
              />
            </div>
          )}

          <Button onClick={renderPages} disabled={rendering} className="w-full">
            {rendering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 渲染中...
              </>
            ) : (
              <>
                <FileImage className="h-4 w-4 mr-2" /> 渲染全部页面
              </>
            )}
          </Button>
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {pages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">渲染结果（{pages.length} 页）</span>
            <Button variant="outline" size="sm" onClick={downloadAll}>
              <Download className="h-3.5 w-3.5 mr-1" /> 全部下载
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {pages.map((page) => (
              <Card key={page.pageNum} className="group cursor-pointer overflow-hidden" onClick={() => downloadPage(page)}>
                <CardContent className="p-2">
                  <div className="relative aspect-[3/4] bg-muted/30 rounded overflow-hidden mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={page.dataUrl}
                      alt={`第 ${page.pageNum} 页`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">第 {page.pageNum} 页</span>
                    <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {Math.round(page.width)}×{Math.round(page.height)} px
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
