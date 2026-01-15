import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Coins,
  CheckCircle2,
  Sparkles,
  TreeDeciduous,
  Droplets,
  Activity,
  Repeat,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ApprovedRequest {
  id: string;
  region_id: string;
  credit_amount: number;
  credit_type: string;
  description: string | null;
  region?: { region_name: string; region_code: string };
}

interface CreditMintingWorkflowProps {
  request: ApprovedRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onMinted: () => void;
}

const creditTypeConfig = {
  land: { icon: TreeDeciduous, color: "text-green-400", bg: "bg-green-400/20", glow: "shadow-green-400/30" },
  ocean: { icon: Droplets, color: "text-blue-400", bg: "bg-blue-400/20", glow: "shadow-blue-400/30" },
  health: { icon: Activity, color: "text-rose-400", bg: "bg-rose-400/20", glow: "shadow-rose-400/30" },
  circular: { icon: Repeat, color: "text-purple-400", bg: "bg-purple-400/20", glow: "shadow-purple-400/30" },
};

const CreditMintingWorkflow = ({ request, isOpen, onClose, onMinted }: CreditMintingWorkflowProps) => {
  const { user } = useAuth();
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStage, setMintingStage] = useState(0);
  const [isMinted, setIsMinted] = useState(false);

  const stages = [
    "Validating verification signatures...",
    "Calculating regenerative capacity...",
    "Generating cryptographic proof...",
    "Minting impact tokens...",
    "Recording to blockchain ledger...",
  ];

  useEffect(() => {
    if (!isOpen) {
      setIsMinting(false);
      setMintingStage(0);
      setIsMinted(false);
    }
  }, [isOpen]);

  const handleMint = async () => {
    if (!request || !user) return;

    setIsMinting(true);
    setMintingStage(0);

    try {
      // Simulate minting stages
      for (let i = 0; i < stages.length; i++) {
        setMintingStage(i);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Generate a mock transaction hash
      const txHash = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      // Insert the minted token
      const { error } = await supabase.from("impact_tokens").insert({
        verification_request_id: request.id,
        region_id: request.region_id,
        token_type: request.credit_type,
        amount: request.credit_amount,
        minted_by: user.id,
        transaction_hash: txHash,
        metadata: {
          description: request.description,
          region_name: request.region?.region_name,
          minting_timestamp: new Date().toISOString(),
        },
      });

      if (error) throw error;

      setIsMinted(true);

      toast({
        title: "Impact Tokens Minted!",
        description: `${request.credit_amount.toLocaleString()} ${request.credit_type} tokens have been minted.`,
      });

      setTimeout(() => {
        onMinted();
        onClose();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Minting Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsMinting(false);
    }
  };

  if (!request) return null;

  const typeConfig = creditTypeConfig[request.credit_type as keyof typeof creditTypeConfig] || creditTypeConfig.land;
  const TypeIcon = typeConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isMinting && onClose()}>
      <DialogContent className="glass-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Mint Impact Tokens
          </DialogTitle>
          <DialogDescription>
            Convert approved verification request into impact tokens
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            {!isMinting && !isMinted ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className={`p-6 rounded-xl ${typeConfig.bg} border border-white/10 text-center`}>
                  <TypeIcon className={`w-12 h-12 ${typeConfig.color} mx-auto mb-3`} />
                  <div className="text-3xl font-display font-bold text-foreground mb-1">
                    {request.credit_amount.toLocaleString()} RCI
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {request.credit_type} Regeneration Credits
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-2">
                    {request.region?.region_name || "Unknown Region"}
                  </div>
                </div>

                {request.description && (
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                  </div>
                )}
              </motion.div>
            ) : isMinting && !isMinted ? (
              <motion.div
                key="minting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-center">
                  <motion.div
                    className={`p-6 rounded-full ${typeConfig.bg} shadow-lg ${typeConfig.glow}`}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        "0 0 20px 0px rgba(0,0,0,0)",
                        "0 0 40px 10px rgba(0,0,0,0.3)",
                        "0 0 20px 0px rgba(0,0,0,0)"
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <TypeIcon className={`w-10 h-10 ${typeConfig.color}`} />
                  </motion.div>
                </div>

                <div className="space-y-3">
                  {stages.map((stage, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: idx <= mintingStage ? 1 : 0.3,
                        x: 0 
                      }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      {idx < mintingStage ? (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      ) : idx === mintingStage ? (
                        <Loader2 className="w-5 h-5 text-primary shrink-0 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-muted-foreground/30 shrink-0" />
                      )}
                      <span className={`text-sm ${idx <= mintingStage ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {stage}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="minted"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="mb-4"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                </motion.div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">
                  Tokens Minted Successfully!
                </h3>
                <p className="text-muted-foreground">
                  {request.credit_amount.toLocaleString()} {request.credit_type} tokens are now in the treasury
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          {!isMinting && !isMinted ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleMint} className="gap-2">
                <Coins className="w-4 h-4" />
                Mint Tokens
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreditMintingWorkflow;