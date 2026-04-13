// Vercel Serverless Function: Stripe Webhook Handler
// POST /api/stripe-webhook
// Handles checkout.session.completed to send confirmation emails

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};

    const formatDate = (d) => {
      if (!d) return d;
      const date = new Date(d);
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });

    const refNum = 'HH-' + Date.now().toString(36).toUpperCase();
    const remaining = parseFloat(meta.remainingAmount || 0).toFixed(2);
    const deposit = parseFloat(meta.depositAmount || 0).toFixed(2);
    const total = parseFloat(meta.totalPrice || 0).toFixed(2);

    // Email to Kevin & Sophie
    const hostHtml = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f9f9f7;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;border:1px solid #e8e4da">
  <div style="background:#18180f;padding:28px 32px">
    <h1 style="color:#fff;font-size:22px;margin:0">✅ Nieuwe betaalde boeking!</h1>
    <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:14px">Referentie: ${refNum}</p>
  </div>
  <div style="padding:28px 32px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#6e6e5e;font-size:13px;width:40%">Appartement</td><td style="padding:8px 0;font-weight:600;font-size:13px">${meta.apartment || '-'}</td></tr>
      <tr><td style="padding:8px 0;color:#6e6e5e;font-size:13px">Inchecken</td><td style="padding:8px 0;font-weight:600;font-size:13px">${formatDate(meta.checkIn)}</td></tr>
      <tr><td style="padding:8px 0;color:#6e6e5e;font-size:13px">Uitchecken</td><td style="padding:8px 0;font-weight:600;font-size:13px">${formatDate(meta.checkOut)}</td></tr>
      <tr><td style="padding:8px 0;color:#6e6e5e;font-size:13px">Nachten</td><td style="padding:8px 0;font-weight:600;font-size:13px">${meta.nights || '-'}</td></tr>
      <tr><td style="padding:8px 0;color:#6e6e5e;font-size:13px">Gasten</td><td style="padding:8px 0;font-weight:600;font-size:13px">${meta.guests || '-'}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e8e4da;margin:16px 0">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#6e6e5e;font-size:13px">Naam gast</td><td style="padding:8px 0;font-weight:600;font-size:13px">${meta.guestName || '-'}</td></tr>
      <tr><td style="padding:8px 0;color:#6e6e5e;font-size:13px">E-mail gast</td><td style="padding:8px 0;font-weight:600;font-size:13px">${session.customer_email || '-'}</td></tr>
      <tr><td style="padding:8px 0;color:#6e6e5e;font-size:13px">Telefoon</td><td style="padding:8px 0;font-weight:600;font-size:13px">${meta.guestPhone || '-'}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #e8e4da;margin:16px 0">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#6e6e5e;font-size:13px">Totaalprijs</td><td style="padding:8px 0;font-weight:600;font-size:13px">€${total}</td></tr>
      <tr><td style="padding:8px 0;color:#22c55e;font-size:13px">✅ Aanbetaling ontvangen</td><td style="padding:8px 0;font-weight:600;font-size:13px;color:#22c55e">€${deposit}</td></tr>
      <tr><td style="padding:8px 0;color:#b5673a;font-size:13px">Restbedrag te ontvangen</td><td style="padding:8px 0;font-weight:600;font-size:13px;color:#b5673a">€${remaining}</td></tr>
    </table>
    ${meta.guestMessage ? `<hr style="border:none;border-top:1px solid #e8e4da;margin:16px 0"><p style="color:#6e6e5e;font-size:13px;margin:0">Bericht: <em>${meta.guestMessage}</em></p>` : ''}
    <div style="margin-top:24px">
      <a href="https://wa.me/${meta.guestPhone ? meta.guestPhone.replace(/\D/g,'') : '31645182246'}" style="background:#22c55e;color:#fff;padding:12px 24px;border-radius:2px;text-decoration:none;font-size:13px;font-weight:600">WhatsApp gast</a>
    </div>
  </div>
