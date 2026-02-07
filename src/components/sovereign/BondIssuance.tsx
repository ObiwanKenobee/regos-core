import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Banknote,
  Plus,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Leaf,
  Target,
  Calendar,
  DollarSign,
  Percent,
  Building2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Bond {
  id: string;
  bond_name: string;
  bond_type: string;
  principal_amount: number;
  coupon_rate: number;
  maturity_date: string;
  issue_date: string;
  status: string;
  rci_linked: boolean;
  rci_threshold: number | null;
  region_id: string;
  created_at: string;
  region?: {
    region_name: string;
    region_code: string;
  };
}

interface Region {
  id: string;
  region_code: string;
  region_name: string;
  rci_score: number;
}

interface BondIssuanceProps {
  regions: Region[];
  userId: string;
}

const bondTypes = [
  { value: "green", label: "Green Bond", icon: Leaf, description: "Environmental projects" },
  { value: "climate", label: "Climate Bond", icon: Target, description: "Climate mitigation" },
  { value: "sustainability", label: "Sustainability Bond", icon: TrendingUp, description: "Sustainable development" },
  { value: "transition", label: "Transition Bond", icon: Building2, description: "Transition financing" },
];

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  draft: { color: "bg-slate-500/20 text-slate-400", icon: FileText },
  pending_approval: { color: "bg-amber-500/20 text-amber-400", icon: Clock },
  active: { color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
  matured: { color: "bg-blue-500/20 text-blue-400", icon: CheckCircle },
  cancelled: { color: "bg-red-500/20 text-red-400", icon: XCircle },
};

export const BondIssuance = ({ regions, userId }: BondIssuanceProps) => {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    bond_name: "",
    bond_type: "green",
    principal_amount: "",
    coupon_rate: "",
    maturity_date: "",
    region_id: "",
    rci_linked: true,
    rci_threshold: "70",
  });

  useEffect(() => {
    fetchBonds();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("bonds-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sovereign_bonds" },
        () => {
          fetchBonds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchBonds = async () => {
    try {
      const { data, error } = await supabase
        .from("sovereign_bonds")
        .select(`
          *,
          region:rci_regions(region_name, region_code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBonds(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching bonds",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBond = async () => {
    if (!formData.bond_name || !formData.principal_amount || !formData.maturity_date || !formData.region_id) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("sovereign_bonds").insert({
        bond_name: formData.bond_name,
        bond_type: formData.bond_type,
        principal_amount: parseFloat(formData.principal_amount),
        coupon_rate: parseFloat(formData.coupon_rate) || 0,
        maturity_date: formData.maturity_date,
        region_id: formData.region_id,
        rci_linked: formData.rci_linked,
        rci_threshold: formData.rci_linked ? parseFloat(formData.rci_threshold) : null,
        created_by: userId,
        status: "draft",
      });

      if (error) throw error;

      toast({
        title: "Bond Created",
        description: "Your sovereign bond draft has been created successfully.",
      });

      setIsDialogOpen(false);
      setFormData({
        bond_name: "",
        bond_type: "green",
        principal_amount: "",
        coupon_rate: "",
        maturity_date: "",
        region_id: "",
        rci_linked: true,
        rci_threshold: "70",
      });
    } catch (error: any) {
      toast({
        title: "Error creating bond",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (bondId: string) => {
    try {
      const { error } = await supabase
        .from("sovereign_bonds")
        .update({ status: "pending_approval" })
        .eq("id", bondId);

      if (error) throw error;

      toast({
        title: "Submitted for Approval",
        description: "Your bond has been submitted for multi-signature approval.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Summary stats
  const stats = {
    total: bonds.length,
    active: bonds.filter((b) => b.status === "active").length,
    pending: bonds.filter((b) => b.status === "pending_approval").length,
    totalValue: bonds
      .filter((b) => b.status === "active")
      .reduce((acc, b) => acc + b.principal_amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Sovereign Bond Issuance</h2>
          <p className="text-muted-foreground">
            Issue and manage RCI-linked sovereign bonds for regenerative financing
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Bond
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Sovereign Bond</DialogTitle>
              <DialogDescription>
                Configure a new RCI-linked sovereign bond for your territory
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Bond Name</Label>
                  <Input
                    placeholder="e.g., Costa Rica Green Bond 2030"
                    value={formData.bond_name}
                    onChange={(e) => setFormData({ ...formData, bond_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Bond Type</Label>
                  <Select
                    value={formData.bond_type}
                    onValueChange={(v) => setFormData({ ...formData, bond_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bondTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Region</Label>
                  <Select
                    value={formData.region_id}
                    onValueChange={(v) => setFormData({ ...formData, region_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.region_name} ({region.region_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Principal Amount (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="100,000,000"
                      className="pl-10"
                      value={formData.principal_amount}
                      onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Coupon Rate (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="4.5"
                      className="pl-10"
                      value={formData.coupon_rate}
                      onChange={(e) => setFormData({ ...formData, coupon_rate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <Label>Maturity Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-10"
                      value={formData.maturity_date}
                      onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="col-span-2 p-4 rounded-lg bg-secondary/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">RCI-Linked Bond</Label>
                      <p className="text-xs text-muted-foreground">
                        Coupon rate adjusts based on RCI performance
                      </p>
                    </div>
                    <Button
                      variant={formData.rci_linked ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, rci_linked: !formData.rci_linked })}
                    >
                      {formData.rci_linked ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  {formData.rci_linked && (
                    <div>
                      <Label className="text-xs">RCI Threshold for Full Coupon</Label>
                      <Input
                        type="number"
                        value={formData.rci_threshold}
                        onChange={(e) => setFormData({ ...formData, rci_threshold: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBond} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Bond"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-strong border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Banknote className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Bonds</p>
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
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active Bonds</p>
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
                <p className="text-xs text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <DollarSign className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${(stats.totalValue / 1_000_000).toFixed(0)}M
                </p>
                <p className="text-xs text-muted-foreground">Active Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bonds Table */}
      <Card className="glass-strong border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Bond Portfolio</CardTitle>
          <CardDescription>Manage your sovereign bond issuances</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : bonds.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bonds Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first RCI-linked sovereign bond to begin regenerative financing.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Bond
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bond Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Coupon</TableHead>
                  <TableHead>Maturity</TableHead>
                  <TableHead>RCI Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonds.map((bond) => {
                  const StatusIcon = statusConfig[bond.status]?.icon || Clock;
                  const bondTypeInfo = bondTypes.find((t) => t.value === bond.bond_type);
                  const TypeIcon = bondTypeInfo?.icon || Leaf;

                  return (
                    <TableRow key={bond.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{bond.bond_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {bond.bond_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {bond.region?.region_code || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${(bond.principal_amount / 1_000_000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {bond.coupon_rate}%
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(bond.maturity_date), "MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        {bond.rci_linked ? (
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-primary" />
                            <span className="text-xs">{bond.rci_threshold}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[bond.status]?.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {bond.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {bond.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmitForApproval(bond.id)}
                          >
                            Submit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BondIssuance;
