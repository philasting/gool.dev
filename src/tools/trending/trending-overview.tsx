"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ExternalLink, AlertCircle, Clock, TrendingUp, Inbox } from "lucide-react";
import { useTrending } from "./_use-trending";

const PLATFORMS = [
  { id: "weibo",    labelZh: "微博",   icon: "🔥", accent: "text-rose-500",   border: "border-rose-200 dark:border-rose-900" },
  { id: "zhihu",    labelZh: "知乎",   icon: "💡", accent: "text-blue-500",   border: "border-blue-200 dark:border-blue-900" },
  { id: "bilibili", labelZh: "B站",    icon: "📺", accent: "text-pink-500",   border: "border-pink-200 dark:border-pink-900" },
  { id: "github",   labelZh: "GitHub", icon: "🐙", accent: "text-violet-500", border: "border-violet-200 dark:border-violet-900" },
  { id: "douyin",   labelZh: "抖音",   icon: "🎵", accent: "text-cyan-500",   border: "border-cyan-200 dark:border-cyan-900" },
  { id: "juejin",   labelZh: "掘金",   icon: "⛏️", accent: "text-amber-500", border: "border-amber-200 dark:border-amber-900" },
];

function PlatformColumn({ platformId, labelZh, icon, accent, border }: {
  platformId: string;
  labelZh: string;
  icon: string;
  accent: string;
  border: string;
}) {
  const { data, status, error, refetch } = useTrending(platformId);

  const updatedAt = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`flex flex-col rounded-xl border ${border} bg-card overflow-hidden`}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span className="font-semibold text-sm">{labelZh}</span>
          {status === "success" && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {updatedAt && (
            <span className="text-xs text-muted-foreground hidden xl:flex items-center gap-1">
              <Clock className="w-3 h-3" />{updatedAt}
            </span>
          )}
          <button onClick={refetch} disabled={status === "loading"} title="刷新"
            className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-40">
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${status === "loading" ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)", minHeight: 300 }}>
        {status === "loading" && (
          <div className="p-3 space-y-2 animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-5 h-4 bg-muted rounded flex-shrink-0 mt-0.5" />
                <div className="h-4 bg-muted rounded flex-1" style={{ width: `${60 + (i % 4) * 8}%` }} />
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-xs">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <span>{error}</span>
            <button onClick={refetch}
              className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs hover:opacity-90">
              重试
            </button>
          </div>
        )}

        {status === "success" && data && data.items.length > 0 && (
          <ol className="py-1">
            {data.items.slice(0, 25).map((item) => (
              <li key={item.rank}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 px-3 py-1.5 hover:bg-muted/60 transition-colors group">
                    <span className={`text-xs font-bold w-5 text-right flex-shrink-0 mt-0.5 ${
                      item.rank <= 3 ? accent : "text-muted-foreground"
                    }`}>{item.rank}</span>
                    <span className="text-xs leading-snug flex-1 min-w-0 line-clamp-2">{item.title}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
                  </a>
                ) : (
                  <div className="flex items-start gap-2 px-3 py-1.5">
                    <span className={`text-xs font-bold w-5 text-right flex-shrink-0 mt-0.5 ${
                      item.rank <= 3 ? accent : "text-muted-foreground"
                    }`}>{item.rank}</span>
                    <span className="text-xs leading-snug flex-1 min-w-0">{item.title}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}

        {status === "success" && data && data.items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-xs">
            <Inbox className="w-6 h-6" />
            <span>暂无数据</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrendingOverview() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-rose-500" />
          <h1 className="text-xl font-bold">热榜总览</h1>
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
            6 个平台 · 实时
          </span>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">
          数据每 5 分钟刷新 · 点击条目可跳转原文
        </p>
      </div>

      {/* 3-column grid (6 platforms = 2 rows) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {PLATFORMS.map((p) => (
          <PlatformColumn
            key={`${p.id}-${refreshKey}`}
            platformId={p.id}
            labelZh={p.labelZh}
            icon={p.icon}
            accent={p.accent}
            border={p.border}
          />
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        热榜数据来自公开 API，仅供参考，5 分钟 CDN 缓存
      </p>
    </div>
  );
}
