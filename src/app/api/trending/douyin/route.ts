import { fetchDirect, fetchWithTimeout, type TrendingItem } from "../_utils";

export const runtime = "edge";

/**
 * Direct call to Douyin's official hot search API.
 * Requires a temporary cookie obtained from the login strategy endpoint.
 */
async function fetchDouyin(): Promise<TrendingItem[]> {
  // Step 1: Get a temporary passport_csrf_token cookie
  const cookieRes = await fetchWithTimeout(
    "https://www.douyin.com/passport/general/login_guiding_strategy/?aid=6383",
    {
      timeoutMs: 5000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    },
  );
  const setCookie = cookieRes.headers.get("set-cookie") ?? "";
  const tokenMatch = setCookie.match(/passport_csrf_token=([^;]+)/);
  const cookie = tokenMatch?.[1] ?? "";

  // Step 2: Fetch the hot search list
  const res = await fetchWithTimeout(
    "https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Cookie: `passport_csrf_token=${cookie}`,
        Referer: "https://www.douyin.com/",
      },
    },
  );
  if (!res.ok) throw new Error(`douyin HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      word_list?: {
        sentence_id?: string;
        word?: string;
        hot_value?: number;
      }[];
    };
  };
  const list = json?.data?.word_list ?? [];
  return list.slice(0, 50).map((v, i) => ({
    rank: i + 1,
    title: v.word ?? "",
    hot: v.hot_value ?? 0,
    url: `https://www.douyin.com/hot/${v.sentence_id}`,
  }));
}

export async function GET() {
  return fetchDirect("douyin", "抖音热点", "🎵", fetchDouyin);
}
