import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Coins,
  TreeDeciduous,
  Droplets,
  Activity,
  Repeat,
  RefreshCw,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import CreditMintingWorkflow from "@/components/CreditMintingWorkflow";

interface VerificationRequest {
  id: string;
  region_id: string;
  credit_amount: number;
  credit_type: "land" | "ocean" | "health" | "circular";
  status: "pending" | "approved" | "rejected";
  required_signatures: number;
  description: string | null;
  evidence_urls: string[] | null;
  created_by: string;
  created_at: string;
  signatures?: VerificationSignature[];
  region?: { region_name: string; region_code: string };
}

interface VerificationSignature {
  id: string;
  request_id: string;
  signer_id: string;
  signature_type: "approve" | "reject";
  comment: string | null;
  signed_at: string;
}

interface RCIRegion {
  id: string;
  region_name: string;
  region_code: string;
}

const creditTypeConfig = {
  land: { icon: TreeDeciduous, color: "text-green-400", label: "Land Regeneration" },
  ocean: { icon: Droplets, color: "text-blue-400", label: "Blue Economy" },
  health: { icon: Activity, color: "text-rose-400", label: "Human Wellbeing" },
  circular: { icon: Repeat, color: "text-purple-400", label: "Circular Economy" },
};

const statusConfig = {
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
  approved: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
  rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

const VerificationWorkflow = () => {
  const { user, roles } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [regions, setRegions] = useState<RCIRegion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [signingRequest, setSigningRequest] = useState<string | null>(null);
  const [signatureComment, setSignatureComment] = useState("");
  const [mintingRequest, setMintingRequest] = useState<VerificationRequest | null>(null);
  const [newRequest, setNewRequest] = useState({
    region_id: "",
    credit_amount: 0,
    credit_type: "land" as const,
    description: "",
    required_signatures: 2,
  });

  const canSign = roles.includes("admin") || roles.includes("sovereign");
  const canCreate = roles.includes("admin") || roles.includes("sovereign");

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [requestsRes, regionsRes] = await Promise.all([
        supabase
          .from("verification_requests")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("rci_regions").select("id, region_name, region_code"),
      ]);

      if (requestsRes.error) throw requestsRes.error;
      if (regionsRes.error) throw regionsRes.error;

      // Fetch signatures for each request
      const requestsWithSignatures = await Promise.all(
        (requestsRes.data || []).map(async (request) => {
          const { data: signatures } = await supabase
            .from("verification_signatures")
            .select("*")
            .eq("request_id", request.id);

          const region = regionsRes.data?.find((r) => r.id === request.region_id);

          return {
            ...request,
            signatures: signatures || [],
            region,
          };
        })
      );

      setRequests(requestsWithSignatures as VerificationRequest[]);
      setRegions(regionsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("verification-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "verification_requests",
        },
        () => {
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "verification_signatures",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreateRequest = async () => {
    if (!user || !newRequest.region_id || newRequest.credit_amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("verification_requests").insert({
        region_id: newRequest.region_id,
        credit_amount: newRequest.credit_amount,
        credit_type: newRequest.credit_type,
        description: newRequest.description,
        required_signatures: newRequest.required_signatures,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Verification request created",
        description: "Awaiting multi-signature approval.",
      });

      setIsCreating(false);
      setNewRequest({
        region_id: "",
        credit_amount: 0,
        credit_type: "land",
        description: "",
        required_signatures: 2,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error creating request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSign = async (requestId: string, signatureType: "approve" | "reject") => {
    if (!user) return;

    try {
      // Add signature
      const { error: sigError } = await supabase.from("verification_signatures").insert({
        request_id: requestId,
        signer_id: user.id,
        signature_type: signatureType,
        comment: signatureComment,
      });

      if (sigError) throw sigError;

      // Check if we have enough signatures
      const request = requests.find((r) => r.id === requestId);
      if (request) {
        const approvals = (request.signatures?.filter((s) => s.signature_type === "approve").length || 0) + (signatureType === "approve" ? 1 : 0);
        const rejections = (request.signatures?.filter((s) => s.signature_type === "reject").length || 0) + (signatureType === "reject" ? 1 : 0);

        let newStatus = request.status;
        if (approvals >= request.required_signatures) {
          newStatus = "approved";
        } else if (rejections >= request.required_signatures) {
          newStatus = "rejected";
        }

        if (newStatus !== request.status) {
          await supabase
            .from("verification_requests")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", requestId);
        }
      }

      toast({
        title: `Verification ${signatureType}d`,
        description: signatureType === "approve" ? "Your approval has been recorded." : "Your rejection has been recorded.",
      });

      setSigningRequest(null);
      setSignatureComment("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error signing request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const hasUserSigned = (request: VerificationRequest) => {
    return request.signatures?.some((s) => s.signer_id === user?.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Verification Workflow
          </h3>
          <p className="text-sm text-muted-foreground">
            Multi-signature approval for high-value regenerative credit minting
          </p>
        </div>
        {canCreate && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle>Create Verification Request</DialogTitle>
                <DialogDescription>
                  Submit a request for regenerative credit minting approval.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Region</Label>
                    <Select
                      value={newRequest.region_id}
                      onValueChange={(value) => setNewRequest({ ...newRequest, region_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.region_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Credit Type</Label>
                    <Select
                      value={newRequest.credit_type}
                      onValueChange={(value) => setNewRequest({ ...newRequest, credit_type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(creditTypeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Credit Amount (RCI)</Label>
                    <Input
                      type="number"
                      value={newRequest.credit_amount}
                      onChange={(e) => setNewRequest({ ...newRequest, credit_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Required Signatures</Label>
                    <Select
                      value={String(newRequest.required_signatures)}
                      onValueChange={(value) => setNewRequest({ ...newRequest, required_signatures: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 signatures</SelectItem>
                        <SelectItem value="3">3 signatures</SelectItem>
                        <SelectItem value="4">4 signatures</SelectItem>
                        <SelectItem value="5">5 signatures</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    placeholder="Describe the regenerative activity and evidence..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRequest}>Submit Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(["pending", "approved", "rejected"] as const).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const count = requests.filter((r) => r.status === status).length;
          return (
            <div key={status} className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                  <p className="text-xl font-display font-bold text-foreground">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Requests list */}
      <div className="space-y-4">
        <AnimatePresence>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No verification requests yet</p>
            </div>
          ) : (
            requests.map((request, index) => {
              const TypeIcon = creditTypeConfig[request.credit_type].icon;
              const typeColor = creditTypeConfig[request.credit_type].color;
              const StatusIcon = statusConfig[request.status].icon;
              const statusColor = statusConfig[request.status].color;
              const approvals = request.signatures?.filter((s) => s.signature_type === "approve").length || 0;
              const progress = (approvals / request.required_signatures) * 100;

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 rounded-xl bg-card border border-border/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-secondary/50`}>
                        <TypeIcon className={`w-6 h-6 ${typeColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-display font-semibold text-foreground">
                            {request.credit_amount.toLocaleString()} RCI
                          </h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[request.status].bg} ${statusColor}`}>
                            <StatusIcon className="w-3 h-3" />
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {creditTypeConfig[request.credit_type].label} • {request.region?.region_name || "Unknown Region"}
                        </p>
                        {request.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {request.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          Created {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {approvals}/{request.required_signatures} signatures
                        </span>
                      </div>
                      <Progress value={progress} className="w-32 h-2" />
                    </div>
                  </div>

                  {/* Signatures */}
                  {request.signatures && request.signatures.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-2">Signatures:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.signatures.map((sig) => (
                          <span
                            key={sig.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              sig.signature_type === "approve"
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {sig.signature_type === "approve" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {sig.signer_id.slice(0, 8)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sign actions */}
                  {canSign && request.status === "pending" && !hasUserSigned(request) && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      {signingRequest === request.id ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Add a comment (optional)..."
                            value={signatureComment}
                            onChange={(e) => setSignatureComment(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSign(request.id, "approve")}
                              className="gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleSign(request.id, "reject")}
                              className="gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSigningRequest(null);
                                setSignatureComment("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSigningRequest(request.id)}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Sign Verification
                        </Button>
                      )}
                    </div>
                  )}

                  {hasUserSigned(request) && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        You have signed this request
                      </span>
                    </div>
                  )}

                  {/* Mint tokens action for approved requests */}
                  {request.status === "approved" && canSign && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <Button
                        size="sm"
                        onClick={() => setMintingRequest(request)}
                        className="gap-2"
                      >
                        <Coins className="w-4 h-4" />
                        Mint Impact Tokens
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Credit Minting Dialog */}
      <CreditMintingWorkflow
        request={mintingRequest ? {
          id: mintingRequest.id,
          region_id: mintingRequest.region_id,
          credit_amount: mintingRequest.credit_amount,
          credit_type: mintingRequest.credit_type,
          description: mintingRequest.description,
          region: mintingRequest.region,
        } : null}
        isOpen={!!mintingRequest}
        onClose={() => setMintingRequest(null)}
        onMinted={() => {
          setMintingRequest(null);
          fetchData();
        }}
      />
    </div>
  );
};

export default VerificationWorkflow;
