// app/api/ml-predictions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import teamConfig from '@/lib/team-config.json'

interface Game {
  id: string
  year: number
  week: number
  homeTeam: string
  awayTeam: string
  timeDisplay: string
  broadcast: string | null
  matchup: string
  status: 'scheduled' | 'in_progress' | 'final'
}

interface TeamRecord {
  id: string
  espnTeamId: number
  name: string
  abbreviation: string
  season: number
  wins: number
  losses: number
  ties: number
  winPercentage: number
  logoUrl: string | null
  updatedAt: Date
  createdAt: Date
}

interface TeamConfig {
  isLocalTeam: boolean
  divisionRivals: string[]
  inStateTeams: boolean
  displayName: string
}

interface MLGamePayload {
  game_id: string
  home_team: string
  away_team: string
  home_win_pct_pre: number
  away_win_pct_pre: number
  home_wins_pre: number
  away_wins_pre: number
  is_local_team: number
  is_in_state_team: number
  divisional_matchup: number
}

interface MLResponse {
  top_game_id: string
  top_probability: number
  probabilities: Array<{
    game_id: string
    probability_all: number
    score: number
    probability: number
  }>
  skipped: string[]
  local_enforced: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { games, teamRecords } = await request.json()
    
    if (!games || !Array.isArray(games)) {
      return NextResponse.json(
        { error: 'Games array is required' },
        { status: 400 }
      )
    }
    
    if (!teamRecords || !Array.isArray(teamRecords)) {
      return NextResponse.json(
        { error: 'Team records array is required' },
        { status: 400 }
      )
    }
    
    // Create a map of team abbreviation -> record for quick lookup
    const recordMap = new Map<string, TeamRecord>()
    teamRecords.forEach((record: TeamRecord) => {
      recordMap.set(record.abbreviation, record)
    })
    
    // Convert games to ML model format
    const mlGames: MLGamePayload[] = games.map((game: Game) => {
      const homeConfig: TeamConfig = teamConfig[game.homeTeam as keyof typeof teamConfig]
      const awayConfig: TeamConfig = teamConfig[game.awayTeam as keyof typeof teamConfig]
      const homeRecord = recordMap.get(game.homeTeam)
      const awayRecord = recordMap.get(game.awayTeam)
      
      // Generate game_id in format: {year}W{week}-{away}@{home}
      const gameId = `${game.year}W${String(game.week).padStart(2, '0')}-${game.awayTeam}@${game.homeTeam}`
      
      // Calculate flags
      const isLocalTeam = (homeConfig?.isLocalTeam || awayConfig?.isLocalTeam) ? 1 : 0
      const isInStateTeam = (homeConfig?.inStateTeams || awayConfig?.inStateTeams) ? 1 : 0
      const isDivisionalMatchup = (
        homeConfig?.divisionRivals?.includes(game.awayTeam) ||
        awayConfig?.divisionRivals?.includes(game.homeTeam)
      ) ? 1 : 0
      
      return {
        game_id: gameId,
        home_team: game.homeTeam,
        away_team: game.awayTeam,
        home_win_pct_pre: homeRecord?.winPercentage || 0,
        away_win_pct_pre: awayRecord?.winPercentage || 0,
        home_wins_pre: homeRecord?.wins || 0,
        away_wins_pre: awayRecord?.wins || 0,
        is_local_team: isLocalTeam,
        is_in_state_team: isInStateTeam,
        divisional_matchup: isDivisionalMatchup
      }
    })
    
    console.log('Calling ML API with payload:', { games: mlGames })
    
    // Call the ML model API
    const mlResponse = await fetch('https://broadcastmlmodel.onrender.com/predict_top', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        games: mlGames
      })
    })
    
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text()
      console.error('ML API failed:', mlResponse.status, errorText)
      throw new Error(`ML API failed: ${mlResponse.status}`)
    }
    
    const mlResult: MLResponse = await mlResponse.json()
    console.log('ML API response:', mlResult)
    
    // Return the ML response with original games for reference
    return NextResponse.json({
      ...mlResult,
      originalGames: games
    })
    
  } catch (error) {
    console.error('ML Predictions API error:', error)
    return NextResponse.json(
      { error: 'Failed to get ML predictions' },
      { status: 500 }
    )
  }
}