// app/api/sync/players/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  return await syncPlayers();
}

export async function GET(req: NextRequest) {
  return await syncPlayers();
}

async function syncPlayers() {
  try {
    console.log('Starting player sync...')
    
    // Fetch players from Sleeper API
    const response = await fetch('https://api.sleeper.app/v1/players/nfl')
    
    if (!response.ok) {
      throw new Error(`Sleeper API error: ${response.status}`)
    }
    
    const playersData = await response.json()
    const playerIds = Object.keys(playersData)
    
    console.log(`Fetched ${playerIds.length} players from Sleeper`)
    
    // Process in smaller batches to avoid memory issues
    const BATCH_SIZE = 50
    let processed = 0
    
    for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
      const batch = playerIds.slice(i, i + BATCH_SIZE)
      
      const upsertPromises = batch.map(async (playerId) => {
        const playerData = playersData[playerId]
        
        return db.player.upsert({
          where: { id: playerId },
          update: {
            fullName: playerData.full_name,
            firstName: playerData.first_name,
            lastName: playerData.last_name,
            position: playerData.position,
            team: playerData.team,
            teamAbbr: playerData.team_abbr,
            status: playerData.status,
            active: playerData.active ?? false,
            yearsExp: playerData.years_exp,
            age: playerData.age,
            height: playerData.height,
            weight: playerData.weight,
            college: playerData.college,
            birthDate: playerData.birth_date,
            fantasyPositions: JSON.stringify(playerData.fantasy_positions || []),
            injuryStatus: playerData.injury_status,
            injuryBodyPart: playerData.injury_body_part,
            injuryNotes: playerData.injury_notes,
            depthChartPosition: playerData.depth_chart_position,
            depthChartOrder: playerData.depth_chart_order,
            searchRank: playerData.search_rank,
            espnId: playerData.espn_id,
            yahooId: playerData.yahoo_id,
            rotowireId: playerData.rotowire_id,
            statsId: playerData.stats_id,
            fantasyDataId: playerData.fantasy_data_id,
          },
          create: {
            id: playerId,
            fullName: playerData.full_name,
            firstName: playerData.first_name,
            lastName: playerData.last_name,
            position: playerData.position,
            team: playerData.team,
            teamAbbr: playerData.team_abbr,
            status: playerData.status,
            active: playerData.active ?? false,
            yearsExp: playerData.years_exp,
            age: playerData.age,
            height: playerData.height,
            weight: playerData.weight,
            college: playerData.college,
            birthDate: playerData.birth_date,
            fantasyPositions: JSON.stringify(playerData.fantasy_positions || []),
            injuryStatus: playerData.injury_status,
            injuryBodyPart: playerData.injury_body_part,
            injuryNotes: playerData.injury_notes,
            depthChartPosition: playerData.depth_chart_position,
            depthChartOrder: playerData.depth_chart_order,
            searchRank: playerData.search_rank,
            espnId: playerData.espn_id,
            yahooId: playerData.yahoo_id,
            rotowireId: playerData.rotowire_id,
            statsId: playerData.stats_id,
            fantasyDataId: playerData.fantasy_data_id,
          }
        })
      })
      
      await Promise.all(upsertPromises)
      processed += batch.length
      
      console.log(`Processed ${processed}/${playerIds.length} players`)
    }
    
    // Log successful sync
    await db.playerSyncLog.create({
      data: {
        playerCount: playerIds.length,
        success: true
      }
    })
    
    return Response.json({ 
      success: true, 
      playersProcessed: processed,
      message: `Successfully synced ${processed} players`
    })
    
  } catch (error) {
    console.error('Player sync failed:', error)
    
    // Log failed sync
    try {
      await db.playerSyncLog.create({
        data: {
          playerCount: 0,
          success: false,
          errorMsg: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    } catch (logError) {
      console.error('Failed to log sync error:', logError)
    }
    
    return Response.json(
      { 
        success: false,
        error: 'Player sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}