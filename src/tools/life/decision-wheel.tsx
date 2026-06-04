"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dices, Plus, Trash2, RotateCcw } from "lucide-react";

interface WheelOption {
  id: number;
  label: string;
  color: string;
}

const DEFAULT_OPTIONS: WheelOption[] = [
  { id: 1, label: "是", color: "#22c55e" },
  { id: 2, label: "否", color: "#ef4444" },
];

const PALETTE = [
  "#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
  "#e11d48", "#84cc16", "#0ea5e9", "#d946ef", "#facc15",
];

let nextId = 3;

export function DecisionWheelTool() {
  const [options, setOptions] = useState<WheelOption[]>(DEFAULT_OPTIONS);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const addOption = useCallback(() => {
    const colorIdx = options.length % PALETTE.length;
    setOptions((prev) => [
      ...prev,
      { id: nextId++, label: `选项${nextId - 1}`, color: PALETTE[colorIdx] },
    ]);
  }, [options.length]);

  const removeOption = useCallback((id: number) => {
    setOptions((prev) => {
      const next = prev.filter((o) => o.id !== id);
      if (next.length < 2) return prev; // Keep at least 2 options
      return next;
    });
    setResult(null);
  }, []);

  const updateOption = useCallback((id: number, label: string) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, label } : o))
    );
    setResult(null);
  }, []);

  const updateColor = useCallback((id: number, color: string) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, color } : o))
    );
    setResult(null);
  }, []);

  // Draw the wheel
  const drawWheel = useCallback(
    (currentRotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = 320;
      canvas.width = size;
      canvas.height = size;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 10;

      ctx.clearRect(0, 0, size, size);

      if (options.length === 0) return;

      const sliceAngle = (2 * Math.PI) / options.length;

      // Draw slices
      options.forEach((option, i) => {
        const startAngle = currentRotation + i * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = option.color;
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label
        const midAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.65;
        const labelX = cx + Math.cos(midAngle) * labelRadius;
        const labelY = cy + Math.sin(midAngle) * labelRadius;

        ctx.save();
        ctx.translate(labelX, labelY);
        ctx.rotate(midAngle + (midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2 ? Math.PI : 0));

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.min(16, Math.max(10, 200 / options.length))}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 3;

        const maxLabelLen = Math.max(4, Math.floor(20 / options.length));
        const displayLabel = option.label.length > maxLabelLen
          ? option.label.slice(0, maxLabelLen) + "…"
          : option.label;
        ctx.fillText(displayLabel, 0, 0);
        ctx.restore();
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
      ctx.fillStyle = "hsl(var(--card))";
      ctx.fill();
      ctx.strokeStyle = "hsl(var(--border))";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw pointer (top)
      ctx.beginPath();
      ctx.moveTo(cx - 12, 8);
      ctx.lineTo(cx + 12, 8);
      ctx.lineTo(cx, 28);
      ctx.closePath();
      ctx.fillStyle = "hsl(var(--foreground))";
      ctx.fill();
    },
    [options]
  );

  // Redraw wheel when options change
  useEffect(() => {
    drawWheel(rotation);
  }, [options, rotation, drawWheel]);

  const spinWheel = useCallback(() => {
    if (spinning || options.length < 2) return;

    setSpinning(true);
    setResult(null);

    const totalRotation = Math.PI * 2 * (5 + Math.random() * 5); // 5-10 full rotations
    const duration = 4000 + Math.random() * 2000; // 4-6 seconds
    const startRotation = rotation;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + totalRotation * eased;

      setRotation(currentRotation);
      drawWheel(currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Determine which option the pointer points to
        // Pointer is at the top (-PI/2)
        const normalizedRotation = ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const pointerAngle = ((2 * Math.PI - normalizedRotation + Math.PI * 1.5) % (2 * Math.PI));
        const sliceAngle = (2 * Math.PI) / options.length;
        const selectedIndex = Math.floor(pointerAngle / sliceAngle) % options.length;

        setResult(options[selectedIndex].label);
        setSpinning(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [spinning, options, rotation, drawWheel]);

  const resetWheel = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setSpinning(false);
    setResult(null);
    setRotation(0);
    drawWheel(0);
  }, [drawWheel]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Wheel canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="max-w-[320px]"
        />
      </div>

      {/* Result */}
      {result && (
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">结果</p>
            <p className="text-2xl font-bold text-primary">{result}</p>
          </CardContent>
        </Card>
      )}

      {/* Spin button */}
      <div className="flex gap-2 justify-center">
        <Button
          onClick={spinWheel}
          size="lg"
          disabled={spinning || options.length < 2}
          className="min-w-[120px]"
        >
          <Dices className="h-5 w-5 mr-2" />
          {spinning ? "旋转中..." : "转！"}
        </Button>
        <Button
          onClick={resetWheel}
          variant="outline"
          size="lg"
          disabled={spinning}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* Options editor */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">选项列表</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              disabled={options.length >= 20}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> 添加
            </Button>
          </div>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {options.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="color"
                  value={option.color}
                  onChange={(e) => updateColor(option.id, e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer shrink-0"
                />
                <Input
                  value={option.label}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  className="h-8 text-sm flex-1"
                  placeholder="选项名称"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeOption(option.id)}
                  disabled={options.length <= 2}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            最少 2 个选项，最多 20 个
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
