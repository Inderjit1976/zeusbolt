import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// IMPORTANT: service role key (server-only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const customerEmail = session.customer_details?.email;

      if (!customerEmail) {
        throw new Error("No customer email found");
      }

      // Find user by email
      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (userError || !user) {
        throw new Error("User not found in profiles");
      }

      // Upsert subscription
      const { error: subError } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          status: "active",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        });

      if (subError) {
        throw subError;
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return res.status(500).json({ error: "Database update failed" });
  }
}
