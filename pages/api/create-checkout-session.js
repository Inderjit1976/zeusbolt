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
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: "price_1So5HCQYwmMPeFokR9rSF68E",
          quantity: 1,
        },
      ],
      success_url:
        "https://zeusbolt.vercel.app/dashboard?payment=success",
      cancel_url:
        "https://zeusbolt.vercel.app/dashboard?payment=cancel",
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    // 👇 THIS IS THE KEY PART
    console.error("STRIPE ERROR FULL OBJECT:", error);

    return res.status(500).json({
      error: "Stripe error",
      message: error.message,
      type: error.type,
      code: error.code,
    });
  }
}

