"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ArrowRightLeft, Trash2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

// ============ Base32 (RFC 4648, alphabet: A-Z2-7) ============

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  if (bytes.length === 0) return "";

  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  // Padding
  const padLen = [0, 6, 4, 3, 1][output.length % 8] ?? 0;
  output += "=".repeat(padLen);

  return output;
}

function base32Decode(input: string): string {
  const cleaned = input.replace(/\s/g, "").replace(/=+$/, "").toUpperCase();
  if (cleaned.length === 0) return "";

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

// ============ Base58 (Bitcoin alphabet, no 0OIl) ============

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  if (bytes.length === 0) return "";

  // Count leading zeros
  let leadingZeros = 0;
  for (const b of bytes) {
    if (b === 0) leadingZeros++;
    else break;
  }

  // Convert to big integer
  let num = BigInt(0);
  for (const b of bytes) {
    num = num * BigInt(256) + BigInt(b);
  }

  let output = "";
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    output = BASE58_ALPHABET[remainder] + output;
    num = num / BigInt(58);
  }

  // Add leading '1's for each leading zero byte
  return "1".repeat(leadingZeros) + output;
}

function base58Decode(input: string): string {
  const cleaned = input.replace(/\s/g, "");
  if (cleaned.length === 0) return "";

  // Count leading '1's
  let leadingOnes = 0;
  for (const c of cleaned) {
    if (c === "1") leadingOnes++;
    else break;
  }

  let num = BigInt(0);
  for (const c of cleaned) {
    const idx = BASE58_ALPHABET.indexOf(c);
    if (idx === -1) continue;
    num = num * BigInt(58) + BigInt(idx);
  }

  const bytes: number[] = [];
  while (num > BigInt(0)) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }

  // Add leading zero bytes
  for (let i = 0; i < leadingOnes; i++) {
    bytes.unshift(0);
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function Base32Base58Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { copied, handleCopy } = useCopyState();

  const handleBase32Encode = () => {
    if (!input) return;
    setOutput(base32Encode(input));
  };

  const handleBase32Decode = () => {
    if (!input) return;
    try {
      setOutput(base32Decode(input));
    } catch {
      setOutput("解码失败：无效的 Base32 输入");
    }
  };

  const handleBase58Encode = () => {
    if (!input) return;
    setOutput(base58Encode(input));
  };

  const handleBase58Decode = () => {
    if (!input) return;
    try {
      setOutput(base58Decode(input));
    } catch {
      setOutput("解码失败：无效的 Base58 输入");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入文本</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要编码/解码的文本..."
          className="min-h-[120px] font-mono text-sm"
        />
      </div>

      <Tabs defaultValue="base32">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="base32">Base32</TabsTrigger>
          <TabsTrigger value="base58">Base58</TabsTrigger>
        </TabsList>

        <TabsContent value="base32" className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleBase32Encode} size="sm" disabled={!input}>
              编码
            </Button>
            <Button onClick={handleBase32Decode} size="sm" variant="secondary" disabled={!input}>
              解码
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
          <Card>
            <CardContent className="p-2">
              <p className="text-xs text-muted-foreground">
                RFC 4648 字母表：A-Z 2-7，使用 = 填充
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="base58" className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleBase58Encode} size="sm" disabled={!input}>
              编码
            </Button>
            <Button onClick={handleBase58Decode} size="sm" variant="secondary" disabled={!input}>
              解码
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
          <Card>
            <CardContent className="p-2">
              <p className="text-xs text-muted-foreground">
                Bitcoin 字母表：123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz（无 0OIl）
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {output && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <code className="text-sm font-mono break-all whitespace-pre-wrap flex-1">
                {output}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleCopy(output)}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
