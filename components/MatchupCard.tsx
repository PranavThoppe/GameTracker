// components/MatchupCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {ArrowLeft, Calendar, Clock, Radio } from "lucide-react";


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

export default function MatchupCard({
  game,
  onBack,
}: {
  game: Game;
  onBack: () => void;
}) {
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

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-slate-300">
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

        {/* simple team line like your lists */}
        <div className="flex justify-between text-xs text-slate-500">
          <span>{game.awayTeam}</span>
          <span>@</span>
          <span>{game.homeTeam}</span>
        </div>
      </CardContent>
    </Card>
  );
}
