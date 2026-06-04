"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

/** Zero-width characters used for encoding */
const ZW_ZERO = "\u200B";       // Zero Width Space → bit 0
const ZW_ONE = "\u200C";        // Zero Width Non-Joiner → bit 1
const ZW_SEPARATOR = "\u200D";  // Zero Width Joiner → separator between chars

/** All zero-width characters for detection */
const ZW_CHARS = new Set(["\u200B", "\u200C", "\u200D", "\uFEFF"]);

/**
 * Encode secret text into zero-width characters.
 * Each character is converted to 16-bit binary, then:
 * - 0 → ZW_ZERO, 1 → ZW_ONE
 * - ZW_SEPARATOR between characters
 */
function encodeSecret(coverText: string, secretText: string): string {
  if (!secretText) return coverText;

  const encoded = secretText
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      const binary = code.toString(2).padStart(16, "0");
      return binary
        .split("")
        .map((bit) => (bit === "0" ? ZW_ZERO : ZW_ONE))
        .join("");
    })
    .join(ZW_SEPARATOR);

  // Insert the hidden text at a random position within the cover text
  // Prefer inserting after the first character for reliability
  if (coverText.length === 0) return encoded;
  const insertPos = Math.min(1, coverText.length);
  return coverText.slice(0, insertPos) + encoded + coverText.slice(insertPos);
}

/**
 * Decode hidden text from a string containing zero-width characters.
 */
function decodeSecret(stegoText: string): string {
  // Extract only zero-width characters
  const zwChars = stegoText.split("").filter((ch) => ZW_CHARS.has(ch));

  if (zwChars.length === 0) return "";

  // Split by separator
  const charBins: string[] = [];
  let currentBin = "";

  for (const ch of zwChars) {
    if (ch === ZW_SEPARATOR) {
      if (currentBin.length > 0) {
        charBins.push(currentBin);
        currentBin = "";
      }
    } else if (ch === ZW_ZERO) {
      currentBin += "0";
    } else if (ch === ZW_ONE) {
      currentBin += "1";
    }
    // Ignore FEFF (BOM) - treat as separator-like
  }
  if (currentBin.length > 0) {
    charBins.push(currentBin);
  }

  return charBins
    .map((bin) => {
      const code = parseInt(bin, 2);
      if (Number.isNaN(code) || code === 0) return "";
      return String.fromCharCode(code);
    })
    .join("");
}

/**
 * Check if a string contains zero-width characters.
 */
function hasZeroWidthChars(text: string): boolean {
  return text.split("").some((ch) => ZW_CHARS.has(ch));
}

/**
 * Remove all zero-width characters from text.
 */
function removeZeroWidthChars(text: string): string {
  return text
    .split("")
    .filter((ch) => !ZW_CHARS.has(ch))
    .join("");
}

/**
 * Count zero-width characters in text.
 */
function countZeroWidthChars(text: string): number {
  return text.split("").filter((ch) => ZW_CHARS.has(ch)).length;
}

