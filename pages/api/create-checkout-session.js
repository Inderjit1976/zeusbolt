export const config = {
  runtime: "nodejs",
};

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Server-side Supabase (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { supabaseUserId } = req.body;

    if (!supabaseUserId) {
      return res.status(400).json({ error: "Missing supabaseUserId" });
    }

    // (Optional safety check) confirm user exists
    const { data: userExists } = await supabase
      .from("auth.users")
      .select("id")
      .eq("id", supabaseUserId)
      .single();

    if (!userExists) {
      return res.status(401).json({ error: "Invalid user" });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],

      // 🔑 CRITICAL: link Stripe to Supabase user
      metadata: {
        supabase_user_id: supabaseUserId,
      },

      success_url:
        "https://zeusbolt.vercel.app/dashboard?payment=success",
      cancel_url:
        "https://zeusbolt.vercel.app/dashboard?payment=cancel",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return res.status(500).json({
      error: "Checkout session failed",
      message: err.message,
    });
  }
}
