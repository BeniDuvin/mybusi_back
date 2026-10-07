import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepotDto, UpdateDepotDto, AssignUserToDepotDto, InviteMemberDto } from './dto';
import { Role, StoreMemberRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { OtpService } from '../auth/services/otp.service';

@Injectable()
export class DepotService {
  constructor(private prisma: PrismaService, private otpService: OtpService) {}

  /** Creates a tenant, its owner membership, and its initial trial atomically. */
  async create(dto: CreateDepotDto, userId: string) {
    const startsAt = new Date();
    const trialEndsAt = new Date(startsAt);
    const startDay = trialEndsAt.getDate();
    trialEndsAt.setDate(1);
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 3);
    const finalDayOfTrialMonth = new Date(
      trialEndsAt.getFullYear(),
      trialEndsAt.getMonth() + 1,
      0,
    ).getDate();
    trialEndsAt.setDate(Math.min(startDay, finalDayOfTrialMonth));
    return this.prisma.$transaction(async (tx) => {
      const store = await tx.depot.create({ data: { ...dto, ownerId: userId } });
      await tx.userDepot.create({
        data: { userId, depotId: store.id, role: StoreMemberRole.ADMINISTRATEUR },
      });
      await tx.subscription.create({
        data: {
          depotId: store.id,
          planCode: 'TRIAL',
          status: 'TRIAL',
          currentPeriodStart: startsAt,
          currentPeriodEnd: trialEndsAt,
        },
      });
      return store;
    });
  }

  async findAll(userId: string, page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = {
      users: { some: { userId, isActive: true } },
      ...(search
        ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
        : {}),
    };

    const [depots, total] = await Promise.all([
      this.prisma.depot.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              products: true,
              sales: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.depot.count({ where }),
    ]);

    return {
      data: depots,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    await this.assertMember(id, userId);
    const depot = await this.prisma.depot.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            sales: true,
            stocks: true,
          },
        },
      },
    });

    if (!depot) {
      throw new NotFoundException(`Depot with ID ${id} not found`);
    }

    return depot;
  }

  async update(id: string, dto: UpdateDepotDto, userId: string) {
    await this.assertOwner(id, userId);

    return this.prisma.depot.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    return this.prisma.depot.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getSubscription(id: string, userId: string) {
    await this.assertMember(id, userId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { depotId: id },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    if (
      subscription &&
      ['TRIAL', 'ACTIVE', 'GRACE_PERIOD'].includes(subscription.status) &&
      subscription.currentPeriodEnd <= new Date()
    ) {
      return { ...subscription, status: 'EXPIRED' as const };
    }
    return subscription;
  }

  async listMembers(id: string, userId: string) {
    await this.assertMember(id, userId);
    return this.prisma.userDepot.findMany({
      where: { depotId: id, isActive: true },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, emailVerified: true, mustChangePassword: true } }, customRole: true },
    });
  }

  private async assertMember(depotId: string, userId: string) {
    const member = await this.prisma.userDepot.findUnique({
      where: { userId_depotId: { userId, depotId } },
      select: { isActive: true },
    });
    if (!member?.isActive) throw new NotFoundException('Boutique introuvable');
  }

  private async assertOwner(depotId: string, userId: string) {
    const store = await this.prisma.depot.findFirst({ where: { id: depotId, ownerId: userId } });
    if (!store) throw new ForbiddenException('Action réservée au propriétaire de la boutique');
  }

  /** Creates or links an account, assigns its store role, and sends mailbox verification. */
  async inviteMember(depotId: string, dto: InviteMemberDto, requesterId: string) {
    await this.assertOwner(depotId, requesterId);
    const email = dto.email.trim().toLowerCase();
    const store = await this.prisma.depot.findUnique({ where: { id: depotId }, select: { id: true, name: true } });
    if (!store) throw new NotFoundException('Boutique introuvable');

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const membership = await this.prisma.userDepot.findUnique({ where: { userId_depotId: { userId: existingUser.id, depotId } } });
      if (membership?.isActive) throw new ConflictException('Cette adresse est déjà membre de la boutique');
    }

    const verificationCode = existingUser?.emailVerified ? undefined : randomInt(100000, 1000000).toString();
    let userId = existingUser?.id;
    let isNewAccount = false;

    if (existingUser) {
      if (verificationCode) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { emailOtpHash: await bcrypt.hash(verificationCode, 12), emailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000), emailOtpAttempts: 0 },
        });
      }
      await this.prisma.userDepot.upsert({
        where: { userId_depotId: { userId: existingUser.id, depotId } },
        update: { isActive: true, role: dto.role || StoreMemberRole.VENDEUR },
        create: { userId: existingUser.id, depotId, role: dto.role || StoreMemberRole.VENDEUR },
      });
    } else {
      const localName = email.split('@')[0].replace(/[._-]+/g, ' ').slice(0, 80) || 'Membre';
      const firstName = dto.firstName?.trim().slice(0, 80) || localName;
      const lastName = dto.lastName?.trim().slice(0, 80) || 'Membre';
      const temporaryPassword = 'azerty@';
      const password = await bcrypt.hash(temporaryPassword, 12);
      const emailOtpHash = await bcrypt.hash(verificationCode!, 12);
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email, password, firstName, lastName, role: Role.CLIENT,
            emailVerified: false, emailOtpHash,
            emailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
            emailOtpAttempts: 0, mustChangePassword: true,
          },
        });
        await tx.userDepot.create({ data: { userId: created.id, depotId, role: dto.role || StoreMemberRole.VENDEUR } });
        return created;
      });
      userId = user.id;
      isNewAccount = true;
    }

    try {
      await this.otpService.sendMemberInvitation({
        email, storeName: store.name, role: dto.role || StoreMemberRole.VENDEUR,
        verificationCode,
        temporaryPassword: isNewAccount ? 'azerty@' : undefined,
      });
    } catch (error) {
      console.error('Member invitation email delivery failed.', { name: error instanceof Error ? error.name : 'UnknownError' });
      await this.prisma.userDepot.updateMany({ where: { userId, depotId }, data: { isActive: false } });
      if (isNewAccount && userId) await this.prisma.user.delete({ where: { id: userId } });
      throw new InternalServerErrorException('Impossible d’envoyer l’invitation par e-mail');
    }

    return {
      message: isNewAccount
        ? 'Invitation envoyée. La personne doit vérifier son adresse puis remplacer le mot de passe temporaire.'
        : 'Invitation envoyée à cette adresse e-mail.',
      existingAccount: !isNewAccount,
    };
  }

  async assignUser(dto: AssignUserToDepotDto, requesterId: string) {
    const { userId, depotId } = dto;
    await this.assertOwner(depotId, requesterId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const depot = await this.prisma.depot.findUnique({ where: { id: depotId } });
    if (!depot) {
      throw new NotFoundException(`Depot with ID ${depotId} not found`);
    }

    return this.prisma.userDepot.upsert({
      where: { userId_depotId: { userId, depotId } },
      update: { isActive: true, role: dto.role || StoreMemberRole.VENDEUR },
      create: { userId, depotId, role: dto.role || StoreMemberRole.VENDEUR },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        depot: true,
      },
    });
  }

  async setMemberRole(depotId: string, userId: string, role: StoreMemberRole, requesterId: string) {
    await this.assertOwner(depotId, requesterId);
    const membership = await this.prisma.userDepot.findUnique({ where: { userId_depotId: { userId, depotId } } });
    if (!membership?.isActive) throw new NotFoundException('Membre introuvable');
    return this.prisma.userDepot.update({
      where: { userId_depotId: { userId, depotId } },
      data: { role },
      select: { userId: true, depotId: true, role: true, isActive: true },
    });
  }

  async removeUserFromDepot(userId: string, depotId: string, requesterId: string) {
    await this.assertOwner(depotId, requesterId);
    if (userId === requesterId) throw new ForbiddenException('Le propriétaire ne peut pas se retirer lui-même');
    const userDepot = await this.prisma.userDepot.findUnique({
      where: {
        userId_depotId: {
          userId,
          depotId,
        },
      },
    });

    if (!userDepot) {
      throw new NotFoundException(`Assignment not found`);
    }

    return this.prisma.userDepot.update({
      where: { userId_depotId: { userId, depotId } },
      data: { isActive: false },
    });
  }
}