export function ZeroWidthSteganographyTool() {
  const [coverText, setCoverText] = useState("");
  const [secretText, setSecretText] = useState("");
  const [encodedText, setEncodedText] = useState("");
  const [decodeInput, setDecodeInput] = useState("");
  const [decodedSecret, setDecodedSecret] = useState("");
  const [cleanedText, setCleanedText] = useState("");
  const { copied, handleCopy } = useCopyState();
  const [copiedDecoded, setCopiedDecoded] = useState(false);
  const [copiedCleaned, setCopiedCleaned] = useState(false);

  const handleEncode = () => {
    if (!coverText || !secretText) return;
    const result = encodeSecret(coverText, secretText);
    setEncodedText(result);
  };

  const handleDecode = () => {
    if (!decodeInput) return;
    const secret = decodeSecret(decodeInput);
    setDecodedSecret(secret);
  };

  const handleClean = () => {
    if (!decodeInput) return;
    setCleanedText(removeZeroWidthChars(decodeInput));
  };

  const copyDecoded = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedDecoded(true);
    setTimeout(() => setCopiedDecoded(false), 2000);
  };

  const copyCleaned = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCleaned(true);
    setTimeout(() => setCopiedCleaned(false), 2000);
  };

  const encodedInfo = encodedText
    ? {
        totalLen: encodedText.length,
        visibleLen: removeZeroWidthChars(encodedText).length,
        hiddenLen: countZeroWidthChars(encodedText),
      }
    : null;

  const decodeInputInfo = decodeInput
    ? {
        hasHidden: hasZeroWidthChars(decodeInput),
        hiddenCount: countZeroWidthChars(decodeInput),
      }
    : null;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="encode">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="encode">
            <Eye className="h-3.5 w-3.5 mr-1" />
            隐写编码
          </TabsTrigger>
          <TabsTrigger value="decode">
            <EyeOff className="h-3.5 w-3.5 mr-1" />
            提取解码
          </TabsTrigger>
          <TabsTrigger value="clean">
            清除隐写
          </TabsTrigger>
        </TabsList>

        {/* Encode Tab */}
        <TabsContent value="encode" className="space-y-3">
          <div className="space-y-2">
            <Label>载体文本（明面上可见的文字）</Label>
            <Textarea
              value={coverText}
              onChange={(e) => setCoverText(e.target.value)}
              placeholder="输入载体文本，例如：今天天气真好"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>秘密文本（要隐藏的信息）</Label>
            <Textarea
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="输入要隐藏的秘密文本"
              className="min-h-[60px]"
            />
          </div>

          <Button onClick={handleEncode} size="sm" disabled={!coverText || !secretText}>
            <Eye className="h-4 w-4 mr-1" /> 编码隐写
          </Button>

          {encodedText && encodedInfo && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">
                      隐写结果（看起来和载体文本一样，但包含隐藏信息）
                    </p>
                    <div className="text-sm break-all whitespace-pre-wrap border rounded p-2 bg-muted/50 font-mono">
                      {removeZeroWidthChars(encodedText)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleCopy(encodedText)}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>总字符: {encodedInfo.totalLen}</span>
                  <span>可见字符: {encodedInfo.visibleLen}</span>
                  <span>隐写字符: {encodedInfo.hiddenLen}</span>
                </div>
                <p className="text-xs text-amber-600">
                  提示：复制后的文本看起来和载体文本一样，但已包含隐藏信息。将此文本粘贴到「提取解码」即可还原。
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Decode Tab */}
        <TabsContent value="decode" className="space-y-3">
          <div className="space-y-2">
            <Label>含隐写的文本</Label>
            <Textarea
              value={decodeInput}
              onChange={(e) => {
                setDecodeInput(e.target.value);
                setDecodedSecret("");
                setCleanedText("");
              }}
              placeholder="粘贴含隐写信息的文本"
              className="min-h-[80px]"
            />
          </div>

          {decodeInputInfo && (
            <div className="flex gap-4 text-xs">
              <span className={decodeInputInfo.hasHidden ? "text-green-600" : "text-muted-foreground"}>
                {decodeInputInfo.hasHidden
                  ? `✓ 检测到 ${decodeInputInfo.hiddenCount} 个零宽字符`
                  : "✗ 未检测到零宽字符"}
              </span>
            </div>
          )}

          <Button onClick={handleDecode} size="sm" disabled={!decodeInput}>
            <EyeOff className="h-4 w-4 mr-1" /> 提取秘密
          </Button>

          {decodedSecret && (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">提取的秘密文本</p>
                    <p className="text-sm break-all whitespace-pre-wrap font-mono">
                      {decodedSecret}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyDecoded(decodedSecret)}
                  >
                    {copiedDecoded ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {decodedSecret === "" && decodeInput && hasZeroWidthChars(decodeInput) && (
            <p className="text-xs text-amber-600">
              检测到零宽字符但未提取到有效文本，可能格式不匹配。
            </p>
          )}
        </TabsContent>

        {/* Clean Tab */}
        <TabsContent value="clean" className="space-y-3">
          <div className="space-y-2">
            <Label>输入文本</Label>
            <Textarea
              value={decodeInput}
              onChange={(e) => {
                setDecodeInput(e.target.value);
                setCleanedText("");
              }}
              placeholder="粘贴可能含隐写信息的文本"
              className="min-h-[80px]"
            />
          </div>

          <Button onClick={handleClean} size="sm" disabled={!decodeInput}>
            清除零宽字符
          </Button>

          {cleanedText && (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">清除后的纯文本</p>
                    <p className="text-sm break-all whitespace-pre-wrap font-mono">
                      {cleanedText}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyCleaned(cleanedText)}
                  >
                    {copiedCleaned ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                {decodeInputInfo && (
                  <p className="text-xs text-muted-foreground mt-2">
                    已移除 {decodeInputInfo.hiddenCount} 个零宽字符
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium">零宽字符隐写原理</p>
          <p>利用不可见的零宽字符（U+200B、U+200C、U+200D）编码秘密信息：</p>
          <p>• U+200B (ZWSP) → 表示二进制 0</p>
          <p>• U+200C (ZWNJ) → 表示二进制 1</p>
          <p>• U+200D (ZWJ) → 字符分隔符</p>
          <p>秘密文本每个字符转为16位二进制，再用零宽字符替换0和1，插入载体文本中。</p>
        </CardContent>
      </Card>
    </div>
  );
}
