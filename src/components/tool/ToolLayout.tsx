"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useFavorites } from "@/hooks/use-favorites";
import { useRecentTools } from "@/hooks/use-recent-tools";
import { getCategoryInfo } from "@/types/tool";
import { getRelatedTools } from "@/tools/registry";
import { toast } from "sonner";
import type { ToolMeta } from "@/types/tool";

interface ToolLayoutProps {
  tool: ToolMeta;
  children: React.ReactNode;
}

export function ToolLayout({ tool, children }: ToolLayoutProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addRecentTool } = useRecentTools();
  const favorite = isFavorite(tool.slug);
  const favoriteLock = useRef(0);

  const handleToggleFavorite = () => {
    const now = Date.now();
    if (now - favoriteLock.current < 50) return;
    favoriteLock.current = now;
    toggleFavorite(tool.slug);
  };

  // Track as recently used (useEffect to avoid infinite re-renders)
  useEffect(() => {
    addRecentTool(tool.slug);
  }, [tool.slug, addRecentTool]);

  const catInfo = getCategoryInfo(tool.category);
  const relatedTools = getRelatedTools(tool, 4);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          首页
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/?category=${tool.category}`}
          className="hover:text-foreground transition-colors"
        >
          {catInfo.labelZh}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{tool.name}</span>
      </nav>

      {/* Tool header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{tool.name}</h1>
          <Badge variant="secondary">{catInfo.labelZh}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          className="shrink-0"
          title={favorite ? "取消收藏 (Alt+F)" : "收藏 (Alt+F)"}
        >
          <Star
            className={`h-5 w-5 ${
              favorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">{tool.description}</p>

      <Separator />

      {/* Tool content */}
      <div className="space-y-4">{children}</div>

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              相关工具
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedTools.map((rt) => {
                return (
                  <Link
                    key={rt.slug}
                    href={`/tools/${rt.slug}`}
                    className="group rounded-lg border border-border p-3 hover:border-primary/30 hover:bg-accent/50 transition-colors"
                  >
                    <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {rt.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {rt.description}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Utility: copy text to clipboard with toast feedback */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  } catch {
    toast.error("复制失败");
  }
}

/** Hook to track copied state for copy buttons */
export function useCopyState(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    if (!text) return;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  };

  return { copied, handleCopy };
}
