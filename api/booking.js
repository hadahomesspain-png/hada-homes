// Vercel Serverless Function: /api/booking
// Sends booking request email to hadahomesspain@gmail.com via Gmail SMTP
// Also sends confirmation email to the guest

const nodemailer = require('nodemailer');

export default async function handler(req, res) {
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

  const {
    ref, apartment, aptName,
    checkin, checkout, nights, total, deposit,
    adults, children,
    name, email, phone, remarks
  } = req.body;

  if (!email || !name || !checkin || !checkout) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Gmail SMTP transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,      // hadahomesspain@gmail.com
      pass: process.env.GMAIL_APP_PASS,  // Gmail App Password (16 chars)
    },
  });

  const guestCount = parseInt(adults || 2) + parseInt(children || 0);

  // Format dates nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    const months = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
    return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
  };

  // ── EMAIL TO KEVIN & SOPHIE ──
  const hostMailOptions = {
    from: `"Hada Homes Boekingen" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    replyTo: email,
    subject: `🏡 Nieuwe boekingsaanvraag — ${aptName} — ${formatDate(checkin)}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#faf8f3;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #e8e4da;border-radius:4px;overflow:hidden;">
    
    <div style="background:#0b3b66;padding:24px 32px;">
      <h1 style="color:white;font-size:22px;margin:0;font-weight:400;letter-spacing:1px;">HADA HOMES</h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Nieuwe boekingsaanvraag</p>
    </div>

    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr style="background:#f0ede4;">
          <td style="padding:12px 16px;font-size:12px;color:#5a5a4a;text-transform:uppercase;letter-spacing:1px;" colspan="2">
            <strong>Referentienummer: ${ref}</strong>
          </td>
        </tr>
      </table>

      <h2 style="font-size:18px;color:#18180f;margin:0 0 16px;font-weight:600;">Verblijfsgegevens</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr style="border-bottom:1px solid #e8e4da;">
          <td style="padding:10px 0;color:#5a5a4a;font-size:14px;width:40%;">Appartement</td>
          <td style="padding:10px 0;font-size:14px;font-weight:600;">${aptName}</td>
        </tr>
        <tr style="border-bottom:1px solid #e8e4da;">
          <td style="padding:10px 0;color:#5a5a4a;font-size:14px;">Aankomst</td>
          <td style="padding:10px 0;font-size:14px;font-weight:600;">${formatDate(checkin)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e8e4da;">
          <td style="padding:10px 0;color:#5a5a4a;font-size:14px;">Vertrek</td>
          <td style="padding:10px 0;font-size:14px;font-weight:600;">${formatDate(checkout)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e8e4da;">
          <td style="padding:10px 0;color:#5a5a4a;font-size:14px;">Nachten</td>
          <td style="padding:10px 0;font-size:14px;">${nights}</td>
        </tr>
        <tr style="border-bottom:1px solid #e8e4da;">
          <td style="padding:10px 0;color:#5a5a4a;font-size:14px;">Gasten</td>
          <td style="padding:10px 0;font-size:14px;">${guestCount} personen</td>
        </tr>
      </table>

      <h2 style="font-size:18px;color:#18180f;margin:0 0 16px;font-weight:600;">Contactgegevens gast</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr style="border-bottom:1px solid #e8e4da;">
          <td style="padding:10px 0;color:#5a5a4a;font-size:14px;width:40%;">Naam</td>
          <td style="padding:10px 0;font-size:14px;font-weight:600;">${name}</td>
        </tr>
        <tr style="border-bottom:1px solid #e8e4da;">
          <td style="padding:10px 0;color:#5a5a4a;font-size:14px;">E-mail</td>
          <td style="padding:10px 0;font-size:14px;"><a href="mailto:${email}" style="color:#b5673a;">${email}</a></td>
        </tr>
        <tr style="border-bottom:1px solid #e8e4da;">
          <td style="padding:10px 0;color:#5a5a4a;font-size:14px;">Telefoon</td>
          <td style="padding:10px 0;font-size:14px;"><a href="tel:${phone}" style="color:#b5673a;">${phone}</a></td>
        </tr>
        ${remarks ? `<tr style="border-bottom:1px solid #e8e4da;">
          <td style="padding:10px 0;color:#5a5a4a;font-size:14px;">Opmerkingen</td>
          <td style="padding:10px 0;font-size:14px;">${remarks}</td>
        </tr>` : ''}
      </table>

      <div style="background:#f0ede4;border-radius:4px;padding:20px;margin-bottom:24px;">
        <h2 style="font-size:16px;color:#18180f;margin:0 0 12px;font-weight:600;">Prijsoverzicht</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#5a5a4a;font-size:14px;">Totaalbedrag</td>
            <td style="padding:6px 0;font-size:14px;text-align:right;font-weight:600;">€${total}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#5a5a4a;font-size:14px;">Aanbetaling (30%)</td>
            <td style="padding:6px 0;font-size:16px;text-align:right;font-weight:700;color:#b5673a;">€${deposit}</td>
          </tr>
        </table>
      </div>

      <div style="background:#e8f5ee;border-left:3px solid #2d7a4f;padding:16px;border-radius:0 4px 4px 0;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#18180f;">
          <strong>Actie vereist:</strong> Neem binnen 24 uur contact op met ${name} via 
          <a href="mailto:${email}" style="color:#b5673a;">${email}</a> of 
          <a href="tel:${phone}" style="color:#b5673a;">${phone}</a> om de boeking te bevestigen.
        </p>
      </div>

      <a href="https://wa.me/${phone.replace(/[^0-9]/g,'')}" 
         style="display:inline-block;background:#25D366;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:600;">
        📱 WhatsApp ${name}
      </a>
    </div>

    <div style="background:#f0ede4;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#5a5a4a;">Hada Homes · hada.homes · hadahomesspain@gmail.com</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  // ── CONFIRMATION EMAIL TO GUEST ──
  const guestMailOptions = {
    from: `"Kevin & Sophie — Hada Homes" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Boekingsaanvraag ontvangen — ${aptName} · Ref: ${ref}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#faf8f3;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:white;border:1px solid #e8e4da;border-radius:4px;overflow:hidden;">
    
    <div style="background:#0b3b66;padding:24px 32px;">
      <h1 style="color:white;font-size:22px;margin:0;font-weight:400;letter-spacing:1px;">HADA HOMES</h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Jávea, Spanje</p>
    </div>

    <div style="padding:32px;">
      <h2 style="font-size:24px;color:#18180f;margin:0 0 8px;font-weight:400;font-family:Georgia,serif;">
        Bedankt voor je aanvraag, ${name.split(' ')[0]}!
      </h2>
      <p style="font-size:15px;color:#5a5a4a;line-height:1.7;margin-bottom:24px;">
        We hebben je boekingsaanvraag ontvangen en nemen binnen <strong>24 uur</strong> contact met je op 
        om alles te bevestigen. Je referentienummer is <strong>${ref}</strong>.
      </p>

      <div style="background:#f0ede4;border-radius:4px;padding:24px;margin-bottom:24px;">
        <h3 style="font-size:14px;color:#5a5a4a;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Samenvatting</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #e8e4da;">
            <td style="padding:8px 0;color:#5a5a4a;font-size:14px;">Appartement</td>
            <td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;">${aptName}</td>
          </tr>
          <tr style="border-bottom:1px solid #e8e4da;">
            <td style="padding:8px 0;color:#5a5a4a;font-size:14px;">Aankomst</td>
            <td style="padding:8px 0;font-size:14px;text-align:right;">${formatDate(checkin)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e8e4da;">
            <td style="padding:8px 0;color:#5a5a4a;font-size:14px;">Vertrek</td>
            <td style="padding:8px 0;font-size:14px;text-align:right;">${formatDate(checkout)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e8e4da;">
            <td style="padding:8px 0;color:#5a5a4a;font-size:14px;">Gasten</td>
            <td style="padding:8px 0;font-size:14px;text-align:right;">${guestCount} personen</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#5a5a4a;font-size:14px;">Totaal</td>
            <td style="padding:8px 0;font-size:16px;font-weight:700;color:#b5673a;text-align:right;">€${total}</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size:16px;color:#18180f;margin:0 0 12px;">Wat gebeurt er nu?</h3>
      <ol style="padding-left:20px;color:#5a5a4a;font-size:14px;line-height:2;">
        <li>Kevin & Sophie bevestigen de beschikbaarheid</li>
        <li>Je ontvangt een betalingslink voor de aanbetaling van <strong>€${deposit}</strong> (30%)</li>
        <li>Na betaling is je verblijf definitief gereserveerd</li>
        <li>Het restbedrag betaal je 4 weken voor aankomst</li>
      </ol>

      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e8e4da;">
        <p style="font-size:14px;color:#5a5a4a;margin:0;">
          Vragen? Neem gerust contact op:<br>
          📧 <a href="mailto:hadahomesspain@gmail.com" style="color:#b5673a;">hadahomesspain@gmail.com</a><br>
          📱 <a href="https://wa.me/31645182246" style="color:#b5673a;">WhatsApp: +31 6 45 18 22 46</a>
        </p>
      </div>
    </div>

    <div style="background:#f0ede4;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#5a5a4a;">
        © Hada Homes · <a href="https://hada.homes" style="color:#b5673a;">hada.homes</a> · Jávea, Spanje
      </p>
    </div>
  </div>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(hostMailOptions);
    await transporter.sendMail(guestMailOptions);
    return res.status(200).json({ success: true, ref });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
