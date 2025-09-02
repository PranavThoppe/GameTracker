// app/api/team-records/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const teamsParam = searchParams.get('teams')
    
    // Parse teams parameter (comma-separated)
    const teams = teamsParam ? teamsParam.split(',').map(t => t.trim().toUpperCase()) : []
    
    console.log('Fetching team records:', { teams })
    
    // Build the where clause
    const whereClause: any = {}
    
    // If specific teams requested, filter by abbreviation
    if (teams.length > 0) {
      whereClause.abbreviation = {
        in: teams
      }
    }
    
    // Query the database
    const teamRecords = await db.team.findMany({
      where: whereClause,
      orderBy: [
        { abbreviation: 'asc' }
      ]
    })
    
    console.log(`Found ${teamRecords.length} team records`)
    
    // Return the data
    return NextResponse.json(teamRecords)
    
  } catch (error) {
    console.error('Team records API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team records' },
      { status: 500 }
    )
  }
}