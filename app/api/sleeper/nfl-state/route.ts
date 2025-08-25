// app/api/sleeper/nfl-state/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(
      'https://api.sleeper.app/v1/state/nfl',
      { next: { revalidate: 3600 } } // Cache for 1 hour since this changes infrequently
    );

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch NFL state" }, 
        { status: res.status }
      );
    }

    const data = await res.json();
    
    return Response.json({
      week: data.week,
      display_week: data.display_week,
      season: data.season,
      season_type: data.season_type,
      leg: data.leg
    });
    
  } catch (error) {
    console.error('Failed to fetch NFL state:', error);
    return Response.json(
      { error: "Failed to fetch NFL state" }, 
      { status: 500 }
    );
  }
}