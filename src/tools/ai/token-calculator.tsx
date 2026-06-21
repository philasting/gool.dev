"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Cpu, Info } from "lucide-react";

// Token 估算：不同模型的近似 token 计数方式
// 英文: ~4 chars/token, 中文: ~1.5 chars/token
// 实际各模型差异较大，这里给出近似估算

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costInput: number;   // USD per 1M tokens
  costOutput: number;  // USD per 1M tokens
  charsPerTokenEn: number;
  charsPerTokenZh: number;
}

const MODELS: ModelInfo[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", maxTokens: 128000, costInput: 2.50, costOutput: 10.00, charsPerTokenEn: 4.0, charsPerTokenZh: 1.5 },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", maxTokens: 128000, costInput: 0.15, costOutput: 0.60, charsPerTokenEn: 4.0, charsPerTokenZh: 1.5 },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI", maxTokens: 1048576, costInput: 2.00, costOutput: 8.00, charsPerTokenEn: 4.0, charsPerTokenZh: 1.5 },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI", maxTokens: 1048576, costInput: 0.40, costOutput: 1.60, charsPerTokenEn: 4.0, charsPerTokenZh: 1.5 },
  { id: "claude-4-sonnet", name: "Claude 4 Sonnet", provider: "Anthropic", maxTokens: 200000, costInput: 3.00, costOutput: 15.00, charsPerTokenEn: 4.5, charsPerTokenZh: 1.0 },
  { id: "claude-4-haiku", name: "Claude 4 Haiku", provider: "Anthropic", maxTokens: 200000, costInput: 1.00, costOutput: 5.00, charsPerTokenEn: 4.5, charsPerTokenZh: 1.0 },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", maxTokens: 1048576, costInput: 1.25, costOutput: 10.00, charsPerTokenEn: 4.0, charsPerTokenZh: 1.5 },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", maxTokens: 1048576, costInput: 0.15, costOutput: 0.60, charsPerTokenEn: 4.0, charsPerTokenZh: 1.5 },
  { id: "deepseek-v3", name: "DeepSeek V3", provider: "DeepSeek", maxTokens: 64000, costInput: 0.27, costOutput: 1.10, charsPerTokenEn: 4.0, charsPerTokenZh: 1.2 },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", maxTokens: 64000, costInput: 0.55, costOutput: 2.19, charsPerTokenEn: 4.0, charsPerTokenZh: 1.2 },
  { id: "qwen-max", name: "通义千问 Max", provider: "阿里云", maxTokens: 32000, costInput: 2.50, costOutput: 10.00, charsPerTokenEn: 4.0, charsPerTokenZh: 1.5 },
  { id: "ernie-4.5", name: "文心一言 4.5", provider: "百度", maxTokens: 32000, costInput: 1.50, costOutput: 6.00, charsPerTokenEn: 4.0, charsPerTokenZh: 1.5 },
];

function estimateTokens(text: string, model: ModelInfo): { enTokens: number; zhTokens: number; totalTokens: number } {
  const zhCount = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const enCount = text.length - zhCount;
  const enTokens = Math.ceil(enCount / model.charsPerTokenEn);
  const zhTokens = Math.ceil(zhCount / model.charsPerTokenZh);
  return { enTokens, zhTokens, totalTokens: enTokens + zhTokens };
}

export function TokenCalculatorTool() {
  const [text, setText] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);

  const model = MODELS.find((m) => m.id === selectedModel)!;
  const tokens = estimateTokens(text, model);

  const inputCost = (tokens.totalTokens / 1000000) * model.costInput;
  const outputCost = (tokens.totalTokens / 1000000) * model.costOutput;

  const usagePercent = Math.min(100, Math.round((tokens.totalTokens / model.maxTokens) * 100));

  return (
    <div className="space-y-6">
      {/* 模型选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cpu className="h-5 w-5 text-blue-500" />
            选择模型
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                  selectedModel === m.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                }`}
              >
                <p className="font-medium text-sm">{m.name}</p>
                <p className="opacity-70">{m.provider}</p>
                <p className="opacity-50 mt-0.5">{m.maxTokens.toLocaleString()} tokens</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 输入 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">输入文本</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="粘贴或输入文本以计算 Token 数量..."
            rows={8}
            className="min-h-[160px]"
          />
        </CardContent>
      </Card>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">总字符数</p>
            <p className="text-2xl font-bold">{text.length.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">预估 Token</p>
            <p className="text-2xl font-bold text-blue-600">{tokens.totalTokens.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">中文字符</p>
            <p className="text-xl font-bold">{tokens.zhTokens.toLocaleString()} tokens</p>
            <p className="text-[10px] text-muted-foreground">
              ~{(tokens.zhTokens * 100 / Math.max(1, tokens.totalTokens)).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">英文/其他</p>
            <p className="text-xl font-bold">{tokens.enTokens.toLocaleString()} tokens</p>
            <p className="text-[10px] text-muted-foreground">
              ~{(tokens.enTokens * 100 / Math.max(1, tokens.totalTokens)).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 上下文窗口与成本 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">上下文窗口占比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>使用量</span>
                <span className="font-medium">{tokens.totalTokens.toLocaleString()} / {model.maxTokens.toLocaleString()} tokens</span>
              </div>
              <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercent > 90 ? "bg-red-500" : usagePercent > 60 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {usagePercent > 90
                  ? "⚠️ 接近上限，建议精简或切换到更大上下文窗口的模型"
                  : usagePercent > 60
                  ? "⚠️ 使用较多，注意输出 token 限制"
                  : "✅ 使用量正常"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">预估成本 (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>输入费用</span>
                <span className="font-medium text-blue-600">${inputCost.toFixed(6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>输出费用 (等量)</span>
                <span className="font-medium text-purple-600">${outputCost.toFixed(6)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-bold">
                <span>往返合计</span>
                <span>${(inputCost + outputCost).toFixed(6)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                * 基于 {model.name} 官方定价估算，不含思考 Token。实际成本可能因计费方式不同而有差异。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium mb-1">Token 计算说明</p>
          <p>不同模型的 Tokenizer 实现不同，此处为近似估算。英文约 {model.charsPerTokenEn} 字符/token，中文约 {model.charsPerTokenZh} 字符/token。精准计算请使用各模型的官方 Tokenizer（如 tiktoken for OpenAI）。</p>
        </div>
      </div>
    </div>
  );
}
