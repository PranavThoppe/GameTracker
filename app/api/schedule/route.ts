// app/api/schedule/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const week = searchParams.get('week')
  const teams = searchParams.get('teams') // comma-separated list of team abbreviations
  
  try {
    // Build the SQL query dynamically
    let whereConditions: string[] = []
    let queryParams: (string | number)[] = []
    
    // Filter by year
    if (year) {
      whereConditions.push(`year = ?`)
      queryParams.push(parseInt(year))
    }
    
    // Filter by week
    if (week) {
      whereConditions.push(`week = ?`)
      queryParams.push(parseInt(week))
    }
    
    // Filter by teams
    if (teams) {
      const teamList = teams.split(',').map(t => t.trim().toUpperCase())
      const teamPlaceholders = teamList.map(() => '?').join(',')
      whereConditions.push(`(homeTeam IN (${teamPlaceholders}) OR awayTeam IN (${teamPlaceholders}))`)
      queryParams.push(...teamList, ...teamList) // Add for both home and away
    }
    
    // Build final query
    let query = `
      SELECT id, year, week, homeTeam, awayTeam, time, broadcast, createdAt, updatedAt
      FROM schedules
    `
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`
    }
    
    query += ` ORDER BY year ASC, week ASC, time ASC`
    
    console.log('Executing query:', query)
    console.log('With params:', queryParams)
    
    // Execute raw SQL query
    const games = await db.$queryRawUnsafe(query, ...queryParams) as any[]
    
    console.log(`Found ${games.length} games`)
    
    // Transform the data to include game status and additional info
   const gamesWithStatus = games.map(game => {
    return {
            id: String(game.id),
            year: Number(game.year),
            week: Number(game.week),
            homeTeam: String(game.homeTeam),
            awayTeam: String(game.awayTeam),
            timeDisplay: String(game.time),   // just send the ESPN string
            broadcast: game.broadcast ? String(game.broadcast) : null,
            matchup: `${game.awayTeam} @ ${game.homeTeam}`,
            status: 'scheduled',              // static for now
        }
    })
    
    return Response.json(gamesWithStatus)
    
  } catch (error) {
    console.error('Failed to fetch schedule:', error)
    return Response.json(
      { 
        error: 'Failed to fetch schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}