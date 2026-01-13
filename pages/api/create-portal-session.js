import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { user_id } = req.body || {};

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user_id)
      .eq("status", "active")
      .single();

    if (error || !subscription?.stripe_customer_id) {
      return res.status(403).json({ error: "No active subscription found" });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://zeusbolt.vercel.app";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${siteUrl}/dashboard`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("Billing portal error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

