const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendOtp = async (email, otp) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"FinnAI" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'FinnAI — Şifre Sıfırlama Kodunuz',
    text: `Şifre sıfırlama kodunuz: ${otp}\n\nBu kod 10 dakika geçerlidir.\nEğer bu isteği siz yapmadıysanız bu e-postayı görmezden gelin.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1B4FD8; margin-bottom: 8px;">FinnAI</h2>
        <p style="color: #374151;">Şifre sıfırlama kodunuz:</p>
        <div style="background: #EFF6FF; border: 2px solid #1B4FD8; padding: 20px; border-radius: 12px; text-align: center; margin: 16px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #1B4FD8;">${otp}</span>
        </div>
        <p style="color: #6B7280; font-size: 13px;">
          Bu kod <strong>10 dakika</strong> geçerlidir.<br>
          Bu isteği siz yapmadıysanız bu e-postayı görmezden gelin.
        </p>
      </div>
    `,
  });
};

module.exports = { sendOtp };
