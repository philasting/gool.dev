/**
 * Shared types and utilities for trending API routes
 * All routes run on the Edge Runtime
 *
 * Each route calls the platform's official API directly — no third-party proxy.
 * If the upstream is unreachable or returns an empty list, an empty result is
 * returned (HTTP 200) so the frontend can display a "no data" state.
 */

export interface TrendingItem {
  rank: number;
  title: string;
  url?: string;
  hot?: string | number;
  desc?: string;
  author?: string;
  /** Extra metadata (repo stars, video views, etc.) */
  extra?: string;
}

export interface TrendingResponse {
  platform: string;
  platformZh: string;
  icon: string;
  items: TrendingItem[];
  updatedAt: string;
  source?: string;
  /** Optional message describing an error or empty-state reason */
  message?: string;
}

export function ok(data: TrendingResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

export function err(msg: string, status = 500): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Fetch with a timeout (default 8s) — safe for Edge runtime */
export async function fetchWithTimeout(
  url: string,
  opts?: { timeoutMs?: number; headers?: Record<string, string> }
): Promise<Response> {
  const timeoutMs = opts?.timeoutMs ?? 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: opts?.headers ?? { "User-Agent": "gool.dev/1.0" },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call a platform's official API directly via the provided fetcher function.
 * If the fetcher throws or returns an empty list, an empty result is returned
 * (HTTP 200 with items: []) so the frontend can render a "no data" state.
 */
export async function fetchDirect(
  platform: string,
  platformZh: string,
  icon: string,
  fetcher: () => Promise<TrendingItem[]>,
): Promise<Response> {
  try {
    const items = await fetcher();
    if (!items.length) throw new Error("empty result");
    return ok({
      platform,
      platformZh,
      icon,
      items,
      updatedAt: new Date().toISOString(),
      source: "direct",
    });
  } catch (e) {
    const message = (e as Error).message || "获取失败";
    console.warn(`[${platform}] direct API failed:`, message);
    return ok({
      platform,
      platformZh,
      icon,
      items: [],
      updatedAt: new Date().toISOString(),
      source: "direct",
      message: `获取失败：${message}`,
    });
  }
}
