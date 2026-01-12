import Stripe from "stripe";
import { buffer } from "micro";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

// 🔑 Pin Stripe API version (important for Vercel)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Server-side Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // ✅ Checkout completed → activate Pro
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.metadata?.supabase_user_id;
      if (!userId) {
        throw new Error("Missing supabase_user_id in metadata");
      }

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        plan: "pro",
        status: "active",
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      });
    }

    // ✅ Subscription status updated
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;

      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
        })
        .eq("stripe_subscription_id", subscription.id);
    }

    // ❌ Subscription cancelled → downgrade
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;

      await supabase
        .from("subscriptions")
        .update({
          status: "inactive",
          plan: "free",
        })
        .eq("stripe_subscription_id", subscription.id);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
