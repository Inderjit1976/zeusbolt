import Stripe from "stripe";
import { buffer } from "micro";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.metadata?.supabase_user_id;
      if (!userId) {
        throw new Error("Missing supabase_user_id in metadata");
      }

      const payload = {
        user_id: userId,
        plan: "pro",
        status: "active",
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      };

      const { data, error } = await supabase
        .from("subscriptions")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        console.error("❌ SUPABASE UPSERT ERROR:", error);
        throw error;
      }

      console.log("✅ Subscription updated:", data);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ WEBHOOK PROCESSING FAILED:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
