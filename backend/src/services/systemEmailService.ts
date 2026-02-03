import { GmailService } from './gmailService';
import { GoogleOAuthService } from './googleOAuthService';
import { FallbackEmailService } from './fallbackEmailService';
import { Not, IsNull } from 'typeorm';

export interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  tempPassword?: string;
  adminEmail: string;
  adminName: string;
  appUrl: string;
}

export interface ExternalUserWelcomeEmailData {
  userEmail: string;
  userName: string;
  tempPassword?: string;
  accountName: string;
  appUrl: string;
}

export interface PasswordResetEmailData {
  userEmail: string;
  userName: string;
  resetToken: string;
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
    try {
      // Import the User entity and DataSource
      const { User } = await import('../entities/User');
      const { AppDataSource } = await import('../config/data-source');
      
      // Find admin user with Gmail integration
      const userRepository = AppDataSource.getRepository(User);
      const adminUser = await userRepository.findOne({
        where: {
          isGoogleUser: true,
          googleAccessToken: Not(IsNull())
        },
        order: { createdAt: 'ASC' } // Get the first available admin user
      });
      
      if (adminUser && adminUser.googleAccessToken) {
        console.log('Found admin user with Gmail integration:', adminUser.email);
        return {
          email: adminUser.email,
          name: adminUser.name,
          googleAccessToken: adminUser.googleAccessToken,
          googleRefreshToken: adminUser.googleRefreshToken || ''
        };
      }
      
      console.log('No admin user with Gmail integration found');
      return null;
    } catch (error) {
      console.error('Error finding admin user with Gmail integration:', error);
      return null;
    }
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

