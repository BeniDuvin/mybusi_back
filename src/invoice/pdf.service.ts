import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

@Injectable()
export class PdfService {
  async generateInvoicePDF(saleData: any, format: 'A4' | '58mm' | '80mm' = 'A4'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        
        let doc: InstanceType<typeof PDFDocument>;
        
        if (format === 'A4') {
          doc = new PDFDocument({ size: 'A4', margin: 50 });
        } else if (format === '58mm') {
          doc = new PDFDocument({ size: [165, 841], margin: 10 });
        } else {
          doc = new PDFDocument({ size: [227, 841], margin: 10 });
        }

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        if (format === 'A4') {
          this.generateA4Invoice(doc, saleData);
        } else {
          this.generateThermalInvoice(doc, saleData, format);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateA4Invoice(doc: InstanceType<typeof PDFDocument>, saleData: any) {
    doc.fontSize(20).text('FACTURE DE VENTE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`N° Facture: ${saleData.saleNumber}`);
    doc.text(`Date: ${new Date(saleData.createdAt).toLocaleDateString('fr-FR')}`);
    doc.moveDown();

    if (saleData.depot) {
      doc.fontSize(14).text('Informations du dépôt:', { underline: true });
      doc.fontSize(10).text(`Nom: ${saleData.depot.name}`);
      doc.text(`Adresse: ${saleData.depot.address}`);
      doc.text(`Téléphone: ${saleData.depot.phone}`);
      doc.moveDown();
    }

    if (saleData.client) {
      doc.fontSize(14).text('Client:', { underline: true });
      doc.fontSize(10).text(`Nom: ${saleData.client.firstName} ${saleData.client.lastName}`);
      doc.text(`Téléphone: ${saleData.client.phone}`);
      doc.moveDown();
    }

    doc.fontSize(14).text('Détails de la vente:', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.fontSize(10);
    doc.text('Produit', 50, tableTop);
    doc.text('Qté', 300, tableTop);
    doc.text('P.U.', 360, tableTop);
    doc.text('Total', 450, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let yPosition = tableTop + 25;
    saleData.lines.forEach((line: any) => {
      doc.text(line.product.name, 50, yPosition);
      doc.text(line.quantity.toString(), 300, yPosition);
      doc.text(`${line.unitPrice} FCFA`, 360, yPosition);
      doc.text(`${line.totalPrice} FCFA`, 450, yPosition);
      yPosition += 20;
    });

    doc.moveDown();
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 20;

    if (saleData.discount > 0) {
      doc.text(`Remise: -${saleData.discount} FCFA`, 400, yPosition, { align: 'right' });
      yPosition += 20;
    }

    if (saleData.tax > 0) {
      doc.text(`Taxe: +${saleData.tax} FCFA`, 400, yPosition, { align: 'right' });
      yPosition += 20;
    }

    doc.fontSize(12).text(`TOTAL: ${saleData.totalAmount} FCFA`, 400, yPosition, { 
      align: 'right'
    }).font('Helvetica-Bold');

    yPosition += 20;
    doc.fontSize(10).text(`Montant payé: ${saleData.paidAmount} FCFA`, 400, yPosition, { align: 'right' });
    yPosition += 15;
    doc.text(`Reste à payer: ${saleData.remainingAmount} FCFA`, 400, yPosition, { align: 'right' });

    doc.moveDown(3);
    doc.fontSize(8).text('Merci pour votre achat!', { align: 'center' });
  }

  private generateThermalInvoice(doc: InstanceType<typeof PDFDocument>, saleData: any, format: '58mm' | '80mm') {
    const width = format === '58mm' ? 155 : 217;

    doc.fontSize(12).text('FACTURE', { align: 'center' }).font('Helvetica-Bold');
    doc.fontSize(8).text('='.repeat(30), { align: 'center' });
    doc.moveDown(0.3);

    doc.fontSize(8).text(`N°: ${saleData.saleNumber}`, { align: 'left' });
    doc.text(`Date: ${new Date(saleData.createdAt).toLocaleDateString('fr-FR')}`, { align: 'left' });
    doc.text('-'.repeat(30), { align: 'center' });
    doc.moveDown(0.3);

    if (saleData.depot) {
      doc.text(saleData.depot.name, { align: 'center' });
      doc.text(saleData.depot.phone, { align: 'center' });
      doc.text('-'.repeat(30), { align: 'center' });
      doc.moveDown(0.3);
    }

    if (saleData.client) {
      doc.text(`Client: ${saleData.client.firstName} ${saleData.client.lastName}`);
      doc.text(`Tel: ${saleData.client.phone}`);
      doc.text('-'.repeat(30), { align: 'center' });
      doc.moveDown(0.3);
    }

    saleData.lines.forEach((line: any) => {
      doc.text(line.product.name);
      doc.text(`  ${line.quantity} x ${line.unitPrice} = ${line.totalPrice} FCFA`);
    });

    doc.text('='.repeat(30), { align: 'center' });
    doc.moveDown(0.3);

    if (saleData.discount > 0) {
      doc.text(`Remise: -${saleData.discount} FCFA`);
    }

    doc.fontSize(10).text(`TOTAL: ${saleData.totalAmount} FCFA`).font('Helvetica-Bold');
    doc.fontSize(8).text(`Payé: ${saleData.paidAmount} FCFA`);
    doc.text(`Reste: ${saleData.remainingAmount} FCFA`);

    doc.moveDown(0.5);
    doc.text('='.repeat(30), { align: 'center' });
    doc.fontSize(7).text('Merci pour votre achat!', { align: 'center' });
  }
}
