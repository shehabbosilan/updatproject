import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'bosilan232@gmail.com',
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendPasswordResetEmail(to, resetUrl) {
    const mailOptions = {
      from: `"ERP Admin" <${process.env.EMAIL_USER || 'bosilan232@gmail.com'}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Please click the link below to set a new password. This link is valid for 15 minutes.</p>
        <a href="${resetUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Could not send email');
    }
  }
}

export const emailService = new EmailService();