</div>
</body></html>`;

    // Email to guest
    const guestHtml = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f9f9f7;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;border:1px solid #e8e4da">
  <div style="background:#18180f;padding:28px 32px">
    <h1 style="color:#fff;font-size:22px;margin:0">Bedankt voor je boeking! 🎉</h1>
    <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:14px">Hada Homes — Jávea, Costa Blanca</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#18180f;font-size:15px">Hoi ${meta.guestName ? meta.guestName.split(' ')[0] : 'daar'},</p>
    <p style="color:#6e6e5e;font-size:14px;line-height:1.7">Je aanbetaling is ontvangen! Kevin & Sophie nemen binnen 24 uur contact met je op om de boeking te bevestigen en je alle praktische informatie te sturen.</p>
    <div style="background:#f9f9f7;border-radius:4px;padding:20px;margin:20px 0">
      <p style="margin:0 0 12px;font-weight:600;font-size:14px">Boekingsoverzicht</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#6e6e5e;font-size:13px">Referentie</td><td style="padding:6px 0;font-weight:600;font-size:13px">${refNum}</td></tr>
        <tr><td style="padding:6px 0;color:#6e6e5e;font-size:13px">Appartement</td><td style="padding:6px 0;font-weight:600;font-size:13px">${meta.apartment || '-'}</td></tr>
        <tr><td style="padding:6px 0;color:#6e6e5e;font-size:13px">Inchecken</td><td style="padding:6px 0;font-weight:600;font-size:13px">${formatDate(meta.checkIn)}</td></tr>
        <tr><td style="padding:6px 0;color:#6e6e5e;font-size:13px">Uitchecken</td><td style="padding:6px 0;font-weight:600;font-size:13px">${formatDate(meta.checkOut)}</td></tr>
        <tr><td style="padding:6px 0;color:#6e6e5e;font-size:13px">Aanbetaling</td><td style="padding:6px 0;font-weight:600;font-size:13px;color:#22c55e">€${deposit} ✅</td></tr>
        <tr><td style="padding:6px 0;color:#6e6e5e;font-size:13px">Restbedrag</td><td style="padding:6px 0;font-weight:600;font-size:13px">€${remaining} (bij aankomst of vooraf)</td></tr>
      </table>
    </div>
    <p style="color:#6e6e5e;font-size:13px;line-height:1.7">Vragen? Stuur ons een WhatsApp of e-mail:</p>
    <p style="font-size:13px"><strong>WhatsApp:</strong> <a href="https://wa.me/31645182246" style="color:#b5673a">+31 6 45 18 22 46</a><br>
    <strong>E-mail:</strong> <a href="mailto:hadahomesspain@gmail.com" style="color:#b5673a">hadahomesspain@gmail.com</a></p>
    <p style="color:#6e6e5e;font-size:12px;margin-top:24px;border-top:1px solid #e8e4da;padding-top:16px">
      Op deze boeking zijn onze <a href="https://hada.homes/voorwaarden" style="color:#b5673a">algemene voorwaarden</a> van toepassing.
    </p>
  </div>
</div>
</body></html>`;

    try {
      // Send to hosts
      await transporter.sendMail({
        from: `"Hada Homes Boekingen" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `✅ Nieuwe boeking ${refNum} — ${meta.apartment} (${formatDate(meta.checkIn)})`,
        html: hostHtml,
      });

      // Send to guest
      if (session.customer_email) {
        await transporter.sendMail({
          from: `"Hada Homes" <${process.env.GMAIL_USER}>`,
          to: session.customer_email,
          subject: `Boekingsbevestiging ${refNum} — Hada Homes Jávea`,
          html: guestHtml,
        });
      }
    } catch (mailErr) {
      console.error('Email error:', mailErr);
      // Don't fail the webhook for email errors
    }
  }

  return res.status(200).json({ received: true });
};

// Helper to get raw body for Stripe signature verification
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
