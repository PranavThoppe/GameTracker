"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Radio, Calendar } from "lucide-react";
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

type AnalysisView = 'broadcast' | 'schedule';

export default function AnalyzeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueId = searchParams.get("league_id");
  const memberId = searchParams.get("member_id");
  const [activeView, setActiveView] = useState<AnalysisView>('broadcast');

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

  const handleViewChange = (view: AnalysisView) => {
    setActiveView(view);
  };

  if (!leagueId || !memberId) {
    return null; // Will redirect in useEffect
  }

  const memberName = member?.display_name || member?.username || "Unknown Member";
  const isLoading = rostersLoading || playersLoading;

  const renderBroadcastView = () => (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Game Coverage Card */}
        <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Live TV Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center py-8">
                <p className="text-slate-400">No live games detected</p>
                <p className="text-slate-500 text-sm mt-1">Check back during game days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Games Card */}
        <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-200 text-lg">Upcoming Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center py-8">
                <p className="text-slate-400">Loading game data...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Information Card */}
        <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-200 text-lg">Network Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center py-8">
                <p className="text-slate-400">Network info coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Large Coverage Map Card */}
      <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-200 text-lg">Regional Coverage Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">Interactive coverage map coming soon...</p>
            <p className="text-slate-500 text-sm mt-2">See which games are available in your area</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderScheduleView = () => (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Week Card */}
        <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8">
                <p className="text-slate-400">Loading weekly schedule...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Matchups Card */}
        <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-200 text-lg">Player Matchups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8">
                <p className="text-slate-400">Analyzing matchups...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Schedule Card */}
      <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-200 text-lg">Season Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">Full season schedule coming soon...</p>
            <p className="text-slate-500 text-sm mt-2">Track all your players' upcoming games</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <main className="mx-auto max-w-[1600px] p-6 space-y-6">
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
      <div className="grid grid-cols-12 gap-6">
        {/* Roster Card - Fixed width on left */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10 sticky top-6">
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

        {/* Analysis Section - Expanded width */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="space-y-6">
            {/* Analysis Toggle */}
            <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant={activeView === 'broadcast' ? 'default' : 'outline'}
                    onClick={() => handleViewChange('broadcast')}
                    className={`transition-all duration-200 ${
                      activeView === 'broadcast'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60'
                    }`}
                  >
                    <Radio className="w-4 h-4 mr-2" />
                    Broadcast
                  </Button>
                  <Button
                    variant={activeView === 'schedule' ? 'default' : 'outline'}
                    onClick={() => handleViewChange('schedule')}
                    className={`transition-all duration-200 ${
                      activeView === 'schedule'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60'
                    }`}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Content with Transitions */}
            <div className="relative min-h-[600px]">
              {activeView === 'broadcast' && renderBroadcastView()}
              {activeView === 'schedule' && renderScheduleView()}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </main>
  );
}