"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ArrowRightLeft } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

type CurrencyCode = "CNY" | "USD" | "EUR" | "JPY" | "GBP" | "KRW";

const CURRENCY_OPTIONS: { value: CurrencyCode; label: string; locale: string }[] = [
  { value: "CNY", label: "人民币 (CNY)", locale: "zh-CN" },
  { value: "USD", label: "美元 (USD)", locale: "en-US" },
  { value: "EUR", label: "欧元 (EUR)", locale: "de-DE" },
  { value: "JPY", label: "日元 (JPY)", locale: "ja-JP" },
  { value: "GBP", label: "英镑 (GBP)", locale: "en-GB" },
  { value: "KRW", label: "韩元 (KRW)", locale: "ko-KR" },
];

interface FormatResult {
  thousands: string;
  scientific: string;
  percent: string;
  currency: string;
}

function formatNumber(num: number, decimals: number, currency: CurrencyCode): FormatResult {
  const thousands = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  const scientific = num.toExponential(decimals > 3 ? 3 : decimals);

  const percent = new Intl.NumberFormat("zh-CN", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  const currOpt = CURRENCY_OPTIONS.find((c) => c.value === currency);
  const currencyStr = new Intl.NumberFormat(currOpt?.locale ?? "zh-CN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  return { thousands, scientific, percent, currency: currencyStr };
}

function parseFormatted(text: string): number | null {
  const cleaned = text.replace(/[^\d.eE+\-]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

export function NumberFormatterTool() {
  const [tab, setTab] = useState("format");
  const [inputNum, setInputNum] = useState("1234567.89");
  const [decimals, setDecimals] = useState(2);
  const [currency, setCurrency] = useState<CurrencyCode>("CNY");
  const [formattedInput, setFormattedInput] = useState("1,234,567.89");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const parsedNum = useMemo(() => {
    const n = Number(inputNum);
    return Number.isNaN(n) ? null : n;
  }, [inputNum]);

  const formatResults = useMemo(() => {
    if (parsedNum === null) return null;
    return formatNumber(parsedNum, decimals, currency);
  }, [parsedNum, decimals, currency]);

  const parsedResult = useMemo(() => {
    return parseFormatted(formattedInput);
  }, [formattedInput]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatRows = formatResults
    ? [
        { label: "千分位分隔", value: formatResults.thousands, key: "thousands" },
        { label: "科学计数法", value: formatResults.scientific, key: "scientific" },
        { label: "百分比", value: formatResults.percent, key: "percent" },
        { label: "货币格式", value: formatResults.currency, key: "currency" },
      ]
    : [];

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="format" className="flex-1">数字 → 格式化</TabsTrigger>
          <TabsTrigger value="parse" className="flex-1">格式化 → 数字</TabsTrigger>
        </TabsList>

        <TabsContent value="format" className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-sm">输入数字</Label>
              <Input
                type="text"
                value={inputNum}
                onChange={(e) => setInputNum(e.target.value)}
                placeholder="请输入数字"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">小数位数: {decimals}</Label>
              <Slider
                value={[decimals]}
                onValueChange={(v) => setDecimals(Array.isArray(v) ? v[0] : v)}
                min={0}
                max={8}
                step={1}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">货币</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formatResults ? (
            <div className="space-y-2">
              {formatRows.map((row) => (
                <Card key={row.key}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{row.label}</span>
                    <code className="flex-1 text-sm font-mono break-all select-all">{row.value}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleCopy(row.value, row.key)}
                    >
                      {copiedKey === row.key ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">请输入有效数字</p>
          )}
        </TabsContent>

        <TabsContent value="parse" className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm">输入格式化字符串</Label>
            <Input
              type="text"
              value={formattedInput}
              onChange={(e) => setFormattedInput(e.target.value)}
              placeholder="例如: 1,234,567.89 或 ¥1,234,567.89"
              className="h-9"
            />
          </div>

          {formattedInput && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">解析结果</span>
                <code className="flex-1 text-sm font-mono break-all select-all">
                  {parsedResult !== null ? parsedResult : "无法解析"}
                </code>
                {parsedResult !== null && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleCopy(parsedResult.toString(), "parsed")}
                  >
                    {copiedKey === "parsed" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
