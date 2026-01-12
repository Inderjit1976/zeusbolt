import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1️⃣ Get logged-in user from Supabase auth cookie
    const { data: authData, error: authError } =
      await supabase.auth.getUser(req.headers.authorization?.replace("Bearer ", ""));

    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = authData.user.id;

    // 2️⃣ Fetch ACTIVE subscription for user
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subError || !subscription?.stripe_customer_id) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    // 3️⃣ Create Stripe Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: "https://zeusbolt.vercel.app/dashboard",
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Billing Portal Error:", error);
    return res.status(500).json({ error: "Failed to create portal session" });
  }
}
