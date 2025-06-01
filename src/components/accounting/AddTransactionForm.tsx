
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface AddTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionAdded: () => void;
}

interface ChartAccount {
  id: string;
  account_name: string;
  account_type: string;
}

export const AddTransactionForm = ({ open, onOpenChange, onTransactionAdded }: AddTransactionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [transactionType, setTransactionType] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchAccounts();
    }
  }, [open]);

  const fetchAccounts = async () => {
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('business_id', businessProfile.id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) throw new Error('Business profile not found');

      const { error } = await supabase
        .from('transactions')
        .insert({
          business_id: businessProfile.id,
          type: transactionType as 'income' | 'expense' | 'transfer',
          amount: Number(formData.get('amount')),
          date: formData.get('date')?.toString() || new Date().toISOString().split('T')[0],
          description: formData.get('description')?.toString() || '',
          reference_number: formData.get('referenceNumber')?.toString() || '',
          category_id: selectedAccount || null
        });

      if (error) throw error;

      toast({
        title: "Transaction Added",
        description: "Transaction has been successfully recorded."
      });

      onTransactionAdded();
      onOpenChange(false);
      setTransactionType('');
      setSelectedAccount('');
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
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Record a new income, expense, or transfer transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Transaction Type *</Label>
              <Select value={transactionType} onValueChange={setTransactionType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₦) *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date *</Label>
              <Input 
                id="date" 
                name="date" 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account">Account Category</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.account_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Transaction description" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input id="referenceNumber" name="referenceNumber" placeholder="Optional reference" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !transactionType}>
              {loading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
