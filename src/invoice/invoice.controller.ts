import { Controller, Get, Param, Query, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get('generate/:saleId')
  @Roles(Role.ADMIN, Role.GERANT, Role.CAISSIER)
  @ApiOperation({ summary: 'Generate invoice for a sale' })
  @ApiQuery({ name: 'format', required: false, enum: ['A4', '58mm', '80mm'] })
  async generateInvoice(
    @Param('saleId') saleId: string,
    @Query('format') format: 'A4' | '58mm' | '80mm' = 'A4',
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.invoiceService.generateInvoice(saleId, format);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${saleId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get(':invoiceNumber')
  @ApiOperation({ summary: 'Get an existing invoice' })
  async getInvoice(@Param('invoiceNumber') invoiceNumber: string, @Res() res: Response) {
    const pdfBuffer = await this.invoiceService.getInvoice(invoiceNumber);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${invoiceNumber}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
