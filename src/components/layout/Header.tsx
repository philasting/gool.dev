"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Search, Sun, Moon, Menu, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToolStore } from "@/stores/tool-store";

const ToolSearch = dynamic(
  () => import("@/components/tool/ToolSearch").then((m) => m.ToolSearch),
  { ssr: false }
);

export function Header() {
  const { theme, setTheme } = useTheme();
  const { setSidebarOpen } = useToolStore();

  return (
    <header className="glass sticky top-0 z-50 border-b border-border">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">打开菜单</span>
        </Button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Gool</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto">
          <ToolSearch />
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="shrink-0"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </div>
    </header>
  );
}
