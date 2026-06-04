"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Download, Trash2, Minimize2, FileText, ArrowDown } from "lucide-react";
import { PDFDocument } from "pdf-lib";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PdfCompressTool() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [compressed, setCompressed] = useState(false);
  const [error, setError] = useState("");
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("请上传 PDF 文件");
      return;
    }
    setPdfFile(file);
    setOriginalSize(file.size);
    setCompressed(false);
    setCompressedSize(0);
    setCompressedBlob(null);
    setError("");
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      setPageCount(pdf.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleCompress = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setError("");
    setCompressed(false);

    try {
      const buffer = await pdfFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(buffer);
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      pages.forEach((p) => newPdf.addPage(p));

      // Use default save (which removes some redundant objects)
      const pdfBytes = await newPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      setCompressedBlob(blob);
      setCompressedSize(pdfBytes.byteLength);
      setCompressed(true);
    } catch (e) {
      setError(`压缩失败：${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob || !pdfFile) return;
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfFile.name.replace(/\.pdf$/i, "_compressed.pdf");
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setPdfFile(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setPageCount(0);
    setCompressed(false);
    setCompressedBlob(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const savingsPercent = compressed && originalSize > 0
    ? Math.max(0, ((originalSize - compressedSize) / originalSize) * 100)
    : 0;
  const ratio = compressed && originalSize > 0
    ? compressedSize / originalSize
    : 0;

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
                <p className="text-xs text-muted-foreground">{pageCount} 页 · {formatFileSize(originalSize)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {pdfFile && !compressed && (
        <Button onClick={handleCompress} disabled={loading} className="w-full">
          {loading ? "压缩中..." : (
            <>
              <Minimize2 className="h-4 w-4 mr-2" /> 开始压缩
            </>
          )}
        </Button>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {compressed && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Minimize2 className="h-4 w-4 text-primary" />
              压缩结果
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">原始大小</p>
                <p className="text-lg font-semibold">{formatFileSize(originalSize)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <p className="text-xs text-muted-foreground mb-1">压缩后</p>
                <p className="text-lg font-semibold text-primary">{formatFileSize(compressedSize)}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <ArrowDown className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {savingsPercent > 0
                  ? `减少了 ${savingsPercent.toFixed(1)}%（压缩比 ${(ratio * 100).toFixed(1)}%）`
                  : "文件已是最优状态，无法进一步压缩"}
              </span>
            </div>

            {savingsPercent > 0 ? (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, savingsPercent)}%` }}
                />
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground text-center">
              纯前端压缩，效果有限。如需深度压缩（图片优化等），建议使用桌面端工具。
            </p>

            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" /> 下载压缩后的 PDF
              </Button>
              <Button onClick={handleClear} variant="outline">
                清空
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
