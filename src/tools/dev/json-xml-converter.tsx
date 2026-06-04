"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Copy, Check, Trash2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

type TabValue = "json-to-xml" | "xml-to-json";

/** Convert a JSON value to XML string */
function jsonToXml(data: unknown, tagName: string, indent: string): string {
  if (data === null || data === undefined) {
    return `${indent}<${tagName}/>`;
  }
  if (typeof data !== "object") {
    const escaped = String(data)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
    return `${indent}<${tagName}>${escaped}</${tagName}>`;
  }
  if (Array.isArray(data)) {
    return data
      .map((item) => jsonToXml(item, "item", indent))
      .join("\n");
  }
  const entries = Object.entries(data as Record<string, unknown>);
  const inner = entries
    .map(([key, val]) => jsonToXml(val, key, `${indent}  `))
    .join("\n");
  if (entries.length === 0) {
    return `${indent}<${tagName}/>`;
  }
  return `${indent}<${tagName}>\n${inner}\n${indent}</${tagName}>`;
}

/** Convert XML string to JSON using DOMParser */
function xmlToJson(xmlStr: string): unknown {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, "text/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    throw new Error("XML 解析错误: " + errorNode.textContent);
  }
  return nodeToJson(doc.documentElement);
}

function nodeToJson(node: Element): unknown {
  const children = Array.from(node.children);
  if (children.length === 0) {
    return node.textContent || "";
  }
  // Check if all children have the same tag name (array pattern)
  const firstTag = children[0].tagName;
  const allSameTag = children.every((c) => c.tagName === firstTag);
  if (allSameTag && children.length > 1) {
    return children.map((c) => nodeToJson(c));
  }
  const result: Record<string, unknown> = {};
  const seen: Record<string, number> = {};
  for (const child of children) {
    const tag = child.tagName;
    const val = nodeToJson(child);
    if (seen[tag] !== undefined) {
      if (seen[tag] === 1) {
        const existing = result[tag];
        result[tag] = [existing, val];
      } else {
        (result[tag] as unknown[]).push(val);
      }
      seen[tag] = (seen[tag] || 0) + 1;
    } else {
      result[tag] = val;
      seen[tag] = 1;
    }
  }
  return result;
}

export function JsonXmlConverterTool() {
  const [tab, setTab] = useState<TabValue>("json-to-xml");
  const [jsonInput, setJsonInput] = useState("");
  const [xmlInput, setXmlInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const { copied, handleCopy } = useCopyState();

  const convertJsonToXml = useCallback(() => {
    try {
      const data = JSON.parse(jsonInput);
      const rootKey =
        typeof data === "object" && data !== null && !Array.isArray(data)
          ? Object.keys(data as Record<string, unknown>)[0] || "root"
          : "root";
      let xml: string;
      if (typeof data === "object" && data !== null && !Array.isArray(data)) {
        const entries = Object.entries(data as Record<string, unknown>);
        xml = entries
          .map(([key, val]) => jsonToXml(val, key, ""))
          .join("\n");
      } else {
        xml = jsonToXml(data, rootKey, "");
      }
      setOutput(`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }, [jsonInput]);

  const convertXmlToJson = useCallback(() => {
    try {
      const result = xmlToJson(xmlInput);
      setOutput(JSON.stringify(result, null, 2));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }, [xmlInput]);

  const clear = () => {
    setJsonInput("");
    setXmlInput("");
    setOutput("");
    setError("");
  };

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); setOutput(""); setError(""); }}>
        <TabsList>
          <TabsTrigger value="json-to-xml">JSON → XML</TabsTrigger>
          <TabsTrigger value="xml-to-json">XML → JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="json-to-xml" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">输入 JSON</label>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"person": {"name": "张三", "age": 30, "hobbies": ["阅读", "编程"]}}'
                className="min-h-[250px] font-mono text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={convertJsonToXml} size="sm">
                  <ArrowRightLeft className="h-4 w-4 mr-1" /> 转换
                </Button>
                <Button onClick={clear} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" /> 清空
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">输出 XML</label>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
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
                    <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[250px] overflow-auto custom-scrollbar">
                      {output || "点击转换按钮查看结果"}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="xml-to-json" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">输入 XML</label>
              <Textarea
                value={xmlInput}
                onChange={(e) => setXmlInput(e.target.value)}
                placeholder={`<person>\n  <name>张三</name>\n  <age>30</age>\n</person>`}
                className="min-h-[250px] font-mono text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={convertXmlToJson} size="sm">
                  <ArrowRightLeft className="h-4 w-4 mr-1" /> 转换
                </Button>
                <Button onClick={clear} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" /> 清空
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">输出 JSON</label>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
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
                    <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[250px] overflow-auto custom-scrollbar">
                      {output || "点击转换按钮查看结果"}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
