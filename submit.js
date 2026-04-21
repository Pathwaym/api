const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email, phone, suburb, referral, message, reasons } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const reasonsList = reasons && reasons.length
    ? reasons.map(r => `<li style="margin-bottom:4px;">${r}</li>`).join('')
    : '<li>Not specified</li>';

  const adminHtml = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1A1A1A;">
      <div style="background: #1A1A1A; padding: 28px 32px; text-align: center;">
        <h2 style="color: #C9A84C; font-weight: 300; font-size: 1.4rem; margin: 0; letter-spacing: 0.05em;">
          New Connection Form — Pathway Ministries
        </h2>
      </div>
      <div style="background: #FAF7F2; padding: 32px; border: 1px solid #E8E0D0; border-top: none;">
        <table style="width:100%; border-collapse: collapse; font-size: 0.92rem;">
          <tr><td style="padding: 8px 0; color: #8A7F74; width: 140px; vertical-align:top;">Full Name</td><td style="padding: 8px 0; font-weight: 500;">${firstName} ${lastName}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A7F74; vertical-align:top;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color:#C9A84C;">${email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #8A7F74; vertical-align:top;">Phone</td><td style="padding: 8px 0;">${phone || '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A7F74; vertical-align:top;">Area / Suburb</td><td style="padding: 8px 0;">${suburb || '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A7F74; vertical-align:top;">Heard via</td><td style="padding: 8px 0;">${referral || '—'}</td></tr>
          <tr>
            <td style="padding: 8px 0; color: #8A7F74; vertical-align:top;">Interested in</td>
            <td style="padding: 8px 0;">
              <ul style="margin:0; padding-left:16px; line-height:1.6;">${reasonsList}</ul>
            </td>
          </tr>
        </table>
        ${message ? `<div style="margin-top:20px; padding:16px; background:#fff; border-left: 3px solid #C9A84C;"><p style="margin:0; color:#8A7F74; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:8px;">Prayer Request / Message</p><p style="margin:0; line-height:1.6;">${message}</p></div>` : ''}
      </div>
      <div style="padding: 16px 32px; text-align: center; font-size: 0.78rem; color: #8A7F74;">
        Pathway Ministries · Hyde Park, Johannesburg · pathwaym.co.za
      </div>
    </div>
  `;

  const autoReplyHtml = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1A1A1A;">
      <div style="background: #1A1A1A; padding: 28px 32px; text-align: center;">
        <h2 style="color: #C9A84C; font-weight: 300; font-size: 1.4rem; margin: 0; letter-spacing: 0.05em;">
          Pathway Ministries
        </h2>
      </div>
      <div style="background: #FAF7F2; padding: 36px 32px; border: 1px solid #E8E0D0; border-top: none;">
        <p style="font-size:1rem; margin-bottom: 16px;">Dear ${firstName},</p>
        <p style="line-height:1.7; margin-bottom:16px;">Thank you for reaching out to us! We've received your details and a member of the Pathway Ministries team will be in touch with you soon.</p>
        <p style="line-height:1.7; margin-bottom:16px;">We're so glad you took this step, and we look forward to connecting with you. In the meantime, feel free to visit us at <strong>Hyde Park, Johannesburg</strong> or explore more at <a href="https://pathwaym.co.za" style="color:#C9A84C;">pathwaym.co.za</a>.</p>
        <p style="line-height:1.7; margin-bottom: 0;">God bless you,<br><strong>The Pathway Ministries Team</strong></p>
      </div>
      <div style="padding: 16px 32px; text-align: center; font-size: 0.78rem; color: #8A7F74;">
        Pathway Ministries · Hyde Park, Johannesburg · pathwaym.co.za
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Pathway Ministries" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `New Connection: ${firstName} ${lastName}`,
      html: adminHtml,
    });

    await transporter.sendMail({
      from: `"Pathway Ministries" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `We've received your details — Pathway Ministries`,
      html: autoReplyHtml,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
