import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

type AuthenticatedRequest = Request & { user: { id: string }; storeId?: string };

/** Resolves every inventory route to one tenant before its existing service runs. */
@Injectable()
export class StoreContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const url = request.originalUrl.split('?')[0];
    let storeId = this.asString(request.params.depotId) || this.asString(request.query.depotId) || this.asString(request.body?.depotId);
    let resolvedStoreId: string | undefined;
    const resourceId = this.asString(request.params.id);

    if (resourceId) {
      if (url.includes('/products/')) resolvedStoreId = (await this.prisma.product.findUnique({ where: { id: resourceId }, select: { depotId: true } }))?.depotId;
      else if (url.includes('/sales/')) resolvedStoreId = (await this.prisma.sale.findUnique({ where: { id: resourceId }, select: { depotId: true } }))?.depotId;
      else if (url.includes('/purchases/')) resolvedStoreId = (await this.prisma.purchase.findUnique({ where: { id: resourceId }, select: { depotId: true } }))?.depotId;
      else if (url.includes('/expenses/')) resolvedStoreId = (await this.prisma.expense.findUnique({ where: { id: resourceId }, select: { depotId: true } }))?.depotId;
      else if (url.includes('/other-incomes/')) resolvedStoreId = (await this.prisma.otherIncome.findUnique({ where: { id: resourceId }, select: { depotId: true } }))?.depotId;
      else if (url.includes('/salaries/')) resolvedStoreId = (await this.prisma.salaryPayment.findUnique({ where: { id: resourceId }, select: { depotId: true } }))?.depotId || undefined;
      else if (url.includes('/clients/')) resolvedStoreId = (await this.prisma.client.findUnique({ where: { id: resourceId }, select: { depotId: true } }))?.depotId || undefined;
      else if (url.includes('/suppliers/')) resolvedStoreId = (await this.prisma.supplier.findUnique({ where: { id: resourceId }, select: { depotId: true } }))?.depotId || undefined;
      else if (url.includes('/payments/')) {
        const payment = await this.prisma.payment.findUnique({ where: { id: resourceId }, select: { sale: { select: { depotId: true } } } });
        resolvedStoreId = payment?.sale?.depotId;
      }
    }
    const productId = this.asString(request.params.productId) || this.asString(request.body?.productId);
    if (productId) {
      const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { depotId: true } });
      if (resolvedStoreId && product?.depotId !== resolvedStoreId) throw new NotFoundException('Ressource introuvable dans cette boutique');
      resolvedStoreId = product?.depotId || resolvedStoreId;
    }
    const saleId = this.asString(request.body?.saleId);
    const saleFilterId = saleId || this.asString(request.query.saleId);
    if (saleFilterId) {
      const sale = await this.prisma.sale.findUnique({ where: { id: saleFilterId }, select: { depotId: true } });
      if (resolvedStoreId && sale?.depotId !== resolvedStoreId) throw new NotFoundException('Ressource introuvable dans cette boutique');
      resolvedStoreId = sale?.depotId || resolvedStoreId;
    }
    const relatedPartyId = this.asString(request.body?.clientId) || this.asString(request.body?.supplierId);
    if (relatedPartyId) {
      const party = this.asString(request.body?.clientId)
        ? await this.prisma.client.findUnique({ where: { id: relatedPartyId }, select: { depotId: true } })
        : await this.prisma.supplier.findUnique({ where: { id: relatedPartyId }, select: { depotId: true } });
      if (resolvedStoreId && party?.depotId !== resolvedStoreId) throw new NotFoundException('Ressource introuvable dans cette boutique');
      resolvedStoreId = party?.depotId || resolvedStoreId;
    }
    const stockId = this.asString(request.params.stockId);
    if (stockId) {
      resolvedStoreId = (await this.prisma.stock.findUnique({ where: { id: stockId }, select: { depotId: true } }))?.depotId;
    }
    const invoiceSaleId = this.asString(request.params.saleId);
    if (invoiceSaleId) {
      resolvedStoreId = (await this.prisma.sale.findUnique({ where: { id: invoiceSaleId }, select: { depotId: true } }))?.depotId;
    }
    if (resolvedStoreId && storeId && resolvedStoreId !== storeId) throw new NotFoundException('Ressource introuvable dans cette boutique');
    storeId = resolvedStoreId || storeId;
    if (!storeId) throw new NotFoundException('Boutique introuvable');

    const member = await this.prisma.userDepot.findUnique({
      where: { userId_depotId: { userId: request.user.id, depotId: storeId } },
      select: { isActive: true, role: true, depot: { select: { isActive: true } } },
    });
    if (!member?.isActive || !member.depot.isActive) throw new NotFoundException('Boutique introuvable');

    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (isWrite && !this.hasWriteAccess(url, request.method, member.role)) {
      throw new ForbiddenException('Votre rôle ne permet pas cette opération dans cette boutique');
    }
    if (!isWrite && !this.hasReadAccess(url, member.role)) {
      throw new ForbiddenException('Votre rôle ne permet pas de consulter ces données');
    }

    const subscription = await this.prisma.subscription.findUnique({ where: { depotId: storeId } });
    const usable = subscription && ['TRIAL', 'ACTIVE'].includes(subscription.status) && subscription.currentPeriodEnd > new Date();
    if (isWrite && !usable) throw new ForbiddenException('L’abonnement de cette boutique ne permet plus cette opération');
    request.storeId = storeId;
    return true;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private hasWriteAccess(url: string, method: string, role: string) {
    if (role === 'ADMINISTRATEUR' || role === 'GERANT') return true;
    if (/\/sales(?:\/|$)|\/payments(?:\/|$)/.test(url)) return ['CAISSIER', 'VENDEUR'].includes(role);
    if (/\/clients(?:\/|$)/.test(url)) return ['CAISSIER', 'VENDEUR'].includes(role);
    if (/\/stock(?:\/|$)/.test(url)) return role === 'MAGASINIER';
    return false;
  }

  private hasReadAccess(url: string, role: string) {
    if (['ADMINISTRATEUR', 'GERANT'].includes(role)) return true;
    if (/\/finance(?:\/|$)|\/expenses(?:\/|$)|\/other-incomes(?:\/|$)|\/purchases(?:\/|$)|\/suppliers(?:\/|$)|\/logs(?:\/|$)|\/salaries(?:\/|$)/.test(url)) return false;
    return ['CAISSIER', 'VENDEUR', 'MAGASINIER'].includes(role);
  }
}
