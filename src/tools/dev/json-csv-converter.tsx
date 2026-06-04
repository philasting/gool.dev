"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, ArrowRightLeft, Trash2 } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type ConvertMode = "json2csv" | "csv2json";
type Delimiter = "," | "\t" | ";";

/** Parse CSV string into 2D array, respecting quoted fields */
function parseCsv(csv: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < csv.length) {
    const ch = csv[i];

    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      currentField += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === delimiter) {
      currentRow.push(currentField);
      currentField = "";
      i++;
      continue;
    }

    if (ch === "\r") {
      i++;
      continue;
    }

    if (ch === "\n") {
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.some((f) => f.trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
      continue;
    }

    currentField += ch;
    i++;
  }

  // Last field
  currentRow.push(currentField);
  if (currentRow.some((f) => f.trim() !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

/** Convert JSON array to CSV */
function jsonToCsv(json: string, delimiter: string): string {
  const data = JSON.parse(json);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("JSON 必须是非空数组");
  }

  // Collect all keys
  const keys = new Set<string>();
  for (const item of data) {
    if (typeof item !== "object" || item === null) {
      throw new Error("数组元素必须是对象");
    }
    for (const key of Object.keys(item)) {
      keys.add(key);
    }
  }

  const headers = Array.from(keys);
  const escapeField = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [
    headers.map(escapeField).join(delimiter),
    ...data.map((item: Record<string, unknown>) =>
      headers.map((h) => escapeField(item[h])).join(delimiter)
    ),
  ];

  return lines.join("\n");
}

/** Convert CSV to JSON array */
function csvToJson(csv: string, delimiter: string): string {
  const rows = parseCsv(csv, delimiter);
  if (rows.length < 2) {
    throw new Error("CSV 至少需要表头和一行数据");
  }

  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (row[i] || "").trim();
    });
    return obj;
  });

  return JSON.stringify(data, null, 2);
}

export function JsonCsvConverterTool() {
  const [mode, setMode] = useState<ConvertMode>("json2csv");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [delimiter, setDelimiter] = useState<Delimiter>(",");
  const { copied, handleCopy } = useCopyState();

  const delimiterLabels: Record<Delimiter, string> = {
    ",": "逗号 (,)",
    "\t": "制表符 (\\t)",
    ";": "分号 (;)",
  };

  const handleConvert = () => {
    if (!input.trim()) return;
    try {
      setError("");
      if (mode === "json2csv") {
        const result = jsonToCsv(input, delimiter);
        setOutput(result);
      } else {
        const result = csvToJson(input, delimiter);
        setOutput(result);
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const onCopyOutput = () => {
    if (!output) return;
    handleCopy(output);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-sm">方向</Label>
          <Tabs value={mode} onValueChange={(v) => { if (v !== null) setMode(v as ConvertMode); }}>
            <TabsList>
              <TabsTrigger value="json2csv">
                JSON → CSV
              </TabsTrigger>
              <TabsTrigger value="csv2json">
                CSV → JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">分隔符</Label>
          <Select value={delimiter} onValueChange={(v) => { if (v !== null) setDelimiter(v as Delimiter); }}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["@", "\t", ";"] as const).map((d) => (
                <SelectItem key={d === "\t" ? "tab" : d} value={d === "\t" ? "\t" : d === "@" ? "," : d}>
                  {d === "@" ? "逗号 (,)" : d === "\t" ? "制表符 (\\t)" : "分号 (;)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {mode === "json2csv" ? "输入 JSON" : "输入 CSV"}
          </label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "json2csv"
                ? '[\n  {"name": "张三", "age": "25"},\n  {"name": "李四", "age": "30"}\n]'
                : "name,age\n张三,25\n李四,30"
            }
            className="min-h-[300px] font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {mode === "json2csv" ? "输出 CSV" : "输出 JSON"}
            </label>
            <Button variant="ghost" size="sm" onClick={onCopyOutput} disabled={!output}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-3">
              {error ? (
                <div className="text-destructive text-sm">
                  <Badge variant="destructive" className="mb-2">转换错误</Badge>
                  <pre className="whitespace-pre-wrap break-all">{error}</pre>
                </div>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[300px] overflow-auto custom-scrollbar">
                  {output || "点击转换按钮查看结果"}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleConvert} size="sm">
          <ArrowRightLeft className="h-4 w-4 mr-1" /> 转换
        </Button>
        <Button onClick={handleClear} variant="ghost" size="sm">
          <Trash2 className="h-4 w-4 mr-1" /> 清空
        </Button>
      </div>
    </div>
  );
}
