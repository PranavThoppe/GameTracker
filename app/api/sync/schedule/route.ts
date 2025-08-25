// app/api/sync/schedule/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  return await syncSchedule(req);
}

export async function GET(req: NextRequest) {
  return await syncSchedule(req);
}

async function syncSchedule(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') || '2025'
  const week = searchParams.get('week') || '1'
  
  try {
    console.log(`Starting schedule sync for year: ${year}, week: ${week}...`)
    
    // Fetch schedule from ESPN API
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?year=${year}&week=${week}&seasontype=2`
    )
    
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`)
    }
    
    const data = await response.json()
    const games = data.events || []
    
    console.log(`Fetched ${games.length} games from ESPN`)
    
    // Process games
    let processed = 0
    
    for (const event of games) {
      const competition = event.competitions[0]
      const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home')
      const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away')
      
      if (!homeTeam || !awayTeam) {
        console.warn('Skipping game with missing team data')
        continue
      }
      
      await db.schedule.upsert({
        where: {
          year_week_homeTeam_awayTeam: {
            year: parseInt(year),
            week: parseInt(week),
            homeTeam: homeTeam.team.abbreviation,
            awayTeam: awayTeam.team.abbreviation
          }
        },
        update: {
          time: competition.status.type.detail,
          broadcast: competition.broadcasts?.[0]?.names?.[0] || null,
        },
        create: {
          year: parseInt(year),
          week: parseInt(week),
          homeTeam: homeTeam.team.abbreviation,
          awayTeam: awayTeam.team.abbreviation,
          time: competition.status.type.detail,
          broadcast: competition.broadcasts?.[0]?.names?.[0] || null,
        }
      })
      
      processed++
    }
    
    console.log(`Successfully processed ${processed} games`)
    
    return Response.json({ 
      success: true, 
      gamesProcessed: processed,
      year: parseInt(year),
      week: parseInt(week),
      message: `Successfully synced ${processed} games for week ${week} of ${year}`
    })
    
  } catch (error) {
    console.error('Schedule sync failed:', error)
    
    return Response.json(
      { 
        success: false,
        error: 'Schedule sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}