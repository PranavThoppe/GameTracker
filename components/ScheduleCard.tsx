// components/ScheduleCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentWeekSchedule } from "@/app/hooks/useSchedule";
import { Calendar, Clock, Radio } from "lucide-react";

interface ScheduleCardProps {
  teams?: string[]; // Optional array of team abbreviations to filter by
}

export function ScheduleCard({ teams }: ScheduleCardProps) {
  const { data: schedule, isLoading, error } = useCurrentWeekSchedule(teams);

  const renderScheduleContent = () => {
    if (isLoading) {
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

    // Group games by day if needed (for now just show all games)
    return (
      <div className="space-y-3">
        <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide border-b border-slate-600 pb-1">
          This Week's Games {teams && `(${teams.join(', ')})`}
        </h3>
        {schedule.map((game) => {
          // Determine if this game involves any of the specified teams
          const isTeamGame = teams && teams.length > 0 
            ? teams.some(team => 
                game.homeTeam === team.toUpperCase() || 
                game.awayTeam === team.toUpperCase()
              )
            : false;

          return (
            <div 
              key={game.id}
              className={`p-4 rounded-lg border transition-colors ${
                isTeamGame 
                  ? 'bg-blue-900/40 border-blue-400/40 shadow-md shadow-blue-500/20' 
                  : 'bg-slate-800/50 border-slate-600/30'
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
                    <div className={`w-2 h-2 rounded-full ${
                      game.status === 'final' ? 'bg-gray-400' :
                      game.status === 'in_progress' ? 'bg-green-400' :
                      'bg-yellow-400'
                    }`} />
                    <span className="capitalize">{game.status.replace('_', ' ')}</span>
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
          This Week's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderScheduleContent()}
      </CardContent>
    </Card>
  );
}