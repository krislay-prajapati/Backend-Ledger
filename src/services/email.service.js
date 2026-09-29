import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Banking-Transaction" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = 'Welcome to Banking-Transaction!';
  const text = `Hello ${name},\n\nThank you for registering at Banking-Transaction. We're excited to have you on board!\n\nBest regards,\nThe Banking-Transaction Team`;
  const html = `<p>Hello ${name},</p><p>Thank you for registering at Banking-Transaction. We're excited to have you on board!</p><p>Best regards,<br>The Banking-Transaction Team</p>`;

  return await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Successful';
  const text = `Hello ${name},\n\nYour transaction of ₹${amount} has been processed successfully.\nTo account: ${toAccount}\n\nThank you for banking with us.\n\nBest regards,\nThe Banking-Transaction Team`;
  const html = `
    <p>Hello ${name},</p>
    <p>Your transaction of <strong>₹${amount}</strong> has been processed successfully.</p>
    <p><strong>To account:</strong> ${toAccount}</p>
    <p>Thank you for banking with us.</p>
    <p>Best regards,<br>The Banking-Transaction Team</p>
  `;

  return await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount, reason) {
  const subject = 'Transaction Failed';
  const text = `Hello ${name},\n\nYour transaction of ₹${amount} could not be completed.\nTo account: ${toAccount}\nReason: ${reason}\n\nPlease try again or contact support.\n\nBest regards,\nThe Banking-Transaction Team`;
  const html = `
    <p>Hello ${name},</p>
    <p>Your transaction of <strong>₹${amount}</strong> could not be completed.</p>
    <p><strong>To account:</strong> ${toAccount}</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please try again or contact support.</p>
    <p>Best regards,<br>The Banking-Transaction Team</p>
  `;

  return await sendEmail(userEmail, subject, text, html);
}

export {
  sendEmail,
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
};

