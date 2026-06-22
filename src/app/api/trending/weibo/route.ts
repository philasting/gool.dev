import { fetchDirect, fetchWithTimeout, type TrendingItem } from "../_utils";

export const runtime = "edge";

/** Direct call to Weibo's official hot search API */
async function fetchWeibo(): Promise<TrendingItem[]> {
  const res = await fetchWithTimeout("https://weibo.com/ajax/side/hotSearch", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Referer: "https://weibo.com/",
    },
  });
  if (!res.ok) throw new Error(`weibo HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: { realtime?: { word?: string; word_scheme?: string; num?: number }[] };
  };
  const list = json?.data?.realtime ?? [];
  return list.slice(0, 50).map((v, i) => ({
    rank: i + 1,
    title: v.word ?? "",
    desc: v.word_scheme ?? "",
    hot: v.num,
    url: `https://s.weibo.com/weibo?q=${encodeURIComponent(v.word ?? "")}`,
  }));
}

export async function GET() {
  return fetchDirect("weibo", "微博热搜", "🔥", fetchWeibo);
}
