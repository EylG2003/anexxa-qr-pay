const Stripe = require('stripe');

// Read raw request body for Stripe signature verification
function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sk = process.env.STRIPE_SECRET;
  if (!secret || !sk) return res.status(500).send('Missing env');

  const stripe = new Stripe(sk, { apiVersion: '2024-06-20' });

  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(await rawBody(req), sig, secret);

    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      console.log('✅ session completed', {
        id: s.id,
        amount_total: s.amount_total,
        currency: s.currency,
        payment_status: s.payment_status,
      });
      // TODO: persist in DB later
    }

    res.json({ received: true });
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`);
  }
};
