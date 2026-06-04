"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Search } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface AsciiEntry {
  decimal: number;
  hex: string;
  character: string;
  description: string;
  printable: boolean;
}

function getAsciiTable(): AsciiEntry[] {
  const descriptions: Record<number, string> = {
    0: "NUL 空字符",
    1: "SOH 标题开始",
    2: "STX 正文开始",
    3: "ETX 正文结束",
    4: "EOT 传输结束",
    5: "ENQ 请求",
    6: "ACK 确认",
    7: "BEL 响铃",
    8: "BS 退格",
    9: "HT 水平制表符",
    10: "LF 换行",
    11: "VT 垂直制表符",
    12: "FF 换页",
    13: "CR 回车",
    14: "SO 移出",
    15: "SI 移入",
    16: "DLE 数据链路转义",
    17: "DC1 设备控制1",
    18: "DC2 设备控制2",
    19: "DC3 设备控制3",
    20: "DC4 设备控制4",
    21: "NAK 否认",
    22: "SYN 同步空闲",
    23: "ETB 传输块结束",
    24: "CAN 取消",
    25: "EM 媒介结束",
    26: "SUB 替换",
    27: "ESC 转义",
    28: "FS 文件分隔符",
    29: "GS 组分隔符",
    30: "RS 记录分隔符",
    31: "US 单元分隔符",
    32: "Space 空格",
    127: "DEL 删除",
  };

  const table: AsciiEntry[] = [];
  for (let i = 0; i <= 127; i++) {
    const printable = i >= 32 && i !== 127;
    table.push({
      decimal: i,
      hex: i.toString(16).toUpperCase().padStart(2, "0"),
      character: printable ? String.fromCharCode(i) : "",
      description: descriptions[i] || String.fromCharCode(i),
      printable,
    });
  }
  return table;
}

const ASCII_TABLE = getAsciiTable();
const CONTROL_CHARS = ASCII_TABLE.filter((e) => !e.printable);
const PRINTABLE_CHARS = ASCII_TABLE.filter((e) => e.printable);

export function AsciiTableTool() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filterEntries = (entries: AsciiEntry[]): AsciiEntry[] => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.decimal.toString().includes(q) ||
        e.hex.toLowerCase().includes(q) ||
        e.character.includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  };

  const filteredControl = useMemo(() => filterEntries(CONTROL_CHARS), [search]);
  const filteredPrintable = useMemo(() => filterEntries(PRINTABLE_CHARS), [search]);

  const handleCopyChar = async (entry: AsciiEntry) => {
    const text = entry.character || String.fromCharCode(entry.decimal);
    await copyToClipboard(text);
    setCopiedId(entry.decimal);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderTable = (title: string, entries: AsciiEntry[]) => (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        {title}
        <Badge variant="secondary" className="text-xs">{entries.length} 项</Badge>
      </h3>
      <div className="overflow-x-auto max-h-[300px] overflow-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-3 text-xs text-muted-foreground font-medium w-12">十进制</th>
              <th className="text-left py-2 pr-3 text-xs text-muted-foreground font-medium w-12">十六进制</th>
              <th className="text-left py-2 pr-3 text-xs text-muted-foreground font-medium w-12">字符</th>
              <th className="text-left py-2 text-xs text-muted-foreground font-medium">描述</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.decimal}
                className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleCopyChar(entry)}
                title="点击复制字符"
              >
                <td className="py-1.5 pr-3 font-mono text-xs">{entry.decimal}</td>
                <td className="py-1.5 pr-3 font-mono text-xs">{entry.hex}</td>
                <td className="py-1.5 pr-3 font-mono text-xs">
                  {entry.character ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-sm">
                      {entry.character === " " ? "␣" : entry.character}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-1.5 text-xs">
                  {entry.description}
                  {copiedId === entry.decimal && (
                    <Check className="h-3 w-3 inline-block ml-2 text-green-500" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索十进制、十六进制、字符或描述..."
            className="pl-9 text-sm"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-6">
          {renderTable("控制字符 (0-31)", filteredControl)}
          {renderTable("可打印字符 (32-126)", filteredPrintable)}
          {/* 127 DEL is in control chars */}
        </CardContent>
      </Card>
    </div>
  );
}
