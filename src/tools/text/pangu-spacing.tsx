"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Copy, Check, Space } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

/**
 * Apply Pangu Spacing (盘古之白):
 * - Add space between CJK characters and Latin/number characters
 * - Do not add space if one already exists
 * - Do not add space between CJK and full-width punctuation
 * - Do not add space between CJK and half-width punctuation
 */
function applyPanguSpacing(text: string): string {
  // Chinese character followed by a letter or digit
  let result = text.replace(
    /([\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff])([a-zA-Z0-9])/g,
    "$1 $2"
  );
  // Letter or digit followed by Chinese character
  result = result.replace(
    /([a-zA-Z0-9])([\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff])/g,
    "$1 $2"
  );
  return result;
}

export function PanguSpacingTool() {
  const [inputText, setInputText] = useState("");
  const { copied, handleCopy } = useCopyState();

  const outputText = useMemo(() => {
    if (!inputText) return "";
    return applyPanguSpacing(inputText);
  }, [inputText]);

  const diffCount = useMemo(() => {
    if (!inputText || !outputText) return 0;
    return outputText.length - inputText.length;
  }, [inputText, outputText]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入文本</Label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="粘贴或输入中英文混排文本，如：我们正在学习JavaScript编程语言"
          rows={5}
          className="resize-y"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleCopy(outputText)}
          disabled={!outputText}
        >
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? "已复制" : "复制结果"}
        </Button>
        {diffCount > 0 && (
          <span className="text-xs text-muted-foreground">
            新增了 {diffCount} 个空格
          </span>
        )}
      </div>

      {outputText && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-2 block">排版结果</Label>
            <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed break-all">
              {outputText}
            </div>
          </CardContent>
        </Card>
      )}

      {!outputText && (
        <div className="text-center text-muted-foreground py-8">
          <Space className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">粘贴中英文混排文本，自动在中文与英文/数字间添加空格</p>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-2">
          <Label className="text-sm font-medium">排版规则</Label>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>中文与英文字母之间自动加空格</li>
            <li>中文与数字之间自动加空格</li>
            <li>已有空格不重复添加</li>
            <li>全角标点与英文之间不加空格</li>
            <li>中文与半角符号之间不加空格</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
