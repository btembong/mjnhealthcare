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
      const doc = new PDFDocument({ margin: 60, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const INK    = '#0D0D0D';   // near-black for primary text
      const MUTED  = '#6B7280';   // secondary labels
      const RULE   = '#D1D5DB';   // thin divider lines
      const L      = 60;          // left margin
      const R      = doc.page.width - 60; // right margin
      const W      = R - L;       // usable width

      const REG_NUMBER  = process.env.COMPANY_REG_NUMBER  ?? 'M032517649867P/RC/YAO/2025/B/637';
      const SOCIAL      = '@mjnhealthcare';

      // Truncate helper — prevents line wrapping which causes auto-page-adds
      const trunc = (str: string, max: number) =>
        str.length > max ? str.slice(0, max - 1) + '…' : str;

      // ── Header ───────────────────────────────────────────────────────────
      doc.fillColor(INK).fontSize(15).font('Helvetica-Bold')
        .text('MJN Healthcare', L, 52);
      doc.fillColor(MUTED).fontSize(8.5).font('Helvetica')
        .text('Academy and Professional Services Ltd', L, 71);

      // RECEIPT label — right aligned
      doc.fillColor(INK).fontSize(20).font('Helvetica-Bold')
        .text('RECEIPT', L, 50, { width: W, align: 'right' });

      const refNum = snapshot.receiptId ?? snapshot.orderId;
      doc.fillColor(MUTED).fontSize(8).font('Helvetica')
        .text(`No. ${refNum}`, L, 74, { width: W, align: 'right' });

      // Full-width rule under header
      const headerRuleY = 90;
      doc.moveTo(L, headerRuleY).lineTo(R, headerRuleY)
        .strokeColor(INK).lineWidth(1.2).stroke();

      // ── Meta row ─────────────────────────────────────────────────────────
      const metaY = 104;
      const col2  = L + 200;
      const col3  = L + 380;

      doc.fillColor(MUTED).fontSize(7).font('Helvetica')
        .text('ISSUED TO', L, metaY)
        .text('DATE ISSUED', col2, metaY)
        .text('ORDER REFERENCE', col3, metaY);

      const issuedDate = new Date(snapshot.issuedAt).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      doc.fillColor(INK).fontSize(9.5).font('Helvetica-Bold')
        .text(snapshot.person.name, L, metaY + 12);
      doc.fillColor(MUTED).fontSize(8).font('Helvetica')
        .text(snapshot.person.email, L, metaY + 25);

      doc.fillColor(INK).fontSize(9.5).font('Helvetica-Bold')
        .text(issuedDate, col2, metaY + 12);

      doc.fillColor(INK).fontSize(8.5).font('Helvetica')
        .text(snapshot.orderId, col3, metaY + 12, { width: R - col3 });

      // Thin rule after meta
      const metaRuleY = metaY + 44;
      doc.moveTo(L, metaRuleY).lineTo(R, metaRuleY)
        .strokeColor(RULE).lineWidth(0.5).stroke();

      // ── Line items table ─────────────────────────────────────────────────
      let y = metaRuleY + 12;

      doc.fillColor(MUTED).fontSize(7).font('Helvetica-Bold')
        .text('DESCRIPTION', L, y)
        .text('CATEGORY', L + 300, y)
        .text('AMOUNT (USD)', L, y, { width: W, align: 'right' });

      y += 11;
      doc.moveTo(L, y).lineTo(R, y).strokeColor(INK).lineWidth(0.6).stroke();
      y += 8;

      for (const item of snapshot.lineItems) {
        doc.fillColor(INK).fontSize(8.5).font('Helvetica')
          .text(trunc(item.name, 52), L, y, { width: 285, lineBreak: false });

        doc.fillColor(MUTED).fontSize(8).font('Helvetica')
          .text(trunc(item.category || '—', 18), L + 300, y, { width: 100, lineBreak: false });

        doc.fillColor(INK).fontSize(8.5).font('Helvetica')
          .text(`$${Number(item.priceCharged).toFixed(2)}`, L, y, { width: W, align: 'right', lineBreak: false });

        y += 17;

        doc.moveTo(L, y - 3).lineTo(R, y - 3)
          .strokeColor(RULE).lineWidth(0.4).stroke();
      }

      // ── Totals ───────────────────────────────────────────────────────────
      y += 8;
      const totW = 180;
      const totX = R - totW;

      const drawTotalRow = (label: string, value: string, bold = false) => {
        doc.fillColor(MUTED).fontSize(8.5).font('Helvetica')
          .text(label, totX, y);
        doc.fillColor(INK).fontSize(8.5).font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .text(value, totX, y, { width: totW, align: 'right' });
        y += 15;
      };

      drawTotalRow('Subtotal', `$${snapshot.subtotal.toFixed(2)}`);
      if (snapshot.taxAmount > 0) {
        drawTotalRow(`Tax (${(snapshot.taxRate * 100).toFixed(2)}%)`, `$${snapshot.taxAmount.toFixed(2)}`);
      }

      doc.moveTo(totX, y - 2).lineTo(R, y - 2).strokeColor(INK).lineWidth(0.6).stroke();
      y += 5;

      doc.fillColor(MUTED).fontSize(8.5).font('Helvetica-Bold').text('TOTAL DUE', totX, y);
      doc.fillColor(INK).fontSize(11).font('Helvetica-Bold')
        .text(`$${snapshot.total.toFixed(2)}`, totX, y - 1, { width: totW, align: 'right' });
      y += 18;

      if (snapshot.amountDueNow != null && snapshot.amountDueNow < snapshot.total) {
        drawTotalRow('Paid now', `$${snapshot.amountDueNow.toFixed(2)}`, true);
        drawTotalRow('Balance due later', `$${(snapshot.total - snapshot.amountDueNow).toFixed(2)}`);
      }

      // ── Payment note ─────────────────────────────────────────────────────
      y += 14;
      doc.moveTo(L, y).lineTo(R, y).strokeColor(RULE).lineWidth(0.5).stroke();
      y += 10;
      doc.fillColor(MUTED).fontSize(7.5).font('Helvetica')
        .text(
          'Payment processed securely. This receipt confirms receipt of funds by MJN Healthcare Academy and Professional Services Ltd. ' +
          'It does not constitute a guarantee of any exam result, visa outcome, or employment placement.',
          L, y, { width: W },
        );

      // ── Footer ───────────────────────────────────────────────────────────
      const footerY = doc.page.height - 76;

      doc.moveTo(L, footerY).lineTo(R, footerY)
        .strokeColor(INK).lineWidth(1).stroke();

      doc.fillColor(INK).fontSize(8).font('Helvetica-Bold')
        .text('MJN Healthcare Academy and Professional Services Ltd', L, footerY + 10, { continued: true })
        .font('Helvetica').fillColor(MUTED)
        .text(`   ·   Auth. No. ${REG_NUMBER}   ·   Yaoundé, Cameroon`);

      doc.fillColor(MUTED).fontSize(7.5).font('Helvetica')
        .text(
          `mjnhealthcare.com   ·   support@mjnhealthcare.com   ·   ${SOCIAL} (Instagram / Facebook / LinkedIn / X)`,
          L, footerY + 26, { width: W },
        );

      doc.fillColor(MUTED).fontSize(7).font('Helvetica')
        .text('Official receipt — retain for your records. Queries: support@mjnhealthcare.com', L, footerY + 42, { width: W });

      doc.end();
    });
  }
}
