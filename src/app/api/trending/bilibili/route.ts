import { fetchDirect, fetchWithTimeout, type TrendingItem } from "../_utils";

export const runtime = "edge";

/** Direct call to Bilibili's official ranking API */
async function fetchBilibili(): Promise<TrendingItem[]> {
  const res = await fetchWithTimeout(
    "https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Referer: "https://www.bilibili.com/ranking/all",
      },
    },
  );
  if (!res.ok) throw new Error(`bilibili HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      list?: {
        title?: string;
        desc?: string;
        bvid?: string;
        short_link_v2?: string;
        owner?: { name?: string };
        stat?: { view?: number };
      }[];
    };
  };
  const list = json?.data?.list ?? [];
  return list.slice(0, 50).map((v, i) => ({
    rank: i + 1,
    title: v.title ?? "",
    desc: v.desc ?? "",
    author: v.owner?.name,
    hot: v.stat?.view ?? 0,
    url: v.short_link_v2 || `https://www.bilibili.com/video/${v.bvid}`,
  }));
}

export async function GET() {
  return fetchDirect("bilibili", "B站热门", "📺", fetchBilibili);
}
