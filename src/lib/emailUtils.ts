
'use server';

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM;
const emailSecure = process.env.EMAIL_SECURE === 'true'; // Convert string to boolean

if (!emailHost || !emailPort || !emailUser || !emailPass || !emailFrom) {
  console.warn(
    'Email environment variables (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM, EMAIL_SECURE) are not fully configured. Password reset emails will not be sent.'
  );
}

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: parseInt(emailPort || '587', 10),
  secure: emailSecure, // true for 465, false for other ports (like 587 with STARTTLS)
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  // If using a self-signed certificate in development (not recommended for production)
  // tls: {
  //   rejectUnauthorized: false
  // }
});

export async function sendPasswordResetEmail(recipientEmail: string, resetToken: string): Promise<void> {
  if (!emailHost || !emailPort || !emailUser || !emailPass || !emailFrom) {
    console.error('Email service is not configured. Cannot send password reset email.');
    // Fallback to console logging the link if email isn't configured,
    // but still throw an error to indicate misconfiguration for server admin.
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const resetLink = `${appBaseUrl}/reset-password?token=${resetToken}`;
    console.log(`[PASSWORD RESET EMAIL FALLBACK] User: ${recipientEmail}`);
    console.log(`[PASSWORD RESET EMAIL FALLBACK] Reset Link: ${resetLink}`);
    throw new Error('Email service not configured. Password reset link logged to console as fallback.');
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const resetLink = `${appBaseUrl}/reset-password?token=${resetToken}`;

  const mailOptions: EmailOptions = {
    from: `"BizLink Support" <${emailFrom}>`,
    to: recipientEmail,
    subject: 'Reset Your BizLink Password',
    text: `Hello,\n\nPlease reset your password by clicking the following link: ${resetLink}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe BizLink Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your BizLink account. Please click the button below to set a new password:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" style="background-color: #FACC15; color: #1A1A1A; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </p>
        <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 0.9em; color: #777;">Thanks,<br />The BizLink Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EmailUtils] Password reset email sent to ${recipientEmail}`);
  } catch (error) {
    console.error(`[EmailUtils] Error sending password reset email to ${recipientEmail}:`, error);
    // Rethrow the error so the calling API route can handle it
    // and potentially inform the user that the email could not be sent.
    throw new Error('Could not send password reset email. Please try again later.');
  }
}
