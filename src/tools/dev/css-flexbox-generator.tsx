"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface FlexItem {
  id: string;
  grow: number;
  shrink: number;
  basis: string;
  label: string;
}

type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
type JustifyContent = "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
type AlignItems = "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
type AlignContent = "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "stretch";

let itemIdCounter = 0;
function nextItemId(): string {
  itemIdCounter += 1;
  return `item-${itemIdCounter}`;
}

export function CssFlexboxGeneratorTool() {
  const [direction, setDirection] = useState<FlexDirection>("row");
  const [wrap, setWrap] = useState<FlexWrap>("nowrap");
  const [justifyContent, setJustifyContent] = useState<JustifyContent>("flex-start");
  const [alignItems, setAlignItems] = useState<AlignItems>("stretch");
  const [alignContent, setAlignContent] = useState<AlignContent>("stretch");
  const [gap, setGap] = useState(8);
  const [items, setItems] = useState<FlexItem[]>([
    { id: nextItemId(), grow: 0, shrink: 1, basis: "auto", label: "1" },
    { id: nextItemId(), grow: 0, shrink: 1, basis: "auto", label: "2" },
    { id: nextItemId(), grow: 0, shrink: 1, basis: "auto", label: "3" },
  ]);
  const { copied, handleCopy } = useCopyState();

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: nextItemId(), grow: 0, shrink: 1, basis: "auto", label: `${prev.length + 1}` },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.id !== id)));
  };

  const updateItem = (id: string, field: keyof FlexItem, value: number | string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const cssCode = useMemo(() => {
    const lines = [
      `display: flex;`,
      `flex-direction: ${direction};`,
      `flex-wrap: ${wrap};`,
      `justify-content: ${justifyContent};`,
      `align-items: ${alignItems};`,
      `align-content: ${alignContent};`,
      `gap: ${gap}px;`,
    ];
    items.forEach((item, idx) => {
      if (item.grow !== 0 || item.shrink !== 1 || item.basis !== "auto") {
        lines.push(`/* Item ${idx + 1} */`);
        lines.push(`flex: ${item.grow} ${item.shrink} ${item.basis};`);
      }
    });
    return lines.join("\n");
  }, [direction, wrap, justifyContent, alignItems, alignContent, gap, items]);

  const previewStyle = useMemo(
    () =>
      ({
        display: "flex",
        flexDirection: direction,
        flexWrap: wrap,
        justifyContent,
        alignItems,
        alignContent,
        gap: `${gap}px`,
      }) as React.CSSProperties,
    [direction, wrap, justifyContent, alignItems, alignContent, gap]
  );

  const optionButton = <T extends string>(current: T, value: T, setter: (v: T) => void, label: string) => (
    <Button
      key={value}
      size="sm"
      variant={current === value ? "default" : "outline"}
      onClick={() => setter(value)}
      className="text-xs"
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* Preview */}
      <Card>
        <CardContent className="p-4">
          <div style={previewStyle} className="min-h-[160px] border border-dashed border-border rounded-lg p-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-xs text-primary font-mono min-w-[50px] min-h-[40px] px-3 py-2"
                style={{
                  flex: `${item.grow} ${item.shrink} ${item.basis}`,
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {/* Direction */}
          <div className="space-y-1">
            <Label className="text-sm">flex-direction</Label>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["row", "row"],
                  ["row-reverse", "row-reverse"],
                  ["column", "column"],
                  ["column-reverse", "column-reverse"],
                ] as const
              ).map(([val, label]) => optionButton(direction, val, setDirection, label))}
            </div>
          </div>

          {/* Wrap */}
          <div className="space-y-1">
            <Label className="text-sm">flex-wrap</Label>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["nowrap", "nowrap"],
                  ["wrap", "wrap"],
                  ["wrap-reverse", "wrap-reverse"],
                ] as const
              ).map(([val, label]) => optionButton(wrap, val, setWrap, label))}
            </div>
          </div>

          {/* Justify Content */}
          <div className="space-y-1">
            <Label className="text-sm">justify-content</Label>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["flex-start", "flex-start"],
                  ["flex-end", "flex-end"],
                  ["center", "center"],
                  ["space-between", "space-between"],
                  ["space-around", "space-around"],
                  ["space-evenly", "space-evenly"],
                ] as const
              ).map(([val, label]) => optionButton(justifyContent, val, setJustifyContent, label))}
            </div>
          </div>

          {/* Align Items */}
          <div className="space-y-1">
            <Label className="text-sm">align-items</Label>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["flex-start", "flex-start"],
                  ["flex-end", "flex-end"],
                  ["center", "center"],
                  ["stretch", "stretch"],
                  ["baseline", "baseline"],
                ] as const
              ).map(([val, label]) => optionButton(alignItems, val, setAlignItems, label))}
            </div>
          </div>

          {/* Align Content */}
          <div className="space-y-1">
            <Label className="text-sm">align-content</Label>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["flex-start", "flex-start"],
                  ["flex-end", "flex-end"],
                  ["center", "center"],
                  ["space-between", "space-between"],
                  ["space-around", "space-around"],
                  ["stretch", "stretch"],
                ] as const
              ).map(([val, label]) => optionButton(alignContent, val, setAlignContent, label))}
            </div>
          </div>

          {/* Gap */}
          <div className="space-y-1">
            <Label className="text-sm">gap: {gap}px</Label>
            <Slider value={[gap]} onValueChange={(v: number | readonly number[]) => { const val = Array.isArray(v) ? v[0] : v; setGap(typeof val === "number" ? val : 0); }} min={0} max={48} step={2} />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">子项设置</Label>
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> 添加子项
            </Button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-auto custom-scrollbar">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Item {item.label}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">grow</Label>
                      <Input
                        type="number"
                        min={0}
                        value={item.grow}
                        onChange={(e) => updateItem(item.id, "grow", Number(e.target.value))}
                        className="font-mono text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">shrink</Label>
                      <Input
                        type="number"
                        min={0}
                        value={item.shrink}
                        onChange={(e) => updateItem(item.id, "shrink", Number(e.target.value))}
                        className="font-mono text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">basis</Label>
                      <Input
                        value={item.basis}
                        onChange={(e) => updateItem(item.id, "basis", e.target.value)}
                        className="font-mono text-xs h-8"
                        placeholder="auto/100px"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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
