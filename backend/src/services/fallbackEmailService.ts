import nodemailer from 'nodemailer';

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class FallbackEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create transporter using environment variables
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send email using SMTP
   */
  async sendEmail(data: EmailData): Promise<string> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.APP_NAME || 'CRM System'}" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
      });

      return info.messageId;
    } catch (error) {
      console.error('Failed to send email via SMTP:', error);
      throw new Error('Failed to send email via SMTP');
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }
}
