// Vercel Serverless Function: Create Stripe Checkout Session
// POST /api/create-checkout
// Body: { apartment, checkIn, checkOut, nights, guests, totalPrice, depositAmount, name, email, phone }

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      apartment,
      checkIn,
      checkOut,
      nights,
      guests,
      totalPrice,
      depositAmount,
      name,
      email,
      phone,
      message
    } = req.body;

    if (!apartment || !checkIn || !checkOut || !totalPrice || !depositAmount || !email) {
      return res.status(400).json({ error: 'Verplichte velden ontbreken' });
    }

    // Format dates nicely
    const formatDate = (d) => {
      const date = new Date(d);
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const depositCents = Math.round(depositAmount * 100);
    const remainingAmount = totalPrice - depositAmount;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Aanbetaling — ${apartment}`,
              description: `Verblijf: ${formatDate(checkIn)} t/m ${formatDate(checkOut)} (${nights} nachten, ${guests} gast${guests > 1 ? 'en' : ''})`,
              images: ['https://hada.homes/assets/img/augusta-pool.jpg'],
            },
            unit_amount: depositCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        apartment,
        checkIn,
        checkOut,
        nights: String(nights),
        guests: String(guests),
        totalPrice: String(totalPrice),
        depositAmount: String(depositAmount),
        remainingAmount: String(remainingAmount),
        guestName: name || '',
        guestPhone: phone || '',
        guestMessage: message || '',
      },
      payment_intent_data: {
        metadata: {
          apartment,
          checkIn,
          checkOut,
          guestName: name || '',
          guestEmail: email,
          guestPhone: phone || '',
          totalPrice: String(totalPrice),
          depositAmount: String(depositAmount),
          remainingAmount: String(remainingAmount),
        },
      },
      success_url: `https://hada.homes/boeken/success?session_id={CHECKOUT_SESSION_ID}&apt=${encodeURIComponent(apartment)}&in=${checkIn}&out=${checkOut}`,
      cancel_url: `https://hada.homes/boeken/?cancelled=1`,
      locale: 'nl',
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message || 'Betaling kon niet worden aangemaakt' });
  }
};
