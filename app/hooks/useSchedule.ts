// app/hooks/useSchedule.ts
import { useQuery } from '@tanstack/react-query'

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

interface NFLState {
  week: number
  display_week: number
  season: number
  season_type: string
  leg: number
}

interface UseScheduleOptions {
  year?: number
  week?: number
  teams?: string[] // Array of team abbreviations
  enabled?: boolean
}

export function useSchedule(options: UseScheduleOptions = {}) {
  const { year, week, teams, enabled = true } = options
  
  return useQuery<Game[]>({
    queryKey: ['schedule', { year, week, teams }],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      if (year) params.set('year', year.toString())
      if (week) params.set('week', week.toString())
      if (teams?.length) params.set('teams', teams.join(','))
      
      console.log('Fetching schedule with params:', params.toString())
      
      const response = await fetch(`/api/schedule?${params}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Schedule fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch schedule: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Schedule data received:', data.length, 'games')
      return data
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

// Hook to get current NFL state (week, season, etc.)
export function useNFLState() {
  return useQuery<NFLState>({
    queryKey: ['nfl-state'],
    queryFn: async () => {
      console.log('Fetching NFL state...')
      const response = await fetch('/api/sleeper/nfl-state')
      if (!response.ok) {
        console.error('NFL state fetch failed:', response.status)
        throw new Error('Failed to fetch NFL state')
      }
      const data = await response.json()
      console.log('NFL state received:', data)
      return data
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 2
  })
}

// Utility hook for getting current week's schedule
export function useCurrentWeekSchedule(teams?: string[]) {
  const { data: nflState, isLoading: nflLoading, error: nflError } = useNFLState()
  
  return useSchedule({
    year: nflState?.season,
    week: nflState?.display_week,
    teams,
    enabled: !!nflState && !nflLoading && !nflError
  })
}

// Hook for getting schedule for specific teams
export function useTeamSchedule(teams: string[], year?: number, week?: number) {
  return useSchedule({
    year,
    week,
    teams,
    enabled: teams.length > 0
  })
}

// Hook for getting a specific week's schedule (useful for testing)
export function useWeekSchedule(year: number, week: number) {
  return useSchedule({
    year,
    week,
    enabled: true
  })
}