"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight, Search } from "lucide-react";

/**
 * Kinship relationship types
 */
type Relation =
  | "父" | "母" | "兄" | "弟" | "姐" | "妹"
  | "子" | "女" | "夫" | "妻"
  | "祖父" | "祖母" | "外祖父" | "外祖母"
  | "伯父" | "叔父" | "姑母" | "舅父" | "姨母"
  | "堂兄" | "堂弟" | "堂姐" | "堂妹"
  | "表兄" | "表弟" | "表姐" | "表妹"
  | "侄子" | "侄女" | "外甥" | "外甥女"
  | "孙子" | "孙女" | "外孙" | "外孙女"
  | "公公" | "婆婆" | "岳父" | "岳母"
  | "大伯子" | "小叔子" | "大姑子" | "小姑子"
  | "大舅子" | "小舅子" | "大姨子" | "小姨子"
  | "妯娌" | "连襟" | "嫂子" | "弟妹"
  | "丈夫" | "妻子" | "儿子" | "女儿"
  | "哥哥" | "弟弟" | "姐姐" | "妹妹"
  | "爸爸" | "妈妈" | "爷爷" | "奶奶"
  | "外公" | "外婆" | "伯伯" | "叔叔"
  | "姑姑" | "舅舅" | "姨妈";

/**
 * Step-by-step chain resolution map.
 * Key: current_relation + next_step → result_relation
 *
 * Format: "当前关系:下一步" → "结果关系"
 */
const KINSHIP_CHAIN: Record<string, string> = {
  // From 父 (father)
  "父:父": "祖父",
  "父:母": "祖母",
  "父:兄": "伯父",
  "父:弟": "叔父",
  "父:姐": "姑母",
  "父:妹": "姑母",
  "父:子": "兄弟",
  "父:女": "姐妹",
  "父:妻": "母",

  // From 母 (mother)
  "母:父": "外祖父",
  "母:母": "外祖母",
  "母:兄": "舅父",
  "母:弟": "舅父",
  "母:姐": "姨母",
  "母:妹": "姨母",
  "母:子": "兄弟",
  "母:女": "姐妹",
  "母:夫": "父",

  // From 兄 (older brother)
  "兄:妻": "嫂子",
  "兄:子": "侄子",
  "兄:女": "侄女",
  "兄:父": "父",
  "兄:母": "母",

  // From 弟 (younger brother)
  "弟:妻": "弟妹",
  "弟:子": "侄子",
  "弟:女": "侄女",
  "弟:父": "父",
  "弟:母": "母",

  // From 姐 (older sister)
  "姐:夫": "姐夫",
  "姐:子": "外甥",
  "姐:女": "外甥女",

  // From 妹 (younger sister)
  "妹:夫": "妹夫",
  "妹:子": "外甥",
  "妹:女": "外甥女",

  // From 子 (son)
  "子:子": "孙子",
  "子:女": "孙女",
  "子:妻": "儿媳",

  // From 女 (daughter)
  "女:子": "外孙",
  "女:女": "外孙女",
  "女:夫": "女婿",

  // From 夫 (husband)
  "夫:父": "公公",
  "夫:母": "婆婆",
  "夫:兄": "大伯子",
  "夫:弟": "小叔子",
  "夫:姐": "大姑子",
  "夫:妹": "小姑子",

  // From 妻 (wife)
  "妻:父": "岳父",
  "妻:母": "岳母",
  "妻:兄": "大舅子",
  "妻:弟": "小舅子",
  "妻:姐": "大姨子",
  "妻:妹": "小姨子",

  // From 伯父 (father's older brother)
  "伯父:子": "堂兄",
  "伯父:女": "堂姐",

  // From 叔父 (father's younger brother)
  "叔父:子": "堂弟",
  "叔父:女": "堂妹",

  // From 姑母 (father's sister)
  "姑母:子": "表兄",
  "姑母:女": "表姐",

  // From 舅父 (mother's brother)
  "舅父:子": "表兄",
  "舅父:女": "表姐",

  // From 姨母 (mother's sister)
  "姨母:子": "表兄",
  "姨母:女": "表姐",

  // From 祖父 (grandfather)
  "祖父:父": "曾祖父",
  "祖父:母": "曾祖母",
  "祖父:兄": "伯祖父",
  "祖父:弟": "叔祖父",

  // From 孙子 (grandson)
  "孙子:子": "曾孙",
  "孙子:女": "曾孙女",

  // From 外孙
  "外孙:子": "外曾孙",
  "外孙:女": "外曾孙女",
};

