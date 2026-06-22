import { fetchDirect, fetchWithTimeout, type TrendingItem } from "../_utils";

export const runtime = "edge";

/** Direct call to Juejin's official article rank API */
async function fetchJuejin(): Promise<TrendingItem[]> {
  const res = await fetchWithTimeout(
    "https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot",
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    },
  );
  if (!res.ok) throw new Error(`juejin HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      content?: { title?: string; content_id?: string };
      author?: { name?: string };
      content_counter?: { hot_rank?: number };
    }[];
  };
  const list = json?.data ?? [];
  return list.slice(0, 50).map((v, i) => ({
    rank: i + 1,
    title: v.content?.title ?? "",
    author: v.author?.name,
    hot: v.content_counter?.hot_rank ?? 0,
    url: `https://juejin.cn/post/${v.content?.content_id}`,
  }));
}

export async function GET() {
  return fetchDirect("juejin", "掘金热榜", "⛏️", fetchJuejin);
}
