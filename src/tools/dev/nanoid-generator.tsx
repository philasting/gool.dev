"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

/** Generate a NanoID using crypto.getRandomValues */
function generateNanoId(length: number, charset: string): string {
  const chars = charset;
  const charsLength = chars.length;
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let id = "";
  for (let i = 0; i < length; i++) {
    // Uniform distribution using rejection sampling
    const byte = bytes[i];
    id += chars[byte % charsLength];
  }
  return id;
}

export function NanoidGeneratorTool() {
  const [length, setLength] = useState(21);
  const [charset, setCharset] = useState(DEFAULT_CHARSET);
  const [count, setCount] = useState(5);
  const [results, setResults] = useState<string[]>([]);
  const { copied, handleCopy } = useCopyState();

  const handleGenerate = useCallback(() => {
    const len = Math.max(5, Math.min(256, length));
    const c = charset.length > 0 ? charset : DEFAULT_CHARSET;
    const n = Math.max(1, Math.min(50, count));
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      ids.push(generateNanoId(len, c));
    }
    setResults(ids);
  }, [length, charset, count]);

  const handleCopyAll = useCallback(() => {
    if (results.length === 0) return;
    handleCopy(results.join("\n"));
  }, [results, handleCopy]);

  const handleClear = useCallback(() => {
    setResults([]);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">长度（5-256）</Label>
          <Input
            type="number"
            value={length}
            onChange={(e) => setLength(Number(e.target.value) || 21)}
            min={5}
            max={256}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">数量（1-50）</Label>
          <Input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 5)}
            min={1}
            max={50}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">字符集</Label>
          <Input
            value={charset}
            onChange={(e) => setCharset(e.target.value || DEFAULT_CHARSET)}
            placeholder={DEFAULT_CHARSET}
            className="h-8 font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGenerate} size="sm">
          <RefreshCw className="h-4 w-4 mr-1" /> 生成
        </Button>
        <Button onClick={handleCopyAll} variant="outline" size="sm" disabled={results.length === 0}>
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? "已复制" : "复制全部"}
        </Button>
        <Button onClick={handleClear} variant="ghost" size="sm">
          <Trash2 className="h-4 w-4 mr-1" /> 清空
        </Button>
      </div>

      {results.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-1 font-mono text-sm max-h-[400px] overflow-auto custom-scrollbar">
              {results.map((id, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <span className="text-muted-foreground text-xs w-6 text-right">{i + 1}.</span>
                  <code className="bg-muted px-2 py-0.5 rounded flex-1 break-all">{id}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                    onClick={() => handleCopy(id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
