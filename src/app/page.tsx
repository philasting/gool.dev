"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ToolGrid } from "@/components/tool/ToolGrid";
import { Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getImplementedTools } from "@/tools/registry";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import Link from "next/link";

function HomeContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  // Register Alt+H shortcut on homepage too (navigates to home = no-op but consistent)
  useKeyboardShortcuts();

  const hotTags = [
    "JSON",
    "Base64",
    "时间戳",
    "正则",
    "密码",
    "哈希",
    "图片压缩",
  ];

  return (
    <div className="space-y-8">
      {/* Hero search area */}
      <section className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Gool 在线工具箱
          </h1>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          几十种实用工具，纯前端运行，数据不离开浏览器
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Search className="h-4 w-4 text-muted-foreground" />
          {hotTags.map((tag) => (
            <Link key={tag} href={`/tools/${getTagSlug(tag)}`}>
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      {/* Tool grid */}
      <ToolGrid category={category} />
    </div>
  );
}

function getTagSlug(tag: string): string {
  const map: Record<string, string> = {
    JSON: "json-formatter",
    Base64: "base64",
    时间戳: "timestamp",
    正则: "regex-tester",
    密码: "password-generator",
    哈希: "hash-calculator",
    图片压缩: "image-compress",
  };
  return map[tag] || "";
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted-foreground">加载中...</div>}>
      <HomeContent />
    </Suspense>
  );
}
