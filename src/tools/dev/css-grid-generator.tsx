"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface TrackConfig {
  id: string;
  size: string; // e.g. "1fr", "100px", "auto"
  label: string;
}

let trackIdCounter = 0;
function nextTrackId(): string {
  trackIdCounter += 1;
  return `track-${trackIdCounter}`;
}

export function CssGridGeneratorTool() {
  const [rows, setRows] = useState<TrackConfig[]>([
    { id: nextTrackId(), size: "1fr", label: "行1" },
    { id: nextTrackId(), size: "1fr", label: "行2" },
  ]);
  const [cols, setCols] = useState<TrackConfig[]>([
    { id: nextTrackId(), size: "1fr", label: "列1" },
    { id: nextTrackId(), size: "1fr", label: "列2" },
    { id: nextTrackId(), size: "1fr", label: "列3" },
  ]);
  const [gap, setGap] = useState(8);
  const { copied, handleCopy } = useCopyState();

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: nextTrackId(), size: "1fr", label: `行${prev.length + 1}` },
    ]);
  };

  const addCol = () => {
    setCols((prev) => [
      ...prev,
      { id: nextTrackId(), size: "1fr", label: `列${prev.length + 1}` },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const removeCol = (id: string) => {
    setCols((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.id !== id)));
  };

  const updateRowSize = (id: string, size: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, size } : r)));
  };

  const updateColSize = (id: string, size: string) => {
    setCols((prev) => prev.map((c) => (c.id === id ? { ...c, size } : c)));
  };

  const parseSize = (size: string): string => {
    const trimmed = size.trim();
    if (trimmed === "auto") return "auto";
    if (trimmed.endsWith("fr")) return trimmed;
    if (trimmed.endsWith("px")) return trimmed;
    if (trimmed.endsWith("%")) return trimmed;
    if (trimmed.endsWith("em")) return trimmed;
    if (trimmed.endsWith("rem")) return trimmed;
    if (/^\d+$/.test(trimmed)) return `${trimmed}px`;
    return trimmed || "1fr";
  };

  const cssCode = useMemo(() => {
    const rowSizes = rows.map((r) => parseSize(r.size)).join(" ");
    const colSizes = cols.map((c) => parseSize(c.size)).join(" ");
    const lines = [
      `display: grid;`,
      `grid-template-rows: ${rowSizes};`,
      `grid-template-columns: ${colSizes};`,
      `gap: ${gap}px;`,
    ];
    return lines.join("\n");
  }, [rows, cols, gap]);

  const previewStyle = useMemo(() => {
    const rowSizes = rows.map((r) => parseSize(r.size)).join(" ");
    const colSizes = cols.map((c) => parseSize(c.size)).join(" ");
    return {
      display: "grid",
      gridTemplateRows: rowSizes,
      gridTemplateColumns: colSizes,
      gap: `${gap}px`,
    } as React.CSSProperties;
  }, [rows, cols, gap]);

  const cellCount = rows.length * cols.length;

  return (
    <div className="space-y-4">
      {/* Preview */}
      <Card>
        <CardContent className="p-4">
          <div style={previewStyle} className="min-h-[200px]">
            {Array.from({ length: cellCount }, (_, i) => (
              <div
                key={i}
                className="rounded border border-primary/30 bg-primary/5 flex items-center justify-center text-xs text-muted-foreground min-h-[40px]"
              >
                {Math.floor(i / cols.length) + 1}-{(i % cols.length) + 1}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rows */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">行 (Rows)</Label>
            <Button size="sm" variant="outline" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" /> 添加行
            </Button>
          </div>
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8 shrink-0">{row.label}</span>
              <Input
                value={row.size}
                onChange={(e) => updateRowSize(row.id, e.target.value)}
                className="font-mono text-xs h-8"
                placeholder="1fr / 100px / auto"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeRow(row.id)}
                disabled={rows.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Columns */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">列 (Columns)</Label>
            <Button size="sm" variant="outline" onClick={addCol}>
              <Plus className="h-4 w-4 mr-1" /> 添加列
            </Button>
          </div>
          {cols.map((col) => (
            <div key={col.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8 shrink-0">{col.label}</span>
              <Input
                value={col.size}
                onChange={(e) => updateColSize(col.id, e.target.value)}
                className="font-mono text-xs h-8"
                placeholder="1fr / 100px / auto"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeCol(col.id)}
                disabled={cols.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Gap */}
      <div className="space-y-2">
        <Label className="text-sm">间距 (Gap): {gap}px</Label>
        <Slider
          value={[gap]}
          onValueChange={(v) => { if (typeof v !== "number") setGap(v[0]); }}
          min={0}
          max={48}
          step={2}
        />
      </div>

      {/* CSS Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">CSS 代码</Label>
          <Button variant="ghost" size="sm" onClick={() => handleCopy(cssCode)}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "已复制" : "复制"}
          </Button>
        </div>
        <Card>
          <CardContent className="p-3">
            <pre className="text-sm font-mono whitespace-pre-wrap break-all">{cssCode}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
