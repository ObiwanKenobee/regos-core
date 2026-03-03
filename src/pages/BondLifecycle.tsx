import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Banknote, CheckCircle, XCircle, Clock, TrendingUp,
  Shield, FileText, DollarSign, Calendar, RefreshCw, ArrowRight,
  AlertTriangle, Percent, Building2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays, isPast } from "date-fns";

const statusFlow = ["draft", "pending_approval", "active", "matured", "cancelled"];

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  draft: { color: "text-slate-400", bg: "bg-slate-500/10", icon: FileText, label: "Draft" },
  pending_approval: { color: "text-amber-400", bg: "bg-amber-500/10", icon: Clock, label: "Pending Approval" },
  active: { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle, label: "Active" },
  matured: { color: "text-blue-400", bg: "bg-blue-500/10", icon: Calendar, label: "Matured" },
  cancelled: { color: "text-red-400", bg: "bg-red-500/10", icon: XCircle, label: "Cancelled" },
};

const BondLifecycle = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [actionDialog, setActionDialog] = useState<{ bond: any; action: string } | null>(null);
  const [actionNote, setActionNote] = useState("");

  const isAdmin = roles.includes("admin");
  const isSovereign = roles.includes("sovereign");
  const isAuthorized = isAdmin || isSovereign;

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    else if (!loading && !isAuthorized) navigate("/dashboard");
  }, [user, roles, loading, navigate, isAuthorized]);

  const { data: bonds = [], isLoading } = useQuery({
    queryKey: ["bond-lifecycle"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sovereign_bonds")
        .select("*, region:rci_regions(region_name, region_code, rci_score)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["bond-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bond_transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const updateBondStatus = useMutation({
    mutationFn: async ({ bondId, newStatus }: { bondId: string; newStatus: string }) => {
      const updateData: any = { status: newStatus };
      if (newStatus === "active") {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("sovereign_bonds")
        .update(updateData)
        .eq("id", bondId);
      if (error) throw error;

      // Record transaction
      await supabase.from("bond_transactions").insert({
        bond_id: bondId,
        transaction_type: newStatus === "active" ? "approval" : newStatus === "cancelled" ? "cancellation" : "status_change",
        amount: 0,
        counterparty: user?.email || "system",
        metadata: { note: actionNote, previous_status: actionDialog?.bond?.status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bond-lifecycle"] });
      queryClient.invalidateQueries({ queryKey: ["bond-transactions"] });
      toast({ title: "Bond Updated", description: "Bond status has been updated successfully." });
      setActionDialog(null);
      setActionNote("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const recordCouponPayment = useMutation({
    mutationFn: async (bond: any) => {
      const couponAmount = bond.principal_amount * (bond.coupon_rate / 100);
      // Adjust for RCI performance if linked
      let adjustedAmount = couponAmount;
      if (bond.rci_linked && bond.region?.rci_score && bond.rci_threshold) {
        const performanceRatio = Math.min(bond.region.rci_score / bond.rci_threshold, 1);
        adjustedAmount = couponAmount * performanceRatio;
      }

      const { error } = await supabase.from("bond_transactions").insert({
        bond_id: bond.id,
        transaction_type: "coupon_payment",
        amount: adjustedAmount,
        counterparty: "bondholders",
        metadata: {
          base_coupon: couponAmount,
          adjusted_coupon: adjustedAmount,
          rci_score: bond.region?.rci_score,
          rci_threshold: bond.rci_threshold,
          performance_ratio: bond.rci_linked
            ? Math.min((bond.region?.rci_score || 0) / (bond.rci_threshold || 70), 1)
            : 1,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bond-transactions"] });
      toast({ title: "Coupon Recorded", description: "Coupon payment has been recorded." });
    },
  });

  // Stats
  const stats = {
    total: bonds.length,
    active: bonds.filter((b: any) => b.status === "active").length,
    pending: bonds.filter((b: any) => b.status === "pending_approval").length,
    totalValue: bonds.filter((b: any) => b.status === "active").reduce((s: number, b: any) => s + b.principal_amount, 0),
    totalCoupons: transactions.filter((t: any) => t.transaction_type === "coupon_payment").reduce((s: number, t: any) => s + Number(t.amount), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container px-4 md:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/sovereign")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sovereign
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Banknote className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Bond Lifecycle Manager</h1>
                <p className="text-muted-foreground">
                  Full bond lifecycle: issuance → approval → coupon payments → maturity
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <Banknote className="w-5 h-5 text-primary mb-2" />
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Bonds</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <CheckCircle className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <Clock className="w-5 h-5 text-amber-400 mb-2" />
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <DollarSign className="w-5 h-5 text-violet-400 mb-2" />
                <p className="text-2xl font-bold">${(stats.totalValue / 1e6).toFixed(0)}M</p>
                <p className="text-xs text-muted-foreground">Active Value</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <TrendingUp className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-2xl font-bold">${(stats.totalCoupons / 1e6).toFixed(1)}M</p>
                <p className="text-xs text-muted-foreground">Coupons Paid</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="overview" className="gap-2">
                <Banknote className="w-4 h-4" /> Bonds
              </TabsTrigger>
              <TabsTrigger value="approvals" className="gap-2">
                <Shield className="w-4 h-4" /> Approvals
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <DollarSign className="w-4 h-4" /> Payments
              </TabsTrigger>
            </TabsList>

            {/* BONDS TAB */}
            <TabsContent value="overview">
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">All Bonds</CardTitle>
                  <CardDescription>Full lifecycle view of all sovereign bonds</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bond</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>Principal</TableHead>
                          <TableHead>Coupon</TableHead>
                          <TableHead>Maturity</TableHead>
                          <TableHead>RCI Link</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bonds.map((bond: any) => {
                          const status = statusConfig[bond.status] || statusConfig.draft;
                          const StatusIcon = status.icon;
                          const daysToMaturity = differenceInDays(new Date(bond.maturity_date), new Date());
                          const isMatured = isPast(new Date(bond.maturity_date));
                          return (
                            <TableRow key={bond.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{bond.bond_name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{bond.bond_type}</p>
                                </div>
                              </TableCell>
                              <TableCell>{bond.region?.region_name || "—"}</TableCell>
                              <TableCell className="font-mono">
                                ${(bond.principal_amount / 1e6).toFixed(1)}M
                              </TableCell>
                              <TableCell>{bond.coupon_rate}%</TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{format(new Date(bond.maturity_date), "MMM yyyy")}</p>
                                  {!isMatured && bond.status === "active" && (
                                    <p className="text-xs text-muted-foreground">{daysToMaturity}d left</p>
                                  )}
                                  {isMatured && bond.status === "active" && (
                                    <Badge variant="destructive" className="text-xs">Overdue</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {bond.rci_linked ? (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      {bond.rci_threshold}%
                                    </Badge>
                                    {bond.region?.rci_score && (
                                      <span className={`text-xs ${
                                        bond.region.rci_score >= (bond.rci_threshold || 70)
                                          ? "text-emerald-400"
                                          : "text-amber-400"
                                      }`}>
                                        ({bond.region.rci_score.toFixed(0)}%)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${status.bg} ${status.color} gap-1`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {bond.status === "draft" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setActionDialog({ bond, action: "submit" })}
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {bond.status === "active" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => recordCouponPayment.mutate(bond)}
                                    >
                                      <DollarSign className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* APPROVALS TAB */}
            <TabsContent value="approvals">
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Pending Approvals</CardTitle>
                  <CardDescription>Bonds awaiting administrative approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bonds.filter((b: any) => b.status === "pending_approval").length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No bonds pending approval</p>
                      </div>
                    ) : (
                      bonds
                        .filter((b: any) => b.status === "pending_approval")
                        .map((bond: any) => (
                          <div
                            key={bond.id}
                            className="p-4 rounded-xl bg-secondary/20 border border-border/30 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{bond.bond_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {bond.region?.region_name} • {bond.bond_type} • ${(bond.principal_amount / 1e6).toFixed(1)}M
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {isAdmin && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => setActionDialog({ bond, action: "approve" })}
                                      className="gap-1"
                                    >
                                      <CheckCircle className="w-4 h-4" /> Approve
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => setActionDialog({ bond, action: "reject" })}
                                      className="gap-1"
                                    >
                                      <XCircle className="w-4 h-4" /> Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              <div className="p-2 rounded-lg bg-secondary/30">
                                <p className="text-xs text-muted-foreground">Coupon</p>
                                <p className="font-semibold">{bond.coupon_rate}%</p>
                              </div>
                              <div className="p-2 rounded-lg bg-secondary/30">
                                <p className="text-xs text-muted-foreground">Maturity</p>
                                <p className="font-semibold text-sm">{format(new Date(bond.maturity_date), "MMM yyyy")}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-secondary/30">
                                <p className="text-xs text-muted-foreground">RCI Linked</p>
                                <p className="font-semibold">{bond.rci_linked ? `Yes (${bond.rci_threshold}%)` : "No"}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-secondary/30">
                                <p className="text-xs text-muted-foreground">Current RCI</p>
                                <p className="font-semibold">{bond.region?.rci_score?.toFixed(1) || "—"}%</p>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PAYMENTS TAB */}
            <TabsContent value="payments">
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Transaction History</CardTitle>
                  <CardDescription>Coupon payments, approvals, and bond events</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Counterparty</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx: any) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {tx.transaction_type.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {Number(tx.amount) > 0 ? `$${Number(tx.amount).toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell>{tx.counterparty || "—"}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(tx.transaction_date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {tx.metadata?.note || tx.metadata?.performance_ratio
                              ? `Perf: ${((tx.metadata?.performance_ratio || 1) * 100).toFixed(0)}%`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No transactions yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" && "Approve Bond"}
              {actionDialog?.action === "reject" && "Reject Bond"}
              {actionDialog?.action === "submit" && "Submit for Approval"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.bond?.bond_name} — ${(actionDialog?.bond?.principal_amount / 1e6)?.toFixed(1)}M
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add a note (optional)..."
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              variant={actionDialog?.action === "reject" ? "destructive" : "default"}
              onClick={() => {
                if (!actionDialog) return;
                const newStatus =
                  actionDialog.action === "approve" ? "active" :
                  actionDialog.action === "reject" ? "cancelled" :
                  "pending_approval";
                updateBondStatus.mutate({ bondId: actionDialog.bond.id, newStatus });
              }}
              disabled={updateBondStatus.isPending}
            >
              {updateBondStatus.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BondLifecycle;
