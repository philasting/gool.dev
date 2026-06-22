"use client";
/**
 * Generic trending list display component
 * Used by all platform-specific trending pages
 */
import { RefreshCw, ExternalLink, AlertCircle, Clock, Inbox } from "lucide-react";
import { useTrending, type TrendingItem } from "./_use-trending";

interface TrendingListProps {
  platform: string;
  platformZh: string;
  icon: string;
  accentColor: string;
}

function formatHot(hot: string | number | undefined): string {
  if (!hot) return "";
  const n = typeof hot === "string" ? parseInt(hot.replace(/,/g, ""), 10) : hot;
  if (isNaN(n)) return String(hot);
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + "亿";
  if (n >= 10_000) return (n / 10_000).toFixed(1) + "万";
  return n.toLocaleString();
}

function RankBadge({ rank }: { rank: number }) {
  const base = "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold flex-shrink-0";
  if (rank === 1) return <span className={`${base} bg-rose-500 text-white`}>1</span>;
  if (rank === 2) return <span className={`${base} bg-orange-400 text-white`}>2</span>;
  if (rank === 3) return <span className={`${base} bg-amber-400 text-white`}>3</span>;
  return <span className={`${base} bg-muted text-muted-foreground`}>{rank}</span>;
}

function SkeletonRows() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <div className="w-6 h-6 rounded bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-muted rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
          </div>
          <div className="w-12 h-4 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

function TrendingRow({ item, accentColor }: { item: TrendingItem; accentColor: string }) {
  const hotStr = formatHot(item.hot);
  const maxHot = 100; // visual max for bar width (%)

  const content = (
    <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${item.url ? "hover:bg-muted/60 cursor-pointer" : ""}`}>
      <RankBadge rank={item.rank} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug truncate">{item.title}</p>
        {item.desc && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.desc}</p>
        )}
        {item.author && (
          <p className="text-xs text-muted-foreground mt-0.5">@{item.author}</p>
        )}
        {item.extra && (
          <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.extra}</span>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {hotStr && (
          <span className={`text-xs font-medium ${accentColor}`}>{hotStr}</span>
        )}
        {item.url && (
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>
    </div>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
}

export default function TrendingList({ platform, platformZh, icon, accentColor }: TrendingListProps) {
  const { data, status, error, refetch } = useTrending(platform);

  const updatedAt = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h1 className="text-xl font-bold">{platformZh}</h1>
          {status === "success" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              实时
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {updatedAt} 更新
            </span>
          )}
          <button
            onClick={refetch}
            disabled={status === "loading"}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === "loading" ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {status === "loading" && (
          <div className="p-4">
            <SkeletonRows />
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm">{error}</p>
            <button
              onClick={refetch}
              className="text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              重试
            </button>
          </div>
        )}

        {status === "success" && data && data.items.length > 0 && (
          <div className="divide-y divide-border/50">
            {data.items.map((item) => (
              <TrendingRow key={item.rank} item={item} accentColor={accentColor} />
            ))}
          </div>
        )}

        {status === "success" && data && data.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Inbox className="w-8 h-8" />
            <p className="text-sm">暂无数据，请稍后重试</p>
            <button
              onClick={refetch}
              className="text-xs px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
            >
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
