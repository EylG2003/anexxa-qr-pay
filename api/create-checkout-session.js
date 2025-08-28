// Serverless function for Vercel (Node.js)
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET, { apiVersion: '2024-06-20' });
    const { amountCents, currency = 'eur', description = 'In-store purchase' } = req.body || {};

    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ error: 'amountCents required (>=50)' });
    }

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
      success_url: 'https://anexxa-qr.vercel.app/success.html?sid={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://anexxa-qr.vercel.app/cancel.html'
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
