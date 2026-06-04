"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, ArrowRightLeft, Trash2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/** Halfwidth to fullwidth mapping for punctuation */
const HALF_FULL_PUNCTUATION: Record<string, string> = {
  ",": "，",
  ".": "。",
  "!": "！",
  "?": "？",
  ":": "：",
  ";": "；",
  "(": "（",
  ")": "）",
  "[": "【",
  "]": "】",
  "{": "｛",
  "}": "｝",
  "<": "＜",
  ">": "＞",
  '"': "＂",
  "'": "＇",
  "/": "／",
  "\\": "＼",
  "@": "＠",
  "#": "＃",
  "$": "＄",
  "%": "％",
  "^": "＾",
  "&": "＆",
  "*": "＊",
  "+": "＋",
  "-": "－",
  "=": "＝",
  "~": "～",
  "`": "｀",
  "|": "｜",
  "_": "＿",
  " ": "\u3000",
};

/** Fullwidth to halfwidth mapping (reverse of above) */
const FULL_HALF_PUNCTUATION: Record<string, string> = {};
for (const [k, v] of Object.entries(HALF_FULL_PUNCTUATION)) {
  FULL_HALF_PUNCTUATION[v] = k;
}

function halfToFull(text: string): string {
  return text
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      // Halfwidth ASCII letters A-Z
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(code + 65248);
      }
      // Halfwidth ASCII digits 0-9
      if (code >= 48 && code <= 57) {
        return String.fromCharCode(code + 65248);
      }
      // Halfwidth ASCII a-z
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(code + 65248);
      }
      // Punctuation mapping
      if (HALF_FULL_PUNCTUATION[ch]) {
        return HALF_FULL_PUNCTUATION[ch];
      }
      return ch;
    })
    .join("");
}

function fullToHalf(text: string): string {
  return text
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      // Fullwidth letters and digits (FF01-FF5E → 0021-007E)
      if (code >= 0xff01 && code <= 0xff5e) {
        return String.fromCharCode(code - 65248);
      }
      // Punctuation mapping
      if (FULL_HALF_PUNCTUATION[ch]) {
        return FULL_HALF_PUNCTUATION[ch];
      }
      return ch;
    })
    .join("");
}

export function FullwidthHalfwidthTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { copied: copiedState, handleCopy: handleCopyFn } = useCopyState();

  const handleConvert = useCallback(
    (mode: "half2full" | "full2half") => {
      if (!input) return;
      const result = mode === "half2full" ? halfToFull(input) : fullToHalf(input);
      setOutput(result);
    },
    [input]
  );

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="half2full">
        <TabsList>
          <TabsTrigger value="half2full">半角 → 全角</TabsTrigger>
          <TabsTrigger value="full2half">全角 → 半角</TabsTrigger>
        </TabsList>

        <TabsContent value="half2full" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>输入文本（半角）</Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入半角字符，如: Hello 123 !@#"
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleConvert("half2full")} disabled={!input}>
              <ArrowRightLeft className="h-4 w-4 mr-1" /> 转换为全角
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
          <div className="space-y-2">
            <Label>转换结果（全角）</Label>
            <div className="relative">
              <Textarea
                value={output}
                readOnly
                placeholder="全角结果将显示在这里..."
                className="min-h-[120px] font-mono text-sm pr-10"
              />
              {output && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => handleCopyFn(output)}
                >
                  {copiedState ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="full2half" className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>输入文本（全角）</Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入全角字符，如：Ｈｅｌｌｏ　１２３　！＠＃"
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleConvert("full2half")} disabled={!input}>
              <ArrowRightLeft className="h-4 w-4 mr-1" /> 转换为半角
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
          <div className="space-y-2">
            <Label>转换结果（半角）</Label>
            <div className="relative">
              <Textarea
                value={output}
                readOnly
                placeholder="半角结果将显示在这里..."
                className="min-h-[120px] font-mono text-sm pr-10"
              />
              {output && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => handleCopyFn(output)}
                >
                  {copiedState ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">
            支持转换：英文字母（A-Z, a-z）、数字（0-9）、常见标点符号（,.!?()[]等）及空格。
            半角空格转换为全角空格（U+3000）。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
