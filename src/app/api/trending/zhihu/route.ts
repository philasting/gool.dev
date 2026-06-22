import { fetchDirect, fetchWithTimeout, type TrendingItem } from "../_utils";

export const runtime = "edge";

/** Direct call to Zhihu's official hot list API */
async function fetchZhihu(): Promise<TrendingItem[]> {
  const res = await fetchWithTimeout(
    "https://api.zhihu.com/topstory/hot-lists/total?limit=50",
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    },
  );
  if (!res.ok) throw new Error(`zhihu HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      target?: { title?: string; excerpt?: string; url?: string };
      detail_text?: string;
    }[];
  };
  const list = json?.data ?? [];
  return list.slice(0, 50).map((v, i) => {
    const target = v.target ?? {};
    const questionId = (target.url ?? "").split("/").pop() ?? "";
    const hotNum = parseFloat((v.detail_text ?? "0").split(" ")[0]) * 10000;
    return {
      rank: i + 1,
      title: target.title ?? "",
      desc: target.excerpt ?? "",
      hot: hotNum,
      url: `https://www.zhihu.com/question/${questionId}`,
    };
  });
}

export async function GET() {
  return fetchDirect("zhihu", "知乎热榜", "💡", fetchZhihu);
}
