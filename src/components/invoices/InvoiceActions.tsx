
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Send, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InvoiceViewDialog } from './InvoiceViewDialog';
import { EditInvoiceDialog } from './EditInvoiceDialog';
import { PartialPaymentDialog } from './PartialPaymentDialog';

interface InvoiceActionsProps {
  invoice: {
    id: string;
    invoice_number: string;
    total_amount: number;
    amount_paid?: number;
    due_date: string;
    status: string;
    customers?: { name: string };
  };
  onInvoiceUpdated: () => void;
}

export const InvoiceActions = ({ invoice, onInvoiceUpdated }: InvoiceActionsProps) => {
  const { toast } = useToast();
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleShare = () => {
    const shareText = `Invoice ${invoice.invoice_number}\nAmount: ₦${Number(invoice.total_amount).toLocaleString()}\nDue Date: ${new Date(invoice.due_date).toLocaleDateString()}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoice.invoice_number}`,
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Invoice Details Copied",
        description: "Invoice details have been copied to clipboard."
      });
    }
  };

  const handleDownload = () => {
    toast({
      title: "Download Feature",
      description: "PDF download feature will be implemented soon."
    });
  };

  const handlePartialPayment = () => {
    setShowPaymentDialog(true);
  };

  return (
    <div className="flex space-x-2">
      <Button variant="ghost" size="sm" onClick={() => setShowViewDialog(true)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setShowEditDialog(true)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleShare}>
        <Send className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4" />
      </Button>
      {invoice.status !== 'paid' && (
        <Button variant="outline" size="sm" onClick={handlePartialPayment}>
          Pay
        </Button>
      )}

      <InvoiceViewDialog 
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        invoice={invoice}
      />

      <EditInvoiceDialog 
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        invoice={invoice}
        onInvoiceUpdated={onInvoiceUpdated}
      />

      <PartialPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoice={invoice}
        onPaymentUpdated={onInvoiceUpdated}
      />
    </div>
  );
};
