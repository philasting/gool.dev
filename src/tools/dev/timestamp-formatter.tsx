"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  Clock,
  List,
  Highlighter,
  FileText,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

// ─── Types ────────────────────────────────────────────────────────────────

type FormatType = "local" | "utc" | "iso" | "relative";
type TimestampType = "sec" | "ms" | "us" | "iso";

interface TimestampMatch {
  /** The raw matched string (may include quotes for quoted matches) */
  raw: string;
  /** Start index in source text */
  start: number;
  /** End index in source text (exclusive) */
  end: number;
  /** Detected type of timestamp */
  type: TimestampType;
  /** Value in milliseconds */
  ms: number;
}

// ─── Constants ────────────────────────────────────────────────────────────

/** 2000-01-01 00:00:00 UTC in ms */
const MIN_MS = 946684800000;
/** 2100-01-01 00:00:00 UTC in ms */
const MAX_MS = 4102444800000;

const TYPE_LABELS: Record<TimestampType, string> = {
  sec: "秒",
  ms: "毫秒",
  us: "微秒",
  iso: "ISO",
};

const TYPE_COLORS: Record<TimestampType, string> = {
  sec: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ms: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  us: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  iso: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

// ─── Utility Functions ────────────────────────────────────────────────────

/** Pad a number to 2 digits with leading zero. */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Validate whether a millisecond value falls within 2000–2100 range. */
function isValidTimestamp(ms: number): boolean {
  return ms >= MIN_MS && ms <= MAX_MS;
}

/** Format as local time: YYYY-MM-DD HH:mm:ss */
function formatLocal(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Format as UTC time: YYYY-MM-DD HH:mm:ss UTC */
function formatUTC(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

/** Format as ISO 8601 with local timezone offset. */
function formatISO(ms: number): string {
  return new Date(ms).toISOString();
}

/** Convert milliseconds to a human-readable relative time string. */
function toRelative(ms: number): string {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  const suffix = diff < 0 ? "前" : "后";

  if (abs < 60_000) {
    return `${Math.round(abs / 1000)}秒${suffix}`;
  }
  if (abs < 3_600_000) {
    return `${Math.round(abs / 60_000)}分钟${suffix}`;
  }
  if (abs < 86_400_000) {
    return `${Math.round(abs / 3_600_000)}小时${suffix}`;
  }
  if (abs < 2_592_000_000) {
    return `${Math.round(abs / 86_400_000)}天${suffix}`;
  }
  if (abs < 31_536_000_000) {
    return `${Math.round(abs / 2_592_000_000)}个月${suffix}`;
  }
  return `${Math.round(abs / 31_536_000_000)}年${suffix}`;
}

/** Format milliseconds according to the selected format type. */
function formatDate(ms: number, format: FormatType): string {
  switch (format) {
    case "local":
      return formatLocal(ms);
    case "utc":
      return formatUTC(ms);
    case "iso":
      return formatISO(ms);
    case "relative":
      return toRelative(ms);
  }
}

/** Classify a numeric string by its digit count and validate the range. */
function classifyNumeric(
  digits: string
): { type: TimestampType; ms: number } | null {
  const num = parseInt(digits, 10);
  if (isNaN(num)) return null;

  let type: TimestampType;
  let ms: number;

  if (digits.length === 10) {
    type = "sec";
    ms = num * 1000;
  } else if (digits.length === 13) {
    type = "ms";
    ms = num;
  } else if (digits.length === 16) {
    type = "us";
    ms = Math.floor(num / 1000); // truncate microseconds to milliseconds
  } else {
    return null;
  }

  if (!isValidTimestamp(ms)) return null;
  return { type, ms };
}

/**
 * Find all timestamps in the given text.
 * Recognizes: ISO date strings, bare Unix timestamps (10/13/16 digits),
 * and quoted Unix timestamps.
 */
function findTimestamps(text: string): TimestampMatch[] {
  const matches: TimestampMatch[] = [];

  // 1. ISO 8601 date strings, e.g. 2024-06-21T22:00:00.000Z or 2024-06-21T22:00:00+08:00
  const ISO_RE =
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g;
  let m: RegExpExecArray | null;
  while ((m = ISO_RE.exec(text)) !== null) {
    const date = new Date(m[0]);
    if (!isNaN(date.getTime()) && isValidTimestamp(date.getTime())) {
      matches.push({
        raw: m[0],
        start: m.index,
        end: m.index + m[0].length,
        type: "iso",
        ms: date.getTime(),
      });
    }
  }

  // 2. Quoted numeric timestamps: "1718978400" or '1718978400'
  const QUOTED_RE = /["'](\d{10}|\d{13}|\d{16})["']/g;
  while ((m = QUOTED_RE.exec(text)) !== null) {
    const result = classifyNumeric(m[1]);
    if (result) {
      matches.push({
        raw: m[0], // include the quotes in raw
        start: m.index,
        end: m.index + m[0].length,
        type: result.type,
        ms: result.ms,
      });
    }
  }

  // 3. Bare numeric timestamps (not preceded or followed by digit or quote)
  const BARE_RE = /(?<!["'\d])(\d{16}|\d{13}|\d{10})(?!["'\d])/g;
  while ((m = BARE_RE.exec(text)) !== null) {
    const result = classifyNumeric(m[1]);
    if (result) {
      matches.push({
        raw: m[1],
        start: m.index,
        end: m.index + m[1].length,
        type: result.type,
        ms: result.ms,
      });
    }
  }

  // Sort by position, then remove overlapping matches (keep first/longest)
  matches.sort((a, b) => a.start - b.start);
  const result: TimestampMatch[] = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.start >= lastEnd) {
      result.push(match);
      lastEnd = match.end;
    }
  }

  return result;
}

/**
 * Build the converted text: replaces each timestamp with its formatted date.
 */
function buildConvertedText(
  text: string,
  matches: TimestampMatch[],
  format: FormatType
): string {
  let result = "";
  let lastEnd = 0;
  for (const match of matches) {
    result += text.slice(lastEnd, match.start);
    result += formatDate(match.ms, format);
    lastEnd = match.end;
  }
  result += text.slice(lastEnd);
  return result;
}

// ─── Single Converter Component ───────────────────────────────────────────

function SingleConverter() {
  const [input, setInput] = useState("");
  const { handleCopy } = useCopyState();

  const results = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    let ms: number | null = null;
    let detectedType: TimestampType | null = null;

    // Try parsing as a number first
    const asNum = Number(trimmed);
    if (!isNaN(asNum) && /^\d+$/.test(trimmed)) {
      const classified = classifyNumeric(trimmed);
      if (classified) {
        ms = classified.ms;
        detectedType = classified.type;
      }
    }

    // Try parsing as a date string
    if (ms === null) {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime()) && isValidTimestamp(date.getTime())) {
        ms = date.getTime();
        detectedType = "iso";
      }
    }

    if (ms === null || detectedType === null) return null;

    return {
      ms,
      type: detectedType,
      local: formatLocal(ms),
      utc: formatUTC(ms),
      iso: formatISO(ms),
      relative: toRelative(ms),
      sec: Math.floor(ms / 1000),
      millis: ms,
    };
  }, [input]);

  const formatRows: { label: string; value: string }[] = results
    ? [
        { label: "本地时间", value: results.local },
        { label: "UTC 时间", value: results.utc },
        { label: "ISO 8601", value: results.iso },
        { label: "相对时间", value: results.relative },
        { label: "Unix 秒", value: String(results.sec) },
        { label: "Unix 毫秒", value: String(results.millis) },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入时间戳或日期字符串</Label>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="如 1718978400、1718978400000 或 2024-06-21T22:00:00Z"
            className="font-mono"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
            title="填入当前时间戳"
          >
            <Clock className="h-4 w-4" />
          </Button>
          {input && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setInput("")}
              title="清空"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {results && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                检测类型：{TYPE_LABELS[results.type]}
              </Badge>
              <Badge variant="outline">
                原始毫秒值：{results.millis}
              </Badge>
            </div>
            <div className="space-y-2">
              {formatRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground shrink-0 w-20">
                      {row.label}
                    </span>
                    <code className="text-sm font-mono truncate">
                      {row.value}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-7 w-7"
                    onClick={() => handleCopy(row.value)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {input.trim() && !results && (
        <p className="text-sm text-destructive">
          无法识别输入为有效的时间戳或日期字符串（支持范围：2000 年 — 2100 年）
        </p>
      )}
    </div>
  );
}

// ─── Batch Converter Component ────────────────────────────────────────────

function BatchConverter() {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<FormatType>("local");
  const [viewMode, setViewMode] = useState<"highlight" | "list">("highlight");
  const { copied, handleCopy } = useCopyState();

  const matches = useMemo(() => findTimestamps(input), [input]);

  const convertedText = useMemo(
    () => buildConvertedText(input, matches, format),
    [input, matches, format]
  );

  // Build highlighted JSX segments
  const highlightedSegments = useMemo(() => {
    const segments: React.ReactNode[] = [];
    let lastEnd = 0;
    matches.forEach((match, i) => {
      if (match.start > lastEnd) {
        segments.push(
          <span key={`text-${i}`}>
            {input.slice(lastEnd, match.start)}
          </span>
        );
      }
      segments.push(
        <mark
          key={`mark-${i}`}
          className="rounded px-0.5 bg-yellow-200 dark:bg-yellow-900/50"
        >
          <span className="font-mono font-semibold text-foreground">
            {match.raw}
          </span>
          <span className="inline-flex items-center gap-1 ml-1 px-1 py-0.5 rounded text-xs bg-primary/10 text-primary">
            <ArrowRight className="h-3 w-3" />
            {formatDate(match.ms, format)}
            <Badge
              variant="outline"
              className={`ml-1 px-1 py-0 text-[10px] h-4 border-0 ${TYPE_COLORS[match.type]}`}
            >
              {TYPE_LABELS[match.type]}
            </Badge>
          </span>
        </mark>
      );
      lastEnd = match.end;
    });
    if (lastEnd < input.length) {
      segments.push(<span key="text-end">{input.slice(lastEnd)}</span>);
    }
    return segments;
  }, [input, matches, format]);

  const handleClear = useCallback(() => {
    setInput("");
  }, []);

  const formatOptions: { value: FormatType; label: string }[] = [
    { value: "local", label: "本地时间 (YYYY-MM-DD HH:mm:ss)" },
    { value: "utc", label: "UTC 时间 (YYYY-MM-DD HH:mm:ss UTC)" },
    { value: "iso", label: "ISO 8601" },
    { value: "relative", label: "相对时间 (如 3天前)" },
  ];

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>粘贴含时间戳的文本（日志、JSON、代码等）</Label>
          <div className="flex items-center gap-2">
            {input && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                清空
              </Button>
            )}
          </div>
        </div>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`粘贴你的文本，例如：

{"event":"login","time":1718978400,"user":"admin"}
{"event":"logout","time":1718978400000}
日志时间: "1718978400" 系统启动于 2024-06-21T22:00:00Z`}
          className="min-h-[160px] font-mono text-sm"
        />
      </div>

      {/* Format selector + stats */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">输出格式</Label>
          <Select
            value={format}
            onValueChange={(v) => {
              if (v !== null) setFormat(v as FormatType);
            }}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formatOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {matches.length > 0 && (
          <Badge variant="secondary">
            识别到 {matches.length} 个时间戳
          </Badge>
        )}
      </div>

      {/* Output: highlight view / list view */}
      {input.trim() && matches.length > 0 ? (
        <Tabs value={viewMode} onValueChange={(v) => { if (v !== null) setViewMode(v as "highlight" | "list"); }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="highlight">
                <Highlighter className="h-3.5 w-3.5 mr-1" />
                高亮展示
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-3.5 w-3.5 mr-1" />
                列表展示
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(convertedText)}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              {copied ? "已复制" : "复制转换后文本"}
            </Button>
          </div>

          {/* Highlight view */}
          <TabsContent value="highlight" className="mt-3">
            <Card>
              <CardContent className="p-4">
                <div className="whitespace-pre-wrap break-words text-sm font-mono leading-relaxed">
                  {highlightedSegments}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* List view */}
          <TabsContent value="list" className="mt-3">
            <Card>
              <CardContent className="p-4 space-y-2">
                {matches.map((match, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <Badge
                      variant="outline"
                      className={`shrink-0 border-0 ${TYPE_COLORS[match.type]}`}
                    >
                      {TYPE_LABELS[match.type]}
                    </Badge>
                    <code className="text-sm font-mono text-muted-foreground shrink-0">
                      {match.raw}
                    </code>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <code className="text-sm font-mono font-semibold flex-1 min-w-0 truncate">
                      {formatDate(match.ms, format)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7"
                      onClick={() => handleCopy(formatDate(match.ms, format))}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : input.trim() ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              未在文本中识别到有效时间戳（支持 10/13/16 位 Unix 时间戳、引号包裹的时间戳、ISO 日期字符串）
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function TimestampFormatterTool() {
  const [tab, setTab] = useState("batch");

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => { if (v !== null) setTab(v); }}>
        <TabsList>
          <TabsTrigger value="batch">
            <List className="h-3.5 w-3.5 mr-1" />
            批量识别
          </TabsTrigger>
          <TabsTrigger value="single">
            <Clock className="h-3.5 w-3.5 mr-1" />
            单次转换
          </TabsTrigger>
        </TabsList>
        <TabsContent value="batch" className="mt-4">
          <BatchConverter />
        </TabsContent>
        <TabsContent value="single" className="mt-4">
          <SingleConverter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
