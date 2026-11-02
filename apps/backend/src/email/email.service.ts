import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { env } from '@notifyiq/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendClient: Resend | null = null;

  constructor() {
    const apiKey = env.RESEND_API_KEY;
    if (apiKey) {
      this.resendClient = new Resend(apiKey);
      this.logger.log('Resend client successfully initialized');
    } else {
      this.logger.warn('RESEND_API_KEY is not configured. Email dispatches will be simulated locally.');
    }
  }

  /**
   * Send an email verification link to a newly registered user using Resend.
   */
  async sendVerificationEmail(
    toEmail: string,
    name: string,
    token: string,
  ): Promise<{ success: boolean; id?: string }> {
    const clientUrl = env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const displayCode = token.slice(0, 8).toUpperCase();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your NotifyIQ Account</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
            .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 36px 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .brand { display: flex; align-items: center; margin-bottom: 24px; }
            .logo { background: linear-gradient(135deg, #059669, #0d9488, #06b6d4); color: #fff; font-weight: 900; font-size: 20px; width: 42px; height: 42px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 42px; margin-right: 12px; }
            .brand-title { font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0; }
            .brand-title span { color: #10b981; }
            h2 { color: #f8fafc; font-size: 20px; margin-top: 0; margin-bottom: 16px; }
            p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 18px; }
            .btn-container { text-align: center; margin: 30px 0; }
            .btn { background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; transition: opacity 0.2s; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35); }
            .code-box { background: #0f172a; border: 1px dashed #475569; border-radius: 8px; padding: 14px; text-align: center; margin: 24px 0; }
            .code { font-family: monospace; font-size: 20px; font-weight: 700; letter-spacing: 3px; color: #34d399; }
            .link-text { word-break: break-all; color: #10b981; font-size: 13px; }
            .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brand">
              <span class="logo">IQ</span>
              <span class="brand-title">Notify<span>IQ</span></span>
            </div>
            <h2>Welcome to NotifyIQ, ${name || 'there'}!</h2>
            <p>Thank you for signing up for NotifyIQ - Meta WhatsApp Cloud API & AI Automation Platform. Please confirm your email address to activate your account.</p>
            
            <div class="btn-container">
              <a href="${verifyUrl}" class="btn" target="_blank">Verify Email Address</a>
            </div>

            <div class="code-box">
              <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Or enter this verification token:</div>
              <div class="code">${displayCode}</div>
            </div>

            <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser:</p>
            <p><a href="${verifyUrl}" class="link-text">${verifyUrl}</a></p>

            <div class="footer">
              <p>This verification link is valid for 24 hours. If you did not create a NotifyIQ account, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} NotifyIQ Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (!this.resendClient) {
      this.logger.warn(`[Resend Email Simulated] Verification email for ${toEmail}: ${verifyUrl}`);
      return { success: true, id: 'simulated_local' };
    }

    try {
      const fromAddress = env.RESEND_FROM_EMAIL?.includes('@')
        ? (env.RESEND_FROM_EMAIL.includes('<') ? env.RESEND_FROM_EMAIL : `NotifyIQ <${env.RESEND_FROM_EMAIL}>`)
        : `NotifyIQ <onboarding@resend.dev>`;

      const response = await this.resendClient.emails.send({
        from: fromAddress,
        to: [toEmail],
        subject: 'Verify your NotifyIQ account',
        html,
      });

      if (response.error) {
        this.logger.error(`Failed to send verification email to ${toEmail}: ${response.error.message}`);
        return { success: false };
      }

      this.logger.log(`Verification email sent to ${toEmail} | Email ID: ${response.data?.id}`);
      return { success: true, id: response.data?.id };
    } catch (error: any) {
      this.logger.error(`Exception sending verification email to ${toEmail}: ${error?.message || error}`);
      return { success: false };
    }
  }

  /**
   * Send a password reset email using Resend.
   */
  async sendPasswordResetEmail(
    toEmail: string,
    name: string,
    token: string,
  ): Promise<{ success: boolean; id?: string }> {
    const clientUrl = env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your NotifyIQ Password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
            .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 36px 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .brand { display: flex; align-items: center; margin-bottom: 24px; }
            .logo { background: linear-gradient(135deg, #059669, #0d9488, #06b6d4); color: #fff; font-weight: 900; font-size: 20px; width: 42px; height: 42px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 42px; margin-right: 12px; }
            .brand-title { font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0; }
            .brand-title span { color: #10b981; }
            h2 { color: #f8fafc; font-size: 20px; margin-top: 0; margin-bottom: 16px; }
            p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 18px; }
            .btn-container { text-align: center; margin: 30px 0; }
            .btn { background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; transition: opacity 0.2s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35); }
            .link-text { word-break: break-all; color: #10b981; font-size: 13px; }
            .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brand">
              <span class="logo">IQ</span>
              <span class="brand-title">Notify<span>IQ</span></span>
            </div>
            <h2>Password Reset Request</h2>
            <p>Hello ${name || 'there'},</p>
            <p>We received a request to reset the password associated with your NotifyIQ account. Click the button below to choose a new password:</p>
            
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
            </div>

            <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser:</p>
            <p><a href="${resetUrl}" class="link-text">${resetUrl}</a></p>

            <div class="footer">
              <p><strong>Note:</strong> This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email; your password will remain unchanged.</p>
              <p>&copy; ${new Date().getFullYear()} NotifyIQ Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (!this.resendClient) {
      this.logger.warn(`[Resend Email Simulated] Password reset email for ${toEmail}: ${resetUrl}`);
      return { success: true, id: 'simulated_local' };
    }

    try {
      const fromAddress = env.RESEND_FROM_EMAIL?.includes('@')
        ? (env.RESEND_FROM_EMAIL.includes('<') ? env.RESEND_FROM_EMAIL : `NotifyIQ <${env.RESEND_FROM_EMAIL}>`)
        : `NotifyIQ <onboarding@resend.dev>`;

      const response = await this.resendClient.emails.send({
        from: fromAddress,
        to: [toEmail],
        subject: 'Reset your NotifyIQ account password',
        html,
      });

      if (response.error) {
        this.logger.error(`Failed to send password reset email to ${toEmail}: ${response.error.message}`);
        return { success: false };
      }

      this.logger.log(`Password reset email sent to ${toEmail} | Email ID: ${response.data?.id}`);
      return { success: true, id: response.data?.id };
    } catch (error: any) {
      this.logger.error(`Exception sending password reset email to ${toEmail}: ${error?.message || error}`);
      return { success: false };
    }
  }
}

