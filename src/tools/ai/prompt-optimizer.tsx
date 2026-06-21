"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, RotateCcw, Check, ArrowDown } from "lucide-react";

// Prompt 优化模板
interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  apply: (prompt: string) => string;
}

const OPTIMIZATION_RULES: OptimizationRule[] = [
  {
    id: "role",
    name: "指定角色",
    description: "明确 AI 扮演的角色和专业背景",
    apply: (p) => {
      if (p.includes("你是一个") || p.includes("你扮演")) return p;
      return `你是一个在该领域的资深专家。\n\n${p}`;
    },
  },
  {
    id: "format",
    name: "指定输出格式",
    description: "明确期望的输出结构（Markdown/JSON/表格等）",
    apply: (p) => {
      if (p.includes("格式") || p.includes("输出为") || p.includes("以") && p.includes("形式")) return p;
      return `${p}\n\n请以清晰的结构化方式输出，使用标题、列表和表格（如适用）。`;
    },
  },
  {
    id: "context",
    name: "提供上下文",
    description: "补充背景信息和约束条件",
    apply: (p) => {
      if (p.includes("背景") || p.includes("前提") || p.includes("约束")) return p;
      return `${p}\n\n背景信息：请确保回答准确、具体、可操作。`;
    },
  },
  {
    id: "steps",
    name: "要求分步骤",
    description: "让 AI 分步骤思考和输出",
    apply: (p) => {
      if (p.includes("步骤") || p.includes("一步步") || p.includes("逐步")) return p;
      return `${p}\n\n请按以下步骤思考和回答：\n1. 先分析问题\n2. 给出方案\n3. 解释为什么`;
    },
  },
  {
    id: "examples",
    name: "提供示例",
    description: "给出期望输出的示例",
    apply: (p) => {
      if (p.includes("示例") || p.includes("例如") || p.includes("比如")) return p;
      return `${p}\n\n示例输出格式：\n[在此提供具体示例]`;
    },
  },
  {
    id: "constraints",
    name: "设定约束",
    description: "明确字数、范围、禁止项等限制",
    apply: (p) => {
      if (p.includes("限制") || p.includes("不超过") || p.includes("不要")) return p;
      return `${p}\n\n约束：请用简洁的语言回答，不超过500字。不要使用过于专业的术语。`;
    },
  },
  {
    id: "tone",
    name: "指定语气",
    description: "设定回答的语气和风格",
    apply: (p) => {
      if (p.includes("语气") || p.includes("风格") || p.includes("口吻")) return p;
      return `${p}\n\n请以专业、友好、易懂的语气回答。`;
    },
  },
  {
    id: "audience",
    name: "指定受众",
    description: "明确目标读者是谁",
    apply: (p) => {
      if (p.includes("受众") || p.includes("面向") || p.includes("读者") || p.includes("用户")) return p;
      return `${p}\n\n目标受众：对技术有一定了解的普通用户。`;
    },
  },
];

// Prompt 模板库
const PROMPT_TEMPLATES = [
  {
    category: "写作",
    items: [
      { name: "文章大纲", prompt: "请为以下主题撰写一份详细的文章大纲：\n\n主题：[在此填写]\n字数：约3000字\n目标读者：[在此填写]" },
      { name: "产品描述", prompt: "请为以下产品撰写一段吸引人的营销描述，突出核心卖点：\n\n产品名称：[在此填写]\n核心功能：[在此填写]\n目标用户：[在此填写]" },
      { name: "邮件撰写", prompt: "请撰写一封专业的商务邮件：\n\n收件人：[在此填写]\n目的：[在此填写]\n语气：专业礼貌" },
    ],
  },
  {
    category: "编程",
    items: [
      { name: "代码生成", prompt: "请用 [语言] 实现以下功能，代码要清晰有注释：\n\n功能描述：[在此填写]\n技术要求：[在此填写]" },
      { name: "Bug 分析", prompt: "我的代码出现了以下错误，请帮我分析原因并给出修复方案：\n\n错误信息：[在此填写]\n相关代码：[在此填写]\n运行环境：[在此填写]" },
      { name: "代码审查", prompt: "请审查以下代码，从正确性、性能、可维护性角度给出建议：\n\n```\n[在此粘贴代码]\n```" },
    ],
  },
  {
    category: "学习",
    items: [
      { name: "概念解释", prompt: "请用通俗易懂的方式解释以下概念，并给出实际例子：\n\n概念：[在此填写]\n我的背景：[在此填写]" },
      { name: "学习计划", prompt: "请为我制定一个学习计划：\n\n目标技能：[在此填写]\n当前水平：[在此填写]\n每周可用时间：[在此填写]\n目标时间：[在此填写]" },
    ],
  },
  {
    category: "创意",
    items: [
      { name: "头脑风暴", prompt: "请就以下主题进行头脑风暴，至少给出10个创意点子：\n\n主题：[在此填写]\n限制条件：[在此填写]" },
      { name: "故事创作", prompt: "请根据以下设定创作一个故事：\n\n题材：[在此填写]\n主角特点：[在此填写]\n核心冲突：[在此填写]\n字数：800-1500字" },
    ],
  },
];

