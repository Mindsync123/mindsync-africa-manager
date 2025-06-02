
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    total_amount: number;
    due_date: string;
  };
  onInvoiceUpdated: () => void;
}

export const EditInvoiceDialog = ({ open, onOpenChange, invoice, onInvoiceUpdated }: EditInvoiceDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(String(invoice.total_amount));
  const [dueDate, setDueDate] = useState(invoice.due_date);

  useEffect(() => {
    if (open) {
      setTotalAmount(String(invoice.total_amount));
      setDueDate(invoice.due_date);
    }
  }, [open, invoice]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          total_amount: Number(totalAmount),
          due_date: dueDate
        })
        .eq('id', invoice.id);

      if (error) throw error;

      toast({
        title: "Invoice Updated",
        description: "Invoice has been successfully updated."
      });

      onInvoiceUpdated();
      onOpenChange(false);
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
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Update invoice {invoice.invoice_number} details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="totalAmount">Total Amount *</Label>
              <Input 
                id="totalAmount" 
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input 
                id="dueDate" 
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
