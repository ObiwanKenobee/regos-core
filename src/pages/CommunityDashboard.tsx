import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  Users, Globe, TrendingUp, Award, RefreshCw, Star, Heart, Trophy,
  Target, Zap, Leaf, Waves, Recycle, Coins, Activity, MessageSquare,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { RoleDashboardHeader } from "@/components/dashboard/RoleDashboardHeader";

interface CommunityMember {
  id: string;
  full_name: string | null;
  organization: string | null;
  country: string | null;
  avatar_url: string | null;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: number;
  type: "land" | "ocean" | "health" | "circular";
}

const tabs = [
  { id: "overview", label: "Overview", icon: Globe },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "challenges", label: "Challenges", icon: Target },
  { id: "activity", label: "Activity", icon: Activity },
];

const challenges: Challenge[] = [
  { id: "1", title: "Plant 1000 Trees", description: "Help restore forest capacity", progress: 756, target: 1000, reward: 50, type: "land" },
  { id: "2", title: "Clean Ocean Initiative", description: "Track ocean cleanup activities", progress: 45, target: 100, reward: 75, type: "ocean" },
  { id: "3", title: "Circular Economy Challenge", description: "Document recycling projects", progress: 234, target: 500, reward: 60, type: "circular" },
  { id: "4", title: "Community Health Survey", description: "Regional health impact assessments", progress: 89, target: 200, reward: 40, type: "health" },
];

