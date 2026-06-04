"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Copy, Check, ChevronDown, ChevronRight, Search } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface StatusCodeEntry {
  code: number;
  name: string;
  description: string;
}

interface StatusCategory {
  label: string;
  range: string;
  color: string;
  codes: StatusCodeEntry[];
}

const STATUS_CATEGORIES: StatusCategory[] = [
  {
    label: "信息 (1xx)",
    range: "1xx",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    codes: [
      { code: 100, name: "Continue", description: "继续发送请求" },
      { code: 101, name: "Switching Protocols", description: "切换协议" },
      { code: 102, name: "Processing", description: "正在处理" },
      { code: 103, name: "Early Hints", description: "早期提示" },
    ],
  },
  {
    label: "成功 (2xx)",
    range: "2xx",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    codes: [
      { code: 200, name: "OK", description: "请求成功" },
      { code: 201, name: "Created", description: "已创建资源" },
      { code: 202, name: "Accepted", description: "已接受请求" },
      { code: 203, name: "Non-Authoritative Information", description: "非权威信息" },
      { code: 204, name: "No Content", description: "无内容返回" },
      { code: 205, name: "Reset Content", description: "重置内容" },
      { code: 206, name: "Partial Content", description: "部分内容" },
      { code: 207, name: "Multi-Status", description: "多状态" },
      { code: 208, name: "Already Reported", description: "已报告" },
      { code: 226, name: "IM Used", description: "IM 已使用" },
    ],
  },
  {
    label: "重定向 (3xx)",
    range: "3xx",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    codes: [
      { code: 300, name: "Multiple Choices", description: "多种选择" },
      { code: 301, name: "Moved Permanently", description: "永久重定向" },
      { code: 302, name: "Found", description: "临时重定向" },
      { code: 303, name: "See Other", description: "查看其他" },
      { code: 304, name: "Not Modified", description: "未修改" },
      { code: 305, name: "Use Proxy", description: "使用代理" },
      { code: 307, name: "Temporary Redirect", description: "临时重定向" },
      { code: 308, name: "Permanent Redirect", description: "永久重定向" },
    ],
  },
  {
    label: "客户端错误 (4xx)",
    range: "4xx",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    codes: [
      { code: 400, name: "Bad Request", description: "错误请求" },
      { code: 401, name: "Unauthorized", description: "未授权" },
      { code: 402, name: "Payment Required", description: "需要付款" },
      { code: 403, name: "Forbidden", description: "禁止访问" },
      { code: 404, name: "Not Found", description: "未找到资源" },
      { code: 405, name: "Method Not Allowed", description: "方法不允许" },
      { code: 406, name: "Not Acceptable", description: "不可接受" },
      { code: 407, name: "Proxy Authentication Required", description: "需要代理认证" },
      { code: 408, name: "Request Timeout", description: "请求超时" },
      { code: 409, name: "Conflict", description: "冲突" },
      { code: 410, name: "Gone", description: "资源已删除" },
      { code: 411, name: "Length Required", description: "需要内容长度" },
      { code: 412, name: "Precondition Failed", description: "前置条件失败" },
      { code: 413, name: "Payload Too Large", description: "请求体过大" },
      { code: 414, name: "URI Too Long", description: "URI 过长" },
      { code: 415, name: "Unsupported Media Type", description: "不支持的媒体类型" },
      { code: 416, name: "Range Not Satisfiable", description: "范围不满足" },
      { code: 417, name: "Expectation Failed", description: "期望失败" },
      { code: 418, name: "I'm a Teapot", description: "我是茶壶" },
      { code: 421, name: "Misdirected Request", description: "错误定向的请求" },
      { code: 422, name: "Unprocessable Entity", description: "不可处理的实体" },
      { code: 423, name: "Locked", description: "已锁定" },
      { code: 424, name: "Failed Dependency", description: "依赖失败" },
      { code: 425, name: "Too Early", description: "太早" },
      { code: 426, name: "Upgrade Required", description: "需要升级" },
      { code: 428, name: "Precondition Required", description: "需要前置条件" },
      { code: 429, name: "Too Many Requests", description: "请求过多" },
      { code: 431, name: "Request Header Fields Too Large", description: "请求头字段过大" },
      { code: 451, name: "Unavailable For Legal Reasons", description: "因法律原因不可用" },
    ],
  },
  {
    label: "服务端错误 (5xx)",
    range: "5xx",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    codes: [
      { code: 500, name: "Internal Server Error", description: "服务器内部错误" },
      { code: 501, name: "Not Implemented", description: "未实现" },
      { code: 502, name: "Bad Gateway", description: "网关错误" },
      { code: 503, name: "Service Unavailable", description: "服务不可用" },
      { code: 504, name: "Gateway Timeout", description: "网关超时" },
      { code: 505, name: "HTTP Version Not Supported", description: "HTTP 版本不支持" },
      { code: 506, name: "Variant Also Negotiates", description: "变体也协商" },
      { code: 507, name: "Insufficient Storage", description: "存储不足" },
      { code: 508, name: "Loop Detected", description: "检测到循环" },
      { code: 510, name: "Not Extended", description: "未扩展" },
      { code: 511, name: "Network Authentication Required", description: "需要网络认证" },
    ],
  },
];

export function HttpStatusCodesTool() {
  const [search, setSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return STATUS_CATEGORIES;
    const q = search.toLowerCase().trim();
    return STATUS_CATEGORIES.map((cat) => ({
      ...cat,
      codes: cat.codes.filter(
        (c) =>
          c.code.toString().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.description.includes(q)
      ),
    })).filter((cat) => cat.codes.length > 0);
  }, [search]);

  const toggleCategory = (label: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const handleCopy = async (code: number, name: string) => {
    const text = `${code} ${name}`;
    await copyToClipboard(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalCodes = STATUS_CATEGORIES.reduce((sum, cat) => sum + cat.codes.length, 0);
  const filteredCount = filteredCategories.reduce((sum, cat) => sum + cat.codes.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索状态码、名称或描述..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {search ? `${filteredCount}/${totalCodes} 个结果` : `共 ${totalCodes} 个状态码`}
        </span>
      </div>

      <div className="space-y-3">
        {filteredCategories.map((category) => {
          const isCollapsed = collapsedCategories.has(category.label);
          return (
            <Card key={category.label}>
              <CardContent className="p-0">
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                  onClick={() => toggleCategory(category.label)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${category.color}`}>
                      {category.range}
                    </span>
                    <Label className="text-sm font-medium cursor-pointer">{category.label}</Label>
                    <span className="text-xs text-muted-foreground">({category.codes.length})</span>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-border border-t">
                    {category.codes.map((entry) => {
                      const copyText = `${entry.code} ${entry.name}`;
                      const isCopied = copiedCode === copyText;
                      return (
                        <button
                          key={entry.code}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent/30 transition-colors text-left"
                          onClick={() => handleCopy(entry.code, entry.name)}
                        >
                          <code className="text-sm font-mono font-bold w-10 shrink-0 text-right">
                            {entry.code}
                          </code>
                          <span className="text-sm font-medium min-w-[140px]">{entry.name}</span>
                          <span className="text-xs text-muted-foreground flex-1">{entry.description}</span>
                          <span className="shrink-0">
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          没有匹配的状态码
        </div>
      )}
    </div>
  );
}
