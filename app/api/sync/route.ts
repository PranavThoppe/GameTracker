import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Import the existing sync logic
import { POST as syncTeams } from './teams/route';
import { POST as syncSchedule } from '../schedule/sync/route';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let teamSyncResult = null;
  let scheduleSyncResult = null;

  try {
    console.log('Starting combined sync for teams and schedule...');

    // Run team sync
    console.log('Running team sync...');
    teamSyncResult = await syncTeams();

    // Run schedule sync
    console.log('Running schedule sync...');
    scheduleSyncResult = await syncSchedule(req);

    console.log('Combined sync complete.');

    return NextResponse.json({
      success: true,
      message: 'Combined sync completed successfully.',
      duration: Date.now() - startTime,
      teamSync: teamSyncResult?.json(),
      scheduleSync: scheduleSyncResult?.json(),
    });
  } catch (error) {
    console.error('Combined sync failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Combined sync failed.',
        duration: Date.now() - startTime,
        teamSync: teamSyncResult?.json() || { error: 'Team sync did not complete.' },
        scheduleSync: scheduleSyncResult?.json() || { error: 'Schedule sync did not complete.' },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}