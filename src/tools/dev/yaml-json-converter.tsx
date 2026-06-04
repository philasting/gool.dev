"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Trash2, ArrowRightLeft } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

// ─── Simple YAML Parser (no external deps) ───

type YamlValue = string | number | boolean | null | YamlValue[] | YamlMap;
interface YamlMap {
  [key: string]: YamlValue;
}

/** Parse a simple YAML string into a JS value */
function parseYaml(input: string): YamlValue {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const result = parseBlock(lines, 0, 0);
  return result.value;
}

interface ParseResult {
  value: YamlValue;
  nextLine: number;
}

/** Detect indentation level */
function getIndent(line: string): number {
  const match = line.match(/^( *)/);
  return match ? match[1].length : 0;
}

/** Parse a block of YAML lines starting at given line with expected indent */
function parseBlock(
  lines: string[],
  startLine: number,
  baseIndent: number
): ParseResult {
  if (startLine >= lines.length) {
    return { value: null, nextLine: startLine };
  }

  // Check if it's a list block or map block
  let i = startLine;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return { value: null, nextLine: i };

  const firstLine = lines[i];
  const firstIndent = getIndent(firstLine);
  const trimmed = firstLine.trim();

  // Determine if it's a list item
  if (trimmed.startsWith("- ")) {
    return parseList(lines, i, firstIndent);
  }

  // Check if it's a key: value (map)
  if (trimmed.includes(":") && isMapLine(trimmed)) {
    return parseMap(lines, i, firstIndent);
  }

  // Scalar value
  return parseScalar(lines, startLine, baseIndent);
}

/** Check if a trimmed line looks like a map entry (key: or key: value) */
function isMapLine(trimmed: string): boolean {
  // Match "key:" or "key: value" but not strings containing colons mid-word
  const match = trimmed.match(/^([^:]+):\s*(.*)/);
  if (!match) return false;
  const key = match[1].trim();
  // Key should not start with special chars (except for quoted keys)
  if (key.startsWith("-") || key.startsWith("[") || key.startsWith("{")) return false;
  return true;
}

/** Parse a YAML map block */
function parseMap(
  lines: string[],
  startLine: number,
  baseIndent: number
): ParseResult {
  const map: YamlMap = {};
  let i = startLine;

  while (i < lines.length) {
    // Skip empty lines
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;

    const line = lines[i];
    const indent = getIndent(line);
    const trimmed = line.trim();

    // If indent is less than base indent, this block is done
    if (indent < baseIndent) break;

    // If indent is more than base, it's a continuation (shouldn't happen at map level)
    if (indent > baseIndent) break;

    // Check if it's a map entry
    if (!isMapLine(trimmed)) break;

    const colonIdx = trimmed.indexOf(":");
    let key = trimmed.slice(0, colonIdx).trim();
    const afterColon = trimmed.slice(colonIdx + 1).trim();

    // Unquote key if necessary
    key = unquote(key);

    if (afterColon === "") {
      // Value is on next indented lines
      const nextLine = i + 1;
      const nextResult = parseBlock(lines, nextLine, indent + 2);
      map[key] = nextResult.value;
      i = nextResult.nextLine;
    } else {
      // Inline value
      map[key] = parseValue(afterColon);
      i++;
    }
  }

  return { value: map, nextLine: i };
}

/** Parse a YAML list block */
function parseList(
  lines: string[],
  startLine: number,
  baseIndent: number
): ParseResult {
  const list: YamlValue[] = [];
  let i = startLine;

  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;

    const line = lines[i];
    const indent = getIndent(line);
    const trimmed = line.trim();

    if (indent < baseIndent) break;
    if (indent > baseIndent) break;

    if (trimmed.startsWith("- ")) {
      const afterDash = trimmed.slice(2).trim();
      if (afterDash === "") {
        // List item with nested content
        const nextResult = parseBlock(lines, i + 1, indent + 2);
        list.push(nextResult.value);
        i = nextResult.nextLine;
      } else if (isMapLine(afterDash)) {
        // List item is an inline map start: "- key: value"
        const mapResult = parseMapFromListItem(lines, i, indent, afterDash);
        list.push(mapResult.value);
        i = mapResult.nextLine;
      } else {
        list.push(parseValue(afterDash));
        i++;
      }
    } else {
      break;
    }
  }

  return { value: list, nextLine: i };
}

