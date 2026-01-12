import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { customerId } = req.body;

    console.log("======== STRIPE PORTAL DEBUG ========");
    console.log("Customer ID received:", customerId);
    console.log("Stripe key starts with:", process.env.STRIPE_SECRET_KEY?.slice(0, 8));
    console.log("====================================");

    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }

    // 🔎 VERIFY CUSTOMER EXISTS IN STRIPE
    const customer = await stripe.customers.retrieve(customerId);

    console.log("Stripe customer FOUND:", customer.id);

    // ✅ Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: "https://zeusbolt.vercel.app/dashboard",
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("❌ STRIPE PORTAL ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
