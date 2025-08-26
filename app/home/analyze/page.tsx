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

interface LeagueMember {
  user_id: string;
  username: string;
  display_name: string | null;
}

type AnalysisView = 'schedule' | 'broadcast';

export default function AnalyzeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueId = searchParams.get("league_id");
  const memberId = searchParams.get("member_id");
  const [activeView, setActiveView] = useState<AnalysisView>('schedule'); // Changed default to schedule

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

  const member = members?.find(m => m.user_id === memberId);

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
            {/* Analysis Toggle */}
            <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
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
                </div>
              </CardContent>
            </Card>

            {/* Content based on active view */}
            {activeView === 'schedule' ? (
              <ScheduleCard />
            ) : (
              <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/10">
                <CardContent className="pt-6">
                  <div className="text-center py-16">
                    <p className="text-slate-400 text-lg">
                      Broadcast analysis coming soon...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}