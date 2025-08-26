// app/components/RosterCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Update the import path below if the hook is located elsewhere, e.g. "@/hooks/usePlayers"
// Update the path below to the actual location of your usePlayers hook
import { usePlayersByIds } from "../app/hooks/usePlayers";
import { useQuery } from "@tanstack/react-query";

interface Roster {
  owner_id: string;
  roster_id: number;
  players: string[];
  starters: string[];
  reserve?: string[];
  taxi?: string[];
}

interface RosterCardProps {
  leagueId: string;
  memberId: string;
}

export function RosterCard({ leagueId, memberId }: RosterCardProps) {
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

  // Fetch player data for the roster
  const { data: players, isLoading: playersLoading } = usePlayersByIds(
    memberRoster?.players || [],
    !!memberRoster?.players?.length
  );

  const isLoading = rostersLoading || playersLoading;

  const renderRosterContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-400">Loading roster...</p>
        </div>
      );
    }

    if (rostersError) {
      return (
        <div className="text-center py-8">
          <p className="text-red-400">Failed to load roster data.</p>
        </div>
      );
    }

    if (!memberRoster) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-400">No roster found for this member.</p>
        </div>
      );
    }

    if (!memberRoster.players?.length) {
      return (
        <p className="text-slate-400 text-center py-4">No players on roster</p>
      );
    }

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
  };

  return (
    <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10 sticky top-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-slate-200 text-lg">My Roster</CardTitle>
      </CardHeader>
      <CardContent>
        {renderRosterContent()}
      </CardContent>
    </Card>
  );
}