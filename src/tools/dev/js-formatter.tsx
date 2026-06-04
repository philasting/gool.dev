"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Wand2, Minimize2, EyeOff, Trash2 } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type JsMode = "format" | "compress" | "obfuscate";

/** Simple JS formatter based on brace/semicolon indentation */
function formatJs(code: string, indent: number = 2): string {
  if (!code.trim()) return "";

  const pad = " ".repeat(indent);
  let level = 0;
  let result = "";
  let i = 0;
  let inString: string | null = null;
  let inTemplate = false;
  let inSingleComment = false;
  let inMultiComment = false;
  let inRegex = false;
  let prevChar = "";
  let lineStart = true;

  while (i < code.length) {
    const ch = code[i];
    const nextCh = code[i + 1] || "";

    // Handle single-line comment
    if (!inString && !inMultiComment && !inTemplate && ch === "/" && nextCh === "/") {
      inSingleComment = true;
      result += ch;
      i++;
      continue;
    }
    if (inSingleComment) {
      if (ch === "\n") {
        inSingleComment = false;
        result += "\n" + pad.repeat(level);
        lineStart = true;
        i++;
        continue;
      }
      result += ch;
      i++;
      continue;
    }

    // Handle multi-line comment
    if (!inString && !inSingleComment && !inTemplate && ch === "/" && nextCh === "*") {
      inMultiComment = true;
      result += ch;
      i++;
      continue;
    }
    if (inMultiComment) {
      result += ch;
      if (ch === "*" && nextCh === "/") {
        inMultiComment = false;
        result += "/";
        i += 2;
        continue;
      }
      if (ch === "\n") {
        result = result.trimEnd() + "\n" + pad.repeat(level);
        lineStart = true;
      }
      i++;
      continue;
    }

    // Handle template literals
    if (!inString && !inMultiComment && ch === "`") {
      inTemplate = !inTemplate;
      result += ch;
      i++;
      continue;
    }
    if (inTemplate) {
      result += ch;
      i++;
      continue;
    }

    // Handle strings
    if (!inMultiComment && !inSingleComment && !inTemplate && (ch === '"' || ch === "'")) {
      if (!inString) {
        inString = ch;
      } else if (inString === ch && prevChar !== "\\") {
        inString = null;
      }
      result += ch;
      prevChar = ch;
      i++;
      continue;
    }
    if (inString) {
      result += ch;
      prevChar = ch;
      i++;
      continue;
    }

    // Opening brace
    if (ch === "{") {
      result = result.trimEnd() + " {\n" + pad.repeat(level + 1);
      level++;
      lineStart = true;
      i++;
      continue;
    }

    // Closing brace
    if (ch === "}") {
      level = Math.max(0, level - 1);
      result = result.trimEnd() + "\n" + pad.repeat(level) + "}";
      lineStart = false;
      i++;
      // Check if next non-whitespace is else/catch/finally
      let j = i;
      while (j < code.length && code[j] === " ") j++;
      const nextWord = code.slice(j, j + 6);
      if (nextWord.startsWith("else") || nextWord.startsWith("catch") || nextWord.startsWith("finally")) {
        result += " ";
      } else {
        result += "\n" + pad.repeat(level);
        lineStart = true;
      }
      continue;
    }

    // Semicolons
    if (ch === ";") {
      result += ";\n" + pad.repeat(level);
      lineStart = true;
      i++;
      // Skip whitespace
      while (i < code.length && (code[i] === " " || code[i] === "\n" || code[i] === "\r")) i++;
      continue;
    }

    // Newlines — skip, we manage our own
    if (ch === "\n" || ch === "\r") {
      i++;
      continue;
    }

    // Multiple spaces — collapse
    if (ch === " " && result.endsWith(" ")) {
      i++;
      continue;
    }

    result += ch;
    prevChar = ch;
    lineStart = false;
    i++;
  }

  return result.trim();
}

