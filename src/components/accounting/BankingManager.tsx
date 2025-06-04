
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CreditCard, Building2, Wallet, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BankAccount {
  id: string;
  account_name: string;
  account_type: 'bank' | 'cash' | 'mobile_money';
  balance: number;
  currency: string;
  created_at: string;
}

interface BankTransaction {
  id: string;
  bank_account_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  reference: string;
  date: string;
  reconciled: boolean;
}

export const BankingManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBankAccounts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountTransactions(selectedAccount.id);
    }
  }, [selectedAccount]);

  const fetchBankAccounts = async () => {
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
        .eq('account_type', 'Assets')
        .or('account_name.ilike.%bank%,account_name.ilike.%cash%')
        .order('account_name');

      if (error) throw error;

      const bankAccountData = (data || []).map(account => ({
        id: account.id,
        account_name: account.account_name,
        account_type: account.account_name.toLowerCase().includes('cash') ? 'cash' as const : 'bank' as const,
        balance: 0,
        currency: '₦',
        created_at: account.created_at
      }));

      setBankAccounts(bankAccountData);
      if (bankAccountData.length > 0 && !selectedAccount) {
        setSelectedAccount(bankAccountData[0]);
      }
    } catch (error: any) {
      console.error('Error fetching bank accounts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountTransactions = async (accountId: string) => {
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', businessProfile.id)
        .eq('category_id', accountId)
        .order('date', { ascending: false });

      if (error) throw error;

      const bankTransactionData = (data || []).map(transaction => ({
        id: transaction.id,
        bank_account_id: accountId,
        amount: Number(transaction.amount),
        type: transaction.type === 'income' ? 'credit' as const : 'debit' as const,
        description: transaction.description || 'No description',
        reference: transaction.reference_number || '',
        date: transaction.date,
        reconciled: false
      }));

      setTransactions(bankTransactionData);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleAddAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const accountName = formData.get('accountName')?.toString() || '';
    
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) throw new Error('Business profile not found');

      const { error } = await supabase
        .from('chart_of_accounts')
        .insert({
          business_id: businessProfile.id,
          account_name: accountName,
          account_type: 'Assets'
        });

      if (error) throw error;

      toast({
        title: "Account Added",
        description: "Bank/cash account has been successfully added."
      });

      fetchBankAccounts();
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error adding account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const calculateBalance = (account: BankAccount) => {
    const accountTransactions = transactions.filter(t => t.bank_account_id === account.id);
    return accountTransactions.reduce((balance, transaction) => {
      return transaction.type === 'credit' 
        ? balance + transaction.amount 
        : balance - transaction.amount;
    }, 0);
  };

  const totalBalance = bankAccounts.reduce((total, account) => total + calculateBalance(account), 0);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Building2 className="h-6 w-6" />;
      case 'cash': return <Wallet className="h-6 w-6" />;
      case 'mobile_money': return <CreditCard className="h-6 w-6" />;
      default: return <Building2 className="h-6 w-6" />;
    }
  };

  if (loading) return <div>Loading banking information...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Banking & Cash</h2>
          <p className="text-gray-600">Track your cash and bank account balances</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bankAccounts.filter(a => a.account_type === 'bank').length}
            </div>
            <p className="text-xs text-muted-foreground">Active bank accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Accounts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bankAccounts.filter(a => a.account_type === 'cash').length}
            </div>
            <p className="text-xs text-muted-foreground">Cash & mobile money</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>Your bank and cash accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bankAccounts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No accounts created yet</p>
              ) : (
                bankAccounts.map((account) => (
                  <div 
                    key={account.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAccount?.id === account.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAccount(account)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">
                        {getAccountIcon(account.account_type)}
                      </div>
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        <p className="text-sm text-gray-500 capitalize">{account.account_type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₦{calculateBalance(account).toLocaleString()}</p>
                      <Badge variant="outline">{account.currency}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUpDown className="h-5 w-5 mr-2" />
              {selectedAccount ? `${selectedAccount.account_name} Transactions` : 'Select Account'}
            </CardTitle>
            <CardDescription>Recent transactions for selected account</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedAccount ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                          {transaction.reference && ` • Ref: ${transaction.reference}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                        </p>
                        <Badge variant={transaction.reconciled ? "default" : "secondary"} className="text-xs">
                          {transaction.reconciled ? "Reconciled" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No transactions found</p>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Select an account to view transactions</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Bank/Cash Account</DialogTitle>
            <DialogDescription>
              Add a new bank account or cash account to track.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAccount}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input id="accountName" name="accountName" placeholder="e.g., GTBank Current Account" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
