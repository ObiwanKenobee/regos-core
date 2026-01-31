import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  type: "token_minted" | "rci_threshold" | "verification_approved";
  recipient_email: string;
  recipient_name?: string;
  data: {
    region_name?: string;
    token_type?: string;
    token_amount?: number;
    rci_score?: number;
    threshold_type?: "warning" | "critical";
    transaction_hash?: string;
  };
}

const getEmailContent = (type: string, data: NotificationEmailRequest["data"]) => {
  switch (type) {
    case "token_minted":
      return {
        subject: `🌱 ${data.token_amount?.toLocaleString()} ${data.token_type} Impact Tokens Minted`,
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
                <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #fafafa;">Impact Tokens Minted</h1>
              </div>
              
              <div style="background: #22c55e20; border: 1px solid #22c55e40; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; font-weight: 700; color: #22c55e; margin-bottom: 8px;">
                  ${data.token_amount?.toLocaleString()}
                </div>
                <div style="font-size: 14px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">
                  ${data.token_type} RCI Tokens
                </div>
              </div>
              
              <div style="border-top: 1px solid #333; padding-top: 24px;">
                <p style="color: #a1a1aa; margin: 8px 0;">
                  <strong style="color: #fafafa;">Region:</strong> ${data.region_name || "Unknown"}
                </p>
                ${data.transaction_hash ? `
                <p style="color: #a1a1aa; margin: 8px 0;">
                  <strong style="color: #fafafa;">Transaction:</strong> 
                  <code style="background: #27272a; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                    ${data.transaction_hash.slice(0, 16)}...
                  </code>
                </p>
                ` : ""}
              </div>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="https://atlas-sanctum.lovable.app/treasury" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #fafafa; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">
                  View Treasury
                </a>
              </div>
              
              <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 32px;">
                Atlas Sanctum - Regenerative Capacity Protocol
              </p>
            </div>
          </body>
          </html>
        `,
      };

    case "rci_threshold":
      const isCritical = data.threshold_type === "critical";
      return {
        subject: `${isCritical ? "🚨 Critical" : "⚠️ Warning"}: RCI Alert for ${data.region_name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid ${isCritical ? "#ef4444" : "#f59e0b"}40; padding: 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; background: ${isCritical ? "#ef444420" : "#f59e0b20"}; border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">${isCritical ? "🚨" : "⚠️"}</span>
                </div>
                <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: ${isCritical ? "#ef4444" : "#f59e0b"};">
                  ${isCritical ? "Critical" : "Warning"} RCI Alert
                </h1>
              </div>
              
              <div style="background: ${isCritical ? "#ef444420" : "#f59e0b20"}; border: 1px solid ${isCritical ? "#ef444440" : "#f59e0b40"}; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 14px; color: #a1a1aa; margin-bottom: 8px;">
                  ${data.region_name}
                </div>
                <div style="font-size: 48px; font-weight: 700; color: ${isCritical ? "#ef4444" : "#f59e0b"}; margin-bottom: 8px;">
                  ${data.rci_score?.toFixed(1)}%
                </div>
                <div style="font-size: 14px; color: #a1a1aa;">
                  RCI Score ${isCritical ? "below 25%" : "below 40%"}
                </div>
              </div>
              
              <p style="color: #a1a1aa; line-height: 1.6;">
                ${isCritical 
                  ? "This region requires immediate attention. The regenerative capacity has dropped to critical levels and may require urgent intervention."
                  : "This region's regenerative capacity has dropped below the warning threshold. Please review and consider implementing corrective measures."}
              </p>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="https://atlas-sanctum.lovable.app/sovereign" style="display: inline-block; background: linear-gradient(135deg, ${isCritical ? "#ef4444" : "#f59e0b"} 0%, ${isCritical ? "#dc2626" : "#d97706"} 100%); color: #fafafa; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">
                  View Dashboard
                </a>
              </div>
              
              <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 32px;">
                Atlas Sanctum - Regenerative Capacity Protocol
              </p>
            </div>
          </body>
          </html>
        `,
      };

    case "verification_approved":
      return {
        subject: `✅ Verification Request Approved - ${data.token_amount?.toLocaleString()} Tokens Ready`,
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
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">✅</span>
                </div>
                <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #fafafa;">Verification Approved</h1>
              </div>
              
              <p style="color: #a1a1aa; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                Your verification request has been approved and is ready for token minting.
              </p>
              
              <div style="background: #3b82f620; border: 1px solid #3b82f640; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <p style="color: #a1a1aa; margin: 8px 0;">
                  <strong style="color: #fafafa;">Region:</strong> ${data.region_name || "Unknown"}
                </p>
                <p style="color: #a1a1aa; margin: 8px 0;">
                  <strong style="color: #fafafa;">Token Type:</strong> ${data.token_type}
                </p>
                <p style="color: #a1a1aa; margin: 8px 0;">
                  <strong style="color: #fafafa;">Amount:</strong> ${data.token_amount?.toLocaleString()} RCI
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 32px;">
                <a href="https://atlas-sanctum.lovable.app/admin" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #fafafa; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">
                  Mint Tokens
                </a>
              </div>
              
              <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 32px;">
                Atlas Sanctum - Regenerative Capacity Protocol
              </p>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "Atlas Sanctum Notification",
        html: "<p>You have a new notification from Atlas Sanctum.</p>",
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipient_email, recipient_name, data }: NotificationEmailRequest = await req.json();

    if (!recipient_email) {
      throw new Error("Recipient email is required");
    }

    const { subject, html } = getEmailContent(type, data);

    const emailResponse = await resend.emails.send({
      from: "Atlas Sanctum <notifications@atlas-sanctum.com>",
      to: [recipient_email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
