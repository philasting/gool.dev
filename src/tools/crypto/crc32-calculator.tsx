"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Calculator, Upload, Trash2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/** CRC32 查找表（多项式 0xEDB88320） */
const CRC32_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
    table.push(crc >>> 0);
  }
  return table;
})();

/** 计算 CRC32 校验值 */
function computeCRC32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** 将 Uint8Array 转为十六进制字符串 */
function toHex(value: number): string {
  return value.toString(16).toUpperCase().padStart(8, "0");
}

export function Crc32CalculatorTool() {
  const [input, setInput] = useState("");
  const [hexResult, setHexResult] = useState("");
  const [decResult, setDecResult] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const { copied, handleCopy } = useCopyState();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculate = useCallback((data: Uint8Array) => {
    const crc = computeCRC32(data);
    setHexResult(toHex(crc));
    setDecResult(crc.toString(10));
  }, []);

  const handleCalculate = () => {
    if (!input) return;
    const data = new TextEncoder().encode(input);
    calculate(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    const buffer = await file.arrayBuffer();
    calculate(new Uint8Array(buffer));
  };

  const handleClear = () => {
    setInput("");
    setHexResult("");
    setDecResult("");
    setFileName("");
    setFileSize(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyField = async (text: string, field: string) => {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="text">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">文本输入</TabsTrigger>
          <TabsTrigger value="file">文件上传</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-2">
          <div className="space-y-2">
            <Label>输入文本</Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入要计算 CRC32 的文本..."
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCalculate} size="sm" disabled={!input}>
              <Calculator className="h-4 w-4 mr-1" /> 计算
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="file" className="space-y-2">
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                const dt = new DataTransfer();
                dt.items.add(file);
                if (fileInputRef.current) {
                  fileInputRef.current.files = dt.files;
                  fileInputRef.current.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                }
              }
            }}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              点击或拖拽文件到此处上传
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          {fileName && (
            <p className="text-sm text-muted-foreground">
              文件: {fileName} ({formatSize(fileSize)})
            </p>
          )}
        </TabsContent>
      </Tabs>

      {(hexResult || decResult) && (
        <div className="space-y-2">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-sm font-semibold w-20 shrink-0">十六进制</span>
              <code className="flex-1 text-sm font-mono break-all text-primary">
                0x{hexResult}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyField(`0x${hexResult}`, "hex")}
              >
                {copiedField === "hex" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-sm font-semibold w-20 shrink-0">十进制</span>
              <code className="flex-1 text-sm font-mono break-all">
                {decResult}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyField(decResult, "dec")}
              >
                {copiedField === "dec" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
