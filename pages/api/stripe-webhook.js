import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Stripe setup
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Supabase service role client (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable body parsing — REQUIRED for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // ✅ Subscription created or updated
    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const data = event.data.object;

      const customerEmail =
        data.customer_details?.email ||
        data.customer_email ||
        data.metadata?.email;

      if (!customerEmail) {
        console.warn("⚠️ No customer email found, skipping");
        return res.status(200).json({ received: true });
      }

      // Update user to PRO in Supabase
      const { error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            email: customerEmail,
            plan: "pro",
            status: "active",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );

      if (error) {
        console.error("❌ Supabase update failed:", error);
        return res.status(500).json({ error: "Database update failed" });
      }

      console.log("✅ User upgraded to PRO:", customerEmail);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}

// Helper: get raw body for Stripe verification
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
