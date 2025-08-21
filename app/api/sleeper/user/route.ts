// app/api/sleeper/user/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  if (!username) return Response.json({ error: "username is required" }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.sleeper.app/v1/user/${encodeURIComponent(username)}`,
      { next: { revalidate: 3600 } } // cache for an hour; tweak as you like
    );

    if (!res.ok) {
      // Sleeper returns 404 if username not found
      return Response.json({ error: "user not found" }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({
      username: data.username ?? username,
      user_id: data.user_id,
    });
  } catch {
    return Response.json({ error: "failed to resolve user" }, { status: 500 });
  }
}
