import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepotDto, UpdateDepotDto, AssignUserToDepotDto } from './dto';

@Injectable()
export class DepotService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepotDto) {
    return this.prisma.depot.create({
      data: dto,
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

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

  async findOne(id: string) {
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

  async update(id: string, dto: UpdateDepotDto) {
    await this.findOne(id);

    return this.prisma.depot.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.depot.delete({
      where: { id },
    });
  }

  async assignUser(dto: AssignUserToDepotDto) {
    const { userId, depotId } = dto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const depot = await this.prisma.depot.findUnique({ where: { id: depotId } });
    if (!depot) {
      throw new NotFoundException(`Depot with ID ${depotId} not found`);
    }

    return this.prisma.userDepot.create({
      data: {
        userId,
        depotId,
      },
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

  async removeUserFromDepot(userId: string, depotId: string) {
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

    return this.prisma.userDepot.delete({
      where: {
        userId_depotId: {
          userId,
          depotId,
        },
      },
    });
  }
}
