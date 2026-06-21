"use client";

import { useState, useEffect, useCallback } from "react";

const RECENT_KEY = "toolbox-recent-tools";
const MAX_RECENT_TOOLS = 10;

/**
 * Hook for tracking recently used tools.
 * Stores up to 10 recent tool slugs in localStorage.
 * Cross-component sync via `recent-tools-changed` custom event.
 *
 * Note: `recentTools` starts as `null` (loading) and populates after mount,
 * to avoid SSR/client hydration mismatch.
 */
export function useRecentTools() {
  // null = not yet loaded from localStorage (avoids SSR mismatch)
  const [recentTools, setRecentTools] = useState<string[] | null>(null);

  // Load from localStorage after mount (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      setRecentTools(raw ? JSON.parse(raw) : []);
    } catch {
      setRecentTools([]);
    }
  }, []);

  // Sync across hook instances (same tab) and across tabs
  useEffect(() => {
    const sync = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem(RECENT_KEY);
        setRecentTools(raw ? JSON.parse(raw) : []);
      } catch {
        setRecentTools([]);
      }
    };
    window.addEventListener("recent-tools-changed", sync);
    window.addEventListener("storage", (e) => {
      if (e.key === RECENT_KEY) sync();
    });
    return () => {
      window.removeEventListener("recent-tools-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const notify = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("recent-tools-changed"));
    }
  };

  const addRecentTool = useCallback((slug: string) => {
    setRecentTools((prev) => {
      const current = prev ?? [];
      const filtered = current.filter((s) => s !== slug);
      const updated = [slug, ...filtered].slice(0, MAX_RECENT_TOOLS);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    notify();
  }, []);

  const clearRecentTools = useCallback(() => {
    setRecentTools([]);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify([]));
    } catch {}
    notify();
  }, []);

  return {
    recentTools: recentTools ?? [],
    addRecentTool,
    clearRecentTools,
  };
}
