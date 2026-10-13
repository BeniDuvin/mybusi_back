import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto, RegisterDto, VerifyOtpDto, SendOtpDto, ChangePasswordDto } from './dto';
import { OtpService } from './services/otp.service';
import { Role } from '@prisma/client';
import { createHash, randomBytes, randomInt, randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, phone, password, firstName, lastName, role } = dto;

    if (email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    if (dto.confirmPassword !== password) throw new BadRequestException('Les mots de passe ne correspondent pas');
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role: Role.CLIENT,
      },
    });

    if (email) {
      await this.issueEmailOtp(user.id, email, 'verification');
      return { message: 'Compte créé. Vérifiez votre adresse email avec le code envoyé.' };
    }
    const tokens = await this.generateTokens(user.id, user.email ?? '', user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const { email, phone, password } = dto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.emailOtpHash) {
      throw new UnauthorizedException('Veuillez vérifier votre adresse email avant de vous connecter');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user.id, user.email ?? '', user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /** Verifies a short lived email code and only then issues a session. */
  async verifyEmail(dto: { email: string; otpCode: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.emailOtpHash || !user.emailOtpExpiry || user.emailVerified) {
      throw new UnauthorizedException('Code invalide ou expiré');
    }
    if (user.emailOtpExpiry <= new Date() || user.emailOtpAttempts >= 5) {
      throw new UnauthorizedException('Code invalide ou expiré');
    }
    const valid = await bcrypt.compare(dto.otpCode, user.emailOtpHash);
    if (!valid) {
      await this.prisma.user.update({ where: { id: user.id }, data: { emailOtpAttempts: { increment: 1 } } });
      throw new UnauthorizedException('Code invalide ou expiré');
    }
    const verified = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailOtpHash: null, emailOtpExpiry: null, emailOtpAttempts: 0 },
    });
    const tokens = await this.generateTokens(verified.id, verified.email ?? '', verified.role);
    await this.updateRefreshToken(verified.id, tokens.refreshToken);
    return { user: this.sanitizeUser(verified), ...tokens };
  }

  async resendEmailOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) return { message: 'Si ce compte peut être vérifié, un code sera envoyé.' };
    if (user.emailOtpExpiry && user.emailOtpExpiry.getTime() - Date.now() > 9 * 60 * 1000) {
      throw new BadRequestException('Veuillez patienter avant de demander un nouveau code');
    }
    await this.issueEmailOtp(user.id, email, 'verification');
    return { message: 'Un nouveau code a été envoyé.' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user?.email) await this.issueEmailOtp(user.id, email, 'password-reset');
    return { message: 'Si cette adresse correspond à un compte, un code de réinitialisation sera envoyé.' };
  }

  async resetPassword(dto: { email: string; otpCode: string; newPassword: string; confirmPassword: string }) {
    if (dto.newPassword !== dto.confirmPassword) throw new BadRequestException('Les mots de passe ne correspondent pas');
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordResetOtpHash || !user.passwordResetOtpExpiry || user.passwordResetOtpExpiry <= new Date() || user.passwordResetOtpAttempts >= 5) {
      throw new UnauthorizedException('Code invalide ou expiré');
    }
    if (!(await bcrypt.compare(dto.otpCode, user.passwordResetOtpHash))) {
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordResetOtpAttempts: { increment: 1 } } });
      throw new UnauthorizedException('Code invalide ou expiré');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(dto.newPassword, 12),
        mustChangePassword: false,
        refreshToken: null,
        passwordResetOtpHash: null,
        passwordResetOtpExpiry: null,
        passwordResetOtpAttempts: 0,
      },
    });
    return { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' };
  }

  private async issueEmailOtp(userId: string, email: string, purpose: 'verification' | 'password-reset') {
    const code = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(code, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    if (purpose === 'verification') {
      await this.prisma.user.update({ where: { id: userId }, data: { emailOtpHash: otpHash, emailOtpExpiry: expiresAt, emailOtpAttempts: 0 } });
    } else {
      await this.prisma.user.update({ where: { id: userId }, data: { passwordResetOtpHash: otpHash, passwordResetOtpExpiry: expiresAt, passwordResetOtpAttempts: 0 } });
    }
    await this.otpService.sendEmailOtp(email, code, purpose);
  }

  async sendOtp(dto: SendOtpDto) {
    const { phone } = dto;

    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          firstName: 'User',
          lastName: phone,
          role: Role.CLIENT,
        },
      });
    }

    if (user.otpExpiry && user.otpExpiry.getTime() - Date.now() > 4 * 60 * 1000) {
      throw new BadRequestException('Veuillez patienter avant de demander un nouveau code');
    }

    const { otpCode, otpExpiry } = await this.otpService.generateOtp();
    const otpHash = await bcrypt.hash(otpCode, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otpHash, otpExpiry, otpAttempts: 0 },
    });

    await this.otpService.sendOtp(phone, otpCode);

    return {
      message: 'OTP sent successfully',
      expiresIn: '5 minutes',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, otpCode } = dto;

    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user || !user.otpCode || !user.otpExpiry) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (new Date() > user.otpExpiry) {
      throw new UnauthorizedException('OTP expired');
    }

    if (user.otpAttempts >= 5) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!(await bcrypt.compare(otpCode, user.otpCode))) {
      await this.prisma.user.update({ where: { id: user.id }, data: { otpAttempts: { increment: 1 } } });
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        otpCode: null,
        otpExpiry: null,
        otpAttempts: 0,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email ?? '', user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async googleLogin(user: any, issueTokens = true) {
    if (!user || !user.email || user.emailVerified !== true) {
      throw new UnauthorizedException('Google authentication failed');
    }

    let dbUser = await this.prisma.user.findUnique({
      where: { googleId: user.googleId },
    });

    if (!dbUser && user.email) {
      dbUser = await this.prisma.user.findUnique({
        where: { email: user.email },
      });
    }

    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          googleId: user.googleId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: true,
          role: Role.CLIENT,
        },
      });
    } else if (!dbUser.googleId) {
      dbUser = await this.prisma.user.update({
        where: { id: dbUser.id },
        data: { googleId: user.googleId, emailVerified: true },
      });
    }

    const safeUser = this.sanitizeUser(dbUser);
    if (!issueTokens) return { user: safeUser };
    const tokens = await this.generateTokens(dbUser.id, dbUser.email ?? '', dbUser.role);
    await this.updateRefreshToken(dbUser.id, tokens.refreshToken);
    return { user: safeUser, ...tokens };
  }

  /** Issues a short-lived, single-use code so native apps never receive tokens in a URL. */
  async createGoogleExchangeCode(user: any): Promise<string> {
    const session = await this.googleLogin(user, false);
    await this.prisma.$executeRaw`DELETE FROM "OAuthExchangeCode" WHERE "expiresAt" <= ${new Date()}`;
    const code = randomBytes(32).toString('base64url');
    const codeHash = createHash('sha256').update(code).digest('hex');
    await this.prisma.$executeRaw`
      INSERT INTO "OAuthExchangeCode" ("id", "codeHash", "userId", "expiresAt")
      VALUES (${randomUUID()}, ${codeHash}, ${session.user.id}, ${new Date(Date.now() + 5 * 60 * 1000)})
    `;
    return code;
  }

  /** Atomically consumes a Google handoff code and issues fresh app credentials. */
  async exchangeGoogleCode(code: string) {
    const codeHash = createHash('sha256').update(code).digest('hex');
    const records = await this.prisma.$queryRaw<Array<{ id: string; userId: string; expiresAt: Date }>>`
      SELECT "id", "userId", "expiresAt" FROM "OAuthExchangeCode" WHERE "codeHash" = ${codeHash} LIMIT 1
    `;
    const record = records[0];
    if (!record || record.expiresAt <= new Date()) {
      throw new UnauthorizedException('Code Google invalide ou expiré');
    }

    const consumed = await this.prisma.$executeRaw`
      DELETE FROM "OAuthExchangeCode"
      WHERE "id" = ${record.id} AND "codeHash" = ${codeHash} AND "expiresAt" > ${new Date()}
    `;
    if (consumed !== 1) throw new UnauthorizedException('Code Google déjà utilisé ou expiré');

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user?.isActive) throw new UnauthorizedException('Compte indisponible');
    const tokens = await this.generateTokens(user.id, user.email ?? '', user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user.id, user.email ?? '', user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.password) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    if (!user.mustChangePassword) {
      const isCurrentValid = dto.currentPassword
        ? await bcrypt.compare(dto.currentPassword, user.password)
        : false;
      if (!isCurrentValid) throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        refreshToken: user.mustChangePassword ? user.refreshToken : null,
      },
    });

    return { message: 'Mot de passe modifié avec succès' };
  }

  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, { expiresIn: '30d' }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  private sanitizeUser(user: any) {
    const {
      password,
      refreshToken,
      otpCode,
      otpExpiry,
      otpAttempts,
      emailOtpHash,
      emailOtpExpiry,
      emailOtpAttempts,
      passwordResetOtpHash,
      passwordResetOtpExpiry,
      passwordResetOtpAttempts,
      ...sanitized
    } = user;
    return sanitized;
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
