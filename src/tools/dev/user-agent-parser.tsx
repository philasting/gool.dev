"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Tablet, RefreshCw } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface UAResult {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  engine: string;
}

function parseUA(ua: string): UAResult {
  let browser = "未知";
  let browserVersion = "";
  let os = "未知";
  let osVersion = "";
  let deviceType = "桌面";
  let engine = "未知";

  // Detect browser
  if (/Edg\/(\d+[\.\d]*)/.test(ua)) {
    browser = "Microsoft Edge";
    browserVersion = RegExp.$1;
  } else if (/OPR\/(\d+[\.\d]*)/.test(ua)) {
    browser = "Opera";
    browserVersion = RegExp.$1;
  } else if (/Firefox\/(\d+[\.\d]*)/.test(ua)) {
    browser = "Firefox";
    browserVersion = RegExp.$1;
  } else if (/Chrome\/(\d+[\.\d]*)/.test(ua)) {
    browser = "Chrome";
    browserVersion = RegExp.$1;
  } else if (/Safari\/(\d+[\.\d]*)/.test(ua) && /Version\/(\d+[\.\d]*)/.test(ua)) {
    browser = "Safari";
    browserVersion = RegExp.$1;
  }

  // Detect OS
  if (/Windows NT (\d+\.\d+)/.test(ua)) {
    os = "Windows";
    const ver = RegExp.$1;
    const winVersions: Record<string, string> = {
      "10.0": "10/11",
      "6.3": "8.1",
      "6.2": "8",
      "6.1": "7",
      "6.0": "Vista",
      "5.1": "XP",
    };
    osVersion = winVersions[ver] || ver;
  } else if (/Mac OS X (\d+[._]\d+[._]?\d*)/.test(ua)) {
    os = "macOS";
    osVersion = RegExp.$1.replace(/_/g, ".");
  } else if (/Android (\d+[\.\d]*)/.test(ua)) {
    os = "Android";
    osVersion = RegExp.$1;
  } else if (/iPhone OS (\d+_\d+)/.test(ua)) {
    os = "iOS";
    osVersion = RegExp.$1.replace(/_/g, ".");
  } else if (/iPad.*OS (\d+_\d+)/.test(ua)) {
    os = "iPadOS";
    osVersion = RegExp.$1.replace(/_/g, ".");
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  } else if (/CrOS/.test(ua)) {
    os = "Chrome OS";
  }

  // Detect device type
  if (/Mobi|Android.*Mobile|iPhone|iPod/.test(ua)) {
    deviceType = "移动";
  } else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) {
    deviceType = "平板";
  } else {
    deviceType = "桌面";
  }

  // Detect engine
  if (/AppleWebKit\/(\d+[\.\d]*)/.test(ua)) {
    engine = "WebKit";
    if (/Chrome\//.test(ua)) {
      engine = "Blink";
    }
  } else if (/Gecko\//.test(ua) && /Firefox/.test(ua)) {
    engine = "Gecko";
  } else if (/Trident\/(\d+[\.\d]*)/.test(ua)) {
    engine = "Trident";
  }

  return { browser, browserVersion, os, osVersion, deviceType, engine };
}

export function UserAgentParserTool() {
  const [input, setInput] = useState("");
  const [useCurrent, setUseCurrent] = useState(true);

  const uaString = useCurrent ? (typeof navigator !== "undefined" ? navigator.userAgent : "") : input;

  const result = useMemo(() => parseUA(uaString), [uaString]);

  const deviceIcon = result.deviceType === "移动" ? Smartphone : result.deviceType === "平板" ? Tablet : Monitor;

  const fields = [
    { label: "浏览器", value: result.browser, badge: result.browserVersion },
    { label: "操作系统", value: result.os, badge: result.osVersion },
    { label: "设备类型", value: result.deviceType, icon: deviceIcon },
    { label: "渲染引擎", value: result.engine },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm">User-Agent</Label>
          <Button
            size="sm"
            variant={useCurrent ? "default" : "outline"}
            onClick={() => setUseCurrent(true)}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> 当前浏览器
          </Button>
          <Button
            size="sm"
            variant={!useCurrent ? "default" : "outline"}
            onClick={() => setUseCurrent(false)}
          >
            手动输入
          </Button>
        </div>
        {useCurrent ? (
          <Card>
            <CardContent className="p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
                {uaString}
              </pre>
            </CardContent>
          </Card>
        ) : (
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 User-Agent 字符串..."
            className="font-mono text-sm"
          />
        )}
      </div>

      {/* Parsed result */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => {
              const IconComp = field.icon;
              return (
                <div
                  key={field.label}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => copyToClipboard(field.value)}
                  title="点击复制"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {IconComp ? (
                      <IconComp className="h-5 w-5 text-primary" />
                    ) : (
                      <span className="text-primary font-bold text-sm">
                        {field.label.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{field.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{field.value}</span>
                      {field.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {field.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
