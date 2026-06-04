"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

function applyBionicReading(text: string, boldRatio: number): string {
  const words = text.split(/(\s+)/);
  return words
    .map((segment) => {
      if (/^\s+$/.test(segment)) return segment;
      if (!segment.trim()) return segment;

      const chars = Array.from(segment);
      const lettersOnly = chars.filter((c) => /[a-zA-Z\u4e00-\u9fa5]/.test(c));

      if (lettersOnly.length <= 1) {
        return `<strong>${segment}</strong>`;
      }

      const boldCount = Math.max(1, Math.ceil(lettersOnly.length * boldRatio));
      let letterIdx = 0;
      let result = "";
      let inBold = false;

      for (const char of chars) {
        const isLetter = /[a-zA-Z\u4e00-\u9fa5]/.test(char);
        if (isLetter) {
          if (letterIdx < boldCount && !inBold) {
            result += "<strong>";
            inBold = true;
          }
          result += char;
          letterIdx++;
          if (letterIdx >= boldCount && inBold) {
            result += "</strong>";
            inBold = false;
          }
        } else {
          if (inBold) {
            result += "</strong>";
            inBold = false;
          }
          result += char;
        }
      }

      if (inBold) {
        result += "</strong>";
      }

      return result;
    })
    .join("");
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

export function BionicReadingTool() {
  const [input, setInput] = useState("");
  const [boldRatio, setBoldRatio] = useState(0.5);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showComparison, setShowComparison] = useState(true);
  const { copied, handleCopy } = useCopyState();

  const bionicHtml = useMemo(() => {
    if (!input.trim()) return "";
    return applyBionicReading(input, boldRatio);
  }, [input, boldRatio]);

  const handleCopyResult = () => {
    if (!bionicHtml) return;
    const plainText = stripHtmlTags(bionicHtml);
    handleCopy(plainText);
  };

  const handleCopyHtml = () => {
    if (!bionicHtml) return;
    handleCopy(bionicHtml);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入文本</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入需要使用仿生阅读的文本...&#10;&#10;Bionic Reading 是一种通过加粗词首部分来引导视线、提升阅读速度的方法。试试看效果吧！"
          className="min-h-[120px] text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">加粗比例: {Math.round(boldRatio * 100)}%</Label>
          <Slider
            value={[boldRatio * 100]}
            onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setBoldRatio(val / 100); }}
            min={30}
            max={60}
            step={5}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30%</span>
            <span>60%</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">字体大小: {fontSize}px</Label>
          <Slider
            value={[fontSize]}
            onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setFontSize(val); }}
            min={14}
            max={28}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>14px</span>
            <span>28px</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">行高: {lineHeight.toFixed(1)}</Label>
          <Slider
            value={[lineHeight * 10]}
            onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setLineHeight(val / 10); }}
            min={12}
            max={30}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1.2</span>
            <span>3.0</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={showComparison ? "default" : "outline"}
          size="sm"
          onClick={() => setShowComparison(!showComparison)}
        >
          对比视图
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyResult} disabled={!bionicHtml}>
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          复制纯文本
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyHtml} disabled={!bionicHtml}>
          复制 HTML
        </Button>
      </div>

      {bionicHtml && (
        <div className={showComparison ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}>
          {showComparison && (
            <Card>
              <CardContent className="p-4">
                <Badge variant="outline" className="mb-2">原文</Badge>
                <div
                  style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}` }}
                  className="whitespace-pre-wrap break-words"
                >
                  {input}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-4">
              <Badge variant="secondary" className="mb-2">仿生阅读</Badge>
              <div
                style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}` }}
                className="whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: bionicHtml }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {!input && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Bionic Reading 通过加粗单词的前半部分来引导视线移动，帮助大脑更快地完成阅读。
              输入文本即可体验效果。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
