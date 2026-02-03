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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Globe,
  TrendingUp,
  Award,
  ArrowLeft,
  RefreshCw,
  Star,
  MessageSquare,
  Heart,
  Trophy,
  Target,
  Zap,
  Leaf,
  Waves,
  Recycle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface CommunityMember {
  id: string;
  full_name: string | null;
  organization: string | null;
  country: string | null;
  avatar_url: string | null;
  contributions: number;
}

interface CommunityStats {
  totalMembers: number;
  activeRegions: number;
  totalContributions: number;
  impactScore: number;
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

const CommunityDashboard = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [view, setView] = useState<"overview" | "leaderboard" | "challenges">("overview");

  const isCommunity = roles.includes("community") || roles.includes("admin");

  // Mock challenges data
  const challenges: Challenge[] = [
    {
      id: "1",
      title: "Plant 1000 Trees",
      description: "Help restore forest capacity by tracking tree planting initiatives",
      progress: 756,
      target: 1000,
      reward: 50,
      type: "land",
    },
    {
      id: "2",
      title: "Clean Ocean Initiative",
      description: "Report and track ocean cleanup activities in your region",
      progress: 45,
      target: 100,
      reward: 75,
      type: "ocean",
    },
    {
      id: "3",
      title: "Circular Economy Challenge",
      description: "Document recycling and upcycling projects in your community",
      progress: 234,
      target: 500,
      reward: 60,
      type: "circular",
    },
    {
      id: "4",
      title: "Community Health Survey",
      description: "Participate in regional health impact assessments",
      progress: 89,
      target: 200,
      reward: 40,
      type: "health",
    },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && !isCommunity) {
      toast({
        title: "Access Denied",
        description: "You need community privileges to access this dashboard.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, roles, loading, navigate, isCommunity]);

  useEffect(() => {
    if (isCommunity && user) {
      fetchData();
    }
  }, [isCommunity, user]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch community profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedMembers: CommunityMember[] = (profiles || []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        organization: p.organization,
        country: p.country,
        avatar_url: p.avatar_url,
        contributions: Math.floor(Math.random() * 100), // Mock data
      }));

      setMembers(formattedMembers);

      // Fetch regions count
      const { count: regionCount } = await supabase
        .from("rci_regions")
        .select("*", { count: "exact", head: true });

      setStats({
        totalMembers: formattedMembers.length,
        activeRegions: regionCount || 0,
        totalContributions: formattedMembers.reduce((sum, m) => sum + m.contributions, 0),
        impactScore: 78,
      });
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "land":
        return <Leaf className="w-5 h-5 text-primary" />;
      case "ocean":
        return <Waves className="w-5 h-5 text-blue-500" />;
      case "health":
        return <Heart className="w-5 h-5 text-rose-500" />;
      case "circular":
        return <Recycle className="w-5 h-5 text-purple-500" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const leaderboardData = members
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 10)
    .map((m, i) => ({
      name: m.full_name || `User ${i + 1}`,
      contributions: m.contributions,
    }));

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isCommunity) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground">
                    Community Hub
                  </h1>
                  <p className="text-muted-foreground">
                    Connect, contribute, and track community impact
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* View Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={view === "overview" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("overview")}
            >
              <Globe className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={view === "leaderboard" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("leaderboard")}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
            <Button
              variant={view === "challenges" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("challenges")}
            >
              <Target className="w-4 h-4 mr-2" />
              Challenges
            </Button>
          </div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Community Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-foreground">
                  {stats?.totalMembers || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Active Regions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-primary">
                  {stats?.activeRegions || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Total Contributions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-foreground">
                  {stats?.totalContributions || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Impact Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-display font-bold text-primary">
                  {stats?.impactScore || 0}
                </p>
                <Progress value={stats?.impactScore || 0} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </motion.div>

          {view === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Challenges Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Active Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {challenges.slice(0, 3).map((challenge) => (
                        <div
                          key={challenge.id}
                          className="p-4 rounded-lg bg-secondary/30 border border-border/50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getChallengeIcon(challenge.type)}
                              <h4 className="font-medium text-foreground">{challenge.title}</h4>
                            </div>
                            <Badge variant="outline" className="text-primary border-primary/30">
                              +{challenge.reward} pts
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {challenge.description}
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{challenge.progress} / {challenge.target}</span>
                              <span className="text-muted-foreground">
                                {Math.round((challenge.progress / challenge.target) * 100)}%
                              </span>
                            </div>
                            <Progress
                              value={(challenge.progress / challenge.target) * 100}
                              className="h-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setView("challenges")}
                    >
                      View All Challenges
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top Contributors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      Top Contributors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {members.slice(0, 5).map((member, index) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.avatar_url || undefined} />
                                <AvatarFallback>
                                  {(member.full_name || "U")[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {index < 3 && (
                                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? "bg-amber-500 text-amber-950" :
                                  index === 1 ? "bg-slate-300 text-slate-950" :
                                  "bg-amber-700 text-amber-100"
                                }`}>
                                  {index + 1}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {member.full_name || "Anonymous"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.organization || member.country || "Community Member"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-primary">
                              {member.contributions}
                            </p>
                            <p className="text-xs text-muted-foreground">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setView("leaderboard")}
                    >
                      View Full Leaderboard
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Community Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2"
              >
                <Card className="glass-strong border-border/50">
                  <CardHeader>
                    <CardTitle>Contribution Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={leaderboardData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="contributions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {view === "leaderboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-strong border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Community Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members
                      .sort((a, b) => b.contributions - a.contributions)
                      .map((member, index) => (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-4 rounded-lg ${
                            index < 3 ? "bg-primary/5 border border-primary/20" : "bg-secondary/30"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? "bg-amber-500 text-amber-950" :
                              index === 1 ? "bg-slate-300 text-slate-950" :
                              index === 2 ? "bg-amber-700 text-amber-100" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {index + 1}
                            </div>
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback>
                                {(member.full_name || "U")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">
                                {member.full_name || "Anonymous"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {member.organization || "Community Member"}
                                {member.country && ` • ${member.country}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-mono font-bold text-primary">
                              {member.contributions}
                            </p>
                            <p className="text-sm text-muted-foreground">points</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {view === "challenges" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="glass-strong border-border/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          challenge.type === "land" ? "bg-primary/10" :
                          challenge.type === "ocean" ? "bg-blue-500/10" :
                          challenge.type === "health" ? "bg-rose-500/10" :
                          "bg-purple-500/10"
                        }`}>
                          {getChallengeIcon(challenge.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <Badge variant="outline" className="capitalize mt-1">
                            {challenge.type}
                          </Badge>
                        </div>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        <Award className="w-3 h-3 mr-1" />
                        +{challenge.reward} pts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{challenge.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {challenge.progress.toLocaleString()} / {challenge.target.toLocaleString()}
                        </span>
                        <span className="text-primary font-medium">
                          {Math.round((challenge.progress / challenge.target) * 100)}% complete
                        </span>
                      </div>
                      <Progress
                        value={(challenge.progress / challenge.target) * 100}
                        className="h-3"
                      />
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      Contribute
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityDashboard;
