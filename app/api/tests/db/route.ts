// app/api/tests/db/route.ts
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Log all available models/methods on the db object
    const dbKeys = Object.keys(db);
    console.log('Available on db object:', dbKeys);
    
    // Try to access different variations
    let results: any = {
      availableKeys: dbKeys,
      tests: {}
    };
    
    // Test different ways to access the schedule model
    try {
      // Test lowercase
      if ('schedule' in db) {
        const scheduleCount = await (db as any).schedule.count();
        results.tests.schedule_lowercase = { success: true, count: scheduleCount };
      } else {
        results.tests.schedule_lowercase = { success: false, error: 'schedule not found' };
      }
    } catch (error) {
      results.tests.schedule_lowercase = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    try {
      // Test uppercase
      if ('Schedule' in db) {
        const scheduleCount = await (db as any).Schedule.count();
        results.tests.Schedule_uppercase = { success: true, count: scheduleCount };
      } else {
        results.tests.Schedule_uppercase = { success: false, error: 'Schedule not found' };
      }
    } catch (error) {
      results.tests.Schedule_uppercase = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    // Test if we can access other models that we know exist
    try {
      if ('player' in db) {
        const playerCount = await (db as any).player.count();
        results.tests.player = { success: true, count: playerCount };
      }
    } catch (error) {
      results.tests.player = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    return Response.json(results);
    
  } catch (error) {
    console.error('Database test error:', error);
    return Response.json(
      { 
        error: 'Database test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}