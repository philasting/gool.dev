"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ArrowRightLeft } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface HtmlNode {
  type: "element" | "text";
  tag?: string;
  attributes?: Record<string, string>;
  children?: HtmlNode[];
  content?: string;
  selfClosing?: boolean;
}

function parseHtml(html: string): HtmlNode[] {
  const nodes: HtmlNode[] = [];
  let i = 0;

  function parseNodes(): HtmlNode[] {
    const result: HtmlNode[] = [];
    while (i < html.length) {
      if (html[i] === "<") {
        if (html.substring(i, i + 4) === "<!--") {
          const endIdx = html.indexOf("-->", i + 4);
          i = endIdx !== -1 ? endIdx + 3 : html.length;
          continue;
        }
        if (html[i + 1] === "/") {
          break;
        }
        const element = parseElement();
        if (element) result.push(element);
      } else {
        const text = parseText();
        if (text) result.push(text);
      }
    }
    return result;
  }

  function parseText(): HtmlNode | null {
    let content = "";
    while (i < html.length && html[i] !== "<") {
      content += html[i];
      i++;
    }
    const trimmed = content.trim();
    if (!trimmed) return null;
    return { type: "text", content: content.replace(/\s+/g, " ") };
  }

  function parseElement(): HtmlNode | null {
    if (html[i] !== "<") return null;
    i++;
    const tagMatch = html.substring(i).match(/^([a-zA-Z][a-zA-Z0-9]*)/);
    if (!tagMatch) {
      i++;
      return null;
    }
    const tag = tagMatch[1].toLowerCase();
    i += tag.length;

    const attributes: Record<string, string> = {};
    while (i < html.length && html[i] !== ">" && html[i] !== "/") {
      i = skipWhitespace();
      if (html[i] === ">" || html[i] === "/") break;
      const attrMatch = html.substring(i).match(/^([a-zA-Z_][\w-]*)/);
      if (attrMatch) {
        const attrName = attrMatch[1].toLowerCase();
        i += attrName.length;
        i = skipWhitespace();
        if (html[i] === "=") {
          i++;
          i = skipWhitespace();
          if (html[i] === '"' || html[i] === "'") {
            const quote = html[i];
            i++;
            const startIdx = i;
            while (i < html.length && html[i] !== quote) i++;
            attributes[attrName] = html.substring(startIdx, i);
            i++;
          } else {
            const startIdx = i;
            while (i < html.length && !/[\s>\/]/.test(html[i])) i++;
            attributes[attrName] = html.substring(startIdx, i);
          }
        } else {
          attributes[attrName] = "";
        }
      } else {
        i++;
      }
    }

    const selfClosing = html[i] === "/";
    if (selfClosing) i++;
    if (html[i] === ">") i++;

    const voidElements = new Set(["br", "hr", "img", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr"]);
    const isVoid = voidElements.has(tag) || selfClosing;

    let children: HtmlNode[] = [];
    if (!isVoid) {
      children = parseNodes();
      if (i < html.length && html[i] === "<" && html[i + 1] === "/") {
        const closeEnd = html.indexOf(">", i);
        i = closeEnd !== -1 ? closeEnd + 1 : html.length;
      }
    }

    return { type: "element", tag, attributes, children, selfClosing: isVoid };
  }

  function skipWhitespace(): number {
    while (i < html.length && /\s/.test(html[i])) i++;
    return i;
  }

  return parseNodes();
}

function htmlToMarkdown(nodes: HtmlNode[], indent: number = 0): string {
  const lines: string[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      const text = decodeHtmlEntities(node.content || "");
      if (text.trim()) lines.push(text);
      continue;
    }

    if (node.type === "element" && node.tag) {
      const tag = node.tag;
      const innerContent = node.children ? htmlToMarkdown(node.children, indent) : "";

      switch (tag) {
        case "h1":
          lines.push(`# ${innerContent.trim()}`);
          lines.push("");
          break;
        case "h2":
          lines.push(`## ${innerContent.trim()}`);
          lines.push("");
          break;
        case "h3":
          lines.push(`### ${innerContent.trim()}`);
          lines.push("");
          break;
        case "h4":
          lines.push(`#### ${innerContent.trim()}`);
          lines.push("");
          break;
        case "h5":
          lines.push(`##### ${innerContent.trim()}`);
          lines.push("");
          break;
        case "h6":
          lines.push(`###### ${innerContent.trim()}`);
          lines.push("");
          break;
        case "p":
          lines.push(innerContent.trim());
          lines.push("");
          break;
        case "strong":
        case "b":
          lines.push(`**${innerContent.trim()}**`);
          break;
        case "em":
        case "i":
          lines.push(`*${innerContent.trim()}*`);
          break;
        case "del":
        case "s":
        case "strike":
          lines.push(`~~${innerContent.trim()}~~`);
          break;
        case "code":
          lines.push(`\`${innerContent.trim()}\``);
          break;
        case "pre":
          lines.push("```");
          lines.push(innerContent.trim());
          lines.push("```");
          lines.push("");
          break;
        case "a":
          const href = node.attributes?.href || "";
          lines.push(`[${innerContent.trim()}](${href})`);
          break;
        case "img":
          const src = node.attributes?.src || "";
          const alt = node.attributes?.alt || "";
          lines.push(`![${alt}](${src})`);
          lines.push("");
          break;
        case "br":
          lines.push("  ");
          break;
        case "hr":
          lines.push("---");
          lines.push("");
          break;
        case "ul":
          if (node.children) {
            for (const child of node.children) {
              if (child.type === "element" && child.tag === "li") {
                const liContent = child.children ? htmlToMarkdown(child.children).trim() : "";
                lines.push(`- ${liContent}`);
              }
            }
          }
          lines.push("");
          break;
        case "ol":
          if (node.children) {
            let idx = 1;
            for (const child of node.children) {
              if (child.type === "element" && child.tag === "li") {
                const liContent = child.children ? htmlToMarkdown(child.children).trim() : "";
                lines.push(`${idx}. ${liContent}`);
                idx++;
              }
            }
          }
          lines.push("");
          break;
        case "blockquote":
          const bqContent = innerContent.trim();
          lines.push(
            bqContent
              .split("\n")
              .map((l: string) => `> ${l}`)
              .join("\n")
          );
          lines.push("");
          break;
        case "table":
          lines.push(convertTable(node));
          lines.push("");
          break;
        case "thead":
        case "tbody":
        case "tfoot":
        case "tr":
        case "th":
        case "td":
        case "div":
        case "span":
        case "section":
        case "article":
        case "main":
        case "header":
        case "footer":
        case "nav":
        case "aside":
        case "figure":
        case "figcaption":
        case "details":
        case "summary":
          lines.push(innerContent);
          break;
        default:
          lines.push(innerContent);
          break;
      }
    }
  }

  return lines.join("\n");
}

function convertTable(tableNode: HtmlNode): string {
  const rows: string[][] = [];

  function extractRows(node: HtmlNode) {
    if (node.type === "element" && node.tag === "tr") {
      const cells: string[] = [];
      if (node.children) {
        for (const child of node.children) {
          if (child.type === "element" && (child.tag === "td" || child.tag === "th")) {
            const cellContent = child.children ? htmlToMarkdown(child.children).trim() : "";
            cells.push(cellContent.replace(/\|/g, "\\|").replace(/\n/g, " "));
          }
        }
      }
      rows.push(cells);
    } else if (node.type === "element" && node.children) {
      for (const child of node.children) {
        extractRows(child);
      }
    }
  }

  if (tableNode.children) {
    for (const child of tableNode.children) {
      extractRows(child);
    }
  }

  if (rows.length === 0) return "";

  const maxCols = Math.max(...rows.map((r) => r.length));
  const normalizedRows = rows.map((r) => {
    while (r.length < maxCols) r.push("");
    return r;
  });

  const lines: string[] = [];
  lines.push(`| ${normalizedRows[0].join(" | ")} |`);
  lines.push(`| ${normalizedRows[0].map(() => "---").join(" | ")} |`);
  for (let i = 1; i < normalizedRows.length; i++) {
    lines.push(`| ${normalizedRows[i].join(" | ")} |`);
  }

  return lines.join("\n");
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function HtmlToMarkdownTool() {
  const [htmlInput, setHtmlInput] = useState("");
  const [markdownOutput, setMarkdownOutput] = useState("");
  const { copied, handleCopy } = useCopyState();

  const handleConvert = () => {
    if (!htmlInput.trim()) return;
    try {
      const nodes = parseHtml(htmlInput);
      const md = htmlToMarkdown(nodes);
      setMarkdownOutput(md.replace(/\n{3,}/g, "\n\n").trim());
    } catch (e) {
      setMarkdownOutput(`转换错误: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>HTML 源码</Label>
        <Textarea
          value={htmlInput}
          onChange={(e) => setHtmlInput(e.target.value)}
          placeholder={`输入 HTML 源码，例如：\n<h1>标题</h1>\n<p>这是一个<strong>加粗</strong>的段落</p>\n<ul>\n  <li>列表项 1</li>\n  <li>列表项 2</li>\n</ul>`}
          className="min-h-[200px] font-mono text-sm"
        />
      </div>

      <Button onClick={handleConvert} size="sm">
        <ArrowRightLeft className="h-4 w-4 mr-1" /> 转换为 Markdown
      </Button>

      {markdownOutput && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Markdown 输出</Label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(markdownOutput)}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-3">
              <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[400px] overflow-auto">
                {markdownOutput}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">支持的 HTML 标签：</p>
            <div className="flex flex-wrap gap-1">
              {["h1-h6", "p", "strong/b", "em/i", "del/s", "a", "img", "ul/ol/li", "code", "pre", "blockquote", "table", "br", "hr"].map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
