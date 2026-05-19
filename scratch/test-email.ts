import nodemailer from 'nodemailer';

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log('SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '***' : 'NOT SET',
  });

  try {
    const info = await transporter.sendMail({
      from: `"Test BangParjo" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // kirim ke diri sendiri
      subject: 'Test Email dari BangParjo Shop',
      text: 'Ini adalah test email untuk memastikan SMTP berfungsi.',
      html: '<h1>Test Email</h1><p>SMTP berfungsi dengan baik!</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error: any) {
    console.error('❌ Error sending email:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Command:', error.command);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

// Load .env
import { config } from 'dotenv';
config({ path: '.env' });

testEmail();