/**
 * Normalize a relation term to its canonical form.
 */
function normalizeRelation(term: string): string {
  const aliases: Record<string, string> = {
    "爸爸": "父",
    "妈妈": "母",
    "爷爷": "祖父",
    "奶奶": "祖母",
    "外公": "外祖父",
    "外婆": "外祖母",
    "伯伯": "伯父",
    "叔叔": "叔父",
    "姑姑": "姑母",
    "舅舅": "舅父",
    "姨妈": "姨母",
    "哥哥": "兄",
    "弟弟": "弟",
    "姐姐": "姐",
    "妹妹": "妹",
    "丈夫": "夫",
    "妻子": "妻",
    "老公": "夫",
    "老婆": "妻",
    "儿子": "子",
    "女儿": "女",
    "祖父的兄": "伯祖父",
    "祖父的弟": "叔祖父",
  };
  return aliases[term] || term;
}

/**
 * Convert display name back to canonical form for chain lookup.
 */
function displayToCanonical(display: string): string {
  const map: Record<string, string> = {
    "爸爸": "父", "妈妈": "母",
    "爷爷": "祖父", "奶奶": "祖母",
    "外公": "外祖父", "外婆": "外祖母",
    "伯伯": "伯父", "叔叔": "叔父",
    "姑姑": "姑母", "舅舅": "舅父", "姨妈": "姨母",
    "哥哥": "兄", "弟弟": "弟", "姐姐": "姐", "妹妹": "妹",
    "老公": "夫", "老婆": "妻",
    "儿子": "子", "女儿": "女",
    "丈夫": "夫", "妻子": "妻",
  };
  return map[display] || display;
}

/**
 * Convert canonical relation to display-friendly name.
 */
function canonicalToDisplay(relation: string): string {
  const map: Record<string, string> = {
    "父": "爸爸", "母": "妈妈",
    "祖父": "爷爷", "祖母": "奶奶",
    "外祖父": "外公", "外祖母": "外婆",
    "伯父": "伯伯", "叔父": "叔叔",
    "姑母": "姑姑", "舅父": "舅舅", "姨母": "姨妈",
    "兄": "哥哥", "弟": "弟弟", "姐": "姐姐", "妹": "妹妹",
    "夫": "丈夫", "妻": "妻子",
    "子": "儿子", "女": "女儿",
    "兄弟": "兄弟", "姐妹": "姐妹",
  };
  return map[relation] || relation;
}

/**
 * Parse the input chain like "爸爸的哥哥的儿子"
 * Returns array of step strings.
 */
