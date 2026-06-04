"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Check, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/**
 * 简化版 Punycode 编码（RFC 3492）
 * 支持中文等常用非 ASCII 字符
 */

/** 将 Unicode 码点编码为 Punycode ACE 格式 */
function encodePunycode(input: string): string {
  // 检查是否包含非 ASCII 字符
  const hasNonAscii = /[^\x00-\x7F]/.test(input);
  if (!hasNonAscii) return input;

  const codePoints: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const cp = input.codePointAt(i);
    if (cp !== undefined) {
      codePoints.push(cp);
      if (cp > 0xffff) i++; // 跳过代理对的后半部分
    }
  }

  let n = 128;
  let delta = 0;
  let bias = 72;
  let output = "";

  // 提取 ASCII 字符
  const asciiChars: string[] = [];
  const nonAsciiPoints: number[] = [];
  for (const cp of codePoints) {
    if (cp < 128) {
      asciiChars.push(String.fromCharCode(cp));
    } else {
      nonAsciiPoints.push(cp);
    }
  }
  output = asciiChars.join("");
  if (asciiChars.length > 0) output += "-";

  const handled = new Set<number>();
  const sortedNonAscii = [...nonAsciiPoints].sort((a, b) => a - b);

  for (const m of sortedNonAscii) {
    if (handled.has(m)) continue;
    handled.add(m);

    if (m >= n) {
      delta += (m - n) * (output.length + 1 - asciiChars.length + (asciiChars.length > 0 ? 0 : 0));
      n = m;
    }

    for (let i = 0; i < codePoints.length; i++) {
      const cp = codePoints[i];
      if (cp < n) {
        delta++;
      } else if (cp === n) {
        let q = delta;
        let k = 36;
        while (true) {
          const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
          if (q < t) break;
          output += String.fromCharCode(encodeDigit(t + (q - t) % (36 - t)));
          q = Math.floor((q - t) / (36 - t));
          k += 36;
        }
        output += String.fromCharCode(encodeDigit(q));
        bias = adaptBias(delta, output.length - asciiChars.length - (asciiChars.length > 0 ? 1 : 0) + 1, asciiChars.length === 0);
        delta = 0;
      }
    }
    delta++;
    n++;
  }

  return "xn--" + output;
}

function encodeDigit(d: number): number {
  return d + 22 + 75 * (d < 26 ? 1 : 0);
}

function adaptBias(delta: number, numPoints: number, firstTime: boolean): number {
  if (firstTime) delta = Math.floor(delta / 700);
  else delta = Math.floor(delta / 2);
  delta += Math.floor(delta / numPoints);
  let k = 0;
  while (delta > Math.floor((36 - 1) * 26) / 2) {
    delta = Math.floor(delta / 36 - 1);
    k += 36;
  }
  return k + Math.floor((36 - 1) * delta / (delta + 38));
}

/** 解码 Punycode ACE 格式 */
function decodePunycode(input: string): string {
  if (!input.startsWith("xn--")) return input;

  const encoded = input.slice(4);
  let n = 128;
  let i = 0;
  let bias = 72;
  let output = "";

  let delimiterPos = encoded.lastIndexOf("-");
  if (delimiterPos >= 0) {
    output = encoded.slice(0, delimiterPos);
  }

  let pos = delimiterPos + 1;
  while (pos < encoded.length) {
    const oldi = i;
    let w = 1;
    let k = 36;
    while (pos < encoded.length) {
      const digit = decodeDigit(encoded.charCodeAt(pos));
      pos++;
      if (digit >= 36) break;
      i += digit * w;
      const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
      if (i < t) break;
      w *= 36 - t;
      k += 36;
    }
    const numPoints = [...output].length + 1;
    bias = adaptBias(i - oldi, numPoints, oldi === 0);
    n += Math.floor((i - oldi) / numPoints);
    i = (i - oldi) % numPoints;
    output = output.slice(0, i) + String.fromCodePoint(n) + output.slice(i);
    i++;
  }

  return output;
}

function decodeDigit(cp: number): number {
  if (cp >= 48 && cp <= 57) return cp - 22;  // 0-9
  if (cp >= 65 && cp <= 90) return cp - 65;   // A-Z
  if (cp >= 97 && cp <= 122) return cp - 97;  // a-z
  return 36;
}

/** 处理完整域名的 Punycode 编码 */
function encodeDomain(domain: string): string {
  return domain.split(".").map((label) => encodePunycode(label)).join(".");
}

/** 处理完整域名的 Punycode 解码 */
function decodeDomain(domain: string): string {
  return domain.split(".").map((label) => decodePunycode(label)).join(".");
}

export function PunycodeConverterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { copied, handleCopy } = useCopyState();

  const handleEncode = () => {
    if (!input) return;
    setOutput(encodeDomain(input));
  };

  const handleDecode = () => {
    if (!input) return;
    setOutput(decodeDomain(input));
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入域名</Label>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例如：中文.com 或 xn--fiq228c.com"
          className="font-mono text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleEncode} size="sm" disabled={!input}>
          <ArrowRight className="h-4 w-4 mr-1" /> 编码
        </Button>
        <Button onClick={handleDecode} size="sm" variant="secondary" disabled={!input}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 解码
        </Button>
        <Button onClick={handleClear} variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-1" /> 清空
        </Button>
      </div>

      {output && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <code className="text-sm font-mono break-all">{output}</code>
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

      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">
            Punycode 是一种将 Unicode 字符编码为 ASCII 的方案，常用于国际化域名（IDN）。
            例如："中文.com" 编码为 "xn--fiq228c.com"。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
