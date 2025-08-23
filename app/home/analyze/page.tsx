"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { usePlayersByIds } from "../../hooks/usePlayers";

interface Roster {
  owner_id: string;
  roster_id: number;
  players: string[];
  starters: string[];
  reserve?: string[];
  taxi?: string[];
}

interface LeagueMember {
  user_id: string;
  username: string;
  display_name: string | null;
}

export default function AnalyzeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueId = searchParams.get("league_id");
  const memberId = searchParams.get("member_id");

  // Fetch league members to get member info
  const { data: members } = useQuery<LeagueMember[]>({
    enabled: !!leagueId,
    queryKey: ["league-members", leagueId],
    queryFn: async () => {
      const r = await fetch(`/api/sleeper/league-members?league_id=${leagueId}`);
      if (!r.ok) throw new Error("failed to fetch members");
      return r.json();
    },
  });

  // Fetch rosters for the league
  const { data: rosters, isLoading: rostersLoading, error: rostersError } = useQuery<Roster[]>({
    enabled: !!leagueId,
    queryKey: ["rosters", leagueId],
    queryFn: async () => {
      const r = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
      if (!r.ok) throw new Error("failed to fetch rosters");
      return r.json();
    },
  });

  // Find the specific roster for this member
  const memberRoster = rosters?.find(roster => roster.owner_id === memberId);
  const member = members?.find(m => m.user_id === memberId);

  // Fetch player data for the roster
  const { data: players, isLoading: playersLoading } = usePlayersByIds(
    memberRoster?.players || [],
    !!memberRoster?.players?.length
  );

  // Redirect if missing required params
  useEffect(() => {
    if (!leagueId || !memberId) {
      router.replace("/home");
    }
  }, [leagueId, memberId, router]);

  const handleBack = () => {
    router.back();
  };

  if (!leagueId || !memberId) {
    return null; // Will redirect in useEffect
  }

  const memberName = member?.display_name || member?.username || "Unknown Member";
  const isLoading = rostersLoading || playersLoading;

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline"
          onClick={handleBack}
          className="border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60 hover:border-cyan-300/40"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Logo width={400} height={100} />
      </div>

      {/* Page Title */}
      <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-slate-200 text-2xl flex items-center gap-3">
            <User className="w-6 h-6" />
            {memberName}'s Team
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster Card - Vertical */}
        <div className="lg:col-span-1">
          <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-200 text-lg">My Roster</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="text-center py-8">
                  <p className="text-slate-400">Loading roster...</p>
                </div>
              )}

              {rostersError && (
                <div className="text-center py-8">
                  <p className="text-red-400">Failed to load roster data.</p>
                </div>
              )}

              {!isLoading && !rostersError && !memberRoster && (
                <div className="text-center py-8">
                  <p className="text-slate-400">No roster found for this member.</p>
                </div>
              )}

{!isLoading && !rostersError && memberRoster && (
                <div className="space-y-4">
                  {memberRoster.players?.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No players on roster</p>
                  ) : (
                    (() => {
                      // Get all player data with starter status
                      const playersWithStatus = memberRoster.players?.map((playerId) => {
                        const player = players?.find(p => p.id === playerId);
                        const isStarter = memberRoster.starters?.includes(playerId);
                        return { playerId, player, isStarter };
                      }) || [];

                      // Position priority for sorting
                      const positionOrder = { 'QB': 1, 'RB': 2, 'WR': 3, 'TE': 4, 'K': 5, 'DEF': 6 };

                      // Position colors
                      const positionColors = {
                        'QB': 'bg-red-900/30 border-red-400/30',
                        'RB': 'bg-green-900/30 border-green-400/30',
                        'WR': 'bg-blue-900/30 border-blue-400/30',
                        'TE': 'bg-yellow-900/30 border-yellow-400/30',
                        'K': 'bg-purple-900/30 border-purple-400/30',
                        'DEF': 'bg-amber-800/30 border-amber-600/30'
                      };

                      // Sort players: starters first (by position), then bench players (by position)
                      const sortedPlayers = playersWithStatus.sort((a, b) => {
                        // First sort by starter status (starters first)
                        if (a.isStarter && !b.isStarter) return -1;
                        if (!a.isStarter && b.isStarter) return 1;
                        
                        // Then sort by position order
                        const posA = a.player?.position || 'ZZ';
                        const posB = b.player?.position || 'ZZ';
                        const orderA = positionOrder[posA as keyof typeof positionOrder] || 99;
                        const orderB = positionOrder[posB as keyof typeof positionOrder] || 99;
                        
                        if (orderA !== orderB) return orderA - orderB;
                        
                        // Finally sort by name
                        const nameA = a.player?.fullName || '';
                        const nameB = b.player?.fullName || '';
                        return nameA.localeCompare(nameB);
                      });

                      // Group players by starter/bench status
                      const starters = sortedPlayers.filter(p => p.isStarter);
                      const bench = sortedPlayers.filter(p => !p.isStarter);

                      const renderPlayerGroup = (players: typeof sortedPlayers, groupTitle: string) => (
                        <div className="space-y-3">
                          <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wide border-b border-slate-600 pb-1">
                            {groupTitle}
                          </h3>
                          {players.map(({ playerId, player, isStarter }) => {
                            const position = player?.position || 'UNK';
                            const colorClass = positionColors[position as keyof typeof positionColors] || 'bg-slate-800/50 border-slate-600/30';
                            
                            // Special handling for DEF names
                            const displayName = position === 'DEF' 
                              ? `${player?.team || 'Unknown'} Defense`
                              : player?.fullName || `Player ${playerId.slice(-4)}`;

                            return (
                              <div 
                                key={playerId}
                                className={`p-3 rounded-lg border transition-colors ${colorClass}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-slate-200 font-medium">
                                      {displayName}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                      <span>{position}</span>
                                      {player?.team && position !== 'DEF' && (
                                        <>
                                          <span>•</span>
                                          <span>{player.team}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {player?.injuryStatus && (
                                  <div className="mt-2 px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded border border-red-400/30">
                                    {player.injuryStatus.toUpperCase()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );

                      return (
                        <div className="space-y-6">
                          {starters.length > 0 && renderPlayerGroup(starters, "Starters")}
                          {bench.length > 0 && renderPlayerGroup(bench, "Bench")}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Empty Horizontal Card */}
        <div className="lg:col-span-2">
          <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10 h-full min-h-[400px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-200 text-lg">Analysis</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">Analysis tools coming soon...</p>
                <p className="text-slate-500 text-sm mt-2">This section will contain detailed player analysis and recommendations.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}