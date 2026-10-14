import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretOrKey = config.get<string>('JWT_SECRET');
    if (!secretOrKey) throw new Error('JWT_SECRET est obligatoire pour démarrer l’API');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        mustChangePassword: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user?.isActive) throw new UnauthorizedException();
    const path = (request.originalUrl || request.url || '').split('?')[0];
    const allowedDuringPasswordChange = ['/auth/me', '/auth/change-password', '/auth/logout']
      .some((suffix) => path.endsWith(suffix));
    if (user.mustChangePassword && !allowedDuringPasswordChange) {
      throw new ForbiddenException('Changez votre mot de passe temporaire avant de continuer');
    }
    return user;
  }
}
