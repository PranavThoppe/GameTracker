// app/api/schedule/sync/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

interface ESPNGame {
  id: string
  date: string
  competitions: Array<{
    competitors: Array<{
      team: {
        abbreviation: string
      }
      homeAway: 'home' | 'away'
    }>
    broadcasts?: Array<{
      names: string[]
    }>
  }>
}

interface ESPNResponse {
  events: ESPNGame[]
}

async function fetchESPNSchedule(year: number, week: number): Promise<ESPNGame[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${year}&seasontype=2&week=${week}`
  
  console.log(`Fetching ESPN schedule for ${year} week ${week}`)
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`ESPN API failed for week ${week}: ${response.status}`)
  }
  
  const data: ESPNResponse = await response.json()
  return data.events || []
}

async function syncWeekSchedule(year: number, week: number) {
  const games = await fetchESPNSchedule(year, week)
  
  let syncedCount = 0
  let skippedCount = 0
  
  for (const game of games) {
    if (!game.competitions?.[0]?.competitors || game.competitions[0].competitors.length !== 2) {
      console.warn(`Skipping malformed game ${game.id} for week ${week}`)
      skippedCount++
      continue
    }
    
    const competitors = game.competitions[0].competitors
    const homeTeam = competitors.find(c => c.homeAway === 'home')?.team?.abbreviation
    const awayTeam = competitors.find(c => c.homeAway === 'away')?.team?.abbreviation
    
    if (!homeTeam || !awayTeam) {
      console.warn(`Missing team data for game ${game.id} in week ${week}`)
      skippedCount++
      continue
    }
    
    const broadcast = game.competitions[0].broadcasts?.[0]?.names?.[0] || null
    
    try {
      await db.schedule.upsert({
        where: {
          year_week_homeTeam_awayTeam: {
            year,
            week,
            homeTeam: homeTeam.toUpperCase(),
            awayTeam: awayTeam.toUpperCase(),
          }
        },
        update: {
          time: game.date,
          broadcast,
        },
        create: {
          year,
          week,
          homeTeam: homeTeam.toUpperCase(),
          awayTeam: awayTeam.toUpperCase(),
          time: game.date,
          broadcast,
        }
      })
      
      syncedCount++
    } catch (error) {
      console.error(`Failed to sync game ${game.id} for week ${week}:`, error)
      skippedCount++
    }
  }
  
  return { syncedCount, skippedCount }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get current NFL state with proper URL handling for Vercel
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const nflStateRes = await fetch(`${baseUrl}/api/sleeper/nfl-state`)
    if (!nflStateRes.ok) {
      throw new Error('Failed to fetch NFL state')
    }
    
    const nflState = await nflStateRes.json()
    const currentWeek = nflState.display_week
    const season = nflState.season
    
    console.log(`Starting schedule sync from week ${currentWeek} to week 18 for ${season} season`)
    
    const results = []
    let totalSynced = 0
    let totalSkipped = 0
    
    // Sync from current week to week 18
    for (let week = currentWeek; week <= 18; week++) {
      try {
        console.log(`Syncing week ${week}...`)
        const result = await syncWeekSchedule(season, week)
        
        results.push({
          week,
          ...result,
          success: true
        })
        
        totalSynced += result.syncedCount
        totalSkipped += result.skippedCount
        
        console.log(`Week ${week} complete: ${result.syncedCount} synced, ${result.skippedCount} skipped`)
        
        // Add a small delay to be nice to ESPN's API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Failed to sync week ${week}:`, error)
        results.push({
          week,
          syncedCount: 0,
          skippedCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    console.log(`Schedule sync complete in ${Date.now() - startTime}ms. Total: ${totalSynced} synced, ${totalSkipped} skipped`)
    
    return Response.json({
      success: true,
      message: `Synced schedule for weeks ${currentWeek}-18`,
      currentWeek,
      season,
      totalSynced,
      totalSkipped,
      duration: Date.now() - startTime,
      weekResults: results
    })
    
  } catch (error) {
    console.error('Schedule sync failed:', error)
    return Response.json(
      {
        success: false,
        error: 'Failed to sync schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Optional: Allow GET requests to check sync status or trigger manually
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const forceSync = searchParams.get('force') === 'true'
  
  if (forceSync) {
    // Redirect to POST handler for actual sync
    return POST(req)
  }
  
  // Return current sync status/info
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const nflStateRes = await fetch(`${baseUrl}/api/sleeper/nfl-state`)
    if (!nflStateRes.ok) {
      throw new Error('Failed to fetch NFL state')
    }
    
    const nflState = await nflStateRes.json()
    
    // Get count of games already synced for remaining weeks
    const gameCount = await db.schedule.count({
      where: {
        year: nflState.season,
        week: {
          gte: nflState.display_week,
          lte: 18
        }
      }
    })
    
    return Response.json({
      currentWeek: nflState.display_week,
      season: nflState.season,
      weeksToSync: Array.from({length: 18 - nflState.display_week + 1}, (_, i) => nflState.display_week + i),
      gamesAlreadySynced: gameCount,
      message: 'Use POST request or add ?force=true to trigger sync'
    })
    
  } catch (error) {
    return Response.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}