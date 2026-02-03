// import nodemailer from 'nodemailer';

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class FallbackEmailService {
  // private transporter: nodemailer.Transporter;

  constructor() {
    // TODO: Uncomment when nodemailer is available
    // Create transporter using environment variables
    // this.transporter = nodemailer.createTransporter({
    //   host: process.env.SMTP_HOST || 'smtp.gmail.com',
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: false, // true for 465, false for other ports
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });
  }

  /**
   * Send email using SMTP
   */
  async sendEmail(data: EmailData): Promise<string> {
    try {
      // TODO: Uncomment when nodemailer is available
      // const info = await this.transporter.sendMail({
      //   from: `"${process.env.APP_NAME || 'CRM System'}" <${process.env.SMTP_USER}>`,
      //   to: data.to,
      //   subject: data.subject,
      //   text: data.text,
      //   html: data.html,
      // });

      // For now, just log the email and return a mock message ID
      console.log('Mock SMTP Email Sent:', {
        to: data.to,
        subject: data.subject,
        text: data.text.substring(0, 100) + '...',
        html: data.html.substring(0, 100) + '...'
      });

      return `mock-${Date.now()}`;
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
      // TODO: Uncomment when nodemailer is available
      // await this.transporter.verify();
      console.log('Mock SMTP connection test - always returns true');
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }
}
