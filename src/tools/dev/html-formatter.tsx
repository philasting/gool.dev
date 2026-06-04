"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Wand2, Minimize2, Trash2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/** Pretty-print HTML using DOMParser — recursive indentation */
function formatHtml(html: string, indent: number = 2): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return prettyPrintNode(doc.documentElement, 0, indent);
}

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

const INLINE_ELEMENTS = new Set([
  "a", "abbr", "b", "bdi", "bdo", "cite", "code", "data", "dfn",
  "em", "i", "kbd", "mark", "q", "rp", "rt", "ruby", "s", "samp",
  "small", "span", "strong", "sub", "sup", "time", "u", "var",
]);

function prettyPrintNode(node: Element, level: number, indent: number): string {
  const pad = " ".repeat(level * indent);
  const tag = node.tagName.toLowerCase();

  // Skip html/head/body wrappers for fragments
  if (tag === "html" || tag === "head" || tag === "body") {
    const parts: string[] = [];
    for (const child of Array.from(node.children)) {
      parts.push(prettyPrintNode(child, level, indent));
    }
    // Also include text nodes for body
    if (tag === "body") {
      const textParts: string[] = [];
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
          textParts.push(pad + child.textContent.trim());
        }
      }
      return [...textParts, ...parts].join("\n");
    }
    return parts.join("\n");
  }

  // Build opening tag with attributes
  let openTag = `<${tag}`;
  for (const attr of Array.from(node.attributes)) {
    openTag += ` ${attr.name}="${attr.value}"`;
  }
  openTag += ">";

  // Void elements
  if (VOID_ELEMENTS.has(tag)) {
    return pad + openTag;
  }

  // Get text content
  const textContent = Array.from(node.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent?.trim() || "")
    .filter(Boolean)
    .join(" ");

  const children = Array.from(node.children);

  // Inline element with text only
  if (children.length === 0 && textContent) {
    return pad + openTag + textContent + `</${tag}>`;
  }

  // Has children
  const parts: string[] = [pad + openTag];
  if (textContent) {
    parts.push(" ".repeat((level + 1) * indent) + textContent);
  }
  for (const child of children) {
    parts.push(prettyPrintNode(child, level + 1, indent));
  }
  parts.push(pad + `</${tag}>`);
  return parts.join("\n");
}

/** Compress HTML — remove whitespace between tags, collapse spaces */
function compressHtml(html: string): string {
  return html
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .replace(/\n/g, "")
    .trim();
}

export function HtmlFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const { copied, handleCopy } = useCopyState();

  const handleFormat = () => {
    if (!input.trim()) return;
    try {
      const result = formatHtml(input, 2);
      setOutput(result);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const handleCompress = () => {
    if (!input.trim()) return;
    try {
      const result = compressHtml(input);
      setOutput(result);
      setError("");
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">输入 HTML</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'<div>\n  <h1>标题</h1>\n  <p>段落内容</p>\n</div>'}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyOutput}
              disabled={!output}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-3">
              {error ? (
                <div className="text-destructive text-sm">
                  <Badge variant="destructive" className="mb-2">解析错误</Badge>
                  <pre className="whitespace-pre-wrap break-all">{error}</pre>
                </div>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[300px] overflow-auto custom-scrollbar">
                  {output || "点击格式化按钮查看结果"}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
