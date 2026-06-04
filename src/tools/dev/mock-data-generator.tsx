"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, Trash2, Plus, X } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

type FieldType =
  | "name"
  | "email"
  | "phone"
  | "address"
  | "company"
  | "url"
  | "ip"
  | "date"
  | "number"
  | "uuid"
  | "color"
  | "boolean";

interface FieldOption {
  type: FieldType;
  label: string;
}

const FIELD_OPTIONS: FieldOption[] = [
  { type: "name", label: "姓名" },
  { type: "email", label: "邮箱" },
  { type: "phone", label: "手机号" },
  { type: "address", label: "地址" },
  { type: "company", label: "公司名" },
  { type: "url", label: "URL" },
  { type: "ip", label: "IP 地址" },
  { type: "date", label: "日期" },
  { type: "number", label: "数字" },
  { type: "uuid", label: "UUID" },
  { type: "color", label: "颜色" },
  { type: "boolean", label: "布尔值" },
];

type OutputFormat = "json" | "csv" | "sql";

// ─── Random generators ───

const SURNAMES = "赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏窦章苏潘葛范彭鲁韦昌马苗凤花方俞任袁柳丰鲍史唐龙廖邹韩".split("");
const GIVEN_NAMES = "伟芳敏静丽强磊洋勇艳杰娟涛明超秀霞刚桂英华慧巧美惠珍贞莉兰凤洁梅琳素云莲真环雪荣爱妹霖琴".split("");

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < len; i++) result += chars[randomInt(0, 15)];
  return result;
}

function generateUUID(): string {
  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${randomInt(8, 11).toString(16)}${randomHex(3)}-${randomHex(12)}`;
}

const CITIES = ["北京市", "上海市", "广州市", "深圳市", "杭州市", "成都市", "武汉市", "南京市", "重庆市", "苏州市"];
const DISTRICTS = ["朝阳区", "海淀区", "浦东新区", "南山区", "西湖区", "武侯区", "江干区", "鼓楼区", "渝中区", "工业园区"];
const ROADS = ["中山路", "人民路", "建设路", "解放路", "长安路", "文化路", "和平路", "幸福路", "科技路", "创新路"];

function generateField(type: FieldType): string | number | boolean {
  switch (type) {
    case "name":
      return randomItem(SURNAMES) + randomItem(GIVEN_NAMES) + (Math.random() > 0.5 ? randomItem(GIVEN_NAMES) : "");
    case "email": {
      const domains = ["qq.com", "163.com", "gmail.com", "outlook.com", "foxmail.com"];
      const name = randomItem(SURNAMES).toLowerCase() + randomInt(100, 9999);
      return `${name}@${randomItem(domains)}`;
    }
    case "phone": {
      const prefixes = ["130", "131", "132", "133", "135", "136", "137", "138", "139", "150", "151", "152", "155", "156", "157", "158", "159", "170", "176", "177", "178", "180", "181", "182", "183", "184", "185", "186", "187", "188", "189"];
      return `1${randomItem(prefixes.slice(1))}${String(randomInt(10000000, 99999999))}`;
    }
    case "address":
      return `${randomItem(CITIES)}${randomItem(DISTRICTS)}${randomItem(ROADS)}${randomInt(1, 200)}号`;
    case "company": {
      const prefixes = ["华", "中", "大", "新", "国", "天", "金", "恒", "博", "创"];
      const mids = ["科", "信", "联", "网", "智", "云", "数", "达", "通", "融"];
      const suffixes = ["科技有限公司", "信息技术有限公司", "网络科技有限公司", "数据服务有限公司", "咨询有限公司"];
      return `${randomItem(prefixes)}${randomItem(mids)}${randomItem(suffixes)}`;
    }
    case "url": {
      const hosts = ["example.com", "test.cn", "demo.net", "sample.org"];
      return `https://${randomItem(hosts)}/${randomHex(6)}`;
    }
    case "ip":
      return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
    case "date": {
      const y = randomInt(2020, 2025);
      const m = String(randomInt(1, 12)).padStart(2, "0");
      const d = String(randomInt(1, 28)).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    case "number":
      return randomInt(1, 10000);
    case "uuid":
      return generateUUID();
    case "color":
      return `#${randomHex(6)}`;
    case "boolean":
      return Math.random() > 0.5;
  }
}

