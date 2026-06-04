"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitCompare, Trash2 } from "lucide-react";

interface DiffEntry {
  path: string;
  type: "added" | "removed" | "modified" | "unchanged";
  oldValue?: unknown;
  newValue?: unknown;
}

/** 递归对比两个 JSON 对象 */
function diffObjects(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
  path: string = ""
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const inLeft = key in obj1;
    const inRight = key in obj2;

    if (inLeft && !inRight) {
      entries.push({ path: currentPath, type: "removed", oldValue: obj1[key] });
    } else if (!inLeft && inRight) {
      entries.push({ path: currentPath, type: "added", newValue: obj2[key] });
    } else {
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (val1 === val2) {
        entries.push({ path: currentPath, type: "unchanged", oldValue: val1 });
      } else if (typeof val1 === "object" && val1 !== null && !Array.isArray(val1) &&
                 typeof val2 === "object" && val2 !== null && !Array.isArray(val2)) {
        entries.push(...diffObjects(
          val1 as Record<string, unknown>,
          val2 as Record<string, unknown>,
          currentPath
        ));
      } else {
        entries.push({
          path: currentPath,
          type: "modified",
          oldValue: val1,
          newValue: val2,
        });
      }
    }
  }

  return entries;
}

function getTypeColor(type: DiffEntry["type"]): string {
  switch (type) {
    case "added": return "text-green-600 dark:text-green-400";
    case "removed": return "text-red-600 dark:text-red-400";
    case "modified": return "text-yellow-600 dark:text-yellow-400";
    case "unchanged": return "text-muted-foreground";
  }
}

function getTypeBg(type: DiffEntry["type"]): string {
  switch (type) {
    case "added": return "bg-green-50 dark:bg-green-950/30";
    case "removed": return "bg-red-50 dark:bg-red-950/30";
    case "modified": return "bg-yellow-50 dark:bg-yellow-950/30";
    case "unchanged": return "";
  }
}

function getTypeLabel(type: DiffEntry["type"]): string {
  switch (type) {
    case "added": return "新增";
    case "removed": return "删除";
    case "modified": return "修改";
    case "unchanged": return "未变";
  }
}

function formatValue(val: unknown): string {
  if (typeof val === "string") return `"${val}"`;
  if (val === null) return "null";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

export function JsonDiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [diffs, setDiffs] = useState<DiffEntry[]>([]);
  const [error, setError] = useState("");
  const [showUnchanged, setShowUnchanged] = useState(false);

  const handleCompare = () => {
    setError("");
    setDiffs([]);
    try {
      const parsedLeft = JSON.parse(left || "{}");
      const parsedRight = JSON.parse(right || "{}");

      if (typeof parsedLeft !== "object" || parsedLeft === null || Array.isArray(parsedLeft)) {
        setError("左侧 JSON 必须是对象");
        return;
      }
      if (typeof parsedRight !== "object" || parsedRight === null || Array.isArray(parsedRight)) {
        setError("右侧 JSON 必须是对象");
        return;
      }

      const result = diffObjects(
        parsedLeft as Record<string, unknown>,
        parsedRight as Record<string, unknown>
      );
      setDiffs(result);
    } catch (e) {
      setError(`JSON 解析失败：${(e as Error).message}`);
    }
  };

  const handleClear = () => {
    setLeft("");
    setRight("");
    setDiffs([]);
    setError("");
  };

  const filteredDiffs = showUnchanged
    ? diffs
    : diffs.filter((d) => d.type !== "unchanged");

  const stats = {
    added: diffs.filter((d) => d.type === "added").length,
    removed: diffs.filter((d) => d.type === "removed").length,
    modified: diffs.filter((d) => d.type === "modified").length,
    unchanged: diffs.filter((d) => d.type === "unchanged").length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>原始 JSON</Label>
          <Textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder='{"name": "张三", "age": 25}'
            className="min-h-[150px] font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label>对比 JSON</Label>
          <Textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder='{"name": "李四", "age": 25, "email": "li@example.com"}'
            className="min-h-[150px] font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleCompare} size="sm" disabled={!left && !right}>
          <GitCompare className="h-4 w-4 mr-1" /> 对比
        </Button>
        <Button onClick={handleClear} variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-1" /> 清空
        </Button>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showUnchanged}
            onChange={(e) => setShowUnchanged(e.target.checked)}
            className="rounded"
          />
          显示未变化项
        </label>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {diffs.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-4 text-xs">
            <span className="text-green-600 dark:text-green-400">+ 新增: {stats.added}</span>
            <span className="text-red-600 dark:text-red-400">- 删除: {stats.removed}</span>
            <span className="text-yellow-600 dark:text-yellow-400">~ 修改: {stats.modified}</span>
            <span className="text-muted-foreground">= 未变: {stats.unchanged}</span>
          </div>

          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filteredDiffs.map((diff, i) => (
              <Card key={i} className={getTypeBg(diff.type)}>
                <CardContent className="p-2 flex items-center gap-2 text-xs font-mono">
                  <span className={`font-semibold w-10 shrink-0 ${getTypeColor(diff.type)}`}>
                    {getTypeLabel(diff.type)}
                  </span>
                  <span className="font-medium break-all">{diff.path}</span>
                  {diff.type === "modified" && (
                    <span className="text-muted-foreground">
                      : {formatValue(diff.oldValue)} → {formatValue(diff.newValue)}
                    </span>
                  )}
                  {diff.type === "added" && (
                    <span className="text-green-600 dark:text-green-400">
                      : {formatValue(diff.newValue)}
                    </span>
                  )}
                  {diff.type === "removed" && (
                    <span className="text-red-600 dark:text-red-400">
                      : {formatValue(diff.oldValue)}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
