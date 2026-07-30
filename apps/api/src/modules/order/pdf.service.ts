import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  /**
   * Generates a receipt/invoice PDF from the stored receipt snapshot.
   * Returns a Buffer containing the PDF bytes.
   */
  generateReceiptPdf(snapshot: {
    orderId: string;
    receiptId?: string;
    issuedAt: string;
    person: { name: string; email: string };
    lineItems: { name: string; category: string; priceCharged: number }[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountDueNow?: number | null;
    paymentMode?: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const PRIMARY = '#0F4C81';
      const LIGHT   = '#F0F4F8';
      const MUTED   = '#6B7280';
      const pageW   = doc.page.width - 100; // usable width (margins 50 each side)

      // ── Header bar ───────────────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 80).fill(PRIMARY);
      doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
        .text('MJN Health Academy', 50, 25);
      doc.fillColor('white').fontSize(10).font('Helvetica')
        .text('and Professional Services', 50, 51);

      // Receipt label top-right
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
        .text('RECEIPT', doc.page.width - 110, 25)
        .font('Helvetica').fontSize(8)
        .text(`#${snapshot.receiptId ?? snapshot.orderId}`, doc.page.width - 110, 41);

      doc.moveDown(3);

      // ── Meta row ─────────────────────────────────────────────────────────
      const metaY = 100;
      doc.fillColor(MUTED).fontSize(8).font('Helvetica')
        .text('ISSUED TO', 50, metaY)
        .text('DATE', 250, metaY)
        .text('ORDER REF', 400, metaY);

      doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold')
        .text(snapshot.person.name, 50, metaY + 14)
        .font('Helvetica').fontSize(9)
        .text(snapshot.person.email, 50, metaY + 28);

      const issuedDate = new Date(snapshot.issuedAt).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold')
        .text(issuedDate, 250, metaY + 14);

      doc.fillColor('#111827').fontSize(9).font('Helvetica')
        .text(snapshot.orderId, 400, metaY + 14, { width: 145 });

      // ── Divider ──────────────────────────────────────────────────────────
      doc.moveTo(50, metaY + 55).lineTo(doc.page.width - 50, metaY + 55)
        .strokeColor('#E5E7EB').lineWidth(1).stroke();

      // ── Line items table ─────────────────────────────────────────────────
      let y = metaY + 70;

      // Table header
      doc.rect(50, y, pageW, 22).fill(LIGHT);
      doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold')
        .text('SERVICE', 58, y + 7)
        .text('CATEGORY', 300, y + 7)
        .text('AMOUNT', doc.page.width - 110, y + 7);

      y += 26;

      // Rows
      for (let i = 0; i < snapshot.lineItems.length; i++) {
        const item = snapshot.lineItems[i];
        const rowBg = i % 2 === 0 ? 'white' : '#FAFAFA';
        doc.rect(50, y, pageW, 22).fill(rowBg);

        doc.fillColor('#111827').fontSize(9).font('Helvetica')
          .text(item.name, 58, y + 7, { width: 235 })
          .text(item.category || '—', 300, y + 7, { width: 130 })
          .text(`$${Number(item.priceCharged).toFixed(2)}`, doc.page.width - 110, y + 7, { width: 60, align: 'right' });

        y += 22;
      }

      // ── Totals box ───────────────────────────────────────────────────────
      y += 12;
      const totalsX = doc.page.width - 220;
      const totalsW = 170;

      const addTotalRow = (label: string, value: string, bold = false, color = '#111827') => {
        doc.fillColor(MUTED).fontSize(9).font('Helvetica').text(label, totalsX, y);
        doc.fillColor(color).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .text(value, totalsX, y, { width: totalsW, align: 'right' });
        y += 16;
      };

      addTotalRow('Subtotal', `$${snapshot.subtotal.toFixed(2)}`);
      if (snapshot.taxAmount > 0) {
        addTotalRow(`Tax (${(snapshot.taxRate * 100).toFixed(0)}%)`, `$${snapshot.taxAmount.toFixed(2)}`);
      }

      doc.moveTo(totalsX, y).lineTo(totalsX + totalsW, y)
        .strokeColor('#E5E7EB').lineWidth(0.5).stroke();
      y += 6;

      addTotalRow('Total', `$${snapshot.total.toFixed(2)}`, true, PRIMARY);

      if (snapshot.amountDueNow != null && snapshot.amountDueNow < snapshot.total) {
        y += 4;
        doc.rect(totalsX - 8, y - 4, totalsW + 16, 26).fill('#EFF6FF');
        addTotalRow('Paid now', `$${snapshot.amountDueNow.toFixed(2)}`, true, PRIMARY);
        addTotalRow('Balance due later', `$${(snapshot.total - snapshot.amountDueNow).toFixed(2)}`, false, MUTED);
      }

      // ── Footer ───────────────────────────────────────────────────────────
      const footerY = doc.page.height - 80;
      doc.rect(0, footerY, doc.page.width, 80).fill(LIGHT);
      doc.fillColor(MUTED).fontSize(8).font('Helvetica')
        .text(
          'MJN Health Academy and Professional Services · mjnhealth.com · noreply@mjnhealth.com',
          50, footerY + 16, { align: 'center', width: doc.page.width - 100 },
        )
        .text(
          'This is an official receipt. Please retain it for your records. For queries contact support@mjnhealth.com',
          50, footerY + 32, { align: 'center', width: doc.page.width - 100 },
        );

      doc.end();
    });
  }
}
