// app/home/analyze/AnalyzeScreen.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Radio, Calendar } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { RosterCard } from "@/components/RosterCard";
import { ScheduleCard } from "@/components/ScheduleCard";
import { useNFLState } from "@/app/hooks/useSchedule";
import { BroadcastCard } from "@/components/BroadcastCard";
import MatchupCard, { Game } from "@/components/MatchupCard";

interface LeagueMember {
  user_id: string;
  username: string;
  display_name: string | null;
}

type AnalysisView = "schedule" | "broadcast";

export default function AnalyzeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueId = searchParams.get("league_id");
  const memberId = searchParams.get("member_id");

  // Parse week/year from URL
  const yearParam = searchParams.get("year");
  const weekParam = searchParams.get("week");
  const year = yearParam ? Number(yearParam) : undefined;
  const week = weekParam ? Number(weekParam) : undefined;

  // Current season/week (fallbacks)
  const { data: nfl } = useNFLState();
  const currentYear = nfl?.season;
  const currentWeek = nfl?.display_week;

  // Helper to update URL params
  const setQuery = (updates: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null) sp.delete(k);
      else sp.set(k, v);
    });
    router.push(`?${sp.toString()}`);
  };

  // Regular-season bounds
  const REG_SEASON_WEEKS = 18;

  const goPrevWeek = () => {
    const y = year ?? currentYear ?? new Date().getFullYear();
    const w = week ?? currentWeek ?? 1;
    if (w > 1) setQuery({ year: String(y), week: String(w - 1) });
    else setQuery({ year: String(y - 1), week: String(REG_SEASON_WEEKS) });
  };

  const goNextWeek = () => {
    const y = year ?? currentYear ?? new Date().getFullYear();
    const w = week ?? currentWeek ?? 1;
    if (w < REG_SEASON_WEEKS) setQuery({ year: String(y), week: String(w + 1) });
    else setQuery({ year: String(y + 1), week: "1" });
  };

  const [activeView, setActiveView] = useState<AnalysisView>("schedule");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Fetch league members
  const { data: members } = useQuery<LeagueMember[]>({
    enabled: !!leagueId,
    queryKey: ["league-members", leagueId],
    queryFn: async () => {
      const r = await fetch(`/api/sleeper/league-members?league_id=${leagueId}`);
      if (!r.ok) throw new Error("failed to fetch members");
      return r.json();
    },
  });

  const member = members?.find((m) => m.user_id === memberId);

  // Redirect if missing required params
  useEffect(() => {
    if (!leagueId || !memberId) {
      router.replace("/home");
    }
  }, [leagueId, memberId, router]);

  const handleBack = () => router.back();
  const handleViewChange = (view: AnalysisView) => setActiveView(view);

  if (!leagueId || !memberId) return null; // Will redirect in useEffect

  const memberName = member?.display_name || member?.username || "Unknown Member";

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
          <RosterCard leagueId={leagueId} memberId={memberId} />
        </div>

        {/* Analysis Section - Expanded width */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="space-y-6">
            {/* If a game is selected, show Matchup view and skip the toggles */}
            {selectedGame ? (
             <MatchupCard 
              game={selectedGame} 
              onBack={() => setSelectedGame(null)}
              leagueId={leagueId}  // Add league ID for fantasy indicators
              memberId={memberId}  // Add member ID for fantasy indicators
            />
            ) : (
              <>
                {/* Analysis Toggle + Week Navigator */}
                <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Button
                        variant={activeView === "schedule" ? "default" : "outline"}
                        onClick={() => handleViewChange("schedule")}
                        className={`transition-all duration-200 ${
                          activeView === "schedule"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60"
                        }`}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                      <Button
                        variant={activeView === "broadcast" ? "default" : "outline"}
                        onClick={() => handleViewChange("broadcast")}
                        className={`transition-all duration-200 ${
                          activeView === "broadcast"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60"
                        }`}
                      >
                        <Radio className="w-4 h-4 mr-2" />
                        Broadcast
                      </Button>

                      {/* Week navigator */}
                      <div className="flex items-center gap-2 ml-3">
                        <Button
                          variant="outline"
                          onClick={goPrevWeek}
                          className="border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60"
                        >
                          Prev
                        </Button>
                        <div className="px-3 py-2 text-slate-300 rounded border border-cyan-400/20">
                          {(year ?? currentYear) && (week ?? currentWeek)
                            ? `Week ${week ?? currentWeek} • ${year ?? currentYear}`
                            : "Current Week"}
                        </div>
                        <Button
                          variant="outline"
                          onClick={goNextWeek}
                          className="border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content based on active view */}
                {activeView === "schedule" ? (
                  <ScheduleCard year={year} week={week} />
                ) : (
                  <BroadcastCard
                    year={year}
                    week={week}
                    // 👇 makes cards clickable in both BroadcastCard and TBDGames
                    onSelectGame={(g) => setSelectedGame(g)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}