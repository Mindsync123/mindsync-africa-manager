
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface InvoiceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    total_amount: number;
    due_date: string;
    status: string;
    customers?: { name: string };
    amount_paid?: number;
  };
}

export const InvoiceViewDialog = ({ open, onOpenChange, invoice }: InvoiceViewDialogProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'part_paid': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const remainingAmount = Number(invoice.total_amount) - (Number(invoice.amount_paid) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{invoice.invoice_number}</h2>
              <p className="text-gray-600">Customer: {invoice.customers?.name || 'No Customer'}</p>
            </div>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Invoice Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>{invoice.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Payment Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold">₦{Number(invoice.total_amount).toLocaleString()}</span>
                </div>
                {Number(invoice.amount_paid) > 0 && (
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="text-green-600">₦{(Number(invoice.amount_paid) || 0).toLocaleString()}</span>
                  </div>
                )}
                {remainingAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="text-red-600">₦{remainingAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="text-center text-sm text-gray-500">
            <p>This is a preview of your invoice. Use the edit button to make changes.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
