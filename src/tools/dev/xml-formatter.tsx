"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Wand2, Minimize2, CheckCircle, Trash2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/** Format XML with proper indentation using DOMParser + XMLSerializer */
function formatXml(xml: string, indent: number = 2): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    throw new Error(errorNode.textContent || "XML 解析错误");
  }
  const serializer = new XMLSerializer();
  const serialized = serializer.serializeToString(doc);
  return prettyPrintXml(serialized, indent);
}

/** Pretty-print XML string with indentation */
function prettyPrintXml(xml: string, indent: number): string {
  const PADDING = " ".repeat(indent);
  let formatted = "";
  let pad = 0;

  // Normalize self-closing tags first
  const raw = xml.replace(/(>)\s*(<)/g, "$1\n$2").split("\n");

  for (const node of raw) {
    const trimmed = node.trim();
    if (!trimmed) continue;

    // Closing tag
    if (trimmed.match(/^<\/\w/)) {
      pad = Math.max(0, pad - 1);
    }

    formatted += PADDING.repeat(pad) + trimmed + "\n";

    // Opening tag (not self-closing, not closing, not declaration, not comment)
    if (
      trimmed.match(/^<\w([^>]*[^/])?>.*$/) &&
      !trimmed.match(/^<\w[^>]*\/\s*>$/) &&
      !trimmed.startsWith("<?") &&
      !trimmed.startsWith("<!") &&
      !trimmed.match(/^<\w[^>]*>.*<\/\w[^>]*>$/)
    ) {
      pad++;
    }

    // Self-closing tag doesn't increase indent
  }

  return formatted.trim();
}

/** Compress XML — remove whitespace between tags */
function compressXml(xml: string): string {
  return xml
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Validate XML using DOMParser */
function validateXml(xml: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    return errorNode.textContent || "XML 格式无效";
  }
  return null;
}

export function XmlFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const { copied, handleCopy } = useCopyState();

  const handleFormat = () => {
    if (!input.trim()) return;
    try {
      const result = formatXml(input, 2);
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
      const validationError = validateXml(input);
      if (validationError) {
        setError(validationError);
        setOutput("");
        return;
      }
      const result = compressXml(input);
      setOutput(result);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const handleValidate = () => {
    if (!input.trim()) return;
    const validationError = validateXml(input);
    if (validationError) {
      setError(validationError);
      setOutput("");
    } else {
      setError("");
      setOutput("✅ XML 格式正确");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const onCopyOutput = () => {
    if (!output || output.startsWith("✅")) return;
    handleCopy(output);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">输入 XML</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'<root>\n  <item>内容</item>\n</root>'}
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleFormat} size="sm">
              <Wand2 className="h-4 w-4 mr-1" /> 格式化
            </Button>
            <Button onClick={handleCompress} variant="secondary" size="sm">
              <Minimize2 className="h-4 w-4 mr-1" /> 压缩
            </Button>
            <Button onClick={handleValidate} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-1" /> 校验
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
              disabled={!output || output.startsWith("✅")}
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
