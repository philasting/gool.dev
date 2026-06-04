"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, Trash2, ShieldCheck } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type HmacAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const ALGORITHMS: HmacAlgorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

function algorithmToSubtle(algo: HmacAlgorithm): string {
  return algo.replace("-", "");
}

async function computeHmac(message: string, key: string, algorithm: HmacAlgorithm): Promise<{ hex: string; base64: string }> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: algorithmToSubtle(algorithm) },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const bytes = new Uint8Array(signature);

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const base64 = btoa(String.fromCharCode(...bytes));

  return { hex, base64 };
}

export function HmacGeneratorTool() {
  const [message, setMessage] = useState("");
  const [key, setKey] = useState("");
  const [algorithm, setAlgorithm] = useState<HmacAlgorithm>("SHA-256");
  const [hexResult, setHexResult] = useState("");
  const [base64Result, setBase64Result] = useState("");
  const [loading, setLoading] = useState(false);
  const { copied: copiedHex, handleCopy: handleCopyHex } = useCopyState();
  const { copied: copiedBase64, handleCopy: handleCopyBase64 } = useCopyState();

  const handleGenerate = useCallback(async () => {
    if (!message || !key) return;
    setLoading(true);
    try {
      const result = await computeHmac(message, key, algorithm);
      setHexResult(result.hex);
      setBase64Result(result.base64);
    } catch (err) {
      console.error("HMAC generation failed:", err);
      setHexResult("生成失败");
      setBase64Result("生成失败");
    } finally {
      setLoading(false);
    }
  }, [message, key, algorithm]);

  const handleClear = useCallback(() => {
    setMessage("");
    setKey("");
    setHexResult("");
    setBase64Result("");
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>消息文本</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入要计算 HMAC 的消息文本..."
          className="min-h-[100px] font-mono text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>密钥</Label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="输入密钥..."
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>算法</Label>
          <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as HmacAlgorithm)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALGORITHMS.map((algo) => (
                <SelectItem key={algo} value={algo}>
                  HMAC-{algo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={loading || !message || !key}>
          <ShieldCheck className="h-4 w-4 mr-1" /> {loading ? "生成中..." : "生成 HMAC"}
        </Button>
        <Button variant="outline" onClick={handleClear}>
          <Trash2 className="h-4 w-4 mr-1" /> 清空
        </Button>
      </div>

      {hexResult && (
        <div className="space-y-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-sm font-semibold w-16 shrink-0">HEX</span>
              <code className="flex-1 text-xs font-mono break-all text-muted-foreground">{hexResult}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleCopyHex(hexResult)}
              >
                {copiedHex ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-sm font-semibold w-16 shrink-0">Base64</span>
              <code className="flex-1 text-xs font-mono break-all text-muted-foreground">{base64Result}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleCopyBase64(base64Result)}
              >
                {copiedBase64 ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">
            使用 Web Crypto API 的 crypto.subtle.sign() 计算 HMAC。支持 SHA-1、SHA-256、SHA-384、SHA-512 算法。
            输出十六进制（HEX）和 Base64 两种格式。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
