import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generate, generateSecret, generateURI, verify, } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { env } from '@notifyiq/config';
import { SuperAdmin, SuperAdminDocument } from '../../database/schemas/super-admin.schema.js';
import { AdminSession, AdminSessionDocument } from '../../database/schemas/admin-session.schema.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import { Verify2FaDto } from './dto/verify-2fa.dto.js';

// const authenticator = (otplib as any).authenticator || (otplib as any).default?.authenticator || otplib;

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(SuperAdmin.name) private superAdminModel: Model<SuperAdminDocument>,
    @InjectModel(AdminSession.name) private sessionModel: Model<AdminSessionDocument>,
  ) { }

  async login(dto: AdminLoginDto, ipAddress?: string, userAgent?: string) {
    const admin = await this.superAdminModel.findOne({ email: dto.email.toLowerCase() });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    if (admin.lockoutUntil && new Date(admin.lockoutUntil) > new Date()) {
      throw new UnauthorizedException('Account locked due to multiple failed login attempts');
    }

    if (dto.password) {
      const isMatch = await bcrypt.compare(dto.password, admin.passwordHash);
      if (!isMatch) {
        admin.failedLoginAttempts += 1;
        if (admin.failedLoginAttempts >= 5) {
          admin.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lockout
        }
        await admin.save();
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // Reset failed attempts on successful password verification
    admin.failedLoginAttempts = 0;
    await admin.save();

    const secret = (env as any).ADMIN_JWT_SECRET || env.JWT_SECRET;

    // Step 1: If 2FA is enabled, issue short-lived challenge token
    if (admin.isTotpEnabled && admin.totpSecret) {
      const challengeToken = jwt.sign(
        { superAdminId: (admin._id as any).toString(), step: '2fa_required', aud: 'admin-portal' },
        secret,
        { expiresIn: '5m' }
      );

      return {
        requires2FA: true,
        challengeToken,
        email: admin.email,
      };
    }

    // If 2FA is not yet set up, return indicator for first-time TOTP setup
    const challengeToken = jwt.sign(
      { superAdminId: (admin._id as any).toString(), step: '2fa_setup_required', aud: 'admin-portal' },
      secret,
      { expiresIn: '10m' }
    );

    return {
      requires2FASetup: true,
      challengeToken,
      email: admin.email,
    };
  }

  async verify2FA(dto: Verify2FaDto, ipAddress?: string, userAgent?: string) {
    const secret = (env as any).ADMIN_JWT_SECRET || env.JWT_SECRET;
    let decoded: any;

    try {
      decoded = jwt.verify(dto.challengeToken, secret);
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA challenge token');
    }

    if (decoded.aud !== 'admin-portal') {
      throw new UnauthorizedException('Invalid challenge token audience');
    }

    const admin = await this.superAdminModel.findById(decoded.superAdminId);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('SuperAdmin not found or deactivated');
    }

    // Verify TOTP code or Backup code
    let isValidCode = false;

    if (admin.totpSecret || admin.pendingTotpSecret) {
      const isValid = await verify({ token: dto.code, secret: admin.totpSecret || admin.pendingTotpSecret || "" });
      isValidCode = isValid.valid;
    }

    // Check backup codes if TOTP fails
    if (!isValidCode && admin.backupCodes && admin.backupCodes.length > 0) {
      for (let i = 0; i < admin.backupCodes.length; i++) {
        const match = await bcrypt.compare(dto.code, admin.backupCodes[i]);
        if (match) {
          isValidCode = true;
          // Consume used backup code
          admin.backupCodes.splice(i, 1);
          await admin.save();
          break;
        }
      }
    }

    if (!isValidCode) {
      throw new UnauthorizedException('Invalid 2FA authentication code');
    }

    admin.lastLoginAt = new Date();
    admin.totpSecret = admin.pendingTotpSecret;
    admin.pendingTotpSecret = null;
    admin.pendingTotpSetupExpiresAt = null;
    admin.pendingBackupCodes = null;
    admin.isTotpEnabled = true;
    await admin.save();

    // Mint Admin Access Token
    const accessToken = jwt.sign(
      {
        superAdminId: (admin._id as any).toString(),
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
        aud: 'admin-portal',
      },
      secret,
      { expiresIn: '8h' }
    );

    // Save session in DB
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    await this.sessionModel.create({
      superAdminId: admin._id as any,
      tokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      lastActivityAt: new Date(),
      isValid: true,
    });

    return {
      accessToken,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
        forcePasswordReset: admin.forcePasswordReset,
      },
    };
  }

  async setup2FA(challengeToken: string) {
    const secret = (env as any).ADMIN_JWT_SECRET || env.JWT_SECRET;

    let decoded: any;

    try {
      decoded = jwt.verify(challengeToken, secret);
    } catch {
      throw new UnauthorizedException('Invalid 2FA setup token');
    }

    const adminId = decoded.superAdminId;

    // ---------------------------------------------------------
    // 1. Check current state
    // ---------------------------------------------------------

    const admin = await this.superAdminModel.findById(adminId);

    if (!admin) {
      throw new NotFoundException('SuperAdmin not found');
    }

    // 2FA is already completely configured.
    if (admin.isTotpEnabled && admin.totpSecret) {
      throw new ConflictException('2FA is already enabled');
    }

    // ---------------------------------------------------------
    // 2. If setup is already in progress, return the existing
    //    setup instead of generating a new secret.
    // ---------------------------------------------------------

    if (admin.pendingTotpSecret) {
      const issuer = 'NotifyIQ Admin';

      const otpauthUrl = generateURI({
        label: admin.email,
        issuer,
        secret: admin.pendingTotpSecret,
      });

      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      return {
        secret: admin.pendingTotpSecret,
        qrCode: qrCodeDataUrl,
        backupCodes: admin.pendingBackupCodes ?? [],
      };
    }

    // ---------------------------------------------------------
    // 3. Generate a new setup
    // ---------------------------------------------------------

    const totpSecret = generateSecret();

    const issuer = 'NotifyIQ Admin';

    const otpauthUrl = generateURI({
      label: admin.email,
      issuer,
      secret: totpSecret,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // ---------------------------------------------------------
    // 4. Generate backup codes
    // ---------------------------------------------------------

    const rawBackupCodes = Array.from(
      { length: 8 },
      () => crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    const hashedBackupCodes = await Promise.all(
      rawBackupCodes.map((code) => bcrypt.hash(code, 10)),
    );

    // ---------------------------------------------------------
    // 5. IMPORTANT:
    //
    // Atomically claim the setup.
    //
    // Only the request that sees:
    //
    // pendingTotpSecret doesn't exist
    //
    // can write the setup.
    // ---------------------------------------------------------

    const updatedAdmin = await this.superAdminModel.findOneAndUpdate(
      {
        _id: adminId,
        isTotpEnabled: false,
        pendingTotpSecret: null,
      },
      {
        $set: {
          pendingTotpSecret: totpSecret,
          pendingBackupCodes: hashedBackupCodes,
          pendingTotpSetupExpiresAt: new Date(
            Date.now() + 10 * 60 * 1000,
          ),
        },
      },
      {
        new: true,
      },
    );

    // ---------------------------------------------------------
    // 6. Another concurrent request won the race.
    //
    // Don't return an error to the frontend.
    // Fetch the setup that actually won and return it.
    // ---------------------------------------------------------
    console.log("adminid: ", adminId, updatedAdmin);
    if (!updatedAdmin) {
      const existingAdmin = await this.superAdminModel.findById(adminId);

      if (!existingAdmin) {
        throw new NotFoundException('SuperAdmin not found');
      }

      if (existingAdmin.isTotpEnabled) {
        throw new ConflictException('2FA is already enabled');
      }

      if (!existingAdmin.pendingTotpSecret) {
        throw new ConflictException(
          'Unable to initialize 2FA setup',
        );
      }

      const existingOtpauthUrl = generateURI({
        label: existingAdmin.email,
        issuer,
        secret: existingAdmin.pendingTotpSecret,
      });

      const existingQrCodeDataUrl =
        await QRCode.toDataURL(existingOtpauthUrl);

      return {
        secret: existingAdmin.pendingTotpSecret,
        qrCode: existingQrCodeDataUrl,

        // IMPORTANT:
        // These are the backup codes belonging to the setup
        // that actually won the race.
        backupCodes: existingAdmin.pendingBackupCodes ?? [],
      };
    }

    // ---------------------------------------------------------
    // 7. We successfully created the setup.
    // ---------------------------------------------------------

    return {
      secret: totpSecret,
      qrCode: qrCodeDataUrl,
      backupCodes: rawBackupCodes,
    };
  }

  async logout(authHeader: string) {
    if (!authHeader) return { success: true };
    const token = authHeader.replace('Bearer ', '');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.sessionModel.updateOne({ tokenHash }, { isValid: false });
    return { success: true };
  }
}
