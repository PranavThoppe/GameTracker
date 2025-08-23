"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const STORAGE_USERNAME_KEY = "sleeper:username";
const STORAGE_USERID_KEY = "sleeper:user_id";

export default function Page() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [showUserIdField, setShowUserIdField] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already saved on this device, go straight to /home
  useEffect(() => {
    const u = localStorage.getItem(STORAGE_USERNAME_KEY);
    const id = localStorage.getItem(STORAGE_USERID_KEY);
    if (u || id) router.replace("/home");
  }, [router]);

  async function continueWithUsername() {
    const u = username.trim();
    if (!u) return;
    setResolving(true);
    setErrorMsg(null);
    try {
      const r = await fetch(`/api/sleeper/user?username=${encodeURIComponent(u)}`);
      if (!r.ok) throw new Error("resolve-failed");
      const data: { username?: string; user_id?: string } = await r.json();
      localStorage.setItem(STORAGE_USERNAME_KEY, data.username ?? u);
      if (data.user_id) localStorage.setItem(STORAGE_USERID_KEY, data.user_id);
      router.push("/home");
    } catch {
      setErrorMsg("Couldn’t find that username. Double-check and try again.");
    } finally {
      setResolving(false);
    }
  }

  function continueWithId() {
    const id = userId.trim();
    if (!id) return;
    localStorage.setItem(STORAGE_USERID_KEY, id);
    if (username.trim()) localStorage.setItem(STORAGE_USERNAME_KEY, username.trim());
    router.push("/home");
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md border-cyan-400/20 bg-cyan-900/30 backdrop-blur shadow-lg shadow-cyan-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-200">Login to your account</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 pt-0">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="sleeper-username" className="text-slate-200">
              Sleeper Username
            </Label>
            <Input
              id="sleeper-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && username.trim() && !resolving) {
                  continueWithUsername();
                }
              }}
              className="bg-neutral-900 border-white/10 text-slate-100 placeholder:text-slate-500"
              autoComplete="username"
            />
          </div>

          <div className="space-y-4">
            <Button
              variant="secondary"
              className="w-full"
              disabled={!username.trim() || resolving}
              onClick={continueWithUsername}
              aria-busy={resolving}
            >
              {resolving ? "Resolving…" : "Continue"}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowUserIdField((v) => !v)}
            >
              Continue with User ID
            </Button>
          </div>

          {showUserIdField && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="sleeper-userid" className="text-slate-200">
                  Sleeper User ID
                </Label>
                <Input
                  id="sleeper-userid"
                  placeholder="e.g. 609953423353356288"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && userId.trim()) continueWithId();
                  }}
                  className="bg-neutral-900 border-white/10 text-slate-100 placeholder:text-slate-500"
                  inputMode="numeric"
                />
              </div>
              <Button className="w-full" disabled={!userId.trim()} onClick={continueWithId}>
                Continue with this ID
              </Button>
            </div>
          )}

          {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
