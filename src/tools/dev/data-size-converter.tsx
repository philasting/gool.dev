"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, ArrowRightLeft } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

type DataUnit = "B" | "KB" | "MB" | "GB" | "TB" | "PB";

const UNITS_BINARY: DataUnit[] = ["B", "KB", "MB", "GB", "TB", "PB"];
const UNITS_SI: DataUnit[] = ["B", "KB", "MB", "GB", "TB", "PB"];

const UNIT_LABELS_BINARY: Record<DataUnit, string> = {
  B: "Byte",
  KB: "KiB",
  MB: "MiB",
  GB: "GiB",
  TB: "TiB",
  PB: "PiB",
};

const UNIT_LABELS_SI: Record<DataUnit, string> = {
  B: "Byte",
  KB: "KB",
  MB: "MB",
  GB: "GB",
  TB: "TB",
  PB: "PB",
};

interface ConversionResult {
  unit: DataUnit;
  value: number;
  label: string;
}

function convertDataSize(
  value: number,
  fromUnit: DataUnit,
  useBinary: boolean
): ConversionResult[] {
  const base = useBinary ? 1024 : 1000;
  const fromIndex = UNITS_BINARY.indexOf(fromUnit);

  // 先转为 Byte
  const bytes = value * Math.pow(base, fromIndex);

  const labels = useBinary ? UNIT_LABELS_BINARY : UNIT_LABELS_SI;

  return UNITS_BINARY.map((unit, toIndex) => {
    const converted = bytes / Math.pow(base, toIndex);
    return {
      unit,
      value: converted,
      label: labels[unit],
    };
  });
}

function formatValue(value: number): string {
  if (value === 0) return "0";
  if (Number.isInteger(value) && Math.abs(value) < 1e15) {
    return value.toLocaleString("zh-CN");
  }
  if (Math.abs(value) >= 1) {
    return value.toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }
  // Very small numbers
  return value.toExponential(6);
}

export function DataSizeConverterTool() {
  const [inputValue, setInputValue] = useState("1");
  const [fromUnit, setFromUnit] = useState<DataUnit>("GB");
  const [useBinary, setUseBinary] = useState(true);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const { copied, handleCopy } = useCopyState();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleConvert = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val < 0) return;
    setResults(convertDataSize(val, fromUnit, useBinary));
  };

  const handleSwap = () => {
    // Not really swapping, just a visual convenience
    setResults([]);
  };

  const copyResult = async (text: string, index: number) => {
    await copyToClipboard(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2 flex-1 min-w-[120px]">
          <Label>数值</Label>
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="1"
            min="0"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>单位</Label>
          <Select value={fromUnit} onValueChange={(v) => setFromUnit(v as DataUnit)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS_BINARY.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {useBinary ? UNIT_LABELS_BINARY[unit] : UNIT_LABELS_SI[unit]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleConvert} size="sm">
          <ArrowRightLeft className="h-4 w-4 mr-1" /> 换算
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="use-binary" checked={useBinary} onCheckedChange={setUseBinary} />
        <Label htmlFor="use-binary" className="text-sm">
          1024 进制（1KB = 1024B）
        </Label>
        <span className="text-xs text-muted-foreground">
          {useBinary ? "二进制前缀 (KiB/MiB/GiB)" : "SI 标准 (KB/MB/GB)"}
        </span>
      </div>

      {results.length > 0 && (
        <div className="space-y-1.5">
          {results.map((result, i) => (
            <Card
              key={result.unit}
              className={
                result.unit === fromUnit ? "border-primary/50 bg-primary/5" : ""
              }
            >
              <CardContent className="p-2.5 flex items-center gap-3">
                <span className="text-sm font-semibold w-12 shrink-0 text-right">
                  {result.label}
                </span>
                <code className="flex-1 text-sm font-mono break-all">
                  {formatValue(result.value)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyResult(formatValue(result.value), i)}
                >
                  {copiedIndex === i ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">
            <strong>1024 进制</strong>：1 KiB = 1024 B，1 MiB = 1024 KiB，常用于内存/硬盘容量<br />
            <strong>1000 进制</strong>：1 KB = 1000 B，1 MB = 1000 KB，SI 国际标准，常用于网络带宽/硬盘厂商标注
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
