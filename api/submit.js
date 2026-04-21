const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { firstName, lastName, email, phone, visitStatus, contactMethod, reasons, message } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isNewVisitor = visitStatus === 'First time' || visitStatus === 'Been a few times';

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
            <tr><td style="padding: 8px 0; color: #8A7F74; width: 160px; vertical-align:top;">Full Name</td><td style="padding: 8px 0; font-weight: 500;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding: 8px 0; color: #8A7F74; vertical-align:top;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color:#C9A84C;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #8A7F74; vertical-align:top;">Phone</td><td style="padding: 8px 0;">${phone || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #8A7F74; vertical-align:top;">Visit Status</td><td style="padding: 8px 0;">
              <span style="background:${isNewVisitor ? '#FFF3CD' : '#E8F5E9'}; color:${isNewVisitor ? '#856404' : '#2E7D32'}; padding: 2px 10px; border-radius: 20px; font-size:0.82rem; font-weight:500;">
                ${visitStatus || '—'}
              </span>
            </td></tr>
            <tr><td style="padding: 8px 0; color: #8A7F74; vertical-align:top;">Best contact via</td><td style="padding: 8px 0;">${contactMethod || '—'}</td></tr>
            <tr>
              <td style="padding: 8px 0; color: #8A7F74; vertical-align:top;">Interested in</td>
              <td style="padding: 8px 0;"><ul style="margin:0; padding-left:16px; line-height:1.7;">${reasonsList}</ul></td>
            </tr>
          </table>
          ${message ? `<div style="margin-top:20px; padding:16px; background:#fff; border-left: 3px solid #C9A84C;"><p style="margin:0; color:#8A7F74; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:8px;">Prayer Request / Message</p><p style="margin:0; line-height:1.6;">${message}</p></div>` : ''}
          ${isNewVisitor ? `<div style="margin-top:16px; padding:12px 16px; background:#FFF3CD; border-radius:4px; font-size:0.82rem; color:#856404;">📎 Welcome pack was automatically sent to this visitor.</div>` : ''}
        </div>
        <div style="padding: 16px 32px; text-align: center; font-size: 0.78rem; color: #8A7F74;">
          Pathway Ministries · Hyde Park, Johannesburg · pathwaym.co.za
        </div>
      </div>
    `;

    const autoReplyHtml = isNewVisitor ? `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1A1A1A;">
        <div style="background: #1A1A1A; padding: 28px 32px; text-align: center;">
          <h2 style="color: #C9A84C; font-weight: 300; font-size: 1.4rem; margin: 0; letter-spacing: 0.05em;">Welcome Home, ${firstName}.</h2>
        </div>
        <div style="background: #FAF7F2; padding: 36px 32px; border: 1px solid #E8E0D0; border-top: none;">
          <p style="font-size:1rem; margin-bottom: 16px;">We're so glad you found your way to Pathway.</p>
          <p style="line-height:1.7; margin-bottom:16px;">You're not here by accident. Someone from our team will be reaching out to you personally soon. In the meantime, we've attached our <strong>Welcome Pack</strong> to this email — it has everything you need to know about who we are, what we believe, and how to take your next step.</p>
          <p style="line-height:1.7; margin-bottom:24px;">Visit us at <a href="https://pathwaym.co.za" style="color:#C9A84C;">pathwaym.co.za</a> or reply to this email anytime.</p>
          <div style="border-top: 1px solid #E8E0D0; padding-top: 20px; font-style: italic; color: #8A7F74; font-size: 0.88rem; line-height: 1.7;">
            "For I know the plans I have for you, declares the LORD — plans to give you a future and a hope."<br>
            <strong style="color:#C9A84C;">Jeremiah 29:11</strong>
          </div>
          <p style="margin-top:24px; margin-bottom: 0;">With love,<br><strong>The Pathway Ministries Team</strong></p>
        </div>
        <div style="padding: 16px 32px; text-align: center; font-size: 0.78rem; color: #8A7F74;">Pathway Ministries · Hyde Park, Johannesburg · pathwaym.co.za</div>
      </div>
    ` : `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1A1A1A;">
        <div style="background: #1A1A1A; padding: 28px 32px; text-align: center;">
          <h2 style="color: #C9A84C; font-weight: 300; font-size: 1.4rem; margin: 0; letter-spacing: 0.05em;">Pathway Ministries</h2>
        </div>
        <div style="background: #FAF7F2; padding: 36px 32px; border: 1px solid #E8E0D0; border-top: none;">
          <p style="font-size:1rem; margin-bottom: 16px;">Dear ${firstName},</p>
          <p style="line-height:1.7; margin-bottom:16px;">Thank you for reaching out — it means a lot. Someone from our team will be in touch with you personally soon.</p>
          <p style="line-height:1.7; margin-bottom:16px;">In the meantime feel free to visit <a href="https://pathwaym.co.za" style="color:#C9A84C;">pathwaym.co.za</a> or email us at <a href="mailto:info@pathwaym.co.za" style="color:#C9A84C;">info@pathwaym.co.za</a>.</p>
          <p style="line-height:1.7; margin-bottom: 0;">God bless you,<br><strong>The Pathway Ministries Team</strong></p>
        </div>
        <div style="padding: 16px 32px; text-align: center; font-size: 0.78rem; color: #8A7F74;">Pathway Ministries · Hyde Park, Johannesburg · pathwaym.co.za</div>
      </div>
    `;

    // Notify church
    await transporter.sendMail({
      from: `"Pathway Ministries" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `New Connection: ${firstName} ${lastName}${isNewVisitor ? ' 🌟 New Visitor' : ''}`,
      html: adminHtml,
    });

    // Auto-reply with optional welcome pack
    const replyOptions = {
      from: `"Pathway Ministries" <${process.env.SMTP_USER}>`,
      to: email,
      subject: isNewVisitor ? `Welcome Home, ${firstName} — Pathway Ministries` : `We've received your details — Pathway Ministries`,
      html: autoReplyHtml,
    };

    if (isNewVisitor) {
      const pdfPath = path.join(__dirname, '..', 'pathway-welcome-pack.pdf');
      if (fs.existsSync(pdfPath)) {
        replyOptions.attachments = [{
          filename: 'Pathway Ministries - Welcome Pack.pdf',
          path: pdfPath,
          contentType: 'application/pdf',
        }];
      }
    }

    await transporter.sendMail(replyOptions);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
