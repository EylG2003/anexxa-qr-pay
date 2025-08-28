module.exports = (req, res) => {
  const key = process.env.STRIPE_SECRET || "";
  const env =
    key.startsWith("sk_live_") ? "live" :
    key.startsWith("sk_test_") ? "test" : "missing";
  res.status(200).json({
    hasStripeSecret: !!key,
    stripeKeyEnv: env,
    site: `https://${req.headers.host}`
  });
};
