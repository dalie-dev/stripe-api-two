const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const bodyParser = require('body-parser');


// Initialisation de l'application Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialisation de Stripe avec la clé secrète
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Endpoint pour créer un paiement
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method_types: ['card'],
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Endpoint pour les webhooks Stripe
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Gestion de l'événement (par exemple, 'payment_intent.succeeded')
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
  }

  // Réponse à Stripe pour indiquer que l'événement a été reçu correctement
  res.json({ received: true });
});

module.exports = app;

// Pour les déploiements sur Vercel
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API running on port ${port}`));
}