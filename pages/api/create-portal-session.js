export const config = {
  runtime: "nodejs",
};

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

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // 1️⃣ Get Stripe customer ID from Supabase
    const { data, error } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (error || !data?.stripe_customer_id) {
      throw new Error("Stripe customer not found");
    }

    // 2️⃣ Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: "https://zeusbolt.vercel.app/dashboard",
    });

    // 3️⃣ Return URL
    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("Billing portal error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
