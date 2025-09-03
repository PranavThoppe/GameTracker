// app/api/schedule/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const week = searchParams.get('week')
  const teams = searchParams.get('teams') // comma-separated team abbreviations, e.g., "DAL,HOU"

  try {
    // Build Prisma where clause
    const where: any = {}

    if (year) where.year = Number(year)
    if (week) where.week = Number(week)

    if (teams) {
      const teamList = teams.split(',').map(t => t.trim().toUpperCase())
      // homeTeam IN (...) OR awayTeam IN (...)
      where.OR = [
        { homeTeam: { in: teamList } },
        { awayTeam: { in: teamList } },
      ]
    }

    const games = await db.schedule.findMany({
      where,
      orderBy: [
        { year: 'asc' },
        { week: 'asc' },
        { time: 'asc' }, // you're storing ESPN's string; this still sorts OK most of the time
      ],
      select: {
        id: true,
        year: true,
        week: true,
        homeTeam: true,
        awayTeam: true,
        time: true,
        broadcast: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const gamesWithStatus = games.map((g) => ({
      id: String(g.id),
      year: Number(g.year),
      week: Number(g.week),
      homeTeam: String(g.homeTeam),
      awayTeam: String(g.awayTeam),
      timeDisplay: String(g.time),            // keep ESPN string
      broadcast: g.broadcast ?? null,
      matchup: `${g.awayTeam} @ ${g.homeTeam}`,
      status: 'scheduled' as const,
    }))

    return Response.json(gamesWithStatus)
  } catch (error) {
    console.error('Failed to fetch schedule:', error)
    return Response.json(
      {
        error: 'Failed to fetch schedule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
