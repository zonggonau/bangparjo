import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendCheckoutEmail(email: string, orderNum: string, checkoutUrl: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[MAIL] SMTP credentials missing. Email not sent.');
    return { success: false, error: 'SMTP configuration missing' };
  }

  const mailOptions = {
    from: `"BangParjo Shop" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Complete your Order #${orderNum} - BangParjo Shop`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #ff6b00; text-align: center;">BangParjo Shop</h2>
        <p>Hi there!</p>
        <p>Thank you for choosing BangParjo Shop. Your order <strong>#${orderNum}</strong> has been created, but payment is still pending.</p>
        <p>Please complete your payment within <strong>24 hours</strong> using the secure link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${checkoutUrl}" style="background-color: #ff6b00; color: white; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Finalize Payment Now</a>
        </div>
        <p style="font-size: 12px; color: #666;">If you have any questions, feel free to reply to this email or contact our support team.</p>
        <p style="font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
          © 2024 BangParjo Shop. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[MAIL] Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[MAIL] Error sending email:', error);
    return { success: false, error: error.message };
  }
}
