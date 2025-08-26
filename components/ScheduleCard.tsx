// components/ScheduleCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSchedule, useNFLState } from "@/app/hooks/useSchedule";
import { Calendar, Clock, Radio } from "lucide-react";

interface ScheduleCardProps {
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
  //           "Thu, November 28th at 12:30 PM ET"  (treat ET as EST/EDT? we’ll assume ET ~ EST for sorting)
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

export function ScheduleCard({ teams, year, week }: ScheduleCardProps) {
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

  const { data: schedule, isLoading, error } = useSchedule({
    year: finalYear,
    week: finalWeek,
    teams,
    enabled,
  });

  const renderScheduleContent = () => {
    if (!enabled || isLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-400">Loading schedule...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-400">Failed to load schedule data.</p>
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

    // Sort by parsed kickoff timestamp; fallback to alpha if parsing fails
    const sorted = [...schedule].sort((a, b) => {
      const ta = parseKickoffUTCms(a.timeDisplay, finalYear);
      const tb = parseKickoffUTCms(b.timeDisplay, finalYear);
      if (ta !== tb) return ta - tb;
      // stable fallback tie-breakers
      const byMatchup = a.matchup.localeCompare(b.matchup, undefined, { sensitivity: "base" });
      if (byMatchup !== 0) return byMatchup;
      return a.id.localeCompare(b.id);
    });

    return (
      <div className="space-y-3">
        <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide border-b border-slate-600 pb-1">
          {typeof year === "number" && typeof week === "number"
            ? `Week ${finalWeek} Games ${teams ? `(${teams.join(", ")})` : ""}`
            : `This Week's Games ${teams ? `(${teams.join(", ")})` : ""}`}
        </h3>

        {sorted.map((game) => {
          const isTeamGame =
            teams && teams.length > 0
              ? teams.some(
                  (team) =>
                    game.homeTeam === team.toUpperCase() ||
                    game.awayTeam === team.toUpperCase()
                )
              : false;

          return (
            <div
              key={game.id}
              className={`p-4 rounded-lg border transition-colors ${
                isTeamGame
                  ? "bg-blue-900/40 border-blue-400/40 shadow-md shadow-blue-500/20"
                  : "bg-slate-800/50 border-slate-600/30"
              }`}
            >
              <div className="space-y-2">
                {/* Matchup */}
                <div className="flex items-center justify-between">
                  <p className="text-slate-200 font-semibold text-lg">
                    {game.matchup}
                  </p>
                  <div className="text-right">
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

                  {/* Broadcast */}
                  {game.broadcast && (
                    <div className="flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      <span className="text-cyan-300">{game.broadcast}</span>
                    </div>
                  )}

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
    );
  };

  return (
    <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10 sticky top-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {typeof year === "number" && typeof week === "number"
            ? `Schedule - Week ${finalWeek}, ${finalYear}`
            : "This Week's Schedule"}
        </CardTitle>
      </CardHeader>
      <CardContent>{renderScheduleContent()}</CardContent>
    </Card>
  );
}
