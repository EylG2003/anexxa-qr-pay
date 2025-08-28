// Serverless function for Vercel (Node.js)
const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', method: req.method });
  }

  try {
    if (!process.env.STRIPE_SECRET) {
      return res.status(500).json({ error: 'STRIPE_SECRET not set' });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET, { apiVersion: '2024-06-20' });

    // --- Robust JSON body parse (Vercel Node functions don't auto-parse) ---
    let body = {};
    if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else {
      const chunks = [];
      await new Promise((resolve, reject) => {
        req.on('data', (c) => chunks.push(c));
        req.on('end', resolve);
        req.on('error', reject);
      });
      if (chunks.length) {
        try { body = JSON.parse(Buffer.concat(chunks).toString()); }
        catch { return res.status(400).json({ error: 'Invalid JSON body' }); }
      }
    }

    let { amountCents, currency = 'eur', description = 'In-store purchase' } = body || {};
    amountCents = Number(amountCents);
    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ error: 'amountCents required (>=50)' });
    }

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
