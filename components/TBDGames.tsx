// components/TBDGames.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Radio, HelpCircle } from "lucide-react";

interface Game {
  id: string;
  year: number;
  week: number;
  homeTeam: string;
  awayTeam: string;
  timeDisplay: string;
  broadcast: string | null;
  matchup: string;
  status: 'scheduled' | 'in_progress' | 'final';
}

interface TBDGamesProps {
  games: Game[];
  teams?: string[];
  finalWeek?: number;
  finalYear?: number;
  isDallasGame: (game: Game) => boolean;
}

// Helper function to determine the time slot context
const getTimeSlotContext = (timeDisplay: string): string => {
  const lowerTime = timeDisplay.toLowerCase();
  
  // Check day of week first
  if (lowerTime.includes('thu') || lowerTime.includes('thursday')) {
    return 'Thursday Night';
  }
  if (lowerTime.includes('fri') || lowerTime.includes('friday')) {
    return 'Friday Night';
  }
  if (lowerTime.includes('mon') || lowerTime.includes('monday')) {
    return 'Monday Night';
  }
  if (lowerTime.includes('sat') || lowerTime.includes('saturday')) {
    return 'Saturday';
  }
  
  // Sunday games - check time
  if (lowerTime.includes('sun') || lowerTime.includes('sunday')) {
    // Look for time patterns
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = timeDisplay.match(timeRegex);
    if (match) {
      const hour = parseInt(match[1]);
      const ampm = match[3].toUpperCase();
      
      let hour24 = hour;
      if (ampm === 'PM' && hour !== 12) hour24 += 12;
      if (ampm === 'AM' && hour === 12) hour24 = 0;
      
      // Sunday Night Football (typically 7 PM or later)
      if (hour24 >= 19) return 'Sunday Night';
      
      // Late games (around 4 PM)
      if (hour24 >= 16) return 'Late';
      
      // Early games (around 1 PM)
      return 'Early';
    }
    
    // Fallback for Sunday games without clear time
    return 'Sunday';
  }
  
  // Default fallback
  return 'Games';
};

// Time parsing helpers
const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

const TZ_OFFSETS_HOURS: Record<string, number> = {
  EDT: -4, EST: -5, CDT: -5, CST: -6, MDT: -6, MST: -7, PDT: -7, PST: -8,
};

