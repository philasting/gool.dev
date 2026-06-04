"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ArrowRightLeft, Trash2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/** URL escape：将特殊字符转为 %XX 格式 */
function urlEscape(text: string): string {
  return encodeURIComponent(text);
}

/** URL unescape：将 %XX 还原 */
function urlUnescape(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return "无效的编码格式";
  }
}

/** HTML 实体转义 */
function htmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** HTML 实体反转义 */
function htmlUnescape(text: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

export function EscapeUnescapeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { copied, handleCopy } = useCopyState();

  const handleUrlEscape = () => {
    if (!input) return;
    setOutput(urlEscape(input));
  };

  const handleUrlUnescape = () => {
    if (!input) return;
    setOutput(urlUnescape(input));
  };

  const handleHtmlEscape = () => {
    if (!input) return;
    setOutput(htmlEscape(input));
  };

  const handleHtmlUnescape = () => {
    if (!input) return;
    setOutput(htmlUnescape(input));
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入文本</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要转换的文本..."
          className="min-h-[120px] font-mono text-sm"
        />
      </div>

      <Tabs defaultValue="url">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">URL 编码</TabsTrigger>
          <TabsTrigger value="html">HTML 实体</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleUrlEscape} size="sm" disabled={!input}>
              Escape
            </Button>
            <Button onClick={handleUrlUnescape} size="sm" variant="secondary" disabled={!input}>
              Unescape
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="html" className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleHtmlEscape} size="sm" disabled={!input}>
              转义
            </Button>
            <Button onClick={handleHtmlUnescape} size="sm" variant="secondary" disabled={!input}>
              反转义
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {output && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <code className="text-sm font-mono break-all whitespace-pre-wrap flex-1">
                {output}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleCopy(output)}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
