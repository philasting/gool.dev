"use client";
/**
 * Shared hook for fetching trending data from our Edge API
 */
import { useState, useEffect, useCallback } from "react";

export interface TrendingItem {
  rank: number;
  title: string;
  url?: string;
  hot?: string | number;
  desc?: string;
  author?: string;
  extra?: string;
}

export interface TrendingData {
  platform: string;
  platformZh: string;
  icon: string;
  items: TrendingItem[];
  updatedAt: string;
  source?: string;
  /** Optional message describing an error or empty-state reason */
  message?: string;
}

export type FetchStatus = "idle" | "loading" | "success" | "error";

export function useTrending(platform: string) {
  const [data, setData] = useState<TrendingData | null>(null);
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [error, setError] = useState<string>("");

  const fetch_ = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/trending/${platform}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取失败");
      setStatus("error");
    }
  }, [platform]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, status, error, refetch: fetch_ };
}
