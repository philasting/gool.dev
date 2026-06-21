"use client";

import Link from "next/link";
import { Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFavorites } from "@/hooks/use-favorites";
import { getToolBySlug } from "@/tools/registry";
import { getCategoryInfo } from "@/types/tool";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useFavorites();

  const favoriteTools = favorites
    .map((slug) => getToolBySlug(slug))
    .filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          <h1 className="text-2xl font-bold">我的收藏</h1>
        </div>
        <span className="text-sm text-muted-foreground ml-2">
          {favorites.length} 个工具
        </span>
      </div>

      {/* Empty state */}
      {favoriteTools.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Star className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">还没有收藏任何工具</p>
          <p className="text-sm text-muted-foreground/60">
            在工具详情页点击星标即可收藏
          </p>
          <Link href="/">
            <Button variant="outline" className="mt-4">
              去浏览工具
            </Button>
          </Link>
        </div>
      )}

      {/* Favorites grid */}
      {favoriteTools.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favoriteTools.map((tool) => {
            const catInfo = getCategoryInfo(tool!.category);
            return (
              <div key={tool!.slug} className="group relative">
                <Link href={`/tools/${tool!.slug}`}>
                  <Card className="p-4 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="font-medium text-sm group-hover:text-primary transition-colors">
                          {tool!.name}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {tool!.description}
                        </div>
                        <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {catInfo.labelZh}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
                {/* Remove favorite button */}
                <button
                  onClick={() => toggleFavorite(tool!.slug)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-destructive/20 text-yellow-400 hover:text-destructive transition-colors"
                  title="取消收藏"
                >
                  <Star className="h-4 w-4 fill-yellow-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
