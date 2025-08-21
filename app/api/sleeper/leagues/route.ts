// app/api/sleeper/leagues/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  const season = searchParams.get("season") ?? "2025";
  if (!user_id) return Response.json({ error: "user_id is required" }, { status: 400 });

  const url = `https://api.sleeper.app/v1/user/${encodeURIComponent(
    user_id
  )}/leagues/nfl/${encodeURIComponent(season)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return Response.json({ error: "failed to fetch leagues" }, { status: res.status });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "unexpected error" }, { status: 500 });
  }
}
