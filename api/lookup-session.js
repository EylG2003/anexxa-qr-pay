// /api/lookup-session.js
const Stripe = require('stripe');

module.exports = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET) {
      return res.status(500).json({ error: 'STRIPE_SECRET not set' });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET, { apiVersion: '2024-06-20' });

    const sid = (req.query.sid || '').toString();
    if (!sid) return res.status(400).json({ error: 'sid required e.g. /api/lookup-session?sid=cs_test_...' });

    const session = await stripe.checkout.sessions.retrieve(sid, {
      expand: ['payment_intent', 'customer']
    });

    res.status(200).json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_intent_id: session.payment_intent?.id,
      payment_intent_status: session.payment_intent?.status
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
