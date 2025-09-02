// app/api/sync/teams/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ESPNRecordResponse {
  items: Array<{
    id: string
    name: string
    summary: string // "W-L" or "W-L-T" format
  }>
}

export async function POST() {
  try {
    console.log('Starting team records sync...')
    
    // Get all teams from database
    const teams = await db.team.findMany({
      where: { season: 2025 },
      select: { id: true, espnTeamId: true, name: true, abbreviation: true }
    })
    
    if (teams.length === 0) {
      return NextResponse.json(
        { error: 'No teams found. Run team sync first.' },
        { status: 400 }
      )
    }
    
    console.log(`Found ${teams.length} teams to sync`)
    
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []
    
    for (const team of teams) {
      try {
        console.log(`Syncing ${team.abbreviation}...`)
        
        // Fetch team record from ESPN
        const response = await fetch(
          `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/teams/${team.espnTeamId}/record`
        )
        
        if (!response.ok) {
          throw new Error(`ESPN API failed: ${response.status}`)
        }
        
        const data: ESPNRecordResponse = await response.json()
        
        // Find the "overall" record
        const overallRecord = data.items.find(item => item.name === 'overall')
        
        if (!overallRecord) {
          throw new Error('Overall record not found')
        }
        
        // Parse the summary (e.g., "3-2" or "3-2-1")
        const recordParts = overallRecord.summary.split('-').map(Number)
        const wins = recordParts[0] || 0
        const losses = recordParts[1] || 0
        const ties = recordParts[2] || 0
        
        // Calculate win percentage: (wins + 0.5*ties) / (wins + losses + ties)
        const totalGames = wins + losses + ties
        const winPercentage = totalGames > 0 
          ? (wins + 0.5 * ties) / totalGames 
          : 0
        
        // Update team record
        await db.team.updateMany({
          where: {   
            espnTeamId: team.espnTeamId,
            season: 2025
          },
          data: {
            wins,
            losses,
            ties,
            winPercentage: Math.round(winPercentage * 1000) / 1000 // Round to 3 decimal places
          }
        })
        
        console.log(`✓ ${team.abbreviation}: ${overallRecord.summary} (${(winPercentage * 100).toFixed(1)}%)`)
        successCount++
        
        // Add small delay to be nice to ESPN's API
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`✗ ${team.abbreviation}: ${error}`)
        errorCount++
        errors.push(`${team.abbreviation}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    console.log('\nSync complete!')
    console.log(`- Success: ${successCount} teams`)
    console.log(`- Errors: ${errorCount} teams`)
    
    return NextResponse.json({
      success: true,
      summary: {
        totalTeams: teams.length,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      }
    })
    
  } catch (error) {
    console.error('Team records sync failed:', error)
    return NextResponse.json(
      { 
        error: 'Sync failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}