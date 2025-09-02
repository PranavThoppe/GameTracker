// app/hooks/useStarters.ts
import { useQuery } from '@tanstack/react-query'

interface Player {
  id: string
  fullName: string | null
  firstName: string | null
  lastName: string | null
  position: string | null
  team: string | null
  teamAbbr: string | null
  depthChartPosition: string | null
  depthChartOrder: number | null
  injuryStatus: string | null
}

interface UseStartersOptions {
  homeTeam: string
  awayTeam: string
  enabled?: boolean
}

const STARTER_LIMITS = {
  QB: 1,
  RB: 2,
  WR: 4,
  TE: 1,
  K: 1
} as const

type Position = keyof typeof STARTER_LIMITS

export function useStarters({ homeTeam, awayTeam, enabled = true }: UseStartersOptions) {
  console.log('useStarters called with:', { homeTeam, awayTeam, enabled })
  
  return useQuery({
    queryKey: ['starters', homeTeam, awayTeam],
    queryFn: async () => {
      console.log('queryFn executing for teams:', homeTeam, awayTeam)
      const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K']
      const teams = [homeTeam, awayTeam]
      console.log('Teams array:', teams)
      console.log('Positions array:', positions)
      
      // Make API calls for each team/position combination
      const fetchPromises = teams.flatMap(team =>
        positions.map(async position => {
          const url = `/api/players?team=${team}&position=${position}&active=true&starters=true`
          console.log(`Fetching: ${url}`)
          
          const response = await fetch(url)
          if (!response.ok) {
            console.error(`API call failed: ${response.status} ${response.statusText}`)
            throw new Error(`Failed to fetch ${position} players for ${team}`)
          }
          const players: Player[] = await response.json()
          console.log(`${team} ${position} players from API:`, players.length, players)
          
          // The API now handles the depth chart filtering and ordering
          // Just take the top N players as they're already sorted by depthChartOrder
          const starters = players.slice(0, STARTER_LIMITS[position])
          
          console.log(`${team} ${position} starters:`, starters)
          
          return {
            team,
            position,
            players: starters
          }
        })
      )
      
      const results = await Promise.all(fetchPromises)
      
      // Group by team
      const startersByTeam = results.reduce((acc, { team, position, players }) => {
        if (!acc[team]) acc[team] = {}
        acc[team][position] = players
        return acc
      }, {} as Record<string, Partial<Record<Position, Player[]>>>)
      
      return {
        homeTeam: startersByTeam[homeTeam] || {} as Partial<Record<Position, Player[]>>,
        awayTeam: startersByTeam[awayTeam] || {} as Partial<Record<Position, Player[]>>
      }
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  })
}