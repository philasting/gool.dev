"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface UrlParts {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
  href: string;
}

interface QueryParam {
  key: string;
  value: string;
}

function parseUrl(urlStr: string): UrlParts | null {
  try {
    const url = new URL(urlStr);
    return {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      href: url.href,
    };
  } catch {
    return null;
  }
}

function getQueryParams(search: string): QueryParam[] {
  if (!search) return [];
  const params = new URLSearchParams(search);
  const result: QueryParam[] = [];
  params.forEach((value, key) => {
    result.push({ key, value });
  });
  return result;
}

export function UrlParserTool() {
  const [input, setInput] = useState("https://example.com:8080/path/to/page?name=test&age=30#section");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const parsed = useMemo(() => parseUrl(input), [input]);
  const queryParams = useMemo(() => (parsed ? getQueryParams(parsed.search) : []), [parsed]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, fieldKey }: { text: string; fieldKey: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0"
      onClick={() => handleCopy(text, fieldKey)}
    >
      {copiedField === fieldKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">输入 URL</Label>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://example.com/path?query=value#hash"
          className="font-mono text-sm"
        />
      </div>

      {parsed ? (
        <>
          {/* URL Parts */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">URL 组成部分</h3>
              <div className="space-y-2">
                {[
                  { label: "Protocol", value: parsed.protocol, key: "protocol" },
                  { label: "Hostname", value: parsed.hostname, key: "hostname" },
                  { label: "Port", value: parsed.port || "(默认)", key: "port" },
                  { label: "Pathname", value: parsed.pathname, key: "pathname" },
                  { label: "Search", value: parsed.search || "(无)", key: "search" },
                  { label: "Hash", value: parsed.hash || "(无)", key: "hash" },
                  { label: "Origin", value: parsed.origin, key: "origin" },
                  { label: "Href", value: parsed.href, key: "href" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {item.label}
                      </Badge>
                      <span className="text-sm font-mono truncate">{item.value}</span>
                    </div>
                    <CopyButton text={item.value} fieldKey={item.key} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Query Parameters */}
          {queryParams.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">查询参数</h3>
                <div className="space-y-2">
                  {queryParams.map((param, i) => (
                    <div
                      key={`param-${i}`}
                      className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <code className="text-sm font-mono text-primary shrink-0">{param.key}</code>
                        <span className="text-muted-foreground">=</span>
                        <span className="text-sm font-mono truncate">{param.value}</span>
                      </div>
                      <CopyButton text={param.value} fieldKey={`param-${i}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        input.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-destructive text-sm">无效的 URL 格式</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
