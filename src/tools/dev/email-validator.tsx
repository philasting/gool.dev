"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Mail, MailX, ClipboardList } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/** Simplified RFC 5322 email regex */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

interface EmailResult {
  email: string;
  valid: boolean;
}

export function EmailValidatorTool() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<EmailResult[]>([]);
  const { copied, handleCopy } = useCopyState();

  const validate = () => {
    const lines = input
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const res = lines.map((email) => ({
      email,
      valid: EMAIL_REGEX.test(email),
    }));
    setResults(res);
  };

  const stats = useMemo(() => {
    const valid = results.filter((r) => r.valid).length;
    const invalid = results.length - valid;
    return { total: results.length, valid, invalid };
  }, [results]);

  const validEmails = useMemo(
    () => results.filter((r) => r.valid).map((r) => r.email).join("\n"),
    [results]
  );

  const clear = () => {
    setInput("");
    setResults([]);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">输入邮箱地址（每行一个）</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"user@example.com\ntest@domain.org\ninvalid-email"}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={validate} size="sm">
              <Mail className="h-4 w-4 mr-1" /> 校验
            </Button>
            <Button onClick={clear} variant="outline" size="sm">
              清空
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">校验结果</label>
            {results.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(validEmails)}
                disabled={!validEmails}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "已复制" : "复制合法邮箱"}
              </Button>
            )}
          </div>

          {/* Stats */}
          {results.length > 0 && (
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">总计: <strong>{stats.total}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-green-500" />
                <span className="text-sm">合法: <strong className="text-green-600">{stats.valid}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <MailX className="h-4 w-4 text-red-500" />
                <span className="text-sm">不合法: <strong className="text-red-600">{stats.invalid}</strong></span>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-3 max-h-[300px] overflow-auto custom-scrollbar">
              {results.length === 0 ? (
                <p className="text-muted-foreground text-sm">点击校验按钮查看结果</p>
              ) : (
                <div className="space-y-1">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1 border-b border-border last:border-0"
                    >
                      <span className="text-sm font-mono truncate mr-2">{r.email}</span>
                      {r.valid ? (
                        <Badge variant="default" className="bg-green-600 text-xs shrink-0">
                          合法
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          不合法
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
