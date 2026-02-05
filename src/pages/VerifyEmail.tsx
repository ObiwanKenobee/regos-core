 import { useEffect, useState } from "react";
 import { useSearchParams, useNavigate } from "react-router-dom";
 import { motion } from "framer-motion";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { CheckCircle, XCircle, Loader2 } from "lucide-react";
 
 const VerifyEmail = () => {
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();
   const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
   const [message, setMessage] = useState("");
 
   useEffect(() => {
     const verifyEmail = async () => {
       const email = searchParams.get("email");
       const token = searchParams.get("token");
 
       if (!email || !token) {
         setStatus("error");
         setMessage("Invalid verification link");
         return;
       }
 
       try {
         const { data, error } = await supabase.functions.invoke("newsletter-confirm", {
           body: {
             email,
             verification_token: token,
             action: "verify",
           },
         });
 
         if (error) throw error;
 
         setStatus("success");
         setMessage("Your email has been verified successfully!");
       } catch (error: any) {
         console.error("Verification error:", error);
         setStatus("error");
         setMessage(error.message || "Verification failed. The link may have expired.");
       }
     };
 
     verifyEmail();
   }, [searchParams]);
 
   return (
     <div className="min-h-screen bg-background flex items-center justify-center p-4">
       <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="glass-strong rounded-2xl p-8 max-w-md w-full text-center"
       >
         {status === "loading" && (
           <>
             <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
             <h1 className="text-2xl font-display font-bold text-foreground mb-2">
               Verifying your email...
             </h1>
             <p className="text-muted-foreground">Please wait a moment.</p>
           </>
         )}
 
         {status === "success" && (
           <>
             <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
               <CheckCircle className="w-8 h-8 text-primary" />
             </div>
             <h1 className="text-2xl font-display font-bold text-foreground mb-2">
               Email Verified!
             </h1>
             <p className="text-muted-foreground mb-6">{message}</p>
             <Button onClick={() => navigate("/")}>
               Return to Home
             </Button>
           </>
         )}
 
         {status === "error" && (
           <>
             <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
               <XCircle className="w-8 h-8 text-destructive" />
             </div>
             <h1 className="text-2xl font-display font-bold text-foreground mb-2">
               Verification Failed
             </h1>
             <p className="text-muted-foreground mb-6">{message}</p>
             <Button onClick={() => navigate("/")}>
               Return to Home
             </Button>
           </>
         )}
       </motion.div>
     </div>
   );
 };
 
 export default VerifyEmail;