"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Copy, Check, Lock, Unlock, Shield } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/** 凯撒密码加密：仅处理英文字母，保留其他字符 */
function caesarEncrypt(text: string, shift: number): string {
  return text
    .split("")
    .map((char) => {
      if (char >= "A" && char <= "Z") {
        return String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
      }
      if (char >= "a" && char <= "z") {
        return String.fromCharCode(((char.charCodeAt(0) - 97 + shift) % 26) + 97);
      }
      return char;
    })
    .join("");
}

/** 凯撒密码解密 */
function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, 26 - (shift % 26));
}

/** 暴力破解：返回所有25种偏移结果 */
function bruteForce(text: string): { shift: number; result: string }[] {
  const results: { shift: number; result: string }[] = [];
  for (let i = 1; i <= 25; i++) {
    results.push({ shift: i, result: caesarDecrypt(text, i) });
  }
  return results;
}

export function CaesarCipherTool() {
  const [input, setInput] = useState("");
  const [shift, setShift] = useState(3);
  const [encryptResult, setEncryptResult] = useState("");
  const [decryptResult, setDecryptResult] = useState("");
  const [bruteResults, setBruteResults] = useState<{ shift: number; result: string }[]>([]);
  const { copied, handleCopy } = useCopyState();
  const [copiedBrute, setCopiedBrute] = useState<number | null>(null);

  const handleEncrypt = () => {
    if (!input) return;
    setEncryptResult(caesarEncrypt(input, shift));
  };

  const handleDecrypt = () => {
    if (!input) return;
    setDecryptResult(caesarDecrypt(input, shift));
  };

  const handleBruteForce = () => {
    if (!input) return;
    setBruteResults(bruteForce(input));
  };

  const handleClear = () => {
    setInput("");
    setEncryptResult("");
    setDecryptResult("");
    setBruteResults([]);
  };

  const copyBruteResult = async (text: string, index: number) => {
    await copyToClipboard(text);
    setCopiedBrute(index);
    setTimeout(() => setCopiedBrute(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入文本</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要加密/解密的文本..."
          className="min-h-[100px] font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>偏移量</Label>
          <span className="text-sm font-mono text-primary">{shift}</span>
        </div>
        <Slider
          value={[shift]}
          onValueChange={(v) => setShift(Array.isArray(v) ? v[0] : v)}
          min={1}
          max={25}
          step={1}
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={25}
            value={shift}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (v >= 1 && v <= 25) setShift(v);
            }}
            className="w-20 h-8"
          />
          <span className="text-xs text-muted-foreground">范围 1-25</span>
        </div>
      </div>

      <Tabs defaultValue="encrypt">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="encrypt">
            <Lock className="h-3.5 w-3.5 mr-1" />
            加密
          </TabsTrigger>
          <TabsTrigger value="decrypt">
            <Unlock className="h-3.5 w-3.5 mr-1" />
            解密
          </TabsTrigger>
          <TabsTrigger value="brute">
            <Shield className="h-3.5 w-3.5 mr-1" />
            暴力破解
          </TabsTrigger>
        </TabsList>

        <TabsContent value="encrypt" className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleEncrypt} size="sm" disabled={!input}>
              <Lock className="h-4 w-4 mr-1" /> 加密
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              清空
            </Button>
          </div>
          {encryptResult && (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <code className="text-sm font-mono break-all whitespace-pre-wrap">
                    {encryptResult}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleCopy(encryptResult)}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="decrypt" className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleDecrypt} size="sm" disabled={!input}>
              <Unlock className="h-4 w-4 mr-1" /> 解密
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              清空
            </Button>
          </div>
          {decryptResult && (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <code className="text-sm font-mono break-all whitespace-pre-wrap">
                    {decryptResult}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleCopy(decryptResult)}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="brute" className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={handleBruteForce} size="sm" disabled={!input}>
              <Shield className="h-4 w-4 mr-1" /> 暴力破解
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm">
              清空
            </Button>
          </div>
          {bruteResults.length > 0 && (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {bruteResults.map((item) => (
                <Card key={item.shift}>
                  <CardContent className="p-2 flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-primary w-8 shrink-0">
                      +{item.shift}
                    </span>
                    <code className="flex-1 text-xs font-mono break-all">
                      {item.result}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => copyBruteResult(item.result, item.shift)}
                    >
                      {copiedBrute === item.shift ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
