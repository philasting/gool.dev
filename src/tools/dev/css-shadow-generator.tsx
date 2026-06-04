"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface ShadowLayer {
  id: string;
  xOffset: number;
  yOffset: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

type ShadowMode = "box-shadow" | "text-shadow";

let layerIdCounter = 0;
function nextLayerId(): string {
  layerIdCounter += 1;
  return `layer-${layerIdCounter}`;
}

export function CssShadowGeneratorTool() {
  const [mode, setMode] = useState<ShadowMode>("box-shadow");
  const [layers, setLayers] = useState<ShadowLayer[]>([
    {
      id: nextLayerId(),
      xOffset: 4,
      yOffset: 4,
      blur: 10,
      spread: 0,
      color: "#000000",
      opacity: 25,
      inset: false,
    },
  ]);
  const { copied, handleCopy } = useCopyState();

  const addLayer = useCallback(() => {
    setLayers((prev) => [
      ...prev,
      {
        id: nextLayerId(),
        xOffset: 4,
        yOffset: 4,
        blur: 10,
        spread: 0,
        color: "#000000",
        opacity: 25,
        inset: false,
      },
    ]);
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const updateLayer = useCallback(
    (id: string, field: keyof ShadowLayer, value: number | string | boolean) => {
      setLayers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
      );
    },
    []
  );

  const cssCode = useMemo(() => {
    if (mode === "text-shadow") {
      const shadows = layers
        .map((l) => {
          const alpha = Math.round((l.opacity / 100) * 255)
            .toString(16)
            .padStart(2, "0");
          return `${l.xOffset}px ${l.yOffset}px ${l.blur}px ${l.color}${alpha}`;
        })
        .join(", ");
      return `text-shadow: ${shadows};`;
    }
    const shadows = layers
      .map((l) => {
        const alpha = Math.round((l.opacity / 100) * 255)
          .toString(16)
          .padStart(2, "0");
        const insetStr = l.inset ? "inset " : "";
        return `${insetStr}${l.xOffset}px ${l.yOffset}px ${l.blur}px ${l.spread}px ${l.color}${alpha}`;
      })
      .join(", ");
    return `box-shadow: ${shadows};`;
  }, [mode, layers]);

  const previewStyle = useMemo(() => {
    if (mode === "text-shadow") {
      const shadows = layers
        .map((l) => {
          const alpha = Math.round((l.opacity / 100) * 255)
            .toString(16)
            .padStart(2, "0");
          return `${l.xOffset}px ${l.yOffset}px ${l.blur}px ${l.color}${alpha}`;
        })
        .join(", ");
      return { textShadow: shadows };
    }
    const shadows = layers
      .map((l) => {
        const alpha = Math.round((l.opacity / 100) * 255)
          .toString(16)
          .padStart(2, "0");
        const insetStr = l.inset ? "inset " : "";
        return `${insetStr}${l.xOffset}px ${l.yOffset}px ${l.blur}px ${l.spread}px ${l.color}${alpha}`;
      })
      .join(", ");
    return { boxShadow: shadows };
  }, [mode, layers]);

  return (
    <div className="space-y-4">
      {/* Preview */}
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          {mode === "box-shadow" ? (
            <div
              className="w-40 h-40 rounded-xl bg-white dark:bg-zinc-800 border border-border"
              style={previewStyle}
            />
          ) : (
            <p
              className="text-4xl font-bold text-foreground"
              style={previewStyle}
            >
              文字阴影预览
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mode selector */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={mode === "box-shadow" ? "default" : "outline"}
          onClick={() => setMode("box-shadow")}
        >
          Box Shadow
        </Button>
        <Button
          size="sm"
          variant={mode === "text-shadow" ? "default" : "outline"}
          onClick={() => setMode("text-shadow")}
        >
          Text Shadow
        </Button>
      </div>

      {/* Layers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">阴影层</Label>
          <Button size="sm" variant="outline" onClick={addLayer}>
            <Plus className="h-4 w-4 mr-1" /> 添加阴影层
          </Button>
        </div>
        {layers.map((layer) => (
          <Card key={layer.id}>
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  阴影层 {layers.indexOf(layer) + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeLayer(layer.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">X 偏移: {layer.xOffset}px</Label>
                  <Slider
                    value={[layer.xOffset]}
                    onValueChange={(v) => { if (typeof v !== "number") updateLayer(layer.id, "xOffset", v[0]); }}
                    min={-50}
                    max={50}
                    step={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Y 偏移: {layer.yOffset}px</Label>
                  <Slider
                    value={[layer.yOffset]}
                    onValueChange={(v) => { if (typeof v !== "number") updateLayer(layer.id, "yOffset", v[0]); }}
                    min={-50}
                    max={50}
                    step={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">模糊半径: {layer.blur}px</Label>
                  <Slider
                    value={[layer.blur]}
                    onValueChange={(v) => { if (typeof v !== "number") updateLayer(layer.id, "blur", v[0]); }}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">扩展半径: {layer.spread}px</Label>
                  <Slider
                    value={[layer.spread]}
                    onValueChange={(v) => { if (typeof v !== "number") updateLayer(layer.id, "spread", v[0]); }}
                    min={-50}
                    max={50}
                    step={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">透明度: {layer.opacity}%</Label>
                  <Slider
                    value={[layer.opacity]}
                    onValueChange={(v) => { if (typeof v !== "number") updateLayer(layer.id, "opacity", v[0]); }}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">颜色</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={layer.color}
                      onChange={(e) => updateLayer(layer.id, "color", e.target.value)}
                      className="h-8 w-8 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={layer.color}
                      onChange={(e) => updateLayer(layer.id, "color", e.target.value)}
                      className="font-mono text-xs h-8"
                    />
                  </div>
                </div>
              </div>

              {mode === "box-shadow" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={layer.inset}
                    onChange={(e) => updateLayer(layer.id, "inset", e.target.checked)}
                    className="rounded border-border"
                  />
                  <Label className="text-xs">内阴影 (inset)</Label>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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
