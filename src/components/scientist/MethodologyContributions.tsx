import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface VerificationRequest {
  id: string;
  credit_type: string;
  credit_amount: number;
  description: string | null;
  status: string;
  created_at: string;
  region?: {
    region_name: string;
    region_code: string;
  };
  signatures?: {
    id: string;
    signature_type: string;
    signer_id: string;
  }[];
}

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: "bg-amber-500/20 text-amber-500", icon: Clock },
  approved: { color: "bg-emerald-500/20 text-emerald-500", icon: CheckCircle },
  rejected: { color: "bg-red-500/20 text-red-500", icon: AlertCircle },
};

export const MethodologyContributions = () => {
  const [contributions, setContributions] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchContributions();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("contributions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verification_requests" },
        () => fetchContributions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchContributions = async () => {
    try {
      const { data, error } = await supabase
        .from("verification_requests")
        .select(`
          id,
          credit_type,
          credit_amount,
          description,
          status,
          created_at,
          region:rci_regions(region_name, region_code),
          signatures:verification_signatures(id, signature_type, signer_id)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setContributions(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter((c) => c.status === "pending").length || 0;
      const approved = data?.filter((c) => c.status === "approved").length || 0;
      const rejected = data?.filter((c) => c.status === "rejected").length || 0;
      
      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error("Error fetching contributions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      land: "Land Capacity",
      ocean: "Ocean Capacity",
      health: "Human Health",
      circular: "Circular Economy",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card className="glass-strong border-border/50">
        <CardContent className="py-12 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-strong border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Contributions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contributions Table */}
      <Card className="glass-strong border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Research Contributions
          </CardTitle>
          <CardDescription>
            Track your research submissions and peer review status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Contributions Yet</h3>
              <p className="text-muted-foreground">
                Submit your first research contribution to get started
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Type</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Impact Score</TableHead>
                    <TableHead>Signatures</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((contribution) => {
                    const StatusConfig = statusConfig[contribution.status] || statusConfig.pending;
                    const StatusIcon = StatusConfig.icon;
                    const signatureCount = contribution.signatures?.length || 0;

                    return (
                      <TableRow key={contribution.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {getTypeLabel(contribution.credit_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {contribution.region?.region_code || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {contribution.description?.split("\n")[0] || "No description"}
                        </TableCell>
                        <TableCell className="font-mono text-primary">
                          {contribution.credit_amount.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={(signatureCount / 2) * 100} className="w-16 h-2" />
                            <span className="text-xs text-muted-foreground">{signatureCount}/2</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={StatusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {contribution.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(contribution.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MethodologyContributions;
