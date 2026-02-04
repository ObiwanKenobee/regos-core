import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Mail, Sparkles, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const FloatingNewsletter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already subscribed or dismissed
    const dismissed = localStorage.getItem("newsletter_dismissed");
    const subscribed = localStorage.getItem("newsletter_subscribed");
    
    if (!dismissed && !subscribed) {
      // Show after 5 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    try {
      // Save to database
      const { error } = await supabase
        .from("newsletter_subscriptions" as any)
        .insert({
          email: email.toLowerCase().trim(),
          source: "floating_popup",
        });

      if (error) {
        // Check if it's a duplicate email error
        if (error.code === "23505") {
          toast({
            title: "Already subscribed!",
            description: "This email is already on our list.",
          });
        } else {
          throw error;
        }
      }
      
      setIsSubmitted(true);
      localStorage.setItem("newsletter_subscribed", "true");

      // Close after success
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Subscription failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("newsletter_dismissed", "true");
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleExpand = () => {
    setIsMinimized(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMinimized ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleExpand}
              className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Mail className="w-6 h-6" />
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
            >
              <div className="glass-strong rounded-2xl shadow-elevated border border-border/50 overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-primary/20 to-accent/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground">
                          Stay Updated
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Regenerative insights weekly
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleMinimize}
                        className="p-1.5 rounded-md hover:bg-background/50 transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Minimize"
                      >
                        <div className="w-4 h-0.5 bg-current" />
                      </button>
                      <button
                        onClick={handleDismiss}
                        className="p-1.5 rounded-md hover:bg-background/50 transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <AnimatePresence mode="wait">
                    {isSubmitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-4"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-semibold text-foreground mb-1">
                          You're on the list!
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Welcome to the Atlas Sanctum community.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div key="form" exit={{ opacity: 0 }}>
                        <p className="text-sm text-muted-foreground mb-4">
                          Join <span className="text-foreground font-medium">2,500+</span> stewards 
                          receiving RCI updates, regenerative research, and impact opportunities.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-3">
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                              required
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                              />
                            ) : (
                              <>
                                Subscribe
                                <Sparkles className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </form>

                        <p className="text-xs text-muted-foreground mt-3 text-center">
                          No spam. Unsubscribe anytime.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default FloatingNewsletter;
