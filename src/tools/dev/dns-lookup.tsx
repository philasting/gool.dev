"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Search, AlertCircle } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT";

interface DnsRecord {
  name: string;
  type: number;
  ttl: number;
  data: string;
}

const TYPE_MAP: Record<number, string> = {
  1: "A",
  28: "AAAA",
  5: "CNAME",
  15: "MX",
  16: "TXT",
};

const TYPE_TO_NUM: Record<string, number> = {
  A: 1,
  AAAA: 28,
  CNAME: 5,
  MX: 15,
  TXT: 16,
};

export function DnsLookupTool() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState<DnsRecordType>("A");
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { copied, handleCopy } = useCopyState();

  const lookup = async () => {
    const trimmed = domain.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setRecords([]);

    try {
      const typeNum = TYPE_TO_NUM[recordType];
      const url = `https://dns.google/resolve?name=${encodeURIComponent(trimmed)}&type=${typeNum}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.Status === 3) {
        setError(`域名 ${trimmed} 不存在 (NXDOMAIN)`);
        return;
      }

      if (data.Status !== 0) {
        setError(`DNS 查询失败，状态码: ${data.Status}`);
        return;
      }

      const answerRecords: DnsRecord[] = (data.Answer || []).map(
        (ans: { name?: string; type?: number; TTL?: number; data?: string }) => ({
          name: ans.name || "",
          type: ans.type || 0,
          ttl: ans.TTL || 0,
          data: ans.data || "",
        })
      );

      if (answerRecords.length === 0) {
        setError(`未找到 ${recordType} 记录`);
        return;
      }

      setRecords(answerRecords);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("网络请求失败，可能是跨域限制。请尝试使用代理或浏览器扩展。");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const allRecordsText = records
    .map((r) => `${TYPE_MAP[r.type] || r.type}\t${r.ttl}s\t${r.data}`)
    .join("\n");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Label className="text-sm">域名</Label>
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="font-mono text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") lookup();
            }}
          />
        </div>
        <div className="w-full sm:w-36">
          <Label className="text-sm">记录类型</Label>
          <div className="flex gap-1 flex-wrap mt-0.5">
            {(["A", "AAAA", "CNAME", "MX", "TXT"] as DnsRecordType[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={recordType === t ? "default" : "outline"}
                onClick={() => setRecordType(t)}
                className="text-xs h-8"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
        <div className="shrink-0 self-end">
          <Button onClick={lookup} disabled={loading || !domain.trim()}>
            <Search className="h-4 w-4 mr-1" />
            {loading ? "查询中..." : "查询"}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="p-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {records.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {domain} — {recordType} 记录
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(allRecordsText)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "已复制" : "复制全部"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">类型</th>
                    <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">TTL</th>
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">值</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4">
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_MAP[r.type] || r.type}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                        {r.ttl}s
                      </td>
                      <td className="py-2 font-mono text-xs break-all">
                        <span
                          className="cursor-pointer hover:text-primary transition-colors"
                          onClick={() => copyToClipboard(r.data)}
                          title="点击复制"
                        >
                          {r.data}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
