import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoreContextGuard } from './store-context.guard';

describe('StoreContextGuard', () => {
  const request = (overrides: Record<string, any> = {}) => ({
    originalUrl: '/api/v1/products/product-a',
    method: 'GET',
    params: { id: 'product-a' },
    query: {},
    body: {},
    user: { id: 'user-a' },
    ...overrides,
  });

  const context = (req: any) => ({ switchToHttp: () => ({ getRequest: () => req }) }) as any;

  it('hides a resource when the caller is not a member of its store', async () => {
    const prisma: any = {
      product: { findUnique: jest.fn().mockResolvedValue({ depotId: 'store-a' }) },
      userDepot: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const guard = new StoreContextGuard(prisma);

    await expect(guard.canActivate(context(request()))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an ID from another store even if the caller provides a permitted store ID', async () => {
    const prisma: any = {
      product: { findUnique: jest.fn().mockResolvedValue({ depotId: 'store-a' }) },
    };
    const guard = new StoreContextGuard(prisma);
    const req = request({ query: { depotId: 'store-b' } });

    await expect(guard.canActivate(context(req))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks writes after a store trial expires while keeping the store readable', async () => {
    const prisma: any = {
      product: { findUnique: jest.fn().mockResolvedValue({ depotId: 'store-a' }) },
      userDepot: { findUnique: jest.fn().mockResolvedValue({ isActive: true, role: 'ADMINISTRATEUR', depot: { isActive: true } }) },
      subscription: { findUnique: jest.fn().mockResolvedValue({ status: 'TRIAL', currentPeriodEnd: new Date(0) }) },
    };
    const guard = new StoreContextGuard(prisma);
    const req = request({ originalUrl: '/api/v1/products', method: 'POST', params: {}, body: { depotId: 'store-a' } });

    await expect(guard.canActivate(context(req))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
