"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOut, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const STORAGE_USERID_KEY = "sleeper:user_id";
const STORAGE_USERNAME_KEY = "sleeper:username";

export default function HomeScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [season, setSeason] = useState<number>(2025);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [openCombobox, setOpenCombobox] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<{[leagueId: string]: string}>({});

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_USERID_KEY);
    if (!id) {
      router.replace("/");
    } else {
      setUserId(id);
    }
  }, [router]);

  const { data, isLoading, error } = useQuery({
    enabled: !!userId,
    queryKey: ["leagues", userId, season],
    queryFn: async () => {
      const r = await fetch(`/api/sleeper/leagues?user_id=${userId}&season=${season}`);
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
  });

  // Fetch league members only when combobox is opened
  const { data: membersData, isLoading: membersLoading } = useQuery({
    enabled: !!openCombobox,
    queryKey: ["league-members", openCombobox],
    queryFn: async () => {
      if (!openCombobox) return [];
      const r = await fetch(`/api/sleeper/league-members?league_id=${openCombobox}`);
      if (!r.ok) throw new Error("failed to fetch members");
      return r.json();
    },
  });

  const handleSignOut = async () => {
    try {
      // Clear ALL localStorage items
      localStorage.clear();
      
      // Wait a moment to ensure localStorage is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force complete page reload and navigation
      window.location.replace("/");
    } catch (error) {
      console.error('Sign out error:', error);
      // Fallback: still try to navigate
      window.location.replace("/");
    }
  };

  const handleLeagueClick = (leagueId: string) => {
    setSelectedLeague(selectedLeague === leagueId ? null : leagueId);
    // Close any open combobox when switching leagues
    setOpenCombobox(null);
  };

  const handleMemberSelect = (leagueId: string, memberId: string) => {
    setSelectedMembers(prev => ({
      ...prev,
      [leagueId]: memberId
    }));
    setOpenCombobox(null);
  };

  const leagues: any[] = data || [];
  const members: any[] = (openCombobox && membersData) ? membersData : [];

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Banner */}
      <Logo className="mb-8" width={600} height={150} />

      {/* Header Card with Controls */}
      <Card className="border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-200 text-2xl">Leagues</CardTitle>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="border-cyan-400/30 bg-cyan-800/50 text-slate-200 hover:bg-cyan-700/60 hover:border-cyan-300/40"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <label className="text-slate-300 text-sm font-medium">Season:</label>
            <Select value={season.toString()} onValueChange={(value) => setSeason(Number(value))}>
              <SelectTrigger className="w-32 bg-cyan-800/50 border-cyan-400/30 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-cyan-800/80 border-cyan-400/30">
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="text-slate-100 hover:bg-cyan-700/50">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading/Error States */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-slate-400">Loading leagues...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-400">Failed to load leagues. Please try again.</p>
        </div>
      )}

      {!isLoading && !error && leagues.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400">No leagues found for {season}.</p>
        </div>
      )}

      {/* League Cards Grid */}
      {!isLoading && !error && leagues.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {leagues.map((league) => (
            <Card 
              key={league.league_id} 
              className="border-cyan-400/20 bg-cyan-900/30 hover:bg-cyan-800/50 transition-all duration-200 cursor-pointer backdrop-blur shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:border-cyan-300/30"
              onClick={() => handleLeagueClick(league.league_id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-slate-200 text-lg leading-tight flex-1 pr-2">
                    {league.name}
                  </CardTitle>
                  {selectedLeague === league.league_id && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Add analyze functionality
                        console.log('Analyze league:', league.league_id);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 text-xs px-3 py-1.5"
                    >
                      Analyze
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Size:</span>
                    <span className="text-slate-200 font-medium">{league.total_rosters}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Sport:</span>
                    <span className="text-slate-200 font-medium uppercase">{league.sport}</span>
                  </div>
                </div>

                {/* League Members Combobox - Shows when league is selected */}
                {selectedLeague === league.league_id && (
                  <div 
                    className="space-y-2 pt-2 border-t border-cyan-400/20"
                    onClick={(e) => e.stopPropagation()} // Prevent card click when interacting with combobox
                  >
                    <label className="text-slate-300 text-sm font-medium">Members:</label>
                    <Popover 
                      open={openCombobox === league.league_id} 
                      onOpenChange={(open) => setOpenCombobox(open ? league.league_id : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox === league.league_id}
                          className="w-full justify-between bg-cyan-800/50 border-cyan-400/30 text-slate-100 hover:bg-cyan-700/60 hover:border-cyan-300/40"
                          onClick={(e) => e.stopPropagation()} // Prevent card click
                        >
                          {selectedMembers[league.league_id] && members.length > 0
                            ? members.find(m => m.user_id === selectedMembers[league.league_id])?.display_name || 
                              members.find(m => m.user_id === selectedMembers[league.league_id])?.username ||
                              "Selected member"
                            : "Search league members..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-cyan-800/80 border-cyan-400/30 shadow-lg shadow-cyan-500/20">
                        <Command className="bg-cyan-800/80">
                          <CommandInput 
                            placeholder="Search members..." 
                            className="bg-cyan-800/50 text-slate-100 border-cyan-400/20"
                          />
                          <CommandList>
                            <CommandEmpty className="text-slate-400">
                              {membersLoading ? "Loading members..." : "No members found."}
                            </CommandEmpty>
                            <CommandGroup>
                              {membersLoading ? (
                                <div className="p-2 text-center text-slate-400">Loading...</div>
                              ) : (
                                members.map((member) => (
                                  <CommandItem
                                    key={member.user_id}
                                    value={`${member.display_name || member.username} ${member.user_id}`}
                                    onSelect={() => handleMemberSelect(league.league_id, member.user_id)}
                                    className="text-slate-100 hover:bg-cyan-700/50"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedMembers[league.league_id] === member.user_id 
                                          ? "opacity-100" 
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {member.display_name || member.username}
                                      </span>
                                      {member.display_name && member.username && (
                                        <span className="text-xs text-slate-400">@{member.username}</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}