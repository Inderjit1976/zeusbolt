export const config = {
  runtime: "nodejs",
};

import Stripe from "stripe";

export default async function handler(req, res) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        error: "STRIPE_SECRET_KEY is missing on server",
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  } catch (err) {
    return res.status(500).json({
      stripe_error_message: err.message,
      stripe_error_type: err.type,
      stripe_error_code: err.code,
    });
  }
}