function parseKickoffUTCms(timeDisplay: string, year?: number): number {
  if (!timeDisplay || !year) return Number.POSITIVE_INFINITY;

  const re = /^\s*\w{3},\s*([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*([A-Z]{2,3})?\s*$/;
  const m = timeDisplay.match(re);
  if (!m) return Number.POSITIVE_INFINITY;

  const [, monthName, dayStr, hhStr, mmStr, ampm, tzRaw] = m;
  const month = MONTHS[(monthName || "").toLowerCase()];
  if (month == null) return Number.POSITIVE_INFINITY;

  let hour = Number(hhStr);
  const minute = Number(mmStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return Number.POSITIVE_INFINITY;

  if (ampm === "AM") {
    if (hour === 12) hour = 0;
  } else if (ampm === "PM") {
    if (hour !== 12) hour += 12;
  }

  const day = Number(dayStr);
  if (Number.isNaN(day)) return Number.POSITIVE_INFINITY;

  let tz = (tzRaw || "").toUpperCase();
  if (tz === "ET") tz = "EST";
  if (tz === "PT") tz = "PST";
  if (tz === "CT") tz = "CST";
  if (tz === "MT") tz = "MST";

  const offset = TZ_OFFSETS_HOURS[tz] ?? 0;
  const utcMs = Date.UTC(year, month, day, hour - offset, minute, 0, 0);
  return utcMs;
}

export function TBDGames({ games, teams, finalWeek, finalYear, isDallasGame }: TBDGamesProps) {
  // Group games by broadcast network + time slot
  const groupGamesByNetworkAndTime = () => {
    const grouped: Record<string, Game[]> = {};
    
    // Sort function for games within each group
    const sortByTime = (a: Game, b: Game) => {
      const ta = parseKickoffUTCms(a.timeDisplay, finalYear);
      const tb = parseKickoffUTCms(b.timeDisplay, finalYear);
      if (ta !== tb) return ta - tb;
      const byMatchup = a.matchup.localeCompare(b.matchup, undefined, { sensitivity: "base" });
      if (byMatchup !== 0) return byMatchup;
      return a.id.localeCompare(b.id);
    };
    
    games.forEach(game => {
      const network = game.broadcast || 'TBD';
      const timeSlot = getTimeSlotContext(game.timeDisplay);
      
      // Create a composite key
      let groupKey: string;
      
      if (network === 'TBD') {
        groupKey = `TBD ${timeSlot} Games`;
      } else {
        // For primetime games, use more descriptive names
        if (timeSlot === 'Thursday Night') {
          groupKey = `Thursday Night Football - ${network}`;
        } else if (timeSlot === 'Friday Night') {
          groupKey = `Friday Night Football - ${network}`;
        } else if (timeSlot === 'Sunday Night') {
          groupKey = `Sunday Night Football - ${network}`;
        } else if (timeSlot === 'Monday Night') {
          groupKey = `Monday Night Football - ${network}`;
        } else if (timeSlot === 'Saturday') {
          groupKey = `Saturday Games - ${network}`;
        } else {
          // For Sunday early/late games
          groupKey = `${network} ${timeSlot} Games`;
        }
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(game);
    });
    
    // Sort games within each group
    Object.keys(grouped).forEach(groupKey => {
      grouped[groupKey].sort(sortByTime);
    });
    
    return grouped;
  };

  const renderNetworkCard = (groupKey: string, games: Game[]) => {
    if (!games?.length) return null;

    const gameCount = games.length;
    const displayName = gameCount === 1 ? groupKey : `${groupKey} (${gameCount})`;

    return (
      <Card key={groupKey} className="border-slate-600/30 bg-slate-700/30 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-200 text-base flex items-center gap-2">
            <Radio className="w-4 h-4" />
            {displayName}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {games.map((game) => {
              const isTeamGame =
                teams && teams.length > 0
                  ? teams.some(
                      (team) =>
                        game.homeTeam === team.toUpperCase() ||
                        game.awayTeam === team.toUpperCase()
                    )
                  : false;

              const isDallas = isDallasGame(game);

              return (
                <div
                  key={game.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isTeamGame
                      ? "bg-blue-900/40 border-blue-400/40 shadow-md shadow-blue-500/20"
                      : isDallas
                      ? "bg-purple-900/40 border-purple-400/40 shadow-md shadow-purple-500/20"
                      : "bg-slate-800/50 border-slate-600/30"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Matchup */}
                    <div className="flex items-center justify-between">
                      <p className="text-slate-200 font-semibold">
                        {game.matchup}
                      </p>
                      <div className="text-right flex items-center gap-2">
                        {groupKey.startsWith('TBD') && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-900/40 border border-yellow-400/30 rounded text-xs text-yellow-300">
                            <HelpCircle className="w-3 h-3" />
                            TBD
                          </div>
                        )}
                        <p className="text-slate-400 text-sm">Week {game.week}</p>
                      </div>
                    </div>

                    {/* Game Details */}
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {/* Time */}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{game.timeDisplay}</span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            game.status === "final"
                              ? "bg-gray-400"
                              : game.status === "in_progress"
                              ? "bg-green-400"
                              : "bg-yellow-400"
                          }`}
                        />
                        <span className="capitalize">
                          {game.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Team abbreviations for clarity */}
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{game.awayTeam}</span>
                      <span>@</span>
                      <span>{game.homeTeam}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const networks = groupGamesByNetworkAndTime();
  const groupKeys = Object.keys(networks);
  
  if (groupKeys.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No games scheduled for this week</p>
      </div>
    );
  }

  // Sort group keys: TBD groups last, others by day/time priority
  const sortedGroupKeys = groupKeys.sort((a, b) => {
    // TBD groups go last
    if (a.startsWith('TBD') && !b.startsWith('TBD')) return 1;
    if (b.startsWith('TBD') && !a.startsWith('TBD')) return -1;
    
    // Both TBD - sort alphabetically
    if (a.startsWith('TBD') && b.startsWith('TBD')) return a.localeCompare(b);
    
    // Neither TBD - sort alphabetically
    return a.localeCompare(b);
  });

  return (
    <div>
      <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide border-b border-slate-600 pb-1 mb-4">
        {`Broadcast Assignments - Week ${finalWeek} ${teams ? `(${teams.join(", ")})` : ""}`}
      </h3>
      <div className="space-y-4">
        {sortedGroupKeys.map(groupKey => renderNetworkCard(groupKey, networks[groupKey]))}
      </div>
    </div>
  );
}