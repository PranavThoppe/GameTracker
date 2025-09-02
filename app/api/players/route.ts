// app/api/players/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ids = searchParams.get('ids') // comma-separated player IDs
  const team = searchParams.get('team')
  const position = searchParams.get('position')
  const active = searchParams.get('active')
  const search = searchParams.get('search')
  const starters = searchParams.get('starters') // new parameter for starter queries
  
  try {
    let whereClause: any = {}
    
    // Query by specific player IDs (most common use case)
    if (ids) {
      whereClause.id = {
        in: ids.split(',').map(id => id.trim())
      }
    }
    
    // Filter by team - check both teamAbbr and team fields
    if (team) {
      whereClause.OR = [
        { teamAbbr: team },
        { team: team }
      ]
    }
    
    // Filter by position
    if (position) {
      whereClause.position = position
    }
    
    // Filter by active status
    if (active !== null && active !== undefined) {
      whereClause.active = active === 'true'
    }
    
    // For starter queries, filter by depth chart data
    if (starters === 'true') {
      whereClause.position = position // Must match the requested position
      whereClause.depthChartOrder = {
        not: null // Must have a depth chart order
      }
    }
    
    // Search by name
    if (search) {
      const searchTerm = search.toLowerCase()
      whereClause.OR = [
        { fullName: { contains: searchTerm } },
        { firstName: { contains: searchTerm } },
        { lastName: { contains: searchTerm } }
      ]
    }
    
    // Determine ordering and limit
    let orderBy: any[]
    let take: number | undefined
    
    if (starters === 'true') {
      // For starters, order by depth chart first
      orderBy = [
        { depthChartOrder: 'asc' },
        { searchRank: 'asc' },
        { lastName: 'asc' }
      ]
      take = 10 // Reasonable limit for depth chart queries
    } else {
      // Default ordering
      orderBy = [
        { searchRank: 'asc' },
        { lastName: 'asc' }
      ]
      take = ids ? undefined : 100
    }
    
    console.log('Player query params:', { team, position, active, starters })
    console.log('Where clause:', JSON.stringify(whereClause, null, 2))
    
    const players = await db.player.findMany({
      where: whereClause,
      orderBy,
      take
    })
    
    console.log(`Found ${players.length} players for query`)
    if (starters === 'true') {
      console.log('Depth chart data:', players.map(p => ({
        name: p.fullName,
        position: p.position,
        depthChartPosition: p.depthChartPosition,
        depthChartOrder: p.depthChartOrder,
        team: p.teamAbbr || p.team
      })))
    }
    
    // Parse fantasy positions back to array
    const playersWithParsedData = players.map(player => ({
      ...player,
      fantasyPositions: player.fantasyPositions 
        ? JSON.parse(player.fantasyPositions) 
        : []
    }))
    
    return Response.json(playersWithParsedData)
    
  } catch (error) {
    console.error('Failed to fetch players:', error)
    return Response.json(
      { error: 'Failed to fetch players' }, 
      { status: 500 }
    )
  }
}