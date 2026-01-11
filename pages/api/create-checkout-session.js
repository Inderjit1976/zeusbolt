export const config = {
  runtime: "nodejs",
};

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY missing");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
            price: process.env.STRIPE_PRICE_ID,
      quantity: 1,
        },
      ],
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
