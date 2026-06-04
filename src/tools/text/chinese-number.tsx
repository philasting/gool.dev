"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, ArrowRightLeft } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

type ChineseMode = "lowercase" | "uppercase";

const LOWER_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const UPPER_DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const LOWER_UNITS = ["", "十", "百", "千"];
const UPPER_UNITS = ["", "拾", "佰", "仟"];
const LOWER_BIG_UNITS = ["", "万", "亿", "万亿"];
const UPPER_BIG_UNITS = ["", "万", "亿", "万亿"];

function numberToChinese(num: number, mode: ChineseMode): string {
  if (num === 0) return mode === "lowercase" ? "零" : "零";

  const isUpper = mode === "uppercase";
  const digits = isUpper ? UPPER_DIGITS : LOWER_DIGITS;
  const units = isUpper ? UPPER_UNITS : LOWER_UNITS;
  const bigUnits = isUpper ? UPPER_BIG_UNITS : LOWER_BIG_UNITS;

  const isNeg = num < 0;
  const absNum = Math.abs(Math.floor(num));

  if (absNum === 0) return digits[0];

  // Split into groups of 4 digits from right
  const groups: number[] = [];
  let temp = absNum;
  while (temp > 0) {
    groups.push(temp % 10000);
    temp = Math.floor(temp / 10000);
  }

  const parts: string[] = [];

  for (let gi = groups.length - 1; gi >= 0; gi--) {
    const group = groups[gi];
    if (group === 0) continue;

    const groupStr = convertGroup(group, digits, units, isUpper, gi === groups.length - 1);
    if (groupStr) {
      parts.push(groupStr + bigUnits[gi]);
    }
  }

  let result = parts.join("");
  // Handle the special case of 10-19 at the beginning (no leading "一" for 十)
  if (mode === "lowercase" && result.startsWith("一十") && absNum < 100) {
    result = result.slice(1);
  }

  return (isNeg ? "负" : "") + result;
}

function convertGroup(
  group: number,
  digits: string[],
  units: string[],
  _isUpper: boolean,
  isFirstGroup: boolean
): string {
  if (group === 0) return "";

  const result: string[] = [];
  let hasZero = false;
  let started = false;

  const d0 = Math.floor(group / 1000) % 10;
  const d1 = Math.floor(group / 100) % 10;
  const d2 = Math.floor(group / 10) % 10;
  const d3 = group % 10;
  const dArr = [d0, d1, d2, d3];

  for (let i = 0; i < 4; i++) {
    const d = dArr[i];
    if (d === 0) {
      if (started) hasZero = true;
    } else {
      if (hasZero) {
        result.push(digits[0]);
        hasZero = false;
      }
      // For the very first group, if it's 10-19, we skip "一" before "十"
      if (isFirstGroup && i === 2 && d === 1 && d0 === 0 && d1 === 0 && !_isUpper) {
        // Just "十", no "一十"
        result.push(units[i]);
      } else {
        result.push(digits[d] + units[i]);
      }
      started = true;
    }
  }

  return result.join("");
}

function chineseToNumber(chinese: string, mode: ChineseMode): number | null {
  if (!chinese.trim()) return null;

  const isUpper = mode === "uppercase";
  const digits = isUpper ? UPPER_DIGITS : LOWER_DIGITS;
  const units = isUpper ? UPPER_UNITS : LOWER_UNITS;
  const bigUnits = isUpper ? UPPER_BIG_UNITS : LOWER_BIG_UNITS;

  // Build digit map
  const digitMap: Record<string, number> = {};
  for (let i = 0; i < 10; i++) {
    digitMap[digits[i]] = i;
  }

  let str = chinese.trim();
  let isNeg = false;
  if (str.startsWith("负")) {
    isNeg = true;
    str = str.slice(1);
  }

  // Parse the Chinese number
  // Split by big units (亿, 万) from right to left
  let result = 0;

  // Handle 亿
  const yiIdx = str.lastIndexOf("亿");
  if (yiIdx !== -1) {
    const beforeYi = str.slice(0, yiIdx);
    const afterYi = str.slice(yiIdx + 1);
    result = parseSmallNumber(beforeYi, digitMap, digits, units) * 100000000;
    if (afterYi) {
      // May have 万 after 亿
      const wanIdx = afterYi.lastIndexOf("万");
      if (wanIdx !== -1) {
        result += parseSmallNumber(afterYi.slice(0, wanIdx), digitMap, digits, units) * 10000;
        result += parseSmallNumber(afterYi.slice(wanIdx + 1), digitMap, digits, units);
      } else {
        result += parseSmallNumber(afterYi, digitMap, digits, units);
      }
    }
  } else {
    const wanIdx = str.lastIndexOf("万");
    if (wanIdx !== -1) {
      result = parseSmallNumber(str.slice(0, wanIdx), digitMap, digits, units) * 10000;
      result += parseSmallNumber(str.slice(wanIdx + 1), digitMap, digits, units);
    } else {
      result = parseSmallNumber(str, digitMap, digits, units);
    }
  }

  if (result === 0 && chinese !== digits[0]) return null;
  return isNeg ? -result : result;
}

