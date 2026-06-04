"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Trash2 } from "lucide-react";

const LANGUAGES: Record<string, { keywords: string[]; label: string }> = {
  javascript: { label: "JavaScript", keywords: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "new", "this", "try", "catch", "throw", "async", "await", "typeof", "instanceof", "switch", "case", "break", "continue", "do", "in", "of", "yield", "true", "false", "null", "undefined", "void", "delete"] },
  typescript: { label: "TypeScript", keywords: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "new", "this", "try", "catch", "throw", "async", "await", "typeof", "instanceof", "interface", "type", "enum", "implements", "extends", "public", "private", "protected", "readonly", "abstract", "as", "is", "keyof", "infer", "never", "unknown", "any", "void", "switch", "case", "break", "continue", "true", "false", "null", "undefined"] },
  python: { label: "Python", keywords: ["def", "class", "import", "from", "return", "if", "elif", "else", "for", "while", "try", "except", "finally", "with", "as", "yield", "lambda", "pass", "break", "continue", "raise", "and", "or", "not", "in", "is", "True", "False", "None", "global", "nonlocal", "assert", "del", "async", "await"] },
  java: { label: "Java", keywords: ["public", "private", "protected", "class", "interface", "extends", "implements", "static", "final", "void", "int", "long", "double", "float", "boolean", "char", "String", "new", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "try", "catch", "finally", "throw", "throws", "import", "package", "this", "super", "null", "true", "false", "abstract", "synchronized"] },
  go: { label: "Go", keywords: ["func", "package", "import", "var", "const", "type", "struct", "interface", "map", "chan", "go", "select", "case", "default", "if", "else", "for", "range", "switch", "break", "continue", "return", "defer", "fallthrough", "nil", "true", "false", "make", "len", "cap", "append", "delete"] },
  rust: { label: "Rust", keywords: ["fn", "let", "mut", "pub", "struct", "enum", "impl", "trait", "mod", "use", "crate", "self", "super", "return", "if", "else", "for", "while", "loop", "match", "break", "continue", "where", "as", "in", "ref", "move", "async", "await", "true", "false", "Some", "None", "Ok", "Err"] },
  css: { label: "CSS", keywords: [] },
  html: { label: "HTML", keywords: [] },
  sql: { label: "SQL", keywords: ["SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "JOIN", "INNER", "LEFT", "RIGHT", "ON", "AND", "OR", "NOT", "IN", "IS", "NULL", "AS", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "DISTINCT", "BETWEEN", "LIKE", "EXISTS", "UNION", "ALL"] },
  json: { label: "JSON", keywords: [] },
  bash: { label: "Bash", keywords: ["if", "then", "else", "elif", "fi", "for", "while", "do", "done", "case", "esac", "function", "return", "in", "echo", "exit", "local", "export", "source", "alias", "unset", "set", "shift"] },
};

const BG_COLORS = [
  { value: "#1e1e2e", label: "Catppuccin Mocha" },
  { value: "#282a36", label: "Dracula" },
  { value: "#1a1b26", label: "Tokyo Night" },
  { value: "#2d2b55", label: "Synthwave 84" },
  { value: "#0d1117", label: "GitHub Dark" },
  { value: "#1e293b", label: "Slate" },
  { value: "#ffffff", label: "白色" },
  { value: "#f8f9fa", label: "浅灰" },
];

/** Token types for syntax highlighting */
type TokenType = "keyword" | "string" | "comment" | "number" | "normal";

interface Token {
  type: TokenType;
  text: string;
}

/** Simple tokenizer for code syntax highlighting */
function tokenizeCode(code: string, language: string): Token[] {
  const tokens: Token[] = [];
  const keywords = new Set(LANGUAGES[language]?.keywords || []);
  let i = 0;

  while (i < code.length) {
    // Single-line comment
    if (code[i] === "/" && code[i + 1] === "/") {
      let end = code.indexOf("\n", i);
      if (end === -1) end = code.length;
      tokens.push({ type: "comment", text: code.slice(i, end) });
      i = end;
      continue;
    }

    // Python-style comment
    if (language === "python" && code[i] === "#") {
      let end = code.indexOf("\n", i);
      if (end === -1) end = code.length;
      tokens.push({ type: "comment", text: code.slice(i, end) });
      i = end;
      continue;
    }

    // SQL comment
    if (language === "sql" && code[i] === "-") {
      let end = code.indexOf("\n", i);
      if (end === -1) end = code.length;
      tokens.push({ type: "comment", text: code.slice(i, end) });
      i = end;
      continue;
    }

    // HTML comment
    if (language === "html" && code.slice(i, i + 4) === "<!--") {
      const end = code.indexOf("-->", i + 4);
      const endIdx = end === -1 ? code.length : end + 3;
      tokens.push({ type: "comment", text: code.slice(i, endIdx) });
      i = endIdx;
      continue;
    }

    // Multi-line comment
    if (code[i] === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const endIdx = end === -1 ? code.length : end + 2;
      tokens.push({ type: "comment", text: code.slice(i, endIdx) });
      i = endIdx;
      continue;
    }

    // Strings
    if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === "\\") j++; // skip escaped
        j++;
      }
      j = Math.min(j + 1, code.length);
      tokens.push({ type: "string", text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Numbers
    if (/\d/.test(code[i]) && (i === 0 || !/[a-zA-Z_$]/.test(code[i - 1]))) {
      let j = i;
      while (j < code.length && /[\d.xXa-fA-FeEoObB_]/.test(code[j])) j++;
      tokens.push({ type: "number", text: code.slice(i, j) });
      i = j;
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      tokens.push({
        type: keywords.has(word) ? "keyword" : "normal",
        text: word,
      });
      i = j;
      continue;
    }

    // Other characters
    tokens.push({ type: "normal", text: code[i] });
    i++;
  }

  return tokens;
}

export function CodeScreenshotTool() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [bgColor, setBgColor] = useState("#1e1e2e");
  const [borderRadius, setBorderRadius] = useState(12);
  const [padding, setPadding] = useState(32);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !code.trim()) return;

    const lines = code.split("\n");
    const lineHeight = 20;
    const fontSize = 14;
    const charWidth = 8.4;

    const maxLineLength = Math.max(...lines.map((l) => l.length), 1);
    const canvasWidth = maxLineLength * charWidth + padding * 2 + 50; // 50 for line numbers
    const canvasHeight = lines.length * lineHeight + padding * 2 + 10;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw rounded rectangle background
    ctx.fillStyle = bgColor;
    roundRect(ctx, 0, 0, canvasWidth, canvasHeight, borderRadius);
    ctx.fill();

    // Draw code window header (dots)
    const headerHeight = 30;
    ctx.fillStyle = adjustColor(bgColor, -20);
    roundRectTop(ctx, 0, 0, canvasWidth, headerHeight, borderRadius);
    ctx.fill();

    // Draw traffic light dots
    ctx.beginPath();
    ctx.arc(padding, 15, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ff5f57";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(padding + 20, 15, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#febc2e";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(padding + 40, 15, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#28c840";
    ctx.fill();

    // Set text properties
    const isDark = isColorDark(bgColor);
    const normalColor = isDark ? "#abb2bf" : "#383a42";
    const keywordColor = isDark ? "#c678dd" : "#a626a4";
    const stringColor = isDark ? "#98c379" : "#50a14f";
    const commentColor = isDark ? "#5c6370" : "#a0a1a7";
    const numberColor = isDark ? "#d19a66" : "#986801";
    const lineNumberColor = isDark ? "#4b5263" : "#a0a1a7";

    ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", "Consolas", monospace`;
    ctx.textBaseline = "top";

    const codeStartY = headerHeight + padding - 10;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const y = codeStartY + lineIdx * lineHeight;

      // Line number
      ctx.fillStyle = lineNumberColor;
      ctx.fillText(String(lineIdx + 1).padStart(3, " "), padding, y);

      // Tokenize and colorize
      const lineTokens = tokenizeCode(lines[lineIdx], language);
      let x = padding + 50;

      for (const token of lineTokens) {
        switch (token.type) {
          case "keyword":
            ctx.fillStyle = keywordColor;
            break;
          case "string":
            ctx.fillStyle = stringColor;
            break;
          case "comment":
            ctx.fillStyle = commentColor;
            break;
          case "number":
            ctx.fillStyle = numberColor;
            break;
          default:
            ctx.fillStyle = normalColor;
        }
        ctx.fillText(token.text, x, y);
        x += ctx.measureText(token.text).width;
      }
    }
  }, [code, language, bgColor, borderRadius, padding]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "code-screenshot.png";
    a.click();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">代码</Label>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={"function hello() {\n  console.log('Hello, World!');\n}"}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">语言</Label>
              <Select value={language} onValueChange={(v) => { if (v !== null) setLanguage(v); }}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">背景色</Label>
              <Select value={bgColor} onValueChange={(v) => { if (v !== null) setBgColor(v); }}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BG_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">圆角: {borderRadius}px</Label>
              <Input
                type="range"
                min={0}
                max={24}
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value))}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">内边距: {padding}px</Label>
              <Input
                type="range"
                min={16}
                max={64}
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="h-8"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateImage} size="sm" disabled={!code.trim()}>
              生成截图
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm" disabled={!code.trim()}>
              <Download className="h-4 w-4 mr-1" /> 下载 PNG
            </Button>
            <Button onClick={() => setCode("")} variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">预览</Label>
          <Card>
            <CardContent className="p-3 flex items-center justify-center min-h-[200px]">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Draw a rounded rectangle */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw a top-rounded rectangle (for header) */
function roundRectTop(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Check if a hex color is dark */
function isColorDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

/** Adjust hex color brightness */
function adjustColor(hex: string, amount: number): string {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
