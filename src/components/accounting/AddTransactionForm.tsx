
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
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

  useEffect(() => {
    if (open) {
      fetchAccounts();
      // Reset form
      setSelectedAccount('');
      setTransactionType('income');
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
        .eq('business_id', businessProfile.id)
        .order('account_type, account_name');

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
          type: transactionType,
          amount: Number(formData.get('amount')) || 0,
          date: formData.get('date')?.toString() || new Date().toISOString().split('T')[0],
          description: formData.get('description')?.toString() || '',
          reference_number: formData.get('reference')?.toString() || '',
          category_id: selectedAccount || null
        });

      if (error) throw error;

      toast({
        title: "Transaction Added",
        description: "Transaction has been successfully recorded."
      });

      onTransactionAdded();
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

  // Filter accounts based on transaction type
  const filteredAccounts = accounts.filter(account => {
    if (transactionType === 'income') {
      return account.account_type === 'Income' || account.account_type === 'Assets';
    } else {
      return account.account_type === 'Expenses' || account.account_type === 'Liabilities';
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Record a new income or expense transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Transaction Type *</Label>
              <Select value={transactionType} onValueChange={(value: 'income' | 'expense') => setTransactionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="account">Account *</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.account_type})
                    </SelectItem>
                  ))}
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
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Transaction description" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input id="reference" name="reference" placeholder="Reference or receipt number" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
