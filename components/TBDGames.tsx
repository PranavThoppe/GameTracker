// components/TBDGames.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Radio, HelpCircle } from "lucide-react";
import { useMemo } from "react";

interface Game {
  id: string;
  year: number;
  week: number;
  homeTeam: string;
  awayTeam: string;
  timeDisplay: string;
  broadcast: string | null;
  matchup: string;
  status: "scheduled" | "in_progress" | "final";
}

interface TBDGamesProps {
  games: Game[];
  teams?: string[];
  finalWeek?: number;
  finalYear?: number;
  isDallasGame: (game: Game) => boolean;
}

/** ---- Time parsing helpers (unchanged core) ---- */
const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

const TZ_OFFSETS_HOURS: Record<string, number> = {
  EDT: -4, EST: -5,
  CDT: -5, CST: -6,
  MDT: -6, MST: -7,
  PDT: -7, PST: -8,
};

function parseKickoffUTCms(timeDisplay: string, year?: number): number {
  if (!timeDisplay || !year) return Number.POSITIVE_INFINITY;

  // Examples: "Sun, September 7th at 4:05 PM EDT", "Sun, December 1st at 1:00 PM ET"
  const re =
    /^\s*(?:\w{3}|\w+),\s*([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*([A-Z]{2,3})?\s*$/;
  const m = timeDisplay.match(re);
  if (!m) return Number.POSITIVE_INFINITY;

  const [, monthName, dayStr, hhStr, mmStr, ampm, tzRaw] = m;
  const month = MONTHS[(monthName || "").toLowerCase()];
  if (month == null) return Number.POSITIVE_INFINITY;

  let hour = Number(hhStr);
  const minute = Number(mmStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return Number.POSITIVE_INFINITY;

  // 12h → 24h
  if (ampm === "AM") {
    if (hour === 12) hour = 0;
  } else if (ampm === "PM") {
    if (hour !== 12) hour += 12;
  }

  const day = Number(dayStr);
  if (Number.isNaN(day)) return Number.POSITIVE_INFINITY;

  // Normalize tz labels
  let tz = (tzRaw || "").toUpperCase();
  if (tz === "ET") tz = "EST";
  if (tz === "PT") tz = "PST";
  if (tz === "CT") tz = "CST";
  if (tz === "MT") tz = "MST";

  const offset = TZ_OFFSETS_HOURS[tz] ?? 0; // default 0 if unknown
  // Local time (tz) -> UTC: UTC = local - offsetHours
  return Date.UTC(year, month, day, hour - offset, minute, 0, 0);
}

/** ---- Sunday-only slot bucketing ---- */
type SundaySlot = "Early" | "Late" | "Sunday";

function getSundaySlot(timeDisplay: string): SundaySlot {
  const lower = timeDisplay.toLowerCase();
  if (!lower.includes("sun")) return "Sunday"; // defensive fallback

  const m = timeDisplay.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return "Sunday";

  let hour = parseInt(m[1], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  if (hour >= 16) return "Late";         // ~4:05/4:25 window
  return "Early";                         // ~1:00 PM window
}

/** ---- Component ---- */
export function TBDGames({ games, teams, finalWeek, finalYear, isDallasGame }: TBDGamesProps) {
  // Build grouped buckets (Network × Sunday Slot), sorted internally by kickoff
  const networks = useMemo(() => {
    const grouped: Record<string, Game[]> = {};

    const sortByTime = (a: Game, b: Game) => {
      const ta = parseKickoffUTCms(a.timeDisplay, finalYear);
      const tb = parseKickoffUTCms(b.timeDisplay, finalYear);
      if (ta !== tb) return ta - tb;
      const byMatchup = a.matchup.localeCompare(b.matchup, undefined, { sensitivity: "base" });
      if (byMatchup !== 0) return byMatchup;
      return a.id.localeCompare(b.id);
    };

    games.forEach((game) => {
      // Only Sunday buckets should hit TBD; non-Sunday will fall to generic 'Sunday' if present
      const slot = getSundaySlot(game.timeDisplay);
      const network = game.broadcast || "TBD";
      const key = network === "TBD" ? `TBD ${slot} Games` : `${network} ${slot} Games`;
      (grouped[key] ||= []).push(game);
    });

    Object.keys(grouped).forEach((k) => grouped[k].sort(sortByTime));
    return grouped;
  }, [games, finalYear]);

  const groupKeys = Object.keys(networks);
  if (groupKeys.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No games scheduled for this week</p>
      </div>
    );
  }

  // Chronological ordering: non-TBD before TBD, Early → Late → (other), tie-break alpha
  const priority = (k: string) => {
        const isTbd = k.startsWith("TBD") ? 1 : 0;
        const slot = k.includes("Early") ? 0 : 1; // only Early or Late matter
        return [isTbd, slot, k] as const;
    };


  const sortedGroupKeys = groupKeys.sort((a, b) => {
    const [ta, sa, ka] = priority(a);
    const [tb, sb, kb] = priority(b);
    if (ta !== tb) return ta - tb;
    if (sa !== sb) return sa - sb;
    return ka.localeCompare(kb);
  });

  const renderNetworkCard = (groupKey: string, groupGames: Game[]) => {
    if (!groupGames?.length) return null;

    const gameCount = groupGames.length;
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
            {groupGames.map((game) => {
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
                      <p className="text-slate-200 font-semibold">{game.matchup}</p>
                      <div className="text-right flex items-center gap-2">
                        {groupKey.startsWith("TBD") && (
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
                        <span className="capitalize">{game.status.replace("_", " ")}</span>
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

  return (
    <div>
      <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide border-b border-slate-600 pb-1 mb-4">
        {`Broadcast Assignments - Week ${finalWeek} ${teams ? `(${teams.join(", ")})` : ""}`}
      </h3>
      <div className="space-y-4">
        {sortedGroupKeys.map((k) => renderNetworkCard(k, networks[k]))}
      </div>
    </div>
  );
}