interface SelectedField {
  id: string;
  type: FieldType;
}

function generateData(fields: SelectedField[], count: number): Record<string, string | number | boolean>[] {
  const result: Record<string, string | number | boolean>[] = [];
  for (let i = 0; i < count; i++) {
    const row: Record<string, string | number | boolean> = {};
    for (const field of fields) {
      const label = FIELD_OPTIONS.find((f) => f.type === field.type)?.label ?? field.type;
      row[label] = generateField(field.type);
    }
    result.push(row);
  }
  return result;
}

function toCSV(data: Record<string, string | number | boolean>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const lines = [headers.join(",")];
  for (const row of data) {
    const values = headers.map((h) => {
      const val = String(row[h]);
      return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

function toSQL(data: Record<string, string | number | boolean>[], tableName: string): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const lines: string[] = [];
  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h];
      if (typeof val === "boolean") return val ? "1" : "0";
      if (typeof val === "number") return String(val);
      return `'${String(val).replace(/'/g, "''")}'`;
    });
    lines.push(`INSERT INTO ${tableName} (${headers.join(", ")}) VALUES (${values.join(", ")});`);
  }
  return lines.join("\n");
}

export function MockDataGeneratorTool() {
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([
    { id: "1", type: "name" },
    { id: "2", type: "email" },
    { id: "3", type: "phone" },
  ]);
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState<OutputFormat>("json");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [nextId, setNextId] = useState(4);

  const availableTypes = useMemo(() => {
    const usedTypes = new Set(selectedFields.map((f) => f.type));
    return FIELD_OPTIONS.filter((f) => !usedTypes.has(f.type));
  }, [selectedFields]);

  const addField = useCallback((type: FieldType) => {
    const id = String(nextId);
    setNextId((prev) => prev + 1);
    setSelectedFields((prev) => [...prev, { id, type }]);
  }, [nextId]);

  const removeField = useCallback((id: string) => {
    setSelectedFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleGenerate = useCallback(() => {
    if (selectedFields.length === 0) return;
    const data = generateData(selectedFields, count);
    let result = "";
    switch (format) {
      case "json":
        result = JSON.stringify(data, null, 2);
        break;
      case "csv":
        result = toCSV(data);
        break;
      case "sql":
        result = toSQL(data, "mock_data");
        break;
    }
    setOutput(result);
  }, [selectedFields, count, format]);

  const handleCopy = async () => {
    if (!output) return;
    await copyToClipboard(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setOutput("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">字段选择</Label>
        <div className="flex flex-wrap gap-2">
          {selectedFields.map((field) => {
            const opt = FIELD_OPTIONS.find((f) => f.type === field.type);
            return (
              <Badge key={field.id} variant="secondary" className="gap-1 pr-1">
                {opt?.label ?? field.type}
                <button onClick={() => removeField(field.id)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {availableTypes.length > 0 && (
            <Select onValueChange={(v) => addField(v as FieldType)}>
              <SelectTrigger className="h-7 w-auto gap-1 text-xs border-dashed">
                <Plus className="h-3 w-3" />
                <SelectValue placeholder="添加字段" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((opt) => (
                  <SelectItem key={opt.type} value={opt.type}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">生成条数</Label>
          <Input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
            min={1}
            max={100}
            className="w-24 h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">输出格式</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="sql">SQL INSERT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={selectedFields.length === 0} size="lg" className="flex-1">
          <RefreshCw className="h-4 w-4 mr-2" /> 生成
        </Button>
        {output && (
          <>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "已复制" : "复制"}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </>
        )}
      </div>

      {output && (
        <Textarea
          value={output}
          readOnly
          rows={12}
          className="font-mono text-xs resize-y"
        />
      )}
    </div>
  );
}
