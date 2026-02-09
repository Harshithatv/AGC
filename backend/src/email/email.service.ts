import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    console.log('SMTP Config:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user ? `${smtpConfig.auth.user.substring(0, 3)}***` : 'NOT SET',
      pass: smtpConfig.auth.pass ? '***SET***' : 'NOT SET'
    });

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  async sendWelcomeEmail(params: {
    to: string;
    name: string;
    email: string;
    password: string;
    organizationName: string;
  }) {
    const { to, name, email, password, organizationName } = params;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
          .credential-value { font-size: 16px; color: #1e293b; padding: 8px 12px; background: #f1f5f9; border-radius: 4px; margin-top: 4px; font-family: monospace; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
          .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Academic Guide Training & Certification</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to your learning portal</p>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Hello ${name},</h2>
            <p>Your account has been created for the <strong>Academic Guide Training & Certification</strong> by <strong>${organizationName}</strong>.</p>
            <p>Use the credentials below to log in to your learning portal:</p>
            
            <div class="credentials">
              <div class="credential-item">
                <div class="credential-label">Email</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Temporary Password</div>
                <div class="credential-value">${password}</div>
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This is a temporary password. Please change it after your first login for security purposes.
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Portal</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Academic Guide Training & Certification. All rights reserved.</p>
            <p>If you did not expect this email, please contact your administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Academic Guide Training & Certification - Login Credentials

Hello ${name},

Your account has been created for the Academic Guide Training & Certification by ${organizationName}.

Your login credentials:
- Email: ${email}
- Temporary Password: ${password}

Important: This is a temporary password. Please change it after your first login.

Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

If you did not expect this email, please contact your administrator.
    `;

    try {
      await this.transporter.sendMail({
        from: `"Academic Guide Training & Certification" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: 'Welcome to Academic Guide Training & Certification - Your Login Credentials',
        text: textContent,
        html: htmlContent
      });
      console.log(`Welcome email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, name: string, resetLink: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
          .button { display: inline-block; background: #0ea5e9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; }
          .link-box { background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 15px 0; word-break: break-all; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔐 Password Reset</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Academic Guide Training & Certification</p>
          </div>
          <div class="content">
            <h2 style="margin-top: 0;">Hello ${name},</h2>
            <p>We received a request to reset your password for your Academic Guide Training & Certification account.</p>
            <p>Click the button below to set a new password:</p>
            
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            
            <div class="link-box">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              ${resetLink}
            </div>
            
            <div class="warning">
              <strong>⏰ This link expires in 1 hour.</strong><br/>
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Academic Guide Training & Certification. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Password Reset - Academic Guide Training & Certification

Hello ${name},

We received a request to reset your password for your Academic Guide Training & Certification account.

Reset your password by visiting this link:
${resetLink}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Academic Guide Training & Certification
    `;

    try {
      await this.transporter.sendMail({
        from: `"Academic Guide Training & Certification" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: 'Password Reset - Academic Guide Training & Certification',
        text: textContent,
        html: htmlContent
      });
      console.log(`Password reset email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }
}
