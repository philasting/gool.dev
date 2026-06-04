"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Copy, Check } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface TimezoneInfo {
  id: string;
  label: string;
  city: string;
  utcOffset: string;
}

const TIMEZONES: TimezoneInfo[] = [
  { id: "UTC", label: "UTC", city: "协调世界时", utcOffset: "+00:00" },
  { id: "Asia/Shanghai", label: "中国标准时间", city: "北京", utcOffset: "+08:00" },
  { id: "Asia/Tokyo", label: "日本标准时间", city: "东京", utcOffset: "+09:00" },
  { id: "Asia/Seoul", label: "韩国标准时间", city: "首尔", utcOffset: "+09:00" },
  { id: "Asia/Singapore", label: "新加坡时间", city: "新加坡", utcOffset: "+08:00" },
  { id: "Asia/Hong_Kong", label: "香港时间", city: "香港", utcOffset: "+08:00" },
  { id: "Asia/Taipei", label: "台北时间", city: "台北", utcOffset: "+08:00" },
  { id: "Asia/Kolkata", label: "印度标准时间", city: "孟买", utcOffset: "+05:30" },
  { id: "Asia/Dubai", label: "海湾标准时间", city: "迪拜", utcOffset: "+04:00" },
  { id: "Asia/Bangkok", label: "印度支那时间", city: "曼谷", utcOffset: "+07:00" },
  { id: "Europe/London", label: "格林威治时间", city: "伦敦", utcOffset: "+00:00" },
  { id: "Europe/Paris", label: "中欧时间", city: "巴黎", utcOffset: "+01:00" },
  { id: "Europe/Berlin", label: "中欧时间", city: "柏林", utcOffset: "+01:00" },
  { id: "Europe/Moscow", label: "莫斯科时间", city: "莫斯科", utcOffset: "+03:00" },
  { id: "America/New_York", label: "美国东部时间", city: "纽约", utcOffset: "-05:00" },
  { id: "America/Chicago", label: "美国中部时间", city: "芝加哥", utcOffset: "-06:00" },
  { id: "America/Denver", label: "美国山区时间", city: "丹佛", utcOffset: "-07:00" },
  { id: "America/Los_Angeles", label: "美国太平洋时间", city: "洛杉矶", utcOffset: "-08:00" },
  { id: "America/Sao_Paulo", label: "巴西利亚时间", city: "圣保罗", utcOffset: "-03:00" },
  { id: "Australia/Sydney", label: "澳大利亚东部时间", city: "悉尼", utcOffset: "+10:00" },
  { id: "Pacific/Auckland", label: "新西兰时间", city: "奥克兰", utcOffset: "+12:00" },
  { id: "Pacific/Honolulu", label: "夏威夷时间", city: "檀香山", utcOffset: "-10:00" },
];

function formatInTimezone(date: Date, tzId: string): string {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: tzId,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      weekday: "short",
    }).format(date);
  } catch {
    return "不支持";
  }
}

function getCurrentOffset(tzId: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tzId,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    return offsetPart?.value || "";
  } catch {
    return "";
  }
}

export function TimezoneConverterTool() {
  const [sourceTime, setSourceTime] = useState("");
  const [sourceTz, setSourceTz] = useState("Asia/Shanghai");
  const [results, setResults] = useState<{ tz: TimezoneInfo; time: string; offset: string }[]>([]);
  const { copied, handleCopy } = useCopyState();

  const handleConvert = useCallback(() => {
    if (!sourceTime) return;

    // Parse the input time as being in the source timezone
    // We use a trick: create the date, then adjust for timezone offset
    const date = new Date(sourceTime);

    // Get the offset difference between local and source timezone
    const sourceFormatted = new Intl.DateTimeFormat("en-US", {
      timeZone: sourceTz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);

    const localFormatted = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);

    // Calculate offset between source and local
    const sourceMs = new Date(sourceFormatted).getTime();
    const localMs = new Date(localFormatted).getTime();
    const offsetDiff = localMs - sourceMs;

    // Adjust the date to represent the same moment
    const adjustedDate = new Date(date.getTime() - offsetDiff + (date.getTime() - new Date(sourceFormatted).getTime()));

    const newResults = TIMEZONES.map((tz) => ({
      tz,
      time: formatInTimezone(adjustedDate, tz.id),
      offset: getCurrentOffset(tz.id),
    }));

    setResults(newResults);
  }, [sourceTime, sourceTz]);

  // Auto-fill current time
  const fillCurrentTime = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setSourceTime(`${year}-${month}-${day}T${hours}:${minutes}`);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm">源时区</Label>
          <Select value={sourceTz} onValueChange={(v) => { if (v) setSourceTz(v); }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.id} value={tz.id}>
                  {tz.city} ({tz.utcOffset})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">时间</Label>
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={sourceTime}
              onChange={(e) => setSourceTime(e.target.value)}
              className="h-8 flex-1"
            />
            <Button variant="outline" size="sm" onClick={fillCurrentTime} className="h-8 shrink-0">
              当前时间
            </Button>
          </div>
        </div>
      </div>

      <Button onClick={handleConvert} disabled={!sourceTime}>
        <Globe className="h-4 w-4 mr-1" /> 转换
      </Button>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => (
            <Card key={result.tz.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{result.tz.city}</span>
                    <span className="text-xs text-muted-foreground">({result.offset || result.tz.utcOffset})</span>
                  </div>
                  <p className="text-sm font-mono">{result.time}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleCopy(`${result.tz.city}: ${result.time}`)}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
