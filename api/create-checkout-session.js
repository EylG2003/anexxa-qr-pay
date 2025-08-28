// Serverless function for Vercel (Node.js)
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET, { apiVersion: '2024-06-20' });

    // Read JSON body (Vercel Node functions parse it automatically if proper headers are sent)
    const { amountCents, currency = 'eur', description = 'In-store purchase' } = req.body || {};

    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ error: 'amountCents required (>=50)' });
    }

    // Use your deployed domain dynamically (works on Vercel)
    const origin = `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency,
          product_data: { name: description },
          unit_amount: amountCents
        },
        quantity: 1
      }],
      success_url: `${origin}/success.html?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
