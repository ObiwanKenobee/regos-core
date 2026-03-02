import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType =
  | "token_minted"
  | "rci_threshold"
  | "verification_approved"
  | "bond_status_changed"
  | "research_reviewed";

interface NotificationEmailRequest {
  type: NotificationType;
  recipient_email: string;
  recipient_name?: string;
  data: {
    region_name?: string;
    token_type?: string;
    token_amount?: number;
    rci_score?: number;
    threshold_type?: "warning" | "critical";
    transaction_hash?: string;
    bond_name?: string;
    bond_status?: string;
    previous_status?: string;
    principal_amount?: number;
    research_title?: string;
    review_status?: "approved" | "rejected" | "revision_requested";
    reviewer_comment?: string;
  };
}

// Internal trigger payload from database webhook
interface TriggerPayload {
  trigger_type: "bond_status" | "verification_status";
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

const getEmailContent = (type: string, data: NotificationEmailRequest["data"]) => {
  switch (type) {
    case "token_minted":
      return {
        subject: `🌱 ${data.token_amount?.toLocaleString()} ${data.token_type} Impact Tokens Minted`,
        html: `
          <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #333; padding: 40px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #fafafa;">🌱 Impact Tokens Minted</h1>
              </div>
              <div style="background: #22c55e20; border: 1px solid #22c55e40; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; font-weight: 700; color: #22c55e;">${data.token_amount?.toLocaleString()}</div>
                <div style="font-size: 14px; color: #a1a1aa; text-transform: uppercase;">${data.token_type} RCI Tokens</div>
              </div>
              <p style="color: #a1a1aa; margin: 8px 0;"><strong style="color: #fafafa;">Region:</strong> ${data.region_name || "Unknown"}</p>
              ${data.transaction_hash ? `<p style="color: #a1a1aa; margin: 8px 0;"><strong style="color: #fafafa;">Tx:</strong> <code style="background: #27272a; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${data.transaction_hash.slice(0, 16)}...</code></p>` : ""}
              <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 32px;">Atlas Sanctum — Regenerative Capacity Protocol</p>
            </div>
          </body></html>`,
      };

    case "rci_threshold": {
      const isCritical = data.threshold_type === "critical";
      const color = isCritical ? "#ef4444" : "#f59e0b";
      return {
        subject: `${isCritical ? "🚨 Critical" : "⚠️ Warning"}: RCI Alert for ${data.region_name}`,
        html: `
          <!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid ${color}40; padding: 40px;">
              <h1 style="text-align: center; font-size: 24px; color: ${color};">${isCritical ? "🚨 Critical" : "⚠️ Warning"} RCI Alert</h1>
              <div style="background: ${color}20; border: 1px solid ${color}40; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <div style="font-size: 14px; color: #a1a1aa;">${data.region_name}</div>
                <div style="font-size: 48px; font-weight: 700; color: ${color};">${data.rci_score?.toFixed(1)}%</div>
              </div>
              <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 32px;">Atlas Sanctum — Regenerative Capacity Protocol</p>
            </div>
          </body></html>`,
      };
    }

    case "verification_approved":
      return {
        subject: `✅ Verification Approved — ${data.token_amount?.toLocaleString()} Tokens Ready`,
        html: `
          <!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #333; padding: 40px;">
              <h1 style="text-align: center; font-size: 24px; color: #fafafa;">✅ Verification Approved</h1>
              <div style="background: #3b82f620; border: 1px solid #3b82f640; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <p style="color: #a1a1aa; margin: 8px 0;"><strong style="color: #fafafa;">Region:</strong> ${data.region_name || "Unknown"}</p>
                <p style="color: #a1a1aa; margin: 8px 0;"><strong style="color: #fafafa;">Type:</strong> ${data.token_type}</p>
                <p style="color: #a1a1aa; margin: 8px 0;"><strong style="color: #fafafa;">Amount:</strong> ${data.token_amount?.toLocaleString()} RCI</p>
              </div>
              <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 32px;">Atlas Sanctum — Regenerative Capacity Protocol</p>
            </div>
          </body></html>`,
      };

    case "bond_status_changed": {
      const statusColors: Record<string, string> = {
        approved: "#22c55e",
        rejected: "#ef4444",
        active: "#3b82f6",
        matured: "#8b5cf6",
        draft: "#a1a1aa",
      };
      const color = statusColors[data.bond_status || ""] || "#a1a1aa";
      const emoji = data.bond_status === "approved" ? "✅" : data.bond_status === "rejected" ? "❌" : data.bond_status === "active" ? "🟢" : "📋";
      return {
        subject: `${emoji} Bond "${data.bond_name}" status changed to ${data.bond_status}`,
        html: `
          <!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #333; padding: 40px;">
              <h1 style="text-align: center; font-size: 24px; color: #fafafa;">${emoji} Sovereign Bond Update</h1>
              <div style="background: ${color}20; border: 1px solid ${color}40; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <p style="color: #fafafa; font-size: 18px; font-weight: 700; margin: 0 0 12px;">${data.bond_name}</p>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
                  <span style="background: #71717a30; color: #a1a1aa; padding: 4px 12px; border-radius: 6px; font-size: 13px; text-decoration: line-through;">${data.previous_status || "draft"}</span>
                  <span style="color: #71717a;">→</span>
                  <span style="background: ${color}30; color: ${color}; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; text-transform: uppercase;">${data.bond_status}</span>
                </div>
                <p style="color: #a1a1aa; margin: 8px 0;"><strong style="color: #fafafa;">Region:</strong> ${data.region_name || "Unknown"}</p>
                ${data.principal_amount ? `<p style="color: #a1a1aa; margin: 8px 0;"><strong style="color: #fafafa;">Principal:</strong> $${data.principal_amount.toLocaleString()}</p>` : ""}
              </div>
              <div style="text-align: center; margin-top: 24px;">
                <a href="https://atlas-sanctum.lovable.app/sovereign" style="display: inline-block; background: ${color}; color: #fafafa; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">View Bond Details</a>
              </div>
              <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 32px;">Atlas Sanctum — Regenerative Capacity Protocol</p>
            </div>
          </body></html>`,
      };
    }

    case "research_reviewed": {
      const reviewColors: Record<string, string> = {
        approved: "#22c55e",
        rejected: "#ef4444",
        revision_requested: "#f59e0b",
      };
      const color = reviewColors[data.review_status || ""] || "#a1a1aa";
      const emoji = data.review_status === "approved" ? "✅" : data.review_status === "rejected" ? "❌" : "🔄";
      const statusLabel = data.review_status === "revision_requested" ? "Revision Requested" : data.review_status;
      return {
        subject: `${emoji} Research Submission ${statusLabel}: "${data.research_title}"`,
        html: `
          <!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #fafafa; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #333; padding: 40px;">
              <h1 style="text-align: center; font-size: 24px; color: #fafafa;">${emoji} Research Review Update</h1>
              <div style="background: ${color}20; border: 1px solid ${color}40; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <p style="color: #fafafa; font-size: 18px; font-weight: 700; margin: 0 0 12px;">${data.research_title || "Untitled Submission"}</p>
                <span style="background: ${color}30; color: ${color}; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; text-transform: uppercase;">${statusLabel}</span>
                ${data.reviewer_comment ? `<div style="margin-top: 16px; padding: 16px; background: #27272a; border-radius: 8px; border-left: 3px solid ${color};"><p style="color: #a1a1aa; margin: 0; font-style: italic;">"${data.reviewer_comment}"</p></div>` : ""}
              </div>
              <div style="text-align: center; margin-top: 24px;">
                <a href="https://atlas-sanctum.lovable.app/scientist" style="display: inline-block; background: ${color}; color: #fafafa; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">View Submission</a>
              </div>
              <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 32px;">Atlas Sanctum — Regenerative Capacity Protocol</p>
            </div>
          </body></html>`,
      };
    }

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
    const body = await req.json();

    // Check if this is a database trigger webhook payload
    if (body.trigger_type) {
      return await handleTrigger(body as TriggerPayload);
    }

    // Direct API call
    const { type, recipient_email, recipient_name, data }: NotificationEmailRequest = body;

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
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

async function handleTrigger(payload: TriggerPayload): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  if (payload.trigger_type === "bond_status") {
    const bond = payload.record;
    const oldBond = payload.old_record;

    if (bond.status !== oldBond?.status) {
      // Get the bond creator's email from auth
      const { data: userData } = await supabase.auth.admin.getUserById(bond.created_by as string);
      if (!userData?.user?.email) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: corsHeaders });

      // Get region name
      const { data: region } = await supabase.from("rci_regions").select("region_name").eq("id", bond.region_id as string).single();

      const { subject, html } = getEmailContent("bond_status_changed", {
        bond_name: bond.bond_name as string,
        bond_status: bond.status as string,
        previous_status: oldBond?.status as string,
        region_name: region?.region_name,
        principal_amount: bond.principal_amount as number,
      });

      await resend.emails.send({
        from: "Atlas Sanctum <notifications@atlas-sanctum.com>",
        to: [userData.user.email],
        subject,
        html,
      });

      // Also create in-app notification
      await supabase.from("notifications").insert({
        user_id: bond.created_by as string,
        type: "bond_update",
        title: `Bond "${bond.bond_name}" — ${bond.status}`,
        message: `Your bond status changed from ${oldBond?.status} to ${bond.status}.`,
        region_id: bond.region_id as string,
        severity: bond.status === "rejected" ? "warning" : "info",
      });
    }
  }

  if (payload.trigger_type === "verification_status") {
    const req = payload.record;
    const oldReq = payload.old_record;

    if (req.status !== oldReq?.status && (req.status === "approved" || req.status === "rejected")) {
      const { data: userData } = await supabase.auth.admin.getUserById(req.created_by as string);
      if (!userData?.user?.email) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: corsHeaders });

      const { data: region } = await supabase.from("rci_regions").select("region_name").eq("id", req.region_id as string).single();

      const { subject, html } = getEmailContent("research_reviewed", {
        research_title: req.description as string || `${req.credit_type} Verification`,
        review_status: req.status as "approved" | "rejected",
        region_name: region?.region_name,
        token_amount: req.credit_amount as number,
        token_type: req.credit_type as string,
      });

      await resend.emails.send({
        from: "Atlas Sanctum <notifications@atlas-sanctum.com>",
        to: [userData.user.email],
        subject,
        html,
      });

      await supabase.from("notifications").insert({
        user_id: req.created_by as string,
        type: "verification_update",
        title: `Verification ${req.status}: ${req.credit_type}`,
        message: `Your ${req.credit_type} verification request for ${region?.region_name || "unknown region"} has been ${req.status}.`,
        region_id: req.region_id as string,
        severity: req.status === "rejected" ? "warning" : "info",
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(handler);