const CommunityDashboard = () => {
  const { user, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [regionCount, setRegionCount] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [verificationCount, setVerificationCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const isCommunity = roles.includes("community") || roles.includes("admin");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    else if (!loading && !isCommunity) {
      toast({ title: "Access Denied", description: "Community privileges required.", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [user, roles, loading, navigate, isCommunity]);

  useEffect(() => {
    if (isCommunity && user) fetchData();
  }, [isCommunity, user]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [profilesRes, regionsRes, tokensRes, verificationsRes, notifRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, organization, country, avatar_url").order("created_at", { ascending: false }).limit(20),
        supabase.from("rci_regions").select("*", { count: "exact", head: true }),
        supabase.from("impact_tokens").select("amount"),
        supabase.from("verification_requests").select("status").eq("status", "approved"),
        supabase.from("notifications").select("id, title, message, type, severity, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20),
      ]);
      setMembers(profilesRes.data || []);
      setRegionCount(regionsRes.count || 0);
      setTokenCount((tokensRes.data || []).reduce((s: number, t: any) => s + t.amount, 0));
      setVerificationCount(verificationsRes.data?.length || 0);
      setNotifications(notifRes.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!isCommunity) return null;

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "land": return <Leaf className="w-5 h-5 text-primary" />;
      case "ocean": return <Waves className="w-5 h-5" style={{ color: "hsl(217, 91%, 60%)" }} />;
      case "health": return <Heart className="w-5 h-5" style={{ color: "hsl(347, 77%, 50%)" }} />;
      case "circular": return <Recycle className="w-5 h-5" style={{ color: "hsl(271, 91%, 65%)" }} />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const challengeChartData = challenges.map((c) => ({
    name: c.title.split(" ").slice(0, 2).join(" "),
    progress: Math.round((c.progress / c.target) * 100),
  }));

  return (
    <div className="min-h-screen bg-background">
      <RoleDashboardHeader
        userEmail={user?.email || ""}
        roles={roles}
        currentRole="community"
        isRealtimeActive={!isLoadingData}
        onSignOut={async () => { await signOut(); navigate("/auth"); }}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="Community Hub"
        accentColor="from-violet-500 to-purple-600"
        accentIcon={Users}
      />

      <main className="container px-4 md:px-6 py-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Community Members", value: members.length.toString(), icon: Users },
            { label: "Active Regions", value: regionCount.toString(), icon: Globe, accent: true },
            { label: "Tokens Minted", value: tokenCount.toLocaleString(), icon: Coins },
            { label: "Verified Projects", value: verificationCount.toString(), icon: Award, accent: true },
            { label: "Active Challenges", value: challenges.length.toString(), icon: Target },
          ].map((kpi) => (
            <Card key={kpi.label} className="glass-strong border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={`w-4 h-4 ${kpi.accent ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className={`text-2xl font-display font-bold ${kpi.accent ? "text-primary" : "text-foreground"}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Challenge progress chart */}
              <Card className="glass-strong border-border/50">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Challenge Progress</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={challengeChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                          formatter={(v: number) => [`${v}%`, "Progress"]} />
                        <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top contributors */}
              <Card className="glass-strong border-border/50">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" />Community Members</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members.slice(0, 6).map((member, index) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{(member.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {index < 3 && (
                              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                index === 0 ? "bg-amber-500 text-amber-950" : index === 1 ? "bg-slate-300 text-slate-950" : "bg-amber-700 text-amber-100"
                              }`}>{index + 1}</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{member.full_name || "Anonymous"}</p>
                            <p className="text-xs text-muted-foreground">{member.organization || member.country || "Member"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Active challenges list */}
              <Card className="glass-strong border-border/50 lg:col-span-2">
                <CardHeader><CardTitle className="text-sm">Active Challenges</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {challenges.map((challenge) => (
                      <div key={challenge.id} className="p-4 rounded-xl border border-border bg-secondary/20">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getChallengeIcon(challenge.type)}
                            <h4 className="font-medium text-sm text-foreground">{challenge.title}</h4>
                          </div>
                          <Badge variant="outline" className="text-primary border-primary/30 text-xs">+{challenge.reward} pts</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{challenge.description}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{challenge.progress}/{challenge.target}</span>
                            <span className="text-primary">{Math.round((challenge.progress / challenge.target) * 100)}%</span>
                          </div>
                          <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <Card className="glass-strong border-border/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" />Community Leaderboard</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div key={member.id} className={`flex items-center justify-between p-4 rounded-lg ${index < 3 ? "bg-primary/5 border border-primary/20" : "bg-secondary/30"}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? "bg-amber-500 text-amber-950" : index === 1 ? "bg-slate-300 text-slate-950" : index === 2 ? "bg-amber-700 text-amber-100" : "bg-muted text-muted-foreground"
                        }`}>{index + 1}</div>
                        <Avatar className="h-10 w-10"><AvatarImage src={member.avatar_url || undefined} /><AvatarFallback>{(member.full_name || "U")[0].toUpperCase()}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{member.full_name || "Anonymous"}</p>
                          <p className="text-sm text-muted-foreground">{member.organization || "Member"}{member.country && ` · ${member.country}`}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "challenges" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="glass-strong border-border/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          challenge.type === "land" ? "bg-primary/10" : challenge.type === "ocean" ? "bg-sky-500/10" : challenge.type === "health" ? "bg-rose-500/10" : "bg-violet-500/10"
                        }`}>{getChallengeIcon(challenge.type)}</div>
                        <div>
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <Badge variant="outline" className="capitalize mt-1">{challenge.type}</Badge>
                        </div>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-primary/30"><Award className="w-3 h-3 mr-1" />+{challenge.reward} pts</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{challenge.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{challenge.progress.toLocaleString()} / {challenge.target.toLocaleString()}</span>
                        <span className="text-primary font-medium">{Math.round((challenge.progress / challenge.target) * 100)}%</span>
                      </div>
                      <Progress value={(challenge.progress / challenge.target) * 100} className="h-3" />
                    </div>
                    <Button className="w-full mt-4" variant="outline">Contribute</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "activity" && (
            <Card className="glass-strong border-border/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" />Recent Activity</CardTitle></CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n: any) => (
                      <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                        <div className={`p-2 rounded-lg ${n.severity === "critical" ? "bg-destructive/10" : n.severity === "warning" ? "bg-amber-500/10" : "bg-primary/10"}`}>
                          <Activity className={`w-4 h-4 ${n.severity === "critical" ? "text-destructive" : n.severity === "warning" ? "text-amber-500" : "text-primary"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "MMM d, h:mm a")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default CommunityDashboard;
