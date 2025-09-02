// app/hooks/useTeamRecords.ts
import { useQuery } from '@tanstack/react-query'

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

interface MLPredictions {
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
  originalGames: Game[]
}

interface UseTeamRecordsOptions {
  teams: string[] // Array of team abbreviations to get records for
  enabled?: boolean
}

export function useTeamRecords(options: UseTeamRecordsOptions) {
  const { teams, enabled = true } = options
  
  return useQuery<TeamRecord[]>({
    queryKey: ['team-records', { teams: teams.sort() }],
    queryFn: async () => {
      if (!teams.length) return []
      
      const params = new URLSearchParams()
      params.set('teams', teams.join(','))
      
      console.log('Fetching team records with params:', params.toString())
      
      const response = await fetch(`/api/team-records?${params}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Team records fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch team records: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Team records data received:', data.length, 'records for teams:', teams)
      return data
    },
    enabled: enabled && teams.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - records don't change super frequently
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

// Hook to get ML predictions for a group of games
export function useMLPredictions(games: Game[], teamRecords: TeamRecord[]) {
  return useQuery<MLPredictions>({
    queryKey: ['ml-predictions', { 
      gameIds: games.map(g => g.id).sort(),
      teamRecordIds: teamRecords.map(t => t.id).sort()
    }],
    queryFn: async () => {
      if (!games.length || !teamRecords.length) {
        throw new Error('Games and team records are required')
      }
      
      console.log('Getting ML predictions for', games.length, 'games')
      
      const response = await fetch('/api/ml-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          games,
          teamRecords
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('ML predictions fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch ML predictions: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('ML predictions received:', data)
      return data
    },
    enabled: games.length > 0 && teamRecords.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - predictions can be more dynamic
    retry: 2
  })
}

// Helper hook specifically for TBDGames component
// Gets records for all teams that appear in the games array
export function useGameTeamRecords(games: Array<{ homeTeam: string; awayTeam: string }>) {
  // Extract unique teams from all games
  const teams = Array.from(new Set(
    games.flatMap(game => [game.homeTeam, game.awayTeam])
  ))
  
  return useTeamRecords({
    teams,
    enabled: games.length > 0
  })
}

// Combined hook for TBDGames that gets team records AND ML predictions
export function useGamePredictions(games: Game[]) {
  // Get team records first
  const { data: teamRecords, isLoading: recordsLoading, error: recordsError } = useGameTeamRecords(games)
  
  // Get ML predictions once we have team records
  const { data: predictions, isLoading: predictionsLoading, error: predictionsError } = useMLPredictions(
    games,
    teamRecords || []
  )
  
  return {
    teamRecords,
    predictions,
    isLoading: recordsLoading || predictionsLoading,
    error: recordsError || predictionsError
  }
}