function parseSmallNumber(
  str: string,
  digitMap: Record<string, number>,
  digits: string[],
  units: string[]
): number {
  if (!str) return 0;
  if (str.length === 1 && digitMap[str] !== undefined) return digitMap[str];

  let result = 0;
  let current = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (digitMap[ch] !== undefined) {
      current = digitMap[ch];
      // If this is the last character, it's a direct digit
      if (i === str.length - 1) {
        result += current;
      }
    } else {
      // It's a unit
      const unitIdx = units.indexOf(ch);
      if (unitIdx !== -1) {
        if (current === 0 && ch === units[1]) {
          // "百" without leading digit (like 百二) → treat as 100
          current = 1;
        }
        if (current === 0 && ch === units[2]) {
          current = 1;
        }
        if (current === 0 && ch === units[3]) {
          current = 1;
        }
        result += current * Math.pow(10, unitIdx);
        current = 0;
      }
    }
  }

  // Handle special: "十" alone = 10
  if (str === units[1]) return 10;

  return result;
}

export function ChineseNumberTool() {
  const [tab, setTab] = useState("num2cn");
  const [inputNum, setInputNum] = useState("1234");
  const [mode, setMode] = useState<ChineseMode>("lowercase");
  const [chineseInput, setChineseInput] = useState("一千二百三十四");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const chineseResult = useMemo(() => {
    const num = Number(inputNum);
    if (Number.isNaN(num) || !Number.isInteger(num) || Math.abs(num) > 9999999999999) {
      return null;
    }
    return numberToChinese(num, mode);
  }, [inputNum, mode]);

  const numberResult = useMemo(() => {
    return chineseToNumber(chineseInput, mode);
  }, [chineseInput, mode]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-sm">转换模式</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as ChineseMode)}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lowercase">小写中文（一二三）</SelectItem>
              <SelectItem value="uppercase">大写财务（壹贰叁）</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="num2cn" className="flex-1">数字 → 中文</TabsTrigger>
          <TabsTrigger value="cn2num" className="flex-1">中文 → 数字</TabsTrigger>
        </TabsList>

        <TabsContent value="num2cn" className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm">输入数字（0 - 9999亿）</Label>
            <Input
              type="text"
              value={inputNum}
              onChange={(e) => setInputNum(e.target.value)}
              placeholder="请输入整数"
              className="h-9"
            />
          </div>

          {chineseResult !== null && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-lg font-medium break-all select-all">{chineseResult}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleCopy(chineseResult, "cn")}
                >
                  {copiedKey === "cn" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          )}

          {chineseResult === null && inputNum && (
            <p className="text-sm text-destructive">请输入有效的整数（范围：0 - 9999亿）</p>
          )}
        </TabsContent>

        <TabsContent value="cn2num" className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm">输入中文数字</Label>
            <Input
              type="text"
              value={chineseInput}
              onChange={(e) => setChineseInput(e.target.value)}
              placeholder={mode === "lowercase" ? "例如：一千二百三十四" : "例如：壹仟贰佰叁拾肆"}
              className="h-9"
            />
          </div>

          {chineseInput && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-lg font-mono break-all select-all">
                  {numberResult !== null ? numberResult.toLocaleString() : "无法解析"}
                </span>
                {numberResult !== null && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleCopy(numberResult.toString(), "num")}
                  >
                    {copiedKey === "num" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
