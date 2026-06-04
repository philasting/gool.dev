"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface RegexPattern {
  name: string;
  pattern: string;
  description: string;
  tags: string[];
}

const PATTERN_LIBRARY: RegexPattern[] = [
  {
    name: "邮箱",
    pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]+",
    description: "匹配常见邮箱格式",
    tags: ["email", "邮箱"],
  },
  {
    name: "URL",
    pattern: "https?://[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*?",
    description: "匹配 http/https 链接",
    tags: ["url", "链接", "网址"],
  },
  {
    name: "手机号(中国)",
    pattern: "1[3-9]\\d{9}",
    description: "匹配中国大陆手机号",
    tags: ["phone", "手机", "电话"],
  },
  {
    name: "IP 地址",
    pattern: "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}",
    description: "匹配 IPv4 地址",
    tags: ["ip", "ipv4", "网络"],
  },
  {
    name: "日期(yyyy-mm-dd)",
    pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])",
    description: "匹配标准日期格式",
    tags: ["date", "日期", "时间"],
  },
  {
    name: "身份证号",
    pattern: "\\d{17}[\\dXx]",
    description: "匹配18位身份证号",
    tags: ["id", "身份证"],
  },
  {
    name: "中文字符",
    pattern: "[\\u4e00-\\u9fa5]+",
    description: "匹配中文字符",
    tags: ["chinese", "中文", "汉字"],
  },
  {
    name: "整数",
    pattern: "-?\\d+",
    description: "匹配正负整数",
    tags: ["number", "数字", "整数"],
  },
  {
    name: "浮点数",
    pattern: "-?\\d+\\.\\d+",
    description: "匹配正负浮点数",
    tags: ["float", "小数", "浮点"],
  },
  {
    name: "HTML 标签",
    pattern: "<[^>]+>",
    description: "匹配 HTML 标签",
    tags: ["html", "标签", "markup"],
  },
  {
    name: "十六进制颜色",
    pattern: "#[0-9a-fA-F]{3,8}",
    description: "匹配 HEX 颜色值",
    tags: ["color", "颜色", "hex"],
  },
  {
    name: "邮编(中国)",
    pattern: "[1-9]\\d{5}",
    description: "匹配6位邮政编码",
    tags: ["zipcode", "邮编", "邮政"],
  },
  {
    name: "UUID",
    pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
    description: "匹配 UUID 格式",
    tags: ["uuid", "id", "guid"],
  },
  {
    name: "时间(HH:MM)",
    pattern: "([01]?\\d|2[0-3]):[0-5]\\d",
    description: "匹配24小时制时间",
    tags: ["time", "时间"],
  },
  {
    name: "英文单词",
    pattern: "[a-zA-Z]+",
    description: "匹配英文字母组成的单词",
    tags: ["english", "英文", "字母"],
  },
];

function analyzeText(text: string): RegexPattern[] {
  const matches: RegexPattern[] = [];

  if (/[a-zA-Z0-9.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.]+/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "邮箱")!);
  }

  if (/https?:\/\/[\w\-]+(\.[\w\-]+)+/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "URL")!);
  }

  if (/1[3-9]\d{9}/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "手机号(中国)")!);
  }

  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "IP 地址")!);
  }

  if (/\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "日期(yyyy-mm-dd)")!);
  }

  if (/\d{17}[\dXx]/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "身份证号")!);
  }

  if (/[\u4e00-\u9fa5]/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "中文字符")!);
  }

  if (/^-?\d+$/.test(text.trim()) || /(^|\s)-?\d+(\s|$)/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "整数")!);
  }

  if (/-?\d+\.\d+/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "浮点数")!);
  }

  if (/<[^>]+>/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "HTML 标签")!);
  }

  if (/#[0-9a-fA-F]{3,8}/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "十六进制颜色")!);
  }

  if (/[1-9]\d{5}/.test(text) && !/1[3-9]\d{9}/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "邮编(中国)")!);
  }

  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "UUID")!);
  }

  if (/([01]?\d|2[0-3]):[0-5]\d/.test(text)) {
    matches.push(PATTERN_LIBRARY.find((p) => p.name === "时间(HH:MM)")!);
  }

  if (/^[a-zA-Z]+$/.test(text.trim()) || /(^|\s)[a-zA-Z]+(\s|$)/.test(text)) {
    if (!matches.find((m) => m.name === "邮箱") && !matches.find((m) => m.name === "URL")) {
      matches.push(PATTERN_LIBRARY.find((p) => p.name === "英文单词")!);
    }
  }

  return matches;
}

export function RegexReverseTool() {
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ pattern: string; matches: string[] } | null>(null);

  const suggestions = useMemo(() => {
    if (!inputText.trim()) return [];
    return analyzeText(inputText);
  }, [inputText]);

  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return PATTERN_LIBRARY;
    const q = searchQuery.toLowerCase();
    return PATTERN_LIBRARY.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTest = (pattern: string) => {
    if (!inputText.trim()) return;
    try {
      const regex = new RegExp(pattern, "g");
      const matches: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(inputText)) !== null) {
        matches.push(match[0]);
        if (match[0] === "") regex.lastIndex++;
      }
      setTestResult({ pattern, matches });
    } catch {
      setTestResult({ pattern, matches: [] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入要匹配的文本</Label>
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="输入一段文本，系统将分析特征并推荐匹配的正则表达式..."
          className="min-h-[100px] text-sm"
        />
      </div>

      {suggestions.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <Label className="text-sm font-semibold">推荐正则</Label>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.name} className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default">{s.name}</Badge>
                  <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded flex-1 min-w-0 truncate">
                    /{s.pattern}/
                  </code>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleTest(s.pattern)}>
                    测试
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(s.pattern, s.name)}
                  >
                    {copiedKey === s.name ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {inputText.trim() && suggestions.length === 0 && (
        <Card>
          <CardContent className="p-3">
            <p className="text-sm text-muted-foreground">未检测到已知模式，请尝试下方的正则模式库</p>
          </CardContent>
        </Card>
      )}

      {testResult && (
        <Card>
          <CardContent className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm">测试结果</Label>
              <Button variant="ghost" size="sm" onClick={() => setTestResult(null)}>
                关闭
              </Button>
            </div>
            <code className="text-xs font-mono">/{testResult.pattern}/g</code>
            {testResult.matches.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">匹配到 {testResult.matches.length} 个结果：</p>
                <div className="flex flex-wrap gap-1">
                  {testResult.matches.map((m, i) => (
                    <Badge key={i} variant="secondary" className="font-mono text-xs">{m}</Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">无匹配结果</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-3 space-y-2">
          <Label className="text-sm font-semibold">常见正则模式库</Label>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索模式..."
            className="text-sm"
          />
          <div className="space-y-1.5 max-h-[300px] overflow-auto">
            {filteredLibrary.map((p) => (
              <div key={p.name} className="flex items-center gap-2 flex-wrap py-1">
                <span className="text-xs font-medium w-28 shrink-0">{p.name}</span>
                <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded flex-1 min-w-0 truncate">
                  {p.pattern}
                </code>
                <Button variant="ghost" size="sm" className="h-6 text-xs shrink-0" onClick={() => handleTest(p.pattern)}>
                  测试
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleCopy(p.pattern, `lib-${p.name}`)}
                >
                  {copiedKey === `lib-${p.name}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
