"use client";

import { useState, useEffect, useCallback } from "react";

const FAVORITES_KEY = "toolbox-favorites";

/**
 * Hook for managing favorite tools.
 * Stores favorite tool slugs in localStorage.
 * Cross-component sync via `favorites-changed` custom event.
 *
 * Note: `favorites` starts as `null` (loading) and populates after mount,
 * to avoid SSR/client hydration mismatch.
 */
export function useFavorites() {
  // null = not yet loaded from localStorage (avoids SSR mismatch)
  const [favorites, setFavorites] = useState<string[] | null>(null);

  // Load from localStorage after mount (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      setFavorites(raw ? JSON.parse(raw) : []);
    } catch {
      setFavorites([]);
    }
  }, []);

  // Sync across hook instances (same tab) and across tabs
  useEffect(() => {
    const sync = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        setFavorites(raw ? JSON.parse(raw) : []);
      } catch {
        setFavorites([]);
      }
    };
    window.addEventListener("favorites-changed", sync);
    window.addEventListener("storage", (e) => {
      if (e.key === FAVORITES_KEY) sync();
    });
    return () => {
      window.removeEventListener("favorites-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isFavorite = useCallback(
    (slug: string): boolean => (favorites ?? []).includes(slug),
    [favorites]
  );

  const notify = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("favorites-changed"));
    }
  };

  const toggleFavorite = (slug: string) => {
    setFavorites((prev) => {
      const current = prev ?? [];
      const updated = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      } catch {
        // storage full
      }
      return updated;
    });
    notify();
  };

  const addFavorite = (slug: string) => {
    setFavorites((prev) => {
      const current = prev ?? [];
      if (current.includes(slug)) return current;
      const updated = [...current, slug];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    notify();
  };

  const removeFavorite = (slug: string) => {
    setFavorites((prev) => {
      const updated = (prev ?? []).filter((s) => s !== slug);
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    notify();
  };

  return { favorites: favorites ?? [], isFavorite, toggleFavorite, addFavorite, removeFavorite };
}
