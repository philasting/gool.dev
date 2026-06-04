"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, Wand2, Minimize2, Trash2 } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

/** Format CSS — left brace no newline, properties indented, right brace unindented */
function formatCss(css: string, indent: number = 2): string {
  if (!css.trim()) return "";

  // Remove comments for processing (but we'll keep them in output)
  // First, simple approach: tokenize around braces and semicolons
  const pad = " ".repeat(indent);
  let level = 0;
  let result = "";
  let i = 0;
  let inComment = false;
  let inString: string | null = null;

  // Normalize whitespace first
  let normalized = css.replace(/\r\n/g, "\n").replace(/\t/g, "  ");

  // Process character by character
  while (i < normalized.length) {
    // Handle string literals
    if (!inComment && (normalized[i] === '"' || normalized[i] === "'")) {
      if (!inString) {
        inString = normalized[i];
      } else if (inString === normalized[i] && normalized[i - 1] !== "\\") {
        inString = null;
      }
      result += normalized[i];
      i++;
      continue;
    }

    if (inString) {
      result += normalized[i];
      i++;
      continue;
    }

    // Handle comments
    if (!inComment && normalized[i] === "/" && normalized[i + 1] === "*") {
      inComment = true;
      result += "/*";
      i += 2;
      continue;
    }

    if (inComment && normalized[i] === "*" && normalized[i + 1] === "/") {
      inComment = false;
      result += "*/";
      i += 2;
      continue;
    }

    if (inComment) {
      result += normalized[i];
      i++;
      continue;
    }

    // Handle opening brace
    if (normalized[i] === "{") {
      // Trim trailing whitespace before brace
      result = result.trimEnd();
      result += " {\n";
      level++;
      result += pad.repeat(level);
      i++;
      // Skip whitespace after {
      while (i < normalized.length && normalized[i] === " " || normalized[i] === "\n") {
        i++;
      }
      continue;
    }

    // Handle closing brace
    if (normalized[i] === "}") {
      level = Math.max(0, level - 1);
      result = result.trimEnd();
      result += "\n" + pad.repeat(level) + "}\n";
      i++;
      // Skip whitespace after }
      while (i < normalized.length && (normalized[i] === " " || normalized[i] === "\n")) {
        i++;
      }
      if (level > 0) {
        result += pad.repeat(level);
      }
      continue;
    }

    // Handle semicolons
    if (normalized[i] === ";") {
      result += ";\n" + pad.repeat(level);
      i++;
      // Skip whitespace after ;
      while (i < normalized.length && (normalized[i] === " " || normalized[i] === "\n")) {
        i++;
      }
      continue;
    }

    // Handle newlines — collapse to nothing (we manage our own)
    if (normalized[i] === "\n") {
      i++;
      continue;
    }

    // Collapse multiple spaces into one
    if (normalized[i] === " ") {
      if (result.endsWith(" ")) {
        i++;
        continue;
      }
      result += " ";
      i++;
      continue;
    }

    result += normalized[i];
    i++;
  }

  return result.trim();
}

/** Compress CSS — remove whitespace and comments */
function compressCss(css: string): string {
  if (!css.trim()) return "";

  let result = "";
  let i = 0;
  let inString: string | null = null;

  while (i < css.length) {
    // Handle string literals
    if (!inString && (css[i] === '"' || css[i] === "'")) {
      inString = css[i];
      result += css[i];
      i++;
      continue;
    }
    if (inString) {
      result += css[i];
      if (css[i] === inString && css[i - 1] !== "\\") {
        inString = null;
      }
      i++;
      continue;
    }

    // Remove comments
    if (css[i] === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      if (end !== -1) {
        i = end + 2;
      } else {
        i = css.length;
      }
      continue;
    }

    // Collapse whitespace
    if (/\s/.test(css[i])) {
      // Add a single space only if needed (between alphanumeric chars)
      if (result.length > 0 && /[a-zA-Z0-9_]/.test(result[result.length - 1])) {
        const nextNonSpace = css.slice(i).search(/\S/);
        if (nextNonSpace > 0 && /[a-zA-Z0-9_]/.test(css[i + nextNonSpace])) {
          result += " ";
        }
      }
      i++;
      continue;
    }

    result += css[i];
    i++;
  }

  return result.trim();
}

export function CssFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { copied, handleCopy } = useCopyState();

  const handleFormat = () => {
    if (!input.trim()) return;
    const result = formatCss(input, 2);
    setOutput(result);
  };

  const handleCompress = () => {
    if (!input.trim()) return;
    const result = compressCss(input);
    setOutput(result);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
  };

  const onCopyOutput = () => {
    if (!output) return;
    handleCopy(output);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">输入 CSS</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={".container {\n  display: flex;\n  align-items: center;\n}"}
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleFormat} size="sm">
              <Wand2 className="h-4 w-4 mr-1" /> 格式化
            </Button>
            <Button onClick={handleCompress} variant="secondary" size="sm">
              <Minimize2 className="h-4 w-4 mr-1" /> 压缩
            </Button>
            <Button onClick={handleClear} variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </div>

        {/* Output */}
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
              <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[300px] overflow-auto custom-scrollbar">
                {output || "点击格式化按钮查看结果"}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
