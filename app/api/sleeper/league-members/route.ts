// app/api/sleeper/league-members/route.ts
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const league_id = searchParams.get("league_id");
  
  if (!league_id) {
    return Response.json({ error: "league_id is required" }, { status: 400 });
  }

  try {
    // First, fetch the rosters for this league
    const rostersRes = await fetch(
      `https://api.sleeper.app/v1/league/${encodeURIComponent(league_id)}/rosters`,
      { next: { revalidate: 300 } } // cache for 5 minutes
    );

    if (!rostersRes.ok) {
      return Response.json(
        { error: `Failed to fetch rosters for league ${league_id}` },
        { status: rostersRes.status }
      );
    }

    const rosters = await rostersRes.json();

    // Extract all unique owner_ids
    const ownerIds = rosters
      .map((roster: any) => roster.owner_id)
      .filter((id: string) => id); // Remove any null/undefined owner_ids

    if (ownerIds.length === 0) {
      return Response.json([], { status: 200 });
    }

    // Fetch user data for each owner_id
    const userPromises = ownerIds.map(async (ownerId: string) => {
      try {
        const userRes = await fetch(
          `https://api.sleeper.app/v1/user/${encodeURIComponent(ownerId)}`,
          { next: { revalidate: 3600 } } // cache user data for 1 hour
        );

        if (!userRes.ok) {
          // If user fetch fails, return a fallback object
          return {
            user_id: ownerId,
            username: `User ${ownerId.slice(-4)}`, // fallback username
            display_name: null,
          };
        }

        const userData = await userRes.json();
        return {
          user_id: userData.user_id || ownerId,
          username: userData.username,
          display_name: userData.display_name,
        };
      } catch {
        // If individual user fetch fails, return fallback
        return {
          user_id: ownerId,
          username: `User ${ownerId.slice(-4)}`,
          display_name: null,
        };
      }
    });

    // Wait for all user data to be fetched
    const members = await Promise.all(userPromises);

    // Sort members by display name or username
    members.sort((a, b) => {
      const nameA = (a.display_name || a.username || '').toLowerCase();
      const nameB = (b.display_name || b.username || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return Response.json(members, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching league members:', error);
    return Response.json({ error: "Unexpected server error" }, { status: 500 });
  }
}