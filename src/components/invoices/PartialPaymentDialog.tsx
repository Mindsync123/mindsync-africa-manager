
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface PartialPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    total_amount: number;
    amount_paid?: number;
  };
  onPaymentRecorded: () => void;
}

export const PartialPaymentDialog = ({ open, onOpenChange, invoice, onPaymentRecorded }: PartialPaymentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const remainingAmount = Number(invoice.total_amount) - (Number(invoice.amount_paid) || 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const paymentAmount = Number(amountPaid);
      
      if (paymentAmount <= 0 || paymentAmount > remainingAmount) {
        throw new Error('Invalid payment amount');
      }

      // Record the payment
      const { error: paymentError } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: invoice.id,
          amount_paid: paymentAmount,
          payment_method: paymentMethod
        });

      if (paymentError) throw paymentError;

      // Update the invoice
      const newAmountPaid = (Number(invoice.amount_paid) || 0) + paymentAmount;
      const newStatus = newAmountPaid >= Number(invoice.total_amount) ? 'paid' : 'part_paid';

      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ 
          amount_paid: newAmountPaid,
          status: newStatus
        })
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      toast({
        title: "Payment Recorded",
        description: `Payment of ₦${paymentAmount.toLocaleString()} has been recorded.`
      });

      onPaymentRecorded();
      onOpenChange(false);
      setAmountPaid('');
      setPaymentMethod('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Partial Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Invoice Total: ₦{Number(invoice.total_amount).toLocaleString()}</Label>
              <Label>Already Paid: ₦{(Number(invoice.amount_paid) || 0).toLocaleString()}</Label>
              <Label>Remaining: ₦{remainingAmount.toLocaleString()}</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amountPaid">Payment Amount *</Label>
              <Input 
                id="amountPaid" 
                type="number"
                step="0.01"
                max={remainingAmount}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
