// components/MatchupCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Radio, Loader2, AlertCircle } from "lucide-react";
import { useStarters } from "@/app/hooks/useStarters";

export interface Game {
  id: string;
  year: number;
  week: number;
  homeTeam: string;
  awayTeam: string;
  timeDisplay: string;
  broadcast: string | null;
  matchup: string; // e.g., "DAL @ PHI"
  status: "scheduled" | "in_progress" | "final";
}

interface Player {
  id: string
  fullName: string | null
  firstName: string | null
  lastName: string | null
  position: string | null
  team: string | null
  teamAbbr: string | null
  depthChartPosition: string | null
  depthChartOrder: number | null
  injuryStatus: string | null
}

type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K'

export default function MatchupCard({
  game,
  onBack,
}: {
  game: Game;
  onBack: () => void;
}) {
  const { data: starters, isLoading, error } = useStarters({
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam
  })

  console.log('Starters data:', starters)
  console.log('Loading:', isLoading, 'Error:', error)

  // Position colors for consistent styling
  const positionColors = {
    'QB': 'bg-red-900/30 border-red-400/30 text-red-300',
    'RB': 'bg-green-900/30 border-green-400/30 text-green-300',
    'WR': 'bg-blue-900/30 border-blue-400/30 text-blue-300',
    'TE': 'bg-yellow-900/30 border-yellow-400/30 text-yellow-300',
    'K': 'bg-purple-900/30 border-purple-400/30 text-purple-300'
  }

  const renderTeamStarters = (teamAbbr: string, teamStarters: Partial<Record<Position, Player[]>>) => {
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K']
    
    return (
      <div className="space-y-3">
        <h3 className="text-slate-200 font-semibold text-lg text-center border-b border-slate-600 pb-2">
          {teamAbbr}
        </h3>
        {positions.map(position => {
          const players = teamStarters[position] || []
          const colorClass = positionColors[position]
          
          return (
            <div key={position} className="space-y-2">
              <h4 className="text-slate-300 font-medium text-sm uppercase tracking-wide">
                {position}
              </h4>
              {players.length > 0 ? (
                players.map(player => (
                  <div 
                    key={player.id}
                    className={`p-2 rounded border ${colorClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {player.fullName || `${player.firstName} ${player.lastName}` || 'Unknown Player'}
                      </span>
                    </div>
                    {player.injuryStatus && (
                      <div className="mt-1 px-1 py-0.5 bg-red-600/20 text-red-400 text-xs rounded border border-red-400/30">
                        {player.injuryStatus.toUpperCase()}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-2 rounded border border-slate-600/30 bg-slate-800/30">
                  <span className="text-xs text-slate-500">No {position} available</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
      <CardHeader className="pb-4 flex items-center justify-between">
        <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
          {game.awayTeam} @ {game.homeTeam}
          <span className="text-slate-400 text-sm font-normal">• Week {game.week}</span>
        </CardTitle>
        <Button
          variant="outline"
          onClick={onBack}
          className="border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60 hover:border-cyan-300/40"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Game Info */}
        <div className="flex items-center gap-4 text-sm text-slate-300 
                border border-slate-600 rounded-lg p-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{game.timeDisplay}</span>
          </div>
          <div className="flex items-center gap-1">
            <Radio className="w-4 h-4" />
            <span>{game.broadcast ?? "TBD Network"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className="capitalize">{game.status.replace("_", " ")}</span>
          </div>
        </div>


        {/* Starters Section */}
        <div>
          <h2 className="text-slate-200 text-xl font-bold mb-4 text-center">
            Starting Lineups
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                <p className="text-slate-400">Loading starters...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
                <p className="text-red-400">Failed to load starters</p>
                <p className="text-slate-500 text-sm">{error.message}</p>
              </div>
            </div>
          ) : starters ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderTeamStarters(game.awayTeam, starters.awayTeam)}
              {renderTeamStarters(game.homeTeam, starters.homeTeam)}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No starter information available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}