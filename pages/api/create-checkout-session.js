export const config = {
  runtime: "nodejs",
};

import Stripe from "stripe";

// 🔑 Explicit API version + timeout (CRITICAL FIX)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  timeout: 20000,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { supabaseUserId } = req.body;

    if (!supabaseUserId) {
      return res.status(400).json({ error: "Missing supabaseUserId" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],

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
    console.error("🔥 STRIPE ERROR TYPE:", err.type);
    console.error("🔥 STRIPE ERROR MESSAGE:", err.message);
    console.error("🔥 FULL ERROR:", err);

    return res.status(500).json({
      error: "Checkout session failed",
      message: err.message,
    });
  }
}
