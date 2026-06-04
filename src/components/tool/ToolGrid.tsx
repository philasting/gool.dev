"use client";

import { CATEGORIES, getCategoryInfo } from "@/types/tool";
import { getToolsByCategory, getImplementedTools } from "@/tools/registry";
import { ToolCard } from "./ToolCard";
import { Flame } from "lucide-react";

interface ToolGridProps {
  category?: string | null;
}

export function ToolGrid({ category }: ToolGridProps) {
  // If a specific category is selected
  if (category) {
    const catInfo = getCategoryInfo(category as typeof CATEGORIES[number]["slug"]);
    const allTools = getToolsByCategory(
      category as typeof CATEGORIES[number]["slug"]
    );
    const tools = allTools.filter((t) => t.priority < 800);

    return (
      <section className="animate-fade-in">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {catInfo.labelZh}
          <span className="text-sm font-normal text-muted-foreground">({tools.length})</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    );
  }

  // Show all categories
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hot / Recommended section */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          热门推荐
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {getImplementedTools().slice(0, 8).map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* Category sections */}
      {CATEGORIES.map((cat) => {
        const allTools = getToolsByCategory(cat.slug);
        const tools = allTools.filter((t) => t.priority < 800);
        if (tools.length === 0) return null;

        return (
          <section key={cat.slug}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {cat.labelZh}
              <span className="text-sm font-normal text-muted-foreground">({tools.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {tools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
