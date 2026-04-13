// Vercel Serverless Function: Create Stripe Checkout Session
// POST /api/create-checkout
// Body: { apartment, aptName, checkIn, checkOut, nights, guests, totalPrice, depositAmount, name, email, phone, remarks, ref }

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function handler(req, res) {
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
      aptName,
      checkIn,
      checkOut,
      nights,
      guests,
      totalPrice,
      depositAmount,
      name,
      email,
      phone,
      remarks,
      ref
    } = req.body;

    if (!apartment || !checkIn || !checkOut || !totalPrice || !depositAmount || !email) {
      return res.status(400).json({ error: 'Verplichte velden ontbreken' });
    }

    // Format dates nicely in Dutch
    const formatDate = (d) => {
      const [y, m, day] = d.split('-');
      const months = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
      return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
    };

    const depositCents = Math.round(depositAmount * 100);
    const remainingAmount = Math.round(totalPrice - depositAmount);
    const bookingRef = ref || ('HH' + Date.now().toString(36).toUpperCase());

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Aanbetaling — ${aptName || apartment}`,
              description: `Verblijf: ${formatDate(checkIn)} t/m ${formatDate(checkOut)} · ${nights} nachten · ${guests} gast${guests > 1 ? 'en' : ''} · Restbedrag €${remainingAmount} bij aankomst`,
            },
            unit_amount: depositCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        ref: bookingRef,
        apartment,
        aptName: aptName || apartment,
        checkIn,
        checkOut,
        nights: String(nights),
        guests: String(guests),
        totalPrice: String(totalPrice),
        depositAmount: String(depositAmount),
        remainingAmount: String(remainingAmount),
        guestName: name || '',
        guestPhone: phone || '',
        guestRemarks: remarks || '',
      },
      payment_intent_data: {
        metadata: {
          ref: bookingRef,
          apartment,
          aptName: aptName || apartment,
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
      success_url: `https://hada.homes/boeken/success/?session_id={CHECKOUT_SESSION_ID}&ref=${encodeURIComponent(bookingRef)}&apt=${encodeURIComponent(aptName || apartment)}&in=${checkIn}&out=${checkOut}`,
      cancel_url: `https://hada.homes/boeken/?cancelled=1`,
      locale: 'nl',
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({
      error: err.message || 'Betaling kon niet worden aangemaakt',
      type: err.type,
      code: err.code,
    });
  }
}

module.exports = handler;
module.exports.config = { maxDuration: 30 };
