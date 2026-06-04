"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

type StatMode = "word" | "char" | "line";

interface FreqItem {
  text: string;
  count: number;
  percentage: string;
}

export function WordFrequencyTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<StatMode>("word");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const { copied, handleCopy } = useCopyState();

  const frequency = useMemo(() => {
    if (!input.trim()) return [];

    const processed = ignoreCase ? input.toLowerCase() : input;
    let items: string[] = [];

    switch (mode) {
      case "word":
        items = processed.split(/\s+/).filter((w) => w.length > 0);
        break;
      case "char":
        items = processed.split("").filter((c) => c.trim().length > 0);
        break;
      case "line":
        items = processed.split("\n").filter((l) => l.trim().length > 0);
        break;
    }

    const total = items.length;
    const freqMap = new Map<string, number>();
    for (const item of items) {
      freqMap.set(item, (freqMap.get(item) ?? 0) + 1);
    }

    const result: FreqItem[] = [];
    for (const [text, count] of freqMap.entries()) {
      result.push({
        text,
        count,
        percentage: ((count / total) * 100).toFixed(2),
      });
    }

    result.sort((a, b) => b.count - a.count);
    return result;
  }, [input, mode, ignoreCase]);

  const totalCount = useMemo(() => frequency.reduce((sum, item) => sum + item.count, 0), [frequency]);
  const uniqueCount = frequency.length;

  const modeButtons: { value: StatMode; label: string }[] = [
    { value: "word", label: "按词统计" },
    { value: "char", label: "按字统计" },
    { value: "line", label: "按行统计" },
  ];

  const freqText = frequency.map((f) => `${f.text}\t${f.count}\t${f.percentage}%`).join("\n");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">输入文本</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="在此输入文本，统计词频..."
          className="min-h-[150px] text-sm"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {modeButtons.map((btn) => (
            <Button
              key={btn.value}
              size="sm"
              variant={mode === btn.value ? "default" : "outline"}
              onClick={() => setMode(btn.value)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={ignoreCase} onCheckedChange={setIgnoreCase} />
          <Label className="text-sm">忽略大小写</Label>
        </div>
      </div>

      {/* Stats */}
      {frequency.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>总数: <strong className="text-foreground">{totalCount}</strong></span>
          <span>不重复: <strong className="text-foreground">{uniqueCount}</strong></span>
        </div>
      )}

      {/* Frequency table */}
      {frequency.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">词频统计（按频率降序）</h3>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(freqText)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium w-12">#</th>
                    <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">
                      {mode === "word" ? "词" : mode === "char" ? "字" : "行"}
                    </th>
                    <th className="text-right py-2 pr-4 text-xs text-muted-foreground font-medium w-16">次数</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium w-20">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {frequency.slice(0, 200).map((item, i) => (
                    <tr key={item.text} className="border-b border-border last:border-0">
                      <td className="py-1.5 pr-4 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="py-1.5 pr-4 font-mono text-sm">
                        <span
                          className="cursor-pointer hover:text-primary transition-colors"
                          onClick={() => copyToClipboard(item.text)}
                          title="点击复制"
                        >
                          {item.text}
                        </span>
                      </td>
                      <td className="py-1.5 pr-4 text-right font-mono text-sm">{item.count}</td>
                      <td className="py-1.5 text-right font-mono text-xs text-muted-foreground">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {frequency.length > 200 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  仅显示前 200 项，共 {frequency.length} 项
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
