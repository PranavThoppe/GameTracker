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
  
  try {
    let whereClause: any = {}
    
    // Query by specific player IDs (most common use case)
    if (ids) {
      whereClause.id = {
        in: ids.split(',').map(id => id.trim())
      }
    }
    
    // Filter by team
    if (team) {
      whereClause.teamAbbr = team
    }
    
    // Filter by position
    if (position) {
      whereClause.position = position
    }
    
    // Filter by active status
    if (active !== null && active !== undefined) {
      whereClause.active = active === 'true'
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
    
    const players = await db.player.findMany({
      where: whereClause,
      orderBy: [
        { searchRank: 'asc' },
        { lastName: 'asc' }
      ],
      take: ids ? undefined : 100 // No limit when querying specific IDs
    })
    
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