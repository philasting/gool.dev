import { fetchDirect, fetchWithTimeout, type TrendingItem } from "../_utils";

export const runtime = "edge";

/**
 * Uses the GitHub Search API to find repositories created in the last 7 days,
 * sorted by stars. This is a clean-JSON alternative to scraping the trending page
 * (which requires HTML parsing unavailable in Edge Runtime).
 */
async function fetchGithub(): Promise<TrendingItem[]> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const dateStr = since.toISOString().split("T")[0];
  const url = `https://api.github.com/search/repositories?q=created:>${dateStr}&sort=stars&order=desc&per_page=30`;

  const res = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "gool.dev/1.0",
    },
  });
  if (!res.ok) throw new Error(`github HTTP ${res.status}`);
  const json = (await res.json()) as {
    items?: {
      full_name?: string;
      description?: string;
      html_url?: string;
      language?: string;
      stargazers_count?: number;
      owner?: { login?: string };
    }[];
  };
  const list = json?.items ?? [];
  return list.slice(0, 30).map((v, i) => ({
    rank: i + 1,
    title: v.full_name ?? "",
    desc: v.description ?? "",
    author: v.owner?.login,
    hot: v.stargazers_count ?? 0,
    extra: v.language,
    url: v.html_url,
  }));
}

export async function GET() {
  return fetchDirect("github", "GitHub 趋势", "🐙", fetchGithub);
}
