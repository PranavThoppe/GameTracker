// app/api/test/simple-schedule/route.ts
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('Testing simple schedule query...');
    
    // Get some sample data without COUNT
    const sampleGames = await db.$queryRaw`
      SELECT id, year, week, homeTeam, awayTeam, time, broadcast 
      FROM schedules 
      ORDER BY year, week, time 
      LIMIT 5
    ` as any[];
    
    // Get some specific teams games
    const kansasCityGames = await db.$queryRaw`
      SELECT id, year, week, homeTeam, awayTeam, time, broadcast
      FROM schedules 
      WHERE homeTeam = 'KC' OR awayTeam = 'KC'
      ORDER BY week
      LIMIT 3
    ` as any[];
    
    // Manual count by getting array length
    const allGames = await db.$queryRaw`SELECT id FROM schedules` as any[];
    const totalCount = allGames.length;
    
    return Response.json({
      success: true,
      totalGames: totalCount,
      sampleGames: sampleGames.map(game => ({
        id: String(game.id),
        year: Number(game.year),
        week: Number(game.week),
        homeTeam: String(game.homeTeam),
        awayTeam: String(game.awayTeam),
        time: String(game.time),
        broadcast: game.broadcast ? String(game.broadcast) : null
      })),
      kansasCityGames: kansasCityGames.map(game => ({
        id: String(game.id),
        year: Number(game.year),
        week: Number(game.week),
        homeTeam: String(game.homeTeam),
        awayTeam: String(game.awayTeam),
        time: String(game.time),
        broadcast: game.broadcast ? String(game.broadcast) : null,
        matchup: `${game.awayTeam} @ ${game.homeTeam}`
      }))
    });
    
  } catch (error) {
    console.error('Simple schedule test failed:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}