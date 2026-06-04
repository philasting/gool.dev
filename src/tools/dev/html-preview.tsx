"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";

export function HtmlPreviewTool() {
  const [code, setCode] = useState("<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; padding: 20px; }\n    h1 { color: #333; }\n  </style>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p>这是一个 HTML 预览示例</p>\n  <button onclick=\"alert('你好！')\">点击我</button>\n</body>\n</html>");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [srcdoc, setSrcdoc] = useState(code);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSrcdoc(code);
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [code, autoRefresh]);

  const handleManualRefresh = useCallback(() => {
    setSrcdoc(code);
  }, [code]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
          <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
            自动刷新
          </Label>
        </div>
        {!autoRefresh && (
          <Button onClick={handleManualRefresh} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" /> 刷新预览
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code editor */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">HTML 代码</Label>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-[500px] font-mono text-sm"
            placeholder="输入 HTML + CSS + JS 代码..."
          />
        </div>

        {/* Preview iframe */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">预览</Label>
          <Card>
            <CardContent className="p-0">
              <iframe
                srcDoc={srcdoc}
                className="w-full min-h-[500px] border-0 rounded-lg"
                sandbox="allow-scripts allow-same-origin"
                title="HTML 预览"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
