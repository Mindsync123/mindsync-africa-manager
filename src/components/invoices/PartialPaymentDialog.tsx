
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
  onPaymentUpdated: () => void;
}

export const PartialPaymentDialog = ({ open, onOpenChange, invoice, onPaymentUpdated }: PartialPaymentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const remainingAmount = Number(invoice.total_amount) - Number(invoice.amount_paid || 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const amount = Number(paymentAmount);
      
      if (amount <= 0 || amount > remainingAmount) {
        throw new Error('Invalid payment amount');
      }

      // Record the payment
      const { error: paymentError } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: invoice.id,
          amount_paid: amount,
          payment_method: paymentMethod,
          notes: notes,
          payment_date: new Date().toISOString().split('T')[0]
        });

      if (paymentError) throw paymentError;

      // Update invoice amount_paid and status
      const newAmountPaid = Number(invoice.amount_paid || 0) + amount;
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
        description: `Payment of ₦${amount.toLocaleString()} has been recorded successfully.`
      });

      onPaymentUpdated();
      onOpenChange(false);
      setPaymentAmount('');
      setPaymentMethod('');
      setNotes('');
    } catch (error: any) {
      console.error('Error recording payment:', error);
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
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Invoice Total: ₦{Number(invoice.total_amount).toLocaleString()}</Label>
              <Label>Amount Paid: ₦{Number(invoice.amount_paid || 0).toLocaleString()}</Label>
              <Label>Remaining: ₦{remainingAmount.toLocaleString()}</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentAmount">Payment Amount *</Label>
              <Input 
                id="paymentAmount" 
                type="number"
                step="0.01"
                max={remainingAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input 
                id="notes" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment reference or notes"
              />
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
