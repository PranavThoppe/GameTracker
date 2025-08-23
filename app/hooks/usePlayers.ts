// app/hooks/usePlayers.ts
import { useQuery } from '@tanstack/react-query'

interface Player {
  id: string
  fullName: string | null
  firstName: string | null
  lastName: string | null
  position: string | null
  team: string | null
  teamAbbr: string | null
  status: string | null
  active: boolean
  fantasyPositions: string[]
  injuryStatus: string | null
  // ... other fields
}

interface UsePlayersOptions {
  ids?: string[]
  team?: string
  position?: string
  active?: boolean
  search?: string
  enabled?: boolean
}

export function usePlayers(options: UsePlayersOptions = {}) {
  const { ids, team, position, active, search, enabled = true } = options
  
  return useQuery<Player[]>({
    queryKey: ['players', { ids, team, position, active, search }],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      if (ids?.length) params.set('ids', ids.join(','))
      if (team) params.set('team', team)
      if (position) params.set('position', position)
      if (active !== undefined) params.set('active', active.toString())
      if (search) params.set('search', search)
      
      const response = await fetch(`/api/players?${params}`)
      if (!response.ok) throw new Error('Failed to fetch players')
      
      return response.json()
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - player data doesn't change often
  })
}

// Utility hook for getting players by IDs (most common use case)
export function usePlayersByIds(ids: string[], enabled: boolean = true) {
  return usePlayers({ ids, enabled: enabled && ids.length > 0 })
}