export function PromptOptimizerTool() {
  const [input, setInput] = useState("");
  const [enabledRules, setEnabledRules] = useState<Set<string>>(new Set());
  const [optimized, setOptimized] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("optimize");

  const toggleRule = (id: string) => {
    const next = new Set(enabledRules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEnabledRules(next);
  };

  const selectAll = () => {
    if (enabledRules.size === OPTIMIZATION_RULES.length) {
      setEnabledRules(new Set());
    } else {
      setEnabledRules(new Set(OPTIMIZATION_RULES.map((r) => r.id)));
    }
  };

  const optimize = () => {
    if (!input.trim()) return;
    let result = input;
    OPTIMIZATION_RULES.forEach((rule) => {
      if (enabledRules.has(rule.id)) {
        result = rule.apply(result);
      }
    });
    setOptimized(result);
  };

  const reset = () => {
    setInput("");
    setOptimized("");
    setEnabledRules(new Set());
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(optimized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyTemplate = (prompt: string) => {
    setInput(prompt);
    setActiveTab("optimize");
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="optimize">Prompt 优化</TabsTrigger>
        <TabsTrigger value="templates">模板库</TabsTrigger>
        <TabsTrigger value="guide">最佳实践</TabsTrigger>
      </TabsList>

      <TabsContent value="optimize" className="space-y-4">
        {/* 输入 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
              原始 Prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="在这里输入你的原始 Prompt..."
              rows={5}
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        {/* 优化规则 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">优化规则</CardTitle>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {enabledRules.size === OPTIMIZATION_RULES.length ? "取消全选" : "全选"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {OPTIMIZATION_RULES.map((rule) => (
                <button
                  key={rule.id}
                  onClick={() => toggleRule(rule.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    enabledRules.has(rule.id)
                      ? "bg-purple-500 text-white border-purple-500"
                      : "hover:bg-muted"
                  }`}
                  title={rule.description}
                >
                  {rule.name}
                  {enabledRules.has(rule.id) && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button onClick={optimize} disabled={!input.trim() || enabledRules.size === 0} className="flex-1">
            <Sparkles className="h-4 w-4 mr-2" />
            优化 Prompt
          </Button>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
        </div>

        {/* 优化结果 */}
        {optimized && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-emerald-500" />
                优化后 Prompt
              </CardTitle>
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "已复制" : "复制"}
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded-lg p-4 font-sans">{optimized}</pre>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="templates" className="space-y-4">
        {PROMPT_TEMPLATES.map((cat) => (
          <Card key={cat.category}>
            <CardHeader>
              <CardTitle className="text-lg">{cat.category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cat.items.map((item) => (
                <div
                  key={item.name}
                  className="p-3 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => applyTemplate(item.prompt)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{item.name}</p>
                    <Badge variant="secondary" className="text-[10px]">使用</Badge>
                  </div>
                  <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap font-sans line-clamp-3">
                    {item.prompt}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="guide" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prompt 编写最佳实践</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "1. 明确角色", desc: "告诉 AI 它是谁。例如「你是一个资深前端工程师」比「帮我写代码」效果好得多。" },
              { title: "2. 具体的目标", desc: "用具体的、可衡量的标准描述你想要什么。避免模糊的表述。" },
              { title: "3. 提供上下文", desc: "给出背景信息、约束条件、目标受众。越多上下文，输出越精准。" },
              { title: "4. 设定输出格式", desc: "明确你期望的输出结构：Markdown、JSON、表格、列表等。" },
              { title: "5. 分步骤思考", desc: "复杂任务要求 AI 先分析再回答，避免直接跳到错误结论。" },
              { title: "6. 提供正反面示例", desc: "给出「好的示例」和「不好的示例」，AI 能更准确地理解你的期望。" },
              { title: "7. 迭代优化", desc: "第一次不满意？补充细节、调整约束，持续打磨你的 Prompt。" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-2xl shrink-0">{["🎭", "🎯", "📋", "📐", "🪜", "📝", "🔄"][i]}</span>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
