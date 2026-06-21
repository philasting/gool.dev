"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  Type,
  Image,
  FileText,
  Shield,
  Heart,
  Star,
  History,
  LayoutGrid,
  Info,
  DollarSign,
  Sparkles,
  Gamepad2,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, getCategoryInfo } from "@/types/tool";
import { useToolStore } from "@/stores/tool-store";
import { useFavorites } from "@/hooks/use-favorites";
import { useRecentTools } from "@/hooks/use-recent-tools";
import { getToolBySlug, getToolsByCategory } from "@/tools/registry";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dev: Code2,
  text: Type,
  image: Image,
  doc: FileText,
  crypto: Shield,
  life: Heart,
  info: Info,
  finance: DollarSign,
  ai: Sparkles,
  fun: Gamepad2,
  study: GraduationCap,
};

export function Sidebar() {
  const pathname = usePathname();
  const { activeCategory, setActiveCategory, sidebarOpen, setSidebarOpen } =
    useToolStore();
  const { favorites } = useFavorites();
  const { recentTools } = useRecentTools();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* All tools */}
      <div className="px-3 py-2 space-y-0.5">
        <Link
          href="/"
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            pathname === "/" && !activeCategory
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          全部工具
        </Link>
        <Link
          href="/favorites"
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            pathname === "/favorites"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <Star className="h-4 w-4 text-yellow-500" />
          我的收藏
          {favorites.length > 0 && (
            <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">
              {favorites.length}
            </span>
          )}
        </Link>
      </div>

      <Separator />

      {/* Category navigation */}
      <div className="px-3 py-2">
        <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          分类
        </p>
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.slug] || Code2;
          return (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}`}
              onClick={() => {
                setActiveCategory(cat.slug);
                setSidebarOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                activeCategory === cat.slug
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", cat.color)} />
              {cat.labelZh}
              <span className="ml-auto text-xs text-muted-foreground">{getToolsByCategory(cat.slug).filter(t => t.priority < 800).length}</span>
            </Link>
          );
        })}
      </div>

      <Separator />

      {/* Recent tools */}
      {recentTools.length > 0 && (
        <div className="px-3 py-2">
          <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            最近使用
          </p>
          <ScrollArea className="max-h-40">
            {recentTools.slice(0, 5).map((slug) => {
              const tool = getToolBySlug(slug);
              if (!tool) return null;
              return (
                <Link
                  key={slug}
                  href={`/tools/${slug}`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <History className="h-3.5 w-3.5" />
                  <span className="truncate">{tool.name}</span>
                </Link>
              );
            })}
          </ScrollArea>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 lg:w-64 md:flex-col md:fixed md:inset-y-0 md:top-16 glass border-r border-border overflow-y-auto custom-scrollbar">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutGrid className="h-4 w-4" />
              </div>
              Gool
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 px-1">{sidebarContent}</ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