/** Parse map starting from a list item line like "- key: value" */
function parseMapFromListItem(
  lines: string[],
  startLine: number,
  baseIndent: number,
  firstLineTrimmed: string
): ParseResult {
  const map: YamlMap = {};
  const colonIdx = firstLineTrimmed.indexOf(":");
  let key = firstLineTrimmed.slice(0, colonIdx).trim();
  const afterColon = firstLineTrimmed.slice(colonIdx + 1).trim();
  key = unquote(key);

  if (afterColon === "") {
    const nextResult = parseBlock(lines, startLine + 1, baseIndent + 2);
    map[key] = nextResult.value;
    let i = nextResult.nextLine;

    // Continue parsing remaining keys at baseIndent + 2
    while (i < lines.length) {
      while (i < lines.length && lines[i].trim() === "") i++;
      if (i >= lines.length) break;
      const line = lines[i];
      const indent = getIndent(line);
      const trimmed = line.trim();
      if (indent !== baseIndent + 2 || !isMapLine(trimmed)) break;
      const ci = trimmed.indexOf(":");
      let k = trimmed.slice(0, ci).trim();
      const ac = trimmed.slice(ci + 1).trim();
      k = unquote(k);
      if (ac === "") {
        const nr = parseBlock(lines, i + 1, indent + 2);
        map[k] = nr.value;
        i = nr.nextLine;
      } else {
        map[k] = parseValue(ac);
        i++;
      }
    }
    return { value: map, nextLine: i };
  } else {
    map[key] = parseValue(afterColon);
    let i = startLine + 1;

    // Continue parsing remaining keys at baseIndent + 2
    while (i < lines.length) {
      while (i < lines.length && lines[i].trim() === "") i++;
      if (i >= lines.length) break;
      const line = lines[i];
      const indent = getIndent(line);
      const trimmed = line.trim();
      if (indent !== baseIndent + 2 || !isMapLine(trimmed)) break;
      const ci = trimmed.indexOf(":");
      let k = trimmed.slice(0, ci).trim();
      const ac = trimmed.slice(ci + 1).trim();
      k = unquote(k);
      if (ac === "") {
        const nr = parseBlock(lines, i + 1, indent + 2);
        map[k] = nr.value;
        i = nr.nextLine;
      } else {
        map[k] = parseValue(ac);
        i++;
      }
    }
    return { value: map, nextLine: i };
  }
}

/** Parse a scalar value */
function parseScalar(
  lines: string[],
  startLine: number,
  _baseIndent: number
): ParseResult {
  if (startLine >= lines.length) return { value: null, nextLine: startLine };
  const trimmed = lines[startLine].trim();
  return { value: parseValue(trimmed), nextLine: startLine + 1 };
}

/** Parse a YAML inline value */
function parseValue(s: string): YamlValue {
  const trimmed = s.trim();
  if (trimmed === "null" || trimmed === "~" || trimmed === "") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  // Number
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);

  // Quoted string
  return unquote(trimmed);
}

/** Remove surrounding quotes from a string */
function unquote(s: string): string {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}

// ─── YAML Serializer ───

