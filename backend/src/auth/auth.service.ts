import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
      name: user.name,
      email: user.email
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      }
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email.toLowerCase().trim());
    
    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, message: 'If the email exists, a reset link has been sent.' };
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing tokens for this email
    await this.prisma.passwordResetToken.deleteMany({
      where: { email: user.email }
    });

    // Create new token
    await this.prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt
      }
    });

    // Send email with reset link
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const emailSent = await this.emailService.sendPasswordResetEmail(user.email, user.name, resetLink);
    
    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email);
      throw new BadRequestException('Unable to send reset email. Please try again later or contact support.');
    }

    return { success: true, message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    if (resetToken.used) {
      throw new BadRequestException('This reset link has already been used');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('This reset link has expired');
    }

    const user = await this.usersService.findByEmail(resetToken.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    return { success: true, message: 'Password has been reset successfully' };
  }

  async verifyResetToken(token: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      return { valid: false };
    }

    return { valid: true, email: resetToken.email };
  }
}
