"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

const LOCATION_MAP: Record<number, string> = {
  0: "标准",
  1: "左侧",
  2: "右侧",
  3: "数字键盘",
};

export function KeycodeDetectorTool() {
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [listening, setListening] = useState(true);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!listening) return;
      e.preventDefault();
      setKeyInfo({
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which,
        location: e.location,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      });
    },
    [listening]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const modifierItems = [
    { label: "Ctrl", active: keyInfo?.ctrlKey ?? false },
    { label: "Shift", active: keyInfo?.shiftKey ?? false },
    { label: "Alt", active: keyInfo?.altKey ?? false },
    { label: "Meta", active: keyInfo?.metaKey ?? false },
  ];

  const detailItems = keyInfo
    ? [
        { label: "event.key", value: keyInfo.key },
        { label: "event.code", value: keyInfo.code },
        { label: "event.keyCode", value: String(keyInfo.keyCode) },
        { label: "event.which", value: String(keyInfo.which) },
        { label: "event.location", value: `${keyInfo.location} (${LOCATION_MAP[keyInfo.location] ?? "未知"})` },
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Keyboard area */}
      <Card
        className={`cursor-pointer transition-colors ${listening ? "border-primary/50" : "border-border"}`}
        onClick={() => setListening(true)}
      >
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[180px]">
          {keyInfo ? (
            <>
              <div className="text-5xl font-bold mb-2 font-mono">{keyInfo.key === " " ? "Space" : keyInfo.key}</div>
              <div className="flex gap-2 flex-wrap justify-center">
                {modifierItems.map((m) =>
                  m.active ? (
                    <Badge key={m.label} variant="default" className="text-xs">
                      {m.label}
                    </Badge>
                  ) : null
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Keyboard className="h-12 w-12" />
              <p className="text-sm">按下任意键开始检测</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail info */}
      {keyInfo && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {detailItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-1.5 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 px-2 rounded transition-colors"
                  onClick={() => copyToClipboard(item.value)}
                  title="点击复制"
                >
                  <span className="text-xs text-muted-foreground font-mono">{item.label}</span>
                  <span className="text-sm font-mono font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modifier keys */}
      <div className="grid grid-cols-4 gap-2">
        {modifierItems.map((m) => (
          <div
            key={m.label}
            className={`text-center py-2 rounded-lg text-xs font-medium transition-colors ${
              m.active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}
