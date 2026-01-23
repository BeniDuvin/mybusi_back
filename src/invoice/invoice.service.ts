import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf.service';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  async generateInvoice(saleId: string, format: 'A4' | '58mm' | '80mm' = 'A4') {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        client: true,
        depot: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!sale) {
      throw new Error('Sale not found');
    }

    const pdfBuffer = await this.pdfService.generateInvoicePDF(sale, format);

    await this.prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${sale.saleNumber}`,
        saleId: sale.id,
        type: 'SALE',
        format,
        content: pdfBuffer.toString('base64'),
      },
    });

    return pdfBuffer;
  }

  async getInvoice(invoiceNumber: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return Buffer.from(invoice.content, 'base64');
  }
}
