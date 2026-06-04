"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Check, Trash2, FileText } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

export function TextRemoveBlankLinesTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [keepSingleBlank, setKeepSingleBlank] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);
  const { copied, handleCopy } = useCopyState();

  const handleProcess = () => {
    if (!input) return;
    const lines = input.split("\n");
    const totalLines = lines.length;

    let result: string[];
    if (keepSingleBlank) {
      // Merge consecutive blank lines into one
      result = [];
      let prevBlank = false;
      for (const line of lines) {
        const isBlank = line.trim() === "";
        if (isBlank) {
          if (!prevBlank) {
            result.push(line);
          }
          prevBlank = true;
        } else {
          result.push(line);
          prevBlank = false;
        }
      }
    } else {
      // Remove all blank lines
      result = lines.filter((line) => line.trim() !== "");
    }

    setOutput(result.join("\n"));
    setRemovedCount(totalLines - result.length);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setRemovedCount(0);
  };

  const onCopyOutput = () => {
    if (!output) return;
    handleCopy(output);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="keep-single"
            checked={keepSingleBlank}
            onCheckedChange={setKeepSingleBlank}
          />
          <Label htmlFor="keep-single" className="text-sm cursor-pointer">
            保留单个空行（合并连续空行）
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">输入文本</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"第一行\n\n\n第二行\n\n\n\n第三行"}
            className="min-h-[300px] text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleProcess} size="sm">
              <FileText className="h-4 w-4 mr-1" /> 处理
            </Button>
            <Button onClick={handleClear} variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">输出结果</label>
              {removedCount > 0 && (
                <Badge variant="secondary">移除了 {removedCount} 行</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onCopyOutput} disabled={!output}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Textarea
            value={output}
            readOnly
            className="min-h-[300px] text-sm"
            placeholder="点击处理按钮查看结果"
          />
        </div>
      </div>
    </div>
  );
}
