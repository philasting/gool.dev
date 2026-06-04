"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download } from "lucide-react";

type BgOption = "transparent" | "white" | "custom";
type InputMode = "code" | "file";

interface PngResult {
  url: string;
  width: number;
  height: number;
}

export function SvgToPngTool() {
  const [mode, setMode] = useState<InputMode>("code");
  const [svgCode, setSvgCode] = useState("");
  const [bgOption, setBgOption] = useState<BgOption>("transparent");
  const [customColor, setCustomColor] = useState("#ffffff");
  const [outputWidth, setOutputWidth] = useState<number | "">("");
  const [outputHeight, setOutputHeight] = useState<number | "">("");
  const [result, setResult] = useState<PngResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertSvgToPng = useCallback(async (svgSource: string) => {
    setError("");
    setResult(null);

    try {
      const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("SVG 加载失败，请检查代码是否正确"));
        img.src = url;
      });

      const w = outputWidth !== "" ? Number(outputWidth) : img.naturalWidth || 300;
      const h = outputHeight !== "" ? Number(outputHeight) : img.naturalHeight || 150;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 不可用");

      if (bgOption === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
      } else if (bgOption === "custom") {
        ctx.fillStyle = customColor;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      setResult({ url: pngUrl, width: w, height: h });
    } catch (err) {
      setError(err instanceof Error ? err.message : "转换失败");
    }
  }, [outputWidth, outputHeight, bgOption, customColor]);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".svg") && !file.type.includes("svg")) {
      setError("请上传 SVG 文件");
      return;
    }
    try {
      const text = await file.text();
      setSvgCode(text);
      await convertSvgToPng(text);
    } catch {
      setError("文件读取失败");
    }
  };

  const handleConvert = () => {
    if (!svgCode.trim()) {
      setError("请输入 SVG 代码");
      return;
    }
    convertSvgToPng(svgCode);
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = "converted.png";
    a.click();
  };

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as InputMode)}>
        <TabsList className="w-full">
          <TabsTrigger value="code" className="flex-1">粘贴 SVG 代码</TabsTrigger>
          <TabsTrigger value="file" className="flex-1">上传 SVG 文件</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="space-y-2">
          <Textarea
            value={svgCode}
            onChange={(e) => setSvgCode(e.target.value)}
            placeholder="在此粘贴 SVG 代码，例如: <svg>...</svg>"
            rows={8}
            className="font-mono text-xs resize-y"
          />
        </TabsContent>

        <TabsContent value="file">
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(file);
            }}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">点击或拖拽 SVG 文件到此处</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">输出宽度</Label>
          <Input
            type="number"
            value={outputWidth}
            onChange={(e) => setOutputWidth(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="默认原始宽度"
            className="w-32 h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">输出高度</Label>
          <Input
            type="number"
            value={outputHeight}
            onChange={(e) => setOutputHeight(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="默认原始高度"
            className="w-32 h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">背景色</Label>
          <Select value={bgOption} onValueChange={(v) => setBgOption(v as BgOption)}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent">透明</SelectItem>
              <SelectItem value="white">白色</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {bgOption === "custom" && (
          <div className="space-y-1">
            <Label className="text-sm">颜色</Label>
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-10 h-8 p-1 cursor-pointer"
            />
          </div>
        )}
      </div>

      <Button onClick={handleConvert} size="lg" className="w-full">
        转换为 PNG
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {result && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {result.width} × {result.height} px
              </p>
              <Button onClick={handleDownload} size="sm">
                <Download className="h-4 w-4 mr-1" /> 下载 PNG
              </Button>
            </div>
            <div
              className="rounded-lg overflow-hidden border border-border"
              style={{ backgroundColor: bgOption === "transparent" ? "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 0 0 / 16px 16px" : undefined }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="PNG 预览"
                className="max-w-full max-h-[400px] mx-auto object-contain"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