  /**
   * Send welcome email to external user
   */
  async sendExternalUserWelcomeEmail(data: ExternalUserWelcomeEmailData): Promise<string> {
    try {
      // Try Gmail integration first
      const adminUser = await this.getAdminUserWithGmail();
      
      if (adminUser && adminUser.googleAccessToken) {
        const email = {
          subject: `Welcome to ${process.env.APP_NAME || 'CRM'} - Client Portal Access`,
          from: { 
            email: adminUser.email, 
            name: adminUser.name 
          },
          to: [{ 
            email: data.userEmail, 
            name: data.userName 
          }],
          body: this.createExternalUserWelcomeEmailText(data),
          bodyHtml: this.createExternalUserWelcomeEmailHtml(data),
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
        subject: `Welcome to ${process.env.APP_NAME || 'CRM'} - Client Portal Access`,
        text: this.createExternalUserWelcomeEmailText(data),
        html: this.createExternalUserWelcomeEmailHtml(data)
      });
    } catch (fallbackError) {
      console.error('Both Gmail and fallback email services failed:', fallbackError);
      throw new Error('Failed to send external user welcome email via all available methods');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<string> {
    try {
      // Try Gmail integration first
      const adminUser = await this.getAdminUserWithGmail();
      
      if (adminUser && adminUser.googleAccessToken) {
        const email = {
          subject: `Password Reset - ${process.env.APP_NAME || 'CRM'}`,
          from: { 
            email: adminUser.email, 
            name: adminUser.name 
          },
          to: [{ 
            email: data.userEmail, 
            name: data.userName 
          }],
          body: this.createPasswordResetEmailText(data),
          bodyHtml: this.createPasswordResetEmailHtml(data),
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
        subject: `Password Reset - ${process.env.APP_NAME || 'CRM'}`,
        text: this.createPasswordResetEmailText(data),
        html: this.createPasswordResetEmailHtml(data)
      });
    } catch (fallbackError) {
      console.error('Both Gmail and fallback email services failed:', fallbackError);
      throw new Error('Failed to send password reset email via all available methods');
    }
  }

  /**
   * Create plain text external user welcome email
   */
  private createExternalUserWelcomeEmailText(data: ExternalUserWelcomeEmailData): string {
    return `
Welcome to ${process.env.APP_NAME || 'CRM'} Client Portal!

Hi ${data.userName},

Your client portal access has been created for ${data.accountName}.

Account Details:
- Email: ${data.userEmail}
- Name: ${data.userName}
- Account: ${data.accountName}
${data.tempPassword ? `- Temporary Password: ${data.tempPassword}` : ''}

To access your client portal:
1. Visit: ${data.appUrl}/client
2. Sign in with your email address
${data.tempPassword ? `3. Use the temporary password above for your first login` : ''}
4. You'll be prompted to change your password on first login

In the client portal, you can:
- View and update your assigned tasks
- Track task progress and status
- Access account information
- Communicate with your account team

If you have any questions, please contact your account manager.

Best regards,
The ${process.env.APP_NAME || 'CRM'} Team
    `.trim();
  }

  /**
   * Create HTML external user welcome email
   */
  private createExternalUserWelcomeEmailHtml(data: ExternalUserWelcomeEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${process.env.APP_NAME || 'CRM'} Client Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: white; padding: 20px; border-radius: 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .credentials { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .features { background: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ${process.env.APP_NAME || 'CRM'} Client Portal!</h1>
        </div>
        
        <div class="content">
            <p>Hi ${data.userName},</p>
            
            <p>Your client portal access has been created for <strong>${data.accountName}</strong>.</p>
            
            <div class="credentials">
                <h3>Account Details:</h3>
                <p><strong>Email:</strong> ${data.userEmail}</p>
                <p><strong>Name:</strong> ${data.userName}</p>
                <p><strong>Account:</strong> ${data.accountName}</p>
                ${data.tempPassword ? `<p><strong>Temporary Password:</strong> <code>${data.tempPassword}</code></p>` : ''}
            </div>
            
            <h3>To access your client portal:</h3>
            <ol>
                <li>Visit: <a href="${data.appUrl}/client">${data.appUrl}/client</a></li>
                <li>Sign in with your email address</li>
                ${data.tempPassword ? `<li>Use the temporary password above for your first login</li>` : ''}
                <li>You'll be prompted to change your password on first login</li>
            </ol>
            
            <a href="${data.appUrl}/client" class="button">Access Client Portal</a>
            
            <div class="features">
                <h3>In the client portal, you can:</h3>
                <ul>
                    <li>View and update your assigned tasks</li>
                    <li>Track task progress and status</li>
                    <li>Access account information</li>
                    <li>Communicate with your account team</li>
                </ul>
            </div>
            
            <p>If you have any questions, please contact your account manager.</p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The ${process.env.APP_NAME || 'CRM'} Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Create plain text password reset email
   */
  private createPasswordResetEmailText(data: PasswordResetEmailData): string {
    return `
Password Reset Request - ${process.env.APP_NAME || 'CRM'}

Hi ${data.userName},

You requested a password reset for your account.

To reset your password:
        1. Visit: ${data.appUrl}/client/password-reset
2. Enter the reset token: ${data.resetToken}
3. Create a new password

This token will expire in 24 hours.

If you didn't request this reset, please ignore this email.

Best regards,
The ${process.env.APP_NAME || 'CRM'} Team
    `.trim();
  }

  /**
   * Create HTML password reset email
   */
  private createPasswordResetEmailHtml(data: PasswordResetEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - ${process.env.APP_NAME || 'CRM'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: white; padding: 20px; border-radius: 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .token { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; font-family: monospace; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
            <p>Hi ${data.userName},</p>
            
            <p>You requested a password reset for your account.</p>
            
            <h3>To reset your password:</h3>
            <ol>
                <li>Visit: <a href="${data.appUrl}/client/password-reset">${data.appUrl}/client/password-reset</a></li>
                <li>Enter the reset token below</li>
                <li>Create a new password</li>
            </ol>
            
            <div class="token">
                <h3>Reset Token:</h3>
                <p><code>${data.resetToken}</code></p>
            </div>
            
                            <a href="${data.appUrl}/client/password-reset" class="button">Reset Password</a>
            
            <p><strong>Note:</strong> This token will expire in 24 hours.</p>
            
            <p>If you didn't request this reset, please ignore this email.</p>
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
