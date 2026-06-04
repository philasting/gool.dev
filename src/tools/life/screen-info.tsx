"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Smartphone } from "lucide-react";

interface ScreenData {
  screenWidth: number;
  screenHeight: number;
  availWidth: number;
  availHeight: number;
  outerWidth: number;
  outerHeight: number;
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
  colorDepth: number;
  orientation: string;
  userAgent: string;
  touchSupport: boolean;
  maxTouchPoints: number;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  online: boolean;
}

function getScreenData(): ScreenData {
  const screen = window.screen;
  const orient = screen.orientation ? screen.orientation.type : "未知";
  let orientLabel = "未知";
  if (orient.includes("portrait")) orientLabel = "竖屏";
  else if (orient.includes("landscape")) orientLabel = "横屏";

  return {
    screenWidth: screen.width,
    screenHeight: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    colorDepth: screen.colorDepth,
    orientation: orientLabel,
    userAgent: navigator.userAgent,
    touchSupport: "ontouchstart" in window,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
  };
}

interface InfoRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export function ScreenInfoTool() {
  const [data, setData] = useState<ScreenData | null>(null);

  const update = useCallback(() => {
    setData(getScreenData());
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [update]);

  if (!data) return null;

  const rows: InfoRow[] = [
    { label: "屏幕分辨率", value: `${data.screenWidth} × ${data.screenHeight}`, highlight: true },
    { label: "可用区域", value: `${data.availWidth} × ${data.availHeight}` },
    { label: "设备像素比 (DPR)", value: `${data.devicePixelRatio}x`, highlight: true },
    { label: "实际像素", value: `${Math.round(data.screenWidth * data.devicePixelRatio)} × ${Math.round(data.screenHeight * data.devicePixelRatio)}` },
    { label: "色深", value: `${data.colorDepth} bit` },
    { label: "屏幕方向", value: data.orientation, highlight: true },
    { label: "浏览器窗口（外部）", value: `${data.outerWidth} × ${data.outerHeight}` },
    { label: "浏览器窗口（内部）", value: `${data.innerWidth} × ${data.innerHeight}`, highlight: true },
    { label: "触摸支持", value: data.touchSupport ? "支持" : "不支持" },
    { label: "触摸点数", value: String(data.maxTouchPoints) },
    { label: "语言", value: data.language },
    { label: "平台", value: data.platform },
    { label: "Cookie", value: data.cookieEnabled ? "已启用" : "已禁用" },
    { label: "网络状态", value: data.online ? "在线" : "离线" },
    { label: "User Agent", value: data.userAgent },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
          <Monitor className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">屏幕信息</h3>
          <p className="text-sm text-muted-foreground">实时检测，窗口大小变化时自动更新</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={`text-sm font-mono ${row.highlight ? "font-semibold text-primary" : ""} max-w-[60%] text-right break-all`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visual representation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">屏幕比例示意</span>
          </div>
          <div className="flex justify-center">
            <div
              className="relative border-2 border-primary/30 rounded-lg bg-muted/30"
              style={{
                width: Math.min(280, (data.screenWidth / data.screenHeight) * 200),
                height: 200,
              }}
            >
              {/* Available area */}
              <div
                className="absolute border border-dashed border-green-500/50 bg-green-500/5 rounded"
                style={{
                  left: `${((data.screenWidth - data.availWidth) / 2 / data.screenWidth) * 100}%`,
                  top: `${((data.screenHeight - data.availHeight) / data.screenHeight) * 100}%`,
                  width: `${(data.availWidth / data.screenWidth) * 100}%`,
                  height: `${(data.availHeight / data.screenHeight) * 100}%`,
                }}
              />
              {/* Browser window */}
              <div
                className="absolute border border-blue-500/50 bg-blue-500/10 rounded"
                style={{
                  left: `${(((data.screenWidth - data.innerWidth) / 2) / data.screenWidth) * 100}%`,
                  top: `${(((data.screenHeight - data.innerHeight) / 2) / data.screenHeight) * 100}%`,
                  width: `${(data.innerWidth / data.screenWidth) * 100}%`,
                  height: `${(data.innerHeight / data.screenHeight) * 100}%`,
                }}
              />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
                {data.screenWidth}×{data.screenHeight} @ {data.devicePixelRatio}x
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border border-primary/30 rounded bg-muted/30" /> 屏幕
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border border-dashed border-green-500/50 rounded bg-green-500/5" /> 可用区域
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border border-blue-500/50 rounded bg-blue-500/10" /> 浏览器窗口
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
