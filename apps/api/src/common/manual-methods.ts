/** How money recorded by staff arrived. The labels appear on receipts and in emails. */
export const MANUAL_METHODS: Record<string, { en: string; fr: string }> = {
  BANK_TRANSFER: { en: 'Bank transfer', fr: 'Virement bancaire' },
  CASH: { en: 'Cash at our office', fr: 'Espèces à notre bureau' },
  MOBILE_MONEY: { en: 'Mobile money to our number', fr: 'Mobile money sur notre numéro' },
  CHEQUE: { en: 'Cheque', fr: 'Chèque' },
  OTHER: { en: 'Other', fr: 'Autre' },
};