function parseChain(input: string): string[] {
  return input
    .split("的")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Resolve a kinship chain step by step.
 */
function resolveChain(steps: string[]): { result: string; trace: string[] } | null {
  if (steps.length === 0) return null;

  let current = displayToCanonical(steps[0]);
  const trace = [`${steps[0]} → ${canonicalToDisplay(current)}`];

  for (let i = 1; i < steps.length; i++) {
    const step = displayToCanonical(steps[i]);
    const key = `${current}:${step}`;
    const next = KINSHIP_CHAIN[key];

    if (!next) {
      trace.push(`${step} → ❌ 未知关系`);
      return { result: "", trace };
    }

    current = next;
    trace.push(`${steps[i]} → ${canonicalToDisplay(current)}`);
  }

  return { result: canonicalToDisplay(current), trace };
}

/**
 * Reverse lookup: find all chains that lead to a given relation name.
 */
function reverseLookup(targetDisplay: string): string[] {
  const results: string[] = [];
  const target = displayToCanonical(targetDisplay);

  // Search through chain table
  for (const [key, val] of Object.entries(KINSHIP_CHAIN)) {
    if (normalizeRelation(val) === target || val === target) {
      const [from, step] = key.split(":");
      const fromDisplay = canonicalToDisplay(from);
      const stepDisplay = canonicalToDisplay(step);
      results.push(`${fromDisplay}的${stepDisplay}`);
    }
  }

  // Also check direct canonical mappings
  if (canonicalToDisplay(target) === targetDisplay) {
    // Check if any base relation maps to this
    const baseRelations = ["父", "母", "兄", "弟", "姐", "妹", "子", "女", "夫", "妻"];
    for (const base of baseRelations) {
      if (base === target) {
        results.unshift(canonicalToDisplay(base));
      }
    }
  }

  return [...new Set(results)];
}

export function KinshipCalculatorTool() {
  const [chainInput, setChainInput] = useState("");
  const [reverseInput, setReverseInput] = useState("");
  const [result, setResult] = useState<{ result: string; trace: string[] } | null>(null);
  const [reverseResults, setReverseResults] = useState<string[]>([]);

  const handleCalculate = () => {
    if (!chainInput.trim()) return;

    const steps = parseChain(chainInput.trim());
    if (steps.length === 0) {
      setResult(null);
      return;
    }

    const resolved = resolveChain(steps);
    setResult(resolved);
  };

  const handleReverseLookup = () => {
    if (!reverseInput.trim()) return;
    const results = reverseLookup(reverseInput.trim());
    setReverseResults(results);
  };

  const exampleChains = [
    "爸爸的哥哥的儿子",
    "妈妈的姐姐的女儿",
    "爸爸的爸爸的哥哥",
    "丈夫的妈妈",
    "妻子的弟弟",
    "哥哥的妻子",
    "爸爸的弟弟的儿子",
    "妈妈的哥哥",
  ];

  const exampleRelations = [
    "堂兄", "表姐", "侄子", "外甥",
    "岳父", "婆婆", "嫂子", "爷爷",
  ];

  return (
    <div className="space-y-4">
      {/* Forward lookup */}
      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">关系链查询</span>
          </div>

          <div className="space-y-2">
            <Label>输入关系链（如：爸爸的哥哥的儿子）</Label>
            <div className="flex gap-2">
              <Input
                value={chainInput}
                onChange={(e) => setChainInput(e.target.value)}
                placeholder="爸爸的哥哥的儿子"
                onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
                className="flex-1"
              />
              <Button onClick={handleCalculate} size="sm" disabled={!chainInput.trim()}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {result && (
            <div className="space-y-2">
              {result.result ? (
                <div className="text-center py-2">
                  <p className="text-2xl font-bold text-primary">{result.result}</p>
                </div>
              ) : (
                <p className="text-sm text-amber-600 text-center">无法解析该关系链</p>
              )}

              <div className="text-xs space-y-1">
                <p className="text-muted-foreground font-medium">推导过程：</p>
                {result.trace.map((step, i) => (
                  <p key={i} className="text-muted-foreground pl-2">
                    {i + 1}. {step}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">示例：</p>
            <div className="flex flex-wrap gap-1">
              {exampleChains.map((ex) => (
                <Badge
                  key={ex}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    setChainInput(ex);
                  }}
                >
                  {ex}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reverse lookup */}
      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">反向查询</span>
          </div>

          <div className="space-y-2">
            <Label>输入称谓，查看可能的称呼方式</Label>
            <div className="flex gap-2">
              <Input
                value={reverseInput}
                onChange={(e) => setReverseInput(e.target.value)}
                placeholder="堂兄"
                onKeyDown={(e) => e.key === "Enter" && handleReverseLookup()}
                className="flex-1"
              />
              <Button onClick={handleReverseLookup} size="sm" disabled={!reverseInput.trim()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {reverseResults.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">「{reverseInput}」可能的称呼方式：</p>
              <div className="flex flex-wrap gap-1">
                {reverseResults.map((r, i) => (
                  <Badge key={i} variant="outline">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {reverseResults.length === 0 && reverseInput && (
            <p className="text-xs text-muted-foreground">未找到匹配的称呼方式</p>
          )}

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">示例：</p>
            <div className="flex flex-wrap gap-1">
              {exampleRelations.map((ex) => (
                <Badge
                  key={ex}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    setReverseInput(ex);
                  }}
                >
                  {ex}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium">使用说明</p>
          <p>• 关系链查询：输入如「爸爸的哥哥的儿子」，系统逐步推导出「堂兄」</p>
          <p>• 反向查询：输入称谓如「堂兄」，查看可能的称呼方式</p>
          <p>• 支持的称谓：父/母/兄/弟/姐/妹/子/女/夫/妻 及其组合</p>
          <p>• 也支持口语化的「爸爸/妈妈/爷爷/奶奶/外公/外婆」等</p>
        </CardContent>
      </Card>
    </div>
  );
}