/** Convert a JS value to YAML string */
function toYaml(value: YamlValue, indent = 0): string {
  if (value === null) return indentStr(indent) + "null";
  if (typeof value === "boolean") return indentStr(indent) + String(value);
  if (typeof value === "number") return indentStr(indent) + String(value);
  if (typeof value === "string") {
    // Quote strings that could be misinterpreted
    const needsQuote =
      value === "null" ||
      value === "true" ||
      value === "false" ||
      value === "" ||
      /^\d+(\.\d+)?$/.test(value) ||
      value.includes(":") ||
      value.includes("#") ||
      value.startsWith("- ") ||
      value.includes("\n");
    const quoted = needsQuote ? `"${value.replace(/"/g, '\\"')}"` : value;
    return indentStr(indent) + quoted;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return indentStr(indent) + "[]";
    return value
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          !Array.isArray(item)
        ) {
          const mapItem = item as YamlMap;
          const entries = Object.entries(mapItem);
          if (entries.length === 0) return indentStr(indent) + "- {}";
          const first = entries[0];
          const rest = entries.slice(1);
          let line = `${indentStr(indent)}- ${first[0]}: ${inlineValue(first[1])}`;
          for (const [k, v] of rest) {
            if (typeof v === "object" && v !== null) {
              line += `\n${toYaml(v, indent + 4)}`;
              // Wrap key at proper indent
              line = line.replace(
                /\n\s*$/,
                `\n${indentStr(indent + 2)}${k}: ${inlineValue(
                  typeof v === "object" && v !== null && !Array.isArray(v)
                    ? ""
                    : v
                )}`
              );
            } else {
              line += `\n${indentStr(indent + 2)}${k}: ${inlineValue(v)}`;
            }
          }
          return line;
        }
        if (typeof item === "object" && item !== null && Array.isArray(item)) {
          return `${indentStr(indent)}-\n${toYaml(item, indent + 2)}`;
        }
        return `${indentStr(indent)}- ${inlineValue(item)}`;
      })
      .join("\n");
  }
  if (typeof value === "object") {
    const map = value as YamlMap;
    const entries = Object.entries(map);
    if (entries.length === 0) return indentStr(indent) + "{}";
    return entries
      .map(([k, v]) => {
        if (typeof v === "object" && v !== null && !Array.isArray(v)) {
          return `${indentStr(indent)}${k}:\n${toYaml(v, indent + 2)}`;
        }
        if (Array.isArray(v)) {
          if (v.length === 0) return `${indentStr(indent)}${k}: []`;
          return `${indentStr(indent)}${k}:\n${toYaml(v, indent + 2)}`;
        }
        return `${indentStr(indent)}${k}: ${inlineValue(v)}`;
      })
      .join("\n");
  }
  return indentStr(indent) + String(value);
}

/** Format a value for inline use (no indent) */
function inlineValue(v: YamlValue): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return String(v);
  if (typeof v === "number") return String(v);
  if (typeof v === "string") {
    const needsQuote =
      v === "null" ||
      v === "true" ||
      v === "false" ||
      v === "" ||
      /^\d+(\.\d+)?$/.test(v) ||
      v.includes(":") ||
      v.includes("#") ||
      v.startsWith("- ");
    return needsQuote ? `"${v.replace(/"/g, '\\"')}"` : v;
  }
  return String(v);
}

function indentStr(n: number): string {
  return " ".repeat(n);
}

// ─── Component ───

export function YamlJsonConverterTool() {
  const [mode, setMode] = useState<"yaml2json" | "json2yaml">("yaml2json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const { copied, handleCopy } = useCopyState();

  const convert = () => {
    setError("");
    setOutput("");

    if (!input.trim()) {
      setError("请输入内容");
      return;
    }

    try {
      if (mode === "yaml2json") {
        const parsed = parseYaml(input);
        setOutput(JSON.stringify(parsed, null, 2));
      } else {
        const parsed = JSON.parse(input);
        setOutput(toYaml(parsed as YamlValue));
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const swapAndConvert = () => {
    const newMode = mode === "yaml2json" ? "json2yaml" : "yaml2json";
    setMode(newMode);
    setInput(output);
    setOutput("");
    setError("");
  };

  const clear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const inputLabel = mode === "yaml2json" ? "输入 YAML" : "输入 JSON";
  const outputLabel = mode === "yaml2json" ? "输出 JSON" : "输出 YAML";
  const inputPlaceholder =
    mode === "yaml2json"
      ? "name: 张三\nage: 25\naddress:\n  city: 北京\n  zip: '100000'\nhobbies:\n  - 编程\n  - 阅读"
      : '{\n  "name": "张三",\n  "age": 25,\n  "address": {\n    "city": "北京"\n  }\n}';

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as "yaml2json" | "json2yaml");
          setInput("");
          setOutput("");
          setError("");
        }}
      >
        <TabsList>
          <TabsTrigger value="yaml2json">YAML → JSON</TabsTrigger>
          <TabsTrigger value="json2yaml">JSON → YAML</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{inputLabel}</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={inputPlaceholder}
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={convert} size="sm">
              转换
            </Button>
            <Button onClick={swapAndConvert} variant="secondary" size="sm">
              <ArrowRightLeft className="h-4 w-4 mr-1" /> 互换
            </Button>
            <Button onClick={clear} variant="outline" size="sm">
              清空
            </Button>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{outputLabel}</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(output)}
              disabled={!output}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-3">
              {error ? (
                <div className="text-destructive text-sm space-y-2">
                  <Badge variant="destructive">转换错误</Badge>
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
    </div>
  );
}
