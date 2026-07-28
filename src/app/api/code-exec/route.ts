import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 300; // 5 分钟缓存 runtimes

const PISTON_BASE = "https://emkc.org/api/v2/piston";

/** Build Authorization header if token is configured */
function tokenHeader(): Record<string, string> {
  const token = process.env.PISTON_API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** GET /api/code-exec — proxy Piston /runtimes (cached 5 min) */
export async function GET() {
  try {
    const res = await fetch(`${PISTON_BASE}/runtimes`, {
      headers: tokenHeader(),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `无法获取语言列表 (HTTP ${res.status})` },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "无法获取语言列表，代码执行服务暂时不可用" },
      { status: 502 }
    );
  }
}

/** POST /api/code-exec — proxy Piston /execute */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.language || !body.files) {
      return NextResponse.json(
        { error: "缺少必要参数: language, files" },
        { status: 400 }
      );
    }

    const res = await fetch(`${PISTON_BASE}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...tokenHeader(),
      },
      body: JSON.stringify({
        language: body.language,
        version: body.version || "*",
        files: body.files,
        stdin: body.stdin || "",
        args: body.args || [],
        run_timeout: body.run_timeout || 5000,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "执行失败" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "代码执行服务不可用，请稍后重试" },
      { status: 502 }
    );
  }
}
