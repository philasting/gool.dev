"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";
import { s2t, t2s } from "./_opencc";

export function SimplifiedTraditionalTool() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<"s2t" | "t2s">("s2t");
  const { copied, handleCopy } = useCopyState();

  const output = useMemo(
    () => (direction === "s2t" ? s2t(input) : t2s(input)),
    [input, direction]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={direction === "s2t" ? "default" : "outline"}
          size="sm"
          onClick={() => setDirection("s2t")}
        >
          简体 → 繁体
        </Button>
        <Button
          variant={direction === "t2s" ? "default" : "outline"}
          size="sm"
          onClick={() => setDirection("t2s")}
        >
          繁体 → 简体
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>输入文本</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === "s2t" ? "输入简体中文..." : "输入繁体中文..."}
            className="min-h-[200px] text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>转换结果</Label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(output)} disabled={!output}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Textarea value={output} readOnly className="min-h-[200px] text-sm" />
        </div>
      </div>
    </div>
  );
}