/** Compress JS — remove whitespace and comments */
function compressJs(code: string): string {
  if (!code.trim()) return "";

  let result = "";
  let i = 0;
  let inString: string | null = null;
  let inTemplate = false;

  while (i < code.length) {
    const ch = code[i];
    const nextCh = code[i + 1] || "";

    // Skip single-line comments
    if (!inString && !inTemplate && ch === "/" && nextCh === "/") {
      while (i < code.length && code[i] !== "\n") i++;
      continue;
    }

    // Skip multi-line comments
    if (!inString && !inTemplate && ch === "/" && nextCh === "*") {
      i += 2;
      while (i < code.length - 1 && !(code[i] === "*" && code[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    // Handle template literals
    if (!inString && ch === "`") {
      inTemplate = !inTemplate;
      result += ch;
      i++;
      continue;
    }
    if (inTemplate) {
      result += ch;
      i++;
      continue;
    }

    // Handle strings
    if (!inTemplate && (ch === '"' || ch === "'")) {
      if (!inString) {
        inString = ch;
      } else if (inString === ch && result[result.length - 1] !== "\\") {
        inString = null;
      }
      result += ch;
      i++;
      continue;
    }
    if (inString) {
      result += ch;
      i++;
      continue;
    }

    // Collapse whitespace
    if (/\s/.test(ch)) {
      if (result.length > 0 && /[a-zA-Z0-9_$]/.test(result[result.length - 1])) {
        const rest = code.slice(i);
        const nextNonSpace = rest.search(/\S/);
        if (nextNonSpace > 0 && /[a-zA-Z0-9_$]/.test(rest[nextNonSpace])) {
          result += " ";
        }
      }
      i++;
      continue;
    }

    result += ch;
    i++;
  }

  return result.trim();
}

/** Obfuscate JS — rename local variables, remove comments and whitespace */
function obfuscateJs(code: string): string {
  if (!code.trim()) return "";

  // First compress
  let compressed = compressJs(code);

  // Find local variable declarations (var/let/const)
  const varPattern = /\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const localVars = new Map<string, string>();
  let varIndex = 0;

  const getShortName = (idx: number): string => {
    let name = "";
    let n = idx;
    do {
      name = String.fromCharCode(97 + (n % 26)) + name;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return name;
  };

  // Collect local variable names
  let match: RegExpExecArray | null;
  const reservedWords = new Set([
    "break", "case", "catch", "continue", "debugger", "default", "delete",
    "do", "else", "finally", "for", "function", "if", "in", "instanceof",
    "new", "return", "switch", "this", "throw", "try", "typeof", "var",
    "void", "while", "with", "class", "const", "enum", "export", "extends",
    "import", "super", "implements", "interface", "let", "package", "private",
    "protected", "public", "static", "yield", "true", "false", "null", "undefined",
  ]);

  while ((match = varPattern.exec(compressed)) !== null) {
    const varName = match[1];
    if (!reservedWords.has(varName) && !localVars.has(varName)) {
      localVars.set(varName, getShortName(varIndex));
      varIndex++;
    }
  }

  // Replace variable names (whole word only, not in strings)
  for (const [original, short] of localVars) {
    const re = new RegExp(`\\b${original}\\b`, "g");
    // Simple approach: replace outside of strings
    let result = "";
    let j = 0;
    let inStr: string | null = null;
    let inTpl = false;

    while (j < compressed.length) {
      const c = compressed[j];
      const nc = compressed[j + 1] || "";

      if (!inStr && !inTpl && c === "`") {
        inTpl = !inTpl;
        result += c;
        j++;
        continue;
      }
      if (inTpl) {
        result += c;
        j++;
        continue;
      }

      if (!inTpl && (c === '"' || c === "'")) {
        if (!inStr) {
          inStr = c;
        } else if (inStr === c && result[result.length - 1] !== "\\") {
          inStr = null;
        }
        result += c;
        j++;
        continue;
      }

      if (inStr) {
        result += c;
        j++;
        continue;
      }

      // Try to match variable name at this position
      if (compressed.slice(j).startsWith(original)) {
        const before = j > 0 ? compressed[j - 1] : " ";
        const after = compressed[j + original.length] || " ";
        if (!/[a-zA-Z0-9_$]/.test(before) && !/[a-zA-Z0-9_$]/.test(after)) {
          result += short;
          j += original.length;
          continue;
        }
      }

      result += c;
      j++;
    }

    compressed = result;
  }

  return compressed;
}

export function JsFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<JsMode>("format");
  const { copied, handleCopy } = useCopyState();

  const handleExecute = () => {
    if (!input.trim()) return;
    try {
      setError("");
      switch (mode) {
        case "format":
          setOutput(formatJs(input, 2));
          break;
        case "compress":
          setOutput(compressJs(input));
          break;
        case "obfuscate":
          setOutput(obfuscateJs(input));
          break;
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
      <Tabs value={mode} onValueChange={(v) => setMode(v as JsMode)}>
        <TabsList>
          <TabsTrigger value="format">
            <Wand2 className="h-3.5 w-3.5 mr-1" /> 格式化
          </TabsTrigger>
          <TabsTrigger value="compress">
            <Minimize2 className="h-3.5 w-3.5 mr-1" /> 压缩
          </TabsTrigger>
          <TabsTrigger value="obfuscate">
            <EyeOff className="h-3.5 w-3.5 mr-1" /> 混淆
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">输入 JavaScript</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"function hello(name) {\n  const greeting = 'Hello, ' + name;\n  return greeting;\n}"}
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleExecute} size="sm">
              执行
            </Button>
            <Button onClick={handleClear} variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">输出</label>
            <Button variant="ghost" size="sm" onClick={onCopyOutput} disabled={!output}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-3">
              {error ? (
                <div className="text-destructive text-sm">
                  <Badge variant="destructive" className="mb-2">错误</Badge>
                  <pre className="whitespace-pre-wrap break-all">{error}</pre>
                </div>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[300px] overflow-auto custom-scrollbar">
                  {output || "点击执行按钮查看结果"}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
