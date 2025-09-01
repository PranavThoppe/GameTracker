// components/BroadcastCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSchedule, useNFLState } from "@/app/hooks/useSchedule";
import { Calendar, Clock, Radio, Check, HelpCircle } from "lucide-react";
import { useState } from "react";
import { TBDGames } from "./TBDGames";

interface BroadcastCardProps {
  teams?: string[];
  year?: number;
  week?: number;
}

// --- Helpers to parse "Sun, September 7th at 4:05 PM EDT" into a UTC timestamp ---
const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

const TZ_OFFSETS_HOURS: Record<string, number> = {
  // US timezones commonly used in NFL listings
  EDT: -4, EST: -5,
  CDT: -5, CST: -6,
  MDT: -6, MST: -7,
  PDT: -7, PST: -8,
};

function parseKickoffUTCms(timeDisplay: string, year?: number): number {
  if (!timeDisplay || !year) return Number.POSITIVE_INFINITY;

  // Examples: "Sun, September 7th at 4:05 PM EDT"
  //           "Mon, December 1st at 8:15 PM EST"
  //           "Thu, November 28th at 12:30 PM ET"  (treat ET as EST/EDT? we'll assume ET ~ EST for sorting)
  const re =
    /^\s*\w{3},\s*([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*([A-Z]{2,3})?\s*$/;
  const m = timeDisplay.match(re);
  if (!m) return Number.POSITIVE_INFINITY;

  const [, monthName, dayStr, hhStr, mmStr, ampm, tzRaw] = m;
  const month = MONTHS[(monthName || "").toLowerCase()];
  if (month == null) return Number.POSITIVE_INFINITY;

  let hour = Number(hhStr);
  const minute = Number(mmStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return Number.POSITIVE_INFINITY;

  // 12h -> 24h
  if (ampm === "AM") {
    if (hour === 12) hour = 0;
  } else if (ampm === "PM") {
    if (hour !== 12) hour += 12;
  }

  const day = Number(dayStr);
  if (Number.isNaN(day)) return Number.POSITIVE_INFINITY;

  // Normalize tz labels: treat "ET" as "EST" for ordering purposes (close enough for sorting)
  let tz = (tzRaw || "").toUpperCase();
  if (tz === "ET") tz = "EST";
  if (tz === "PT") tz = "PST";
  if (tz === "CT") tz = "CST";
  if (tz === "MT") tz = "MST";

  const offset = TZ_OFFSETS_HOURS[tz] ?? 0; // default 0 if unknown
  // Local time (tz) -> UTC: UTC = local - offsetHours
  // Example: EDT = UTC-4 -> UTC = local - (-4) = local + 4
  const utcMs = Date.UTC(year, month, day, hour - offset, minute, 0, 0);
  return utcMs;
}

export function BroadcastCard({ teams, year, week }: BroadcastCardProps) {
  const [activeTab, setActiveTab] = useState<'confirmed' | 'tbd'>('confirmed');
  
  // Always call hooks in the same order
  const { data: nflState, isLoading: nflLoading, error: nflError } = useNFLState();

  // Use props if provided; otherwise fall back to NFL state
  const finalYear = typeof year === "number" ? year : nflState?.season;
  const finalWeek = typeof week === "number" ? week : nflState?.display_week;

  // Enable only when we have enough info to query
  const enabled =
    typeof year === "number" && typeof week === "number"
      ? true
      : !!nflState && !nflLoading && !nflError;

  // Helper function to determine if a game is primetime
  const isPrimetimeGame = (timeDisplay: string): boolean => {
    // Primetime/Special games are typically:
    // - Thursday games (any time)
    // - Friday games (any time)
    // - Sunday Night Football  
    // - Monday games (any time)
    // - Saturday games (any time)
    // - Thanksgiving games (any time on Thursday)
    // - International games at unusual times
    
    const lowerTime = timeDisplay.toLowerCase();
    
    // Debug log to see what we're working with
    console.log('Checking primetime for:', timeDisplay, 'lowercase:', lowerTime);
    
    // Check day of week - ANY game on these days is confirmed
    if (lowerTime.includes('thu') || lowerTime.includes('thursday')) {
      console.log('Found Thursday game (any time)');
      return true;
    }
    if (lowerTime.includes('fri') || lowerTime.includes('friday')) {
      console.log('Found Friday game (any time)');
      return true;
    }
    if (lowerTime.includes('mon') || lowerTime.includes('monday')) {
      console.log('Found Monday game (any time)');
      return true;
    }
    if (lowerTime.includes('sat') || lowerTime.includes('saturday')) {
      console.log('Found Saturday game (any time)');
      return true;
    }
    
    // Sunday Night Football (typically 8:20 PM ET or later)
    if (lowerTime.includes('sun') || lowerTime.includes('sunday')) {
      // Look for evening times (7 PM or later)
      const eveningTimeRegex = /(\d{1,2}):(\d{2})\s*pm/i;
      const match = timeDisplay.match(eveningTimeRegex);
      if (match) {
        const hour = parseInt(match[1]);
        if (hour >= 7) {
          console.log('Found Sunday night game');
          return true; // 7 PM or later on Sunday
        }
      }
    }
    
    console.log('Not a primetime game');
    return false;
  };

  // Helper to check if a game involves Dallas Cowboys
  const isDallasGame = (game: any): boolean => {
    return game.homeTeam === 'DAL' || game.awayTeam === 'DAL';
  };

  // Helper to check if a game starts at exactly 4:05 PM
  const is405Game = (timeDisplay: string): boolean => {
    return timeDisplay.includes('4:05 PM');
  };

  const { data: schedule, isLoading, error } = useSchedule({
    year: finalYear,
    week: finalWeek,
    teams,
    enabled,
  });

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

  // Group games by network and time slot
  const groupGamesByNetworkAndTime = (games: typeof schedule) => {
    if (!games) return { confirmed: {}, tbd: {} };
    
    // Find Dallas games first
    const dallasGames = games.filter(game => isDallasGame(game));
    
    // Filter out all 4:05 games unless they're Dallas games, and filter out NFL Network games
    const filteredGames = games.filter(game => {
      // Filter out NFL Network games completely (check various formats)
      const broadcast = (game.broadcast || '').toLowerCase();
      if (broadcast.includes('nfl net') || broadcast === 'nfln' || broadcast === 'nfl network') {
        return false;
      }
      
      if (is405Game(game.timeDisplay)) {
        return isDallasGame(game); // Only keep 4:05 games if they're Dallas games
      }
      return true; // Keep all non-4:05 games
    });
    
    // Initial split: primetime goes to confirmed, others to TBD
    let confirmed = filteredGames.filter(game => isPrimetimeGame(game.timeDisplay));
    let tbd = filteredGames.filter(game => !isPrimetimeGame(game.timeDisplay));
    
    // Process each Dallas game
    dallasGames.forEach(dallasGame => {
      // Skip if this Dallas game was filtered out (shouldn't happen since we keep Dallas 4:05 games)
      if (!filteredGames.find(g => g.id === dallasGame.id)) return;
      
      // If Dallas game is not already in confirmed (i.e., it's not primetime), move it there
      if (!isPrimetimeGame(dallasGame.timeDisplay)) {
        // Remove Dallas game from TBD and add to confirmed
        tbd = tbd.filter(game => game.id !== dallasGame.id);
        confirmed.push(dallasGame);
      }
      
      // Now remove conflicting games from TBD that share same network + time slot
      const dallasNetwork = dallasGame.broadcast || 'TBD';
      const dallasTimeSlot = getTimeSlotContext(dallasGame.timeDisplay);
      
      // Filter out games that share the same network AND time slot (but keep the Dallas game itself)
      tbd = tbd.filter(game => {
        const gameNetwork = game.broadcast || 'TBD';
        const gameTimeSlot = getTimeSlotContext(game.timeDisplay);
        
        // Keep the game if it's not in the same network+timeslot, or if it's also a Dallas game
        return !(gameNetwork === dallasNetwork && gameTimeSlot === dallasTimeSlot) || isDallasGame(game);
      });
    });
    
    // Sort function for games within each group
    const sortByTime = (a: any, b: any) => {
      const ta = parseKickoffUTCms(a.timeDisplay, finalYear);
      const tb = parseKickoffUTCms(b.timeDisplay, finalYear);
      if (ta !== tb) return ta - tb;
      const byMatchup = a.matchup.localeCompare(b.matchup, undefined, { sensitivity: "base" });
      if (byMatchup !== 0) return byMatchup;
      return a.id.localeCompare(b.id);
    };
    
    // Group by broadcast network + time slot
    const groupByNetworkAndTime = (gamesList: typeof games) => {
      const grouped: Record<string, typeof games> = {};
      
      gamesList.forEach(game => {
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
    
    return {
      confirmed: groupByNetworkAndTime(confirmed),
      tbd: groupByNetworkAndTime(tbd)
    };
  };

  const renderBroadcastContent = () => {
    if (!enabled || isLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-400">Loading broadcast data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-400">Failed to load broadcast data.</p>
        </div>
      );
    }

    if (!schedule?.length) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-400">No games scheduled for this week.</p>
        </div>
      );
    }

    const { confirmed, tbd } = groupGamesByNetworkAndTime(schedule);
    
    // Count total games for tab buttons
    const confirmedCount = Object.values(confirmed).flat().length;
    const tbdCount = Object.values(tbd).flat().length;
    
    const currentNetworks = activeTab === 'confirmed' ? confirmed : tbd;
    
    const renderNetworkCard = (groupKey: string, games: typeof schedule) => {
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
                          {activeTab === 'confirmed' && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-900/40 border border-green-400/30 rounded text-xs text-green-300">
                              <Check className="w-3 h-3" />
                              CONFIRMED
                            </div>
                          )}
                          {isDallas && activeTab === 'confirmed' && !isPrimetimeGame(game.timeDisplay) && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/40 border border-purple-400/30 rounded text-xs text-purple-300">
                              LOCAL TEAM
                            </div>
                          )}
                          {activeTab === 'tbd' && groupKey.startsWith('TBD') && (
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

    const renderNetworkCards = (networks: Record<string, typeof schedule>) => {
      const groupKeys = Object.keys(networks);
      
      if (groupKeys.length === 0) {
        return (
          <div className="text-center py-8">
            <p className="text-slate-400">
              {activeTab === 'confirmed' 
                ? "No confirmed primetime games this week" 
                : "No games scheduled for this week"}
            </p>
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
        <div className="space-y-4">
          {sortedGroupKeys.map(groupKey => renderNetworkCard(groupKey, networks[groupKey]))}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'confirmed' ? 'default' : 'outline'}
            onClick={() => setActiveTab('confirmed')}
            className={`transition-all duration-200 ${
              activeTab === 'confirmed'
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-500'
                : 'border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60'
            }`}
          >
            <Check className="w-4 h-4 mr-2" />
            CONFIRMED {confirmedCount > 1 ? `(${confirmedCount})` : ''}
          </Button>
          <Button
            variant={activeTab === 'tbd' ? 'default' : 'outline'}
            onClick={() => setActiveTab('tbd')}
            className={`transition-all duration-200 ${
              activeTab === 'tbd'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500'
                : 'border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60'
            }`}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            TBD {tbdCount > 1 ? `(${tbdCount})` : ''}
          </Button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'confirmed' ? (
            <div>
              <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide border-b border-slate-600 pb-1 mb-4">
                {`Confirmed Broadcasts - Week ${finalWeek} ${teams ? `(${teams.join(", ")})` : ""}`}
              </h3>
              {renderNetworkCards(confirmed)}
            </div>
          ) : (
            <TBDGames 
              games={Object.values(tbd).flat()}
              teams={teams}
              finalWeek={finalWeek}
              finalYear={finalYear}
              isDallasGame={isDallasGame}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10 sticky top-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
          <Radio className="w-5 h-5" />
          {typeof year === "number" && typeof week === "number"
            ? `Broadcast Analysis - Week ${finalWeek}, ${finalYear}`
            : "This Week's Broadcast Analysis"}
        </CardTitle>
      </CardHeader>
      <CardContent>{renderBroadcastContent()}</CardContent>
    </Card>
  );
}