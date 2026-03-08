import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const PLAN_MAP: Record<string, string> = {
  // Map Stripe product IDs to plan names — update these when products are created
  // "prod_xxx": "architect",
  // "prod_yyy": "sovereign",
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  console.log(`[STRIPE-WEBHOOK] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;
        if (!email) break;

        const productId = subscription.items.data[0]?.price?.product as string;
        const plan = PLAN_MAP[productId] || "pro";
        const isActive = subscription.status === "active";

        // Find user by email
        const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
        const user = userData?.users?.find((u) => u.email === email);
        if (!user) break;

        // Update organization plan if user has one
        const { data: memberships } = await supabaseAdmin
          .from("organization_members")
          .select("organization_id, role")
          .eq("user_id", user.id)
          .eq("role", "owner")
          .limit(1);

        if (memberships && memberships.length > 0) {
          await supabaseAdmin
            .from("organizations")
            .update({
              plan: isActive ? plan : "free",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
            })
            .eq("id", memberships[0].organization_id);
          console.log(`[STRIPE-WEBHOOK] Updated org ${memberships[0].organization_id} to plan: ${isActive ? plan : "free"}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;
        if (!email) break;

        const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
        const user = userData?.users?.find((u) => u.email === email);
        if (!user) break;

        // Downgrade org plan
        const { data: memberships } = await supabaseAdmin
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .eq("role", "owner")
          .limit(1);

        if (memberships && memberships.length > 0) {
          await supabaseAdmin
            .from("organizations")
            .update({ plan: "free", stripe_subscription_id: null })
            .eq("id", memberships[0].organization_id);
          console.log(`[STRIPE-WEBHOOK] Downgraded org ${memberships[0].organization_id} to free`);
        }
        break;
      }
    }
  } catch (err) {
    console.error(`[STRIPE-WEBHOOK] Error processing ${event.type}:`, err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
