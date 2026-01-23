import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto, VerifyOtpDto, SendOtpDto } from './dto';
import { OtpService } from './services/otp.service';
import { Role } from '@prisma/client';

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

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || Role.CLIENT,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email ?? '', user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
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

    const { otpCode, otpExpiry } = await this.otpService.generateOtp();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiry },
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

    if (user.otpCode !== otpCode) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email ?? '', user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async googleLogin(user: any) {
    if (!user) {
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

    const tokens = await this.generateTokens(dbUser.id, dbUser.email ?? '', dbUser.role);
    await this.updateRefreshToken(dbUser.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(dbUser),
      ...tokens,
    };
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
    const { password, refreshToken, otpCode, otpExpiry, ...sanitized } = user;
    return sanitized;
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
