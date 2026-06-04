import nodemailer from 'nodemailer';
import { prisma } from './db';

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

export async function sendBroadcastEmail(recipients: string[], subject: string, htmlContent: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[MAIL] SMTP credentials missing. Broadcast not sent.');
    return { success: false, error: 'SMTP configuration missing' };
  }

  const results = {
    successCount: 0,
    failCount: 0,
    errors: [] as string[],
  };

  // Send to each recipient in a safe batch manner (sequentially)
  for (const email of recipients) {
    try {
      await transporter.sendMail({
        from: `"BangParjo Shop" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 2px solid #ff6b00; padding-bottom: 15px; margin-bottom: 20px;">
              <h2 style="color: #ff6b00; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 0.05em;">BangParjo Shop</h2>
            </div>
            <div style="font-size: 15px; line-height: 1.6; color: #333; min-height: 150px;">
              ${htmlContent.replace(/\n/g, '<br/>')}
            </div>
            <div style="font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px; text-align: center;">
              You received this email because you are a registered customer or subscriber of BangParjo Shop.<br/>
              © 2024 BangParjo Shop. All rights reserved.
            </div>
          </div>
        `,
      });
      results.successCount++;
    } catch (err: any) {
      results.failCount++;
      results.errors.push(`${email}: ${err.message}`);
    }
  }

  return { 
    success: results.failCount === 0, 
    successCount: results.successCount, 
    failCount: results.failCount,
    errors: results.errors 
  };
}

export async function sendPaymentSuccessEmail(orderNum: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[MAIL] SMTP credentials missing. Payment success email not sent.');
    return { success: false, error: 'SMTP configuration missing' };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { orderNum },
      include: {
        items: {
          include: { variant: { include: { product: true } } }
        }
      }
    });

    if (!order || !order.customerEmail) {
      console.warn(`[MAIL] Order ${orderNum} or customer email not found. Skipping email.`);
      return { success: false, error: 'Order or email not found' };
    }

    let parsedOrderData: any = {};
    try {
      parsedOrderData = typeof order.orderData === 'string' ? JSON.parse(order.orderData) : (order.orderData || {});
    } catch(e) {}

    const displayShippingFee = order.shippingFee || parsedOrderData.shippingFee || 0;
    const displayTotalAmount = order.totalAmount || 0;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: left;">
          ${item.variant.product.name} <br>
          <small style="color: #666;">${item.variant.sku} (x${item.quantity})</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"BangParjo Shop" <${process.env.SMTP_USER}>`,
      to: order.customerEmail,
      subject: `Payment Successful - Order #${orderNum}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; border-bottom: 2px solid #ff6b00; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #ff6b00; margin: 0;">Payment Successful!</h2>
          </div>
          <p>Hi ${order.customerName || 'Customer'},</p>
          <p>Great news! We have successfully received your payment for order <strong>#${orderNum}</strong>.</p>
          <p>We are now processing your order and will notify you once it has been shipped.</p>
          
          <h3 style="color: #333; margin-top: 30px;">Order Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 10px; font-weight: bold; text-align: right;">Shipping:</td>
                <td style="padding: 10px; font-weight: bold; text-align: right;">$${(displayShippingFee).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; text-align: right; border-top: 2px solid #eee;">Total:</td>
                <td style="padding: 10px; font-weight: bold; text-align: right; border-top: 2px solid #eee;">$${(displayTotalAmount).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <p style="font-size: 14px; color: #555;">You can check your order status at any time by logging into your account or tracking via our store.</p>
          
          <p style="font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px; text-align: center;">
            Thank you for shopping at BangParjo Shop!<br>
            © ${new Date().getFullYear()} BangParjo Shop. All rights reserved.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[MAIL] Payment success email sent:', info.messageId);
    
    await prisma.order.update({
      where: { id: order.id },
      data: { emailSent: true }
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[MAIL] Error sending payment success email:', error);
    return { success: false, error: error.message };
  }
}
