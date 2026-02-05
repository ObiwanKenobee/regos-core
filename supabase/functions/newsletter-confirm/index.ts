 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { Resend } from "https://esm.sh/resend@2.0.0";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
 
 const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface NewsletterConfirmRequest {
   email: string;
   verification_token: string;
   action: "send" | "verify";
 }
 
 const handler = async (req: Request): Promise<Response> => {
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const { email, verification_token, action }: NewsletterConfirmRequest = await req.json();
 
     if (action === "verify") {
       // Verify the subscription
       const { data, error } = await supabase
         .from("newsletter_subscriptions")
         .update({
           is_verified: true,
           verified_at: new Date().toISOString(),
         })
         .eq("email", email.toLowerCase().trim())
         .eq("verification_token", verification_token)
         .select()
         .single();
 
       if (error || !data) {
         return new Response(
           JSON.stringify({ error: "Invalid or expired verification link" }),
           { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
         );
       }
 
       return new Response(
         JSON.stringify({ success: true, message: "Email verified successfully" }),
         { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     // Send confirmation email
     if (!email) {
       throw new Error("Email is required");
     }
 
     // Get the verification token from the database
     const { data: subscription, error: fetchError } = await supabase
       .from("newsletter_subscriptions")
       .select("verification_token")
       .eq("email", email.toLowerCase().trim())
       .single();
 
     if (fetchError || !subscription) {
       throw new Error("Subscription not found");
     }
 
     const verifyUrl = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/verify-email?email=${encodeURIComponent(email)}&token=${subscription.verification_token}`;
 
     const emailResponse = await resend.emails.send({
       from: "Atlas Sanctum <newsletter@atlas-sanctum.com>",
       to: [email],
       subject: "Confirm your subscription to Atlas Sanctum",
       html: `
         <!DOCTYPE html>
         <html>
         <head>
           <meta charset="utf-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
         </head>
         <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; padding: 40px 20px;">
           <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #333; padding: 40px;">
             <div style="text-align: center; margin-bottom: 32px;">
               <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                 <span style="font-size: 32px;">🌱</span>
               </div>
               <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #fafafa;">Confirm Your Subscription</h1>
             </div>
             
             <p style="color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 24px;">
               Welcome to the Atlas Sanctum community! Click the button below to confirm your email and start receiving regenerative insights.
             </p>
             
             <div style="text-align: center; margin: 32px 0;">
               <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #fafafa; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                 Confirm Subscription
               </a>
             </div>
             
             <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 32px;">
               If you didn't subscribe to our newsletter, you can safely ignore this email.
             </p>
             
             <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 24px;">
               Atlas Sanctum - Regenerative Capacity Protocol
             </p>
           </div>
         </body>
         </html>
       `,
     });
 
     console.log("Newsletter confirmation email sent:", emailResponse);
 
     return new Response(
       JSON.stringify({ success: true, ...emailResponse }),
       { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
     );
   } catch (error: any) {
     console.error("Error in newsletter-confirm function:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
     );
   }
 };
 
 serve(handler);