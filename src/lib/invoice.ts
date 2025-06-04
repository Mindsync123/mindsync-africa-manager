export interface InvoiceDetails {
  id: string;
  invoice_number: string;
  total_amount: number;
  amount_paid?: number;
  due_date: string;
  status: string;
  customers?: { name: string; phone?: string | null };
}

export const generateInvoiceText = (invoice: InvoiceDetails) => {
  const remaining = Number(invoice.total_amount) - (Number(invoice.amount_paid) || 0);
  const lines = [
    `INVOICE ${invoice.invoice_number}`,
    `Customer: ${invoice.customers?.name || 'N/A'}`,
    `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`,
    `Status: ${invoice.status.replace('_', ' ')}`,
    `Total Amount: ₦${Number(invoice.total_amount).toLocaleString()}`,
  ];
  if (invoice.amount_paid) {
    lines.push(`Amount Paid: ₦${Number(invoice.amount_paid).toLocaleString()}`);
  }
  if (remaining > 0) {
    lines.push(`Remaining: ₦${remaining.toLocaleString()}`);
  }
  return lines.join('\n');
};
