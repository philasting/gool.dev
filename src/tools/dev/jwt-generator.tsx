"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

type JwtAlgorithm = "HS256" | "HS384" | "HS512";

const ALGO_HASH_MAP: Record<JwtAlgorithm, string> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

function base64UrlEncode(data: string | ArrayBuffer): string {
  let str: string;
  if (typeof data === "string") {
    str = btoa(unescape(encodeURIComponent(data)));
  } else {
    const bytes = new Uint8Array(data);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    str = btoa(binary);
  }
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signJWT(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  secret: string,
  algorithm: JwtAlgorithm
): Promise<string> {
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: ALGO_HASH_MAP[algorithm] },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const signatureB64 = base64UrlEncode(signature);
  return `${message}.${signatureB64}`;
}

const DEFAULT_PAYLOAD = `{
  "sub": "1234567890",
  "name": "张三",
  "iat": 1516239022
}`;

interface ClaimPreset {
  label: string;
  key: string;
  getValue: () => unknown;
}

const CLAIM_PRESETS: ClaimPreset[] = [
  { label: "iat (签发时间)", key: "iat", getValue: () => Math.floor(Date.now() / 1000) },
  { label: "exp (1小时后)", key: "exp", getValue: () => Math.floor(Date.now() / 1000) + 3600 },
  { label: "exp (24小时后)", key: "exp", getValue: () => Math.floor(Date.now() / 1000) + 86400 },
  { label: "sub (主题)", key: "sub", getValue: () => "user-123" },
  { label: "iss (签发者)", key: "iss", getValue: () => "gool-toolbox" },
  { label: "aud (受众)", key: "aud", getValue: () => "gool-users" },
];

export function JwtGeneratorTool() {
  const [algorithm, setAlgorithm] = useState<JwtAlgorithm>("HS256");
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const header = {
    alg: algorithm,
    typ: "JWT",
  };

  const handleGenerate = useCallback(async () => {
    setError("");
    setToken("");

    let payload: Record<string, unknown>;
    try {
      const parsed = JSON.parse(payloadText);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Payload 必须是 JSON 对象");
      }
      payload = parsed as Record<string, unknown>;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payload JSON 格式错误");
      return;
    }

    if (!secret.trim()) {
      setError("请输入 Secret");
      return;
    }

    try {
      const jwt = await signJWT(header, payload, secret, algorithm);
      setToken(jwt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "签名失败");
    }
  }, [algorithm, payloadText, secret, header]);

  const addClaim = (preset: ClaimPreset) => {
    try {
      const parsed = JSON.parse(payloadText) as Record<string, unknown>;
      parsed[preset.key] = preset.getValue();
      setPayloadText(JSON.stringify(parsed, null, 2));
    } catch {
      // If current payload is invalid, ignore
    }
  };

  const handleCopy = async () => {
    if (!token) return;
    await copyToClipboard(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">签名算法</Label>
          <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as JwtAlgorithm)}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HS256">HS256</SelectItem>
              <SelectItem value="HS384">HS384</SelectItem>
              <SelectItem value="HS512">HS512</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-sm">Secret</Label>
          <Input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="输入密钥"
            className="h-8"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-3 space-y-1">
          <Label className="text-sm">Header</Label>
          <pre className="text-xs font-mono bg-muted p-2 rounded break-all select-all">
            {JSON.stringify(header, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Payload</Label>
          <div className="flex flex-wrap gap-1">
            {CLAIM_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => addClaim(preset)}
              >
                + {preset.label}
              </Button>
            ))}
          </div>
        </div>
        <Textarea
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          rows={8}
          className="font-mono text-xs resize-y"
        />
      </div>

      <Button onClick={handleGenerate} size="lg" className="w-full">
        <RefreshCw className="h-4 w-4 mr-2" /> 生成 JWT
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {token && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm">JWT Token</Label>
              <Badge variant="secondary">{algorithm}</Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs font-mono break-all select-all bg-muted p-2 rounded leading-relaxed">
              {token}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
