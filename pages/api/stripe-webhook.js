import Stripe from "stripe";
import { buffer } from "micro";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // ✅ Checkout completed → Pro ACTIVE
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.metadata?.user_id;
      if (!userId) throw new Error("Missing user_id");

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        plan: "pro",
        status: "active",
        stripe_subscription_id: session.subscription,
      });
    }

    // ✅ Subscription updated (pause, payment issue, etc.)
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;

      const newStatus =
        subscription.status === "active" ? "active" : "inactive";

      await supabase
        .from("subscriptions")
        .update({
          status: newStatus,
        })
        .eq("stripe_subscription_id", subscription.id);
    }

    // ❌ Subscription canceled → DOWNGRADE
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
    console.error("Webhook DB error:", err.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

