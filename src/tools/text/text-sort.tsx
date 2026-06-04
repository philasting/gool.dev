"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, ArrowUpDown, ArrowDownUp, Hash, Ruler, Shuffle, FlipHorizontal2, Trash2 } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type SortMode = "asc" | "desc" | "numeric" | "length" | "shuffle" | "reverse";

interface SortOption {
  mode: SortMode;
  label: string;
  icon: React.ReactNode;
}

const SORT_OPTIONS: SortOption[] = [
  { mode: "asc", label: "升序", icon: <ArrowUpDown className="h-4 w-4" /> },
  { mode: "desc", label: "降序", icon: <ArrowDownUp className="h-4 w-4" /> },
  { mode: "numeric", label: "按数字", icon: <Hash className="h-4 w-4" /> },
  { mode: "length", label: "按长度", icon: <Ruler className="h-4 w-4" /> },
  { mode: "shuffle", label: "随机打乱", icon: <Shuffle className="h-4 w-4" /> },
  { mode: "reverse", label: "反转行序", icon: <FlipHorizontal2 className="h-4 w-4" /> },
];

export function TextSortTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("asc");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [deduplicate, setDeduplicate] = useState(false);
  const { copied, handleCopy } = useCopyState();

  const sort = () => {
    let lines = input.split("\n");

    if (deduplicate) {
      if (ignoreCase) {
        const seen = new Set<string>();
        lines = lines.filter((line) => {
          const key = line.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      } else {
        lines = [...new Set(lines)];
      }
    }

    switch (sortMode) {
      case "asc":
        lines.sort((a, b) => {
          const aVal = ignoreCase ? a.toLowerCase() : a;
          const bVal = ignoreCase ? b.toLowerCase() : b;
          return aVal.localeCompare(bVal, "zh-CN");
        });
        break;
      case "desc":
        lines.sort((a, b) => {
          const aVal = ignoreCase ? a.toLowerCase() : a;
          const bVal = ignoreCase ? b.toLowerCase() : b;
          return bVal.localeCompare(aVal, "zh-CN");
        });
        break;
      case "numeric":
        lines.sort((a, b) => {
          const aNum = parseFloat(a.replace(/[^\d.-]/g, "")) || 0;
          const bNum = parseFloat(b.replace(/[^\d.-]/g, "")) || 0;
          return aNum - bNum;
        });
        break;
      case "length":
        lines.sort((a, b) => a.length - b.length);
        break;
      case "shuffle":
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        break;
      case "reverse":
        lines.reverse();
        break;
    }

    setOutput(lines.join("\n"));
  };

  const clear = () => {
    setInput("");
    setOutput("");
  };

  const inputLineCount = useMemo(() => (input ? input.split("\n").length : 0), [input]);
  const outputLineCount = useMemo(() => (output ? output.split("\n").length : 0), [output]);

  return (
    <div className="space-y-4">
      {/* Sort mode */}
      <div className="space-y-2">
        <Label className="text-sm">排序方式</Label>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.mode}
              size="sm"
              variant={sortMode === opt.mode ? "default" : "outline"}
              onClick={() => setSortMode(opt.mode)}
            >
              {opt.icon}
              <span className="ml-1">{opt.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={ignoreCase} onCheckedChange={setIgnoreCase} />
          <Label className="text-sm">忽略大小写</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={deduplicate} onCheckedChange={setDeduplicate} />
          <Label className="text-sm">去重</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">输入文本（{inputLineCount} 行）</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"香蕉\n苹果\n橙子\n葡萄\n西瓜"}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={sort} size="sm">
              排序
            </Button>
            <Button onClick={clear} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">排序结果（{outputLineCount} 行）</label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-3">
              <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-auto custom-scrollbar">
                {output || "点击排序按钮查看结果"}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
