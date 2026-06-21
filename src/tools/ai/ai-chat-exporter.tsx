"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Download, Copy, Check, FileJson, FileText, RotateCcw } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

function parseChat(text: string): Message[] {
  const messages: Message[] = [];
  const lines = text.split("\n");
  let currentRole: Message["role"] | null = null;
  let currentContent: string[] = [];

  const roleMarkers = [
    { pattern: /^你[：:]\s*/, role: "user" as const },
    { pattern: /^我[：:]\s*/, role: "user" as const },
    { pattern: /^(User|Human)[：:]\s*/i, role: "user" as const },
    { pattern: /^(AI|Assistant|Bot|Claude|ChatGPT|GPT)[：:]\s*/i, role: "assistant" as const },
    { pattern: /^(System)[：:]\s*/i, role: "system" as const },
  ];

  const flush = () => {
    if (currentRole && currentContent.length > 0) {
      messages.push({
        role: currentRole,
        content: currentContent.join("\n").trim(),
        timestamp: new Date().toISOString(),
      });
    }
    currentContent = [];
  };

  for (const line of lines) {
    let matched = false;
    for (const marker of roleMarkers) {
      const m = line.match(marker.pattern);
      if (m) {
        flush();
        currentRole = marker.role;
        currentContent.push(line.slice(m[0].length));
        matched = true;
        break;
      }
    }
    if (!matched && currentRole) {
      currentContent.push(line);
    }
  }
  flush();

  // 如果没解析出任何消息，把所有内容当作一个 user 消息
  if (messages.length === 0 && text.trim()) {
    messages.push({ role: "user", content: text.trim() });
  }

  return messages;
}

function exportMarkdown(messages: Message[]): string {
  let md = "# AI 对话记录\n\n";
  md += `> 导出时间：${new Date().toLocaleString()}\n`;
  md += `> 消息数量：${messages.length}\n\n---\n\n`;

  let prevRole = "";
  for (const msg of messages) {
    if (msg.role !== prevRole) {
      const label = msg.role === "user" ? "👤 用户" : msg.role === "assistant" ? "🤖 AI" : "⚙️ 系统";
      md += `### ${label}\n\n`;
      prevRole = msg.role;
    }
    md += `${msg.content}\n\n`;
  }
  return md;
}

function exportJson(messages: Message[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    },
    null,
    2
  );
}

export function AiChatExporterTool() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const parse = () => {
    const result = parseChat(input);
    setMessages(result);
  };

  const download = useCallback(
    (format: "md" | "json") => {
      if (messages.length === 0) return;
      const content = format === "md" ? exportMarkdown(messages) : exportJson(messages);
      const ext = format === "md" ? "md" : "json";
      const mime = format === "md" ? "text/markdown" : "application/json";
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-chat-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [messages]
  );

  const copyJson = async () => {
    const content = exportJson(messages);
    await navigator.clipboard.writeText(content);
    setCopySuccess("json");
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const copyMd = async () => {
    const content = exportMarkdown(messages);
    await navigator.clipboard.writeText(content);
    setCopySuccess("md");
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const reset = () => {
    setInput("");
    setMessages([]);
  };

  // 手动添加消息
  const addMessage = (role: Message["role"]) => {
    setMessages([...messages, { role, content: "", timestamp: new Date().toISOString() }]);
  };

  const updateMessage = (index: number, content: string) => {
    const next = [...messages];
    next[index] = { ...next[index], content };
    setMessages(next);
  };

  const removeMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const roleLabel = (role: Message["role"]) =>
    role === "user" ? "👤 用户" : role === "assistant" ? "🤖 AI" : "⚙️ 系统";

  return (
    <Tabs defaultValue="parse" className="space-y-4">
      <TabsList>
        <TabsTrigger value="parse">解析导入</TabsTrigger>
        <TabsTrigger value="manual">手动编辑</TabsTrigger>
        <TabsTrigger value="export">导出</TabsTrigger>
      </TabsList>

      <TabsContent value="parse" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              粘贴对话记录
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`粘贴你的 AI 对话记录，系统会自动识别角色。\n\n支持的格式：\n你：你好\nAI：你好！有什么可以帮你的？\n\n或：\nUser: Hello\nAssistant: Hi there!\n\n也支持：\n我：...`}
              rows={10}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={parse} disabled={!input.trim()}>
                解析对话
              </Button>
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4 mr-2" />重置
              </Button>
            </div>
          </CardContent>
        </Card>

        {messages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">解析结果 ({messages.length} 条消息)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-50 dark:bg-blue-950/20 ml-4"
                      : msg.role === "assistant"
                      ? "bg-purple-50 dark:bg-purple-950/20 mr-4"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge
                      variant="secondary"
                      className="text-[10px]"
                    >
                      {roleLabel(msg.role)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">第 {i + 1} 条</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm font-sans">{msg.content}</pre>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="manual" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">手动编辑对话</CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => addMessage("user")}>+ 👤</Button>
              <Button size="sm" variant="outline" onClick={() => addMessage("assistant")}>+ 🤖</Button>
              <Button size="sm" variant="outline" onClick={() => addMessage("system")}>+ ⚙️</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                点击上方按钮添加消息，或在「解析导入」标签页粘贴对话记录
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">
                    {roleLabel(msg.role)}
                  </Badge>
                  <button onClick={() => removeMessage(i)} className="text-xs text-red-500 hover:text-red-700">
                    删除
                  </button>
                </div>
                <Textarea
                  value={msg.content}
                  onChange={(e) => updateMessage(i, e.target.value)}
                  placeholder={`${roleLabel(msg.role)} 消息内容...`}
                  rows={3}
                  className="min-h-[80px] text-sm"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="export" className="space-y-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>暂无对话记录</p>
              <p className="text-sm">请先在「解析导入」或「手动编辑」中添加消息</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">导出选项 ({messages.length} 条消息)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button onClick={() => download("md")} variant="outline" className="h-auto py-4 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">导出 Markdown</span>
                    </div>
                    <span className="text-xs text-muted-foreground">.md 文件，带角色标记和时间戳</span>
                  </Button>
                  <Button onClick={() => download("json")} variant="outline" className="h-auto py-4 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-5 w-5" />
                      <span className="font-medium">导出 JSON</span>
                    </div>
                    <span className="text-xs text-muted-foreground">结构化数据，适合程序处理</span>
                  </Button>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={copyMd} variant="outline" size="sm">
                    {copySuccess === "md" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copySuccess === "md" ? "Markdown 已复制" : "复制 Markdown"}
                  </Button>
                  <Button onClick={copyJson} variant="outline" size="sm">
                    {copySuccess === "json" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copySuccess === "json" ? "JSON 已复制" : "复制 JSON"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 预览 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Markdown 预览</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-xs bg-muted/30 rounded-lg p-4 font-mono max-h-[400px] overflow-y-auto">
                  {exportMarkdown(messages)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
