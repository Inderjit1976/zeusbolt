import Stripe from "stripe";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1️⃣ Create Supabase server client using cookies
    const supabase = createServerSupabaseClient({ req, res });

    // 2️⃣ Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // 3️⃣ Fetch ACTIVE subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (error || !subscription?.stripe_customer_id) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    // 4️⃣ Create Stripe Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: "https://zeusbolt.vercel.app/dashboard",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return res.status(500).json({ error: "Failed to create billing portal session" });
  }
}
