import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export class GoogleOAuthService {
  private oauth2Client: OAuth2Client;
  private static instance: GoogleOAuthService;

  private constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  public static getInstance(): GoogleOAuthService {
    if (!GoogleOAuthService.instance) {
      GoogleOAuthService.instance = new GoogleOAuthService();
    }
    return GoogleOAuthService.instance;
  }

  /**
   * Generate Google OAuth2 authorization URL
   * Optimized for Gmail-based contact discovery and calendar integration
   */
  generateAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',     // SSO login
      'https://www.googleapis.com/auth/userinfo.profile',   // User profile
      'https://www.googleapis.com/auth/gmail.modify',       // Email + contact discovery
      'https://www.googleapis.com/auth/calendar'            // Calendar integration
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state || 'default'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<GoogleTokens> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens as GoogleTokens;
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    return {
      id: data.id!,
      email: data.email!,
      name: data.name!,
      picture: data.picture || undefined,
      verified_email: data.verified_email || false
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials as GoogleTokens;
  }

  /**
   * Revoke Google tokens
   */
  async revokeTokens(accessToken: string): Promise<void> {
    await this.oauth2Client.revokeToken(accessToken);
  }

  /**
   * Set credentials for API calls
   */
  setCredentials(accessToken: string, refreshToken?: string): void {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }

  /**
   * Get OAuth2 client for making Google API calls
   */
  getOAuth2Client(): OAuth2Client {
    return this.oauth2Client;
  }

  /**
   * Verify if tokens are valid
   */
  async verifyTokens(accessToken: string): Promise<boolean> {
    try {
      const tokenInfo = await this.oauth2Client.getTokenInfo(accessToken);
      return !!tokenInfo.email;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create authenticated Gmail API client
   * Used for email integration and contact discovery
   */
  getGmailClient(accessToken: string, refreshToken?: string) {
    this.setCredentials(accessToken, refreshToken);
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Create authenticated Calendar API client
   * Used for meeting/task scheduling integration
   */
  getCalendarClient(accessToken: string, refreshToken?: string) {
    this.setCredentials(accessToken, refreshToken);
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Parse email for contact information
   * Extract contacts from email signatures and participants
   */
  async discoverContactsFromEmail(emailData: any): Promise<any[]> {
    // This will be implemented later for contact discovery
    // Parse email signatures, extract contact details, suggest new contacts
    return [];
  }
} 