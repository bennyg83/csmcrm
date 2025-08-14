import { GmailService } from './gmailService';
import { GoogleOAuthService } from './googleOAuthService';
import { FallbackEmailService } from './fallbackEmailService';

export interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  tempPassword?: string;
  adminEmail: string;
  adminName: string;
  appUrl: string;
}

export class SystemEmailService {
  private gmailService: GmailService;
  private googleOAuthService: GoogleOAuthService;
  private fallbackEmailService: FallbackEmailService;

  constructor() {
    this.gmailService = new GmailService();
    this.googleOAuthService = GoogleOAuthService.getInstance();
    this.fallbackEmailService = new FallbackEmailService();
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<string> {
    try {
      // Try Gmail integration first
      const adminUser = await this.getAdminUserWithGmail();
      
      if (adminUser && adminUser.googleAccessToken) {
        const email = {
          subject: `Welcome to ${process.env.APP_NAME || 'CRM'} - Your Account Has Been Created`,
          from: { 
            email: adminUser.email, 
            name: adminUser.name 
          },
          to: [{ 
            email: data.userEmail, 
            name: data.userName 
          }],
          body: this.createWelcomeEmailText(data),
          bodyHtml: this.createWelcomeEmailHtml(data),
          date: new Date()
        };

        return await this.gmailService.sendEmail(
          adminUser.googleAccessToken,
          adminUser.googleRefreshToken || '',
          email
        );
      }
    } catch (gmailError) {
      console.log('Gmail integration failed, trying fallback email service...');
    }

    // Fallback to SMTP if Gmail integration fails or isn't available
    try {
      return await this.fallbackEmailService.sendEmail({
        to: data.userEmail,
        subject: `Welcome to ${process.env.APP_NAME || 'CRM'} - Your Account Has Been Created`,
        text: this.createWelcomeEmailText(data),
        html: this.createWelcomeEmailHtml(data)
      });
    } catch (fallbackError) {
      console.error('Both Gmail and fallback email services failed:', fallbackError);
      throw new Error('Failed to send welcome email via all available methods');
    }
  }

  /**
   * Get admin user with Gmail integration
   */
  private async getAdminUserWithGmail() {
    // This would need to be implemented based on your User entity
    // For now, we'll use environment variables to specify the system email account
    const systemEmail = process.env.SYSTEM_EMAIL;
    const systemEmailPassword = process.env.SYSTEM_EMAIL_PASSWORD;
    
    if (systemEmail && systemEmailPassword) {
      // Use dedicated system email account
      return {
        email: systemEmail,
        name: 'System Administrator',
        googleAccessToken: systemEmailPassword, // This would need proper OAuth setup
        googleRefreshToken: ''
      };
    }
    
    // Fallback: find admin user with Gmail integration
    // This would require database access
    return null;
  }

  /**
   * Create plain text welcome email
   */
  private createWelcomeEmailText(data: WelcomeEmailData): string {
    return `
Welcome to ${process.env.APP_NAME || 'CRM'}!

Hi ${data.userName},

Your account has been successfully created by ${data.adminName}.

Account Details:
- Email: ${data.userEmail}
- Name: ${data.userName}
${data.tempPassword ? `- Temporary Password: ${data.tempPassword}` : ''}

To get started:
1. Visit: ${data.appUrl}
2. Sign in with your email address
${data.tempPassword ? `3. Use the temporary password above for your first login` : ''}
4. You'll be prompted to change your password on first login

If you have any questions, please contact ${data.adminName} at ${data.adminEmail}.

Best regards,
The ${process.env.APP_NAME || 'CRM'} Team
    `.trim();
  }

  /**
   * Create HTML welcome email
   */
  private createWelcomeEmailHtml(data: WelcomeEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${process.env.APP_NAME || 'CRM'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: white; padding: 20px; border-radius: 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .credentials { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ${process.env.APP_NAME || 'CRM'}!</h1>
        </div>
        
        <div class="content">
            <p>Hi ${data.userName},</p>
            
            <p>Your account has been successfully created by <strong>${data.adminName}</strong>.</p>
            
            <div class="credentials">
                <h3>Account Details:</h3>
                <p><strong>Email:</strong> ${data.userEmail}</p>
                <p><strong>Name:</strong> ${data.userName}</p>
                ${data.tempPassword ? `<p><strong>Temporary Password:</strong> <code>${data.tempPassword}</code></p>` : ''}
            </div>
            
            <h3>To get started:</h3>
            <ol>
                <li>Visit: <a href="${data.appUrl}">${data.appUrl}</a></li>
                <li>Sign in with your email address</li>
                ${data.tempPassword ? `<li>Use the temporary password above for your first login</li>` : ''}
                <li>You'll be prompted to change your password on first login</li>
            </ol>
            
            <a href="${data.appUrl}" class="button">Sign In Now</a>
            
            <p>If you have any questions, please contact <strong>${data.adminName}</strong> at <a href="mailto:${data.adminEmail}">${data.adminEmail}</a>.</p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The ${process.env.APP_NAME || 'CRM'} Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}
