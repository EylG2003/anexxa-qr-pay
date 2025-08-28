module.exports = async (_req, res) => {
  res.status(200).json({ hasStripeSecret: !!process.env.STRIPE_SECRET });
};
