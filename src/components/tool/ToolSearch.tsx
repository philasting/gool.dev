"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Command, X, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchTools } from "@/lib/search";
import { getCategoryInfo } from "@/types/tool";
import type { ToolMeta } from "@/types/tool";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SEARCH_HISTORY_KEY = "gool-search-history";
const MAX_HISTORY = 20;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveHistoryToStorage(history: string[]) {
  localStorage.setItem(
    SEARCH_HISTORY_KEY,
    JSON.stringify(history.slice(0, MAX_HISTORY))
  );
}

export function ToolSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ToolMeta[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const ignoreBlur = useRef(false);

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Search on query change
  useEffect(() => {
    if (query.trim()) {
      const found = searchTools(query);
      setResults(found);
      setOpen(true);
      setSelectedIndex(-1);
      setShowHistory(false);
    } else {
      setResults([]);
      // When query becomes empty and input is focused, show history
      const el = document.activeElement;
      if (
        el === inputRef.current &&
        history.length > 0
      ) {
        setShowHistory(true);
        setOpen(true);
      } else {
        setOpen(false);
        setShowHistory(false);
      }
    }
  }, [query, history.length]);

  // Save current query to history
  const addToHistory = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const updated = [
      trimmed,
      ...history.filter((h) => h !== trimmed),
    ].slice(0, MAX_HISTORY);
    setHistory(updated);
    saveHistoryToStorage(updated);
  };

  // Remove single history item
  const removeHistoryItem = (item: string) => {
    const updated = history.filter((h) => h !== item);
    setHistory(updated);
    saveHistoryToStorage(updated);
    if (updated.length === 0) {
      setOpen(false);
      setShowHistory(false);
    }
  };

  // Clear all history
  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setOpen(false);
    setShowHistory(false);
  };

  // Keyboard shortcut: Alt+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        setShowHistory(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard navigation (history + results)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    // ── History mode ──
    if (showHistory && history.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, history.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const item = history[selectedIndex];
        if (item) {
          setQuery(item);
          setShowHistory(false);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      } else if (e.key === "Backspace" && selectedIndex >= 0) {
        // Delete selected history item with Backspace
        e.preventDefault();
        const item = history[selectedIndex];
        if (item) {
          removeHistoryItem(item);
          setSelectedIndex((prev) =>
            prev >= history.length - 1 ? Math.max(prev - 1, -1) : prev
          );
        }
      }
      return;
    }

    // ── Results mode ──
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const tool = results[selectedIndex];
      if (tool) {
        addToHistory(query);
        window.location.href = `/tools/${tool.slug}`;
        setOpen(false);
        setQuery("");
      }
    }
  };

  const handleFocus = () => {
    if (!query.trim() && history.length > 0) {
      setShowHistory(true);
      setOpen(true);
      setSelectedIndex(-1);
    } else if (query.trim()) {
      setOpen(true);
    }
  };

  const handleBlur = () => {
    if (ignoreBlur.current) {
      ignoreBlur.current = false;
      return;
    }
    setTimeout(() => {
      setOpen(false);
      setShowHistory(false);
    }, 200);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="搜索工具... (Alt+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-12 h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>

      {/* ── History dropdown ── */}
      {open && showHistory && history.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden"
        >
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
            搜索历史
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {history.map((item, index) => (
              <div
                key={item}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent cursor-pointer",
                  index === selectedIndex && "bg-accent"
                )}
                onMouseDown={() => {
                  ignoreBlur.current = true;
                  setQuery(item);
                  setShowHistory(false);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
              >
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 font-medium truncate">{item}</span>
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    removeHistoryItem(item);
                  }}
                  className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-4 py-2 flex justify-end">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                clearAllHistory();
              }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              清空历史
            </button>
          </div>
        </div>
      )}

      {/* ── Search results dropdown ── */}
      {open && !showHistory && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden"
        >
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {results.map((tool, index) => {
              const catInfo = getCategoryInfo(tool.category);
              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  onMouseDown={() => {
                    ignoreBlur.current = true;
                    addToHistory(query);
                  }}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent",
                    index === selectedIndex && "bg-accent"
                  )}
                >
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {catInfo.labelZh}
                  </span>
                  <span className="font-medium">{tool.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {tool.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* No results */}
      {open && !showHistory && query.trim() && results.length === 0 && (
        <div className="absolute top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
          未找到匹配的工具
        </div>
      )}
    </div>
  );
}
