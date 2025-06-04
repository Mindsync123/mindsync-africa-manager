
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChartAccount {
  id: string;
  account_name: string;
  account_type: string;
  parent_id?: string;
  created_at: string;
}

const ACCOUNT_TYPES = ['Assets', 'Liabilities', 'Income', 'Expenses', 'Equity'];

export const ChartOfAccountsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

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
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const accountName = formData.get('accountName')?.toString() || '';
    const accountType = formData.get('accountType')?.toString() || '';
    
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) throw new Error('Business profile not found');

      if (editingAccount) {
        const { error } = await supabase
          .from('chart_of_accounts')
          .update({
            account_name: accountName,
            account_type: accountType
          })
          .eq('id', editingAccount.id);

        if (error) throw error;

        toast({
          title: "Account Updated",
          description: "Chart of account has been successfully updated."
        });
      } else {
        const { error } = await supabase
          .from('chart_of_accounts')
          .insert({
            business_id: businessProfile.id,
            account_name: accountName,
            account_type: accountType
          });

        if (error) throw error;

        toast({
          title: "Account Added",
          description: "New account has been successfully added to chart of accounts."
        });
      }

      fetchAccounts();
      setShowAddForm(false);
      setEditingAccount(null);
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Account has been successfully deleted."
      });

      fetchAccounts();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.account_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || account.account_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const groupedAccounts = ACCOUNT_TYPES.reduce((acc, type) => {
    acc[type] = filteredAccounts.filter(account => account.account_type === type);
    return acc;
  }, {} as Record<string, ChartAccount[]>);

  if (loading) return <div>Loading chart of accounts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Chart of Accounts</h2>
          <p className="text-gray-600">Manage your accounting structure</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ACCOUNT_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {ACCOUNT_TYPES.map(type => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {type}
                <Badge variant="outline">{groupedAccounts[type]?.length || 0} accounts</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedAccounts[type]?.map(account => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{account.account_name}</p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(account.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingAccount(account);
                          setShowAddForm(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!groupedAccounts[type] || groupedAccounts[type].length === 0) && (
                  <p className="text-gray-500 text-center py-4">No accounts in this category</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddForm} onOpenChange={(open) => {
        setShowAddForm(open);
        if (!open) setEditingAccount(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Update account details.' : 'Create a new account in your chart of accounts.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input 
                  id="accountName" 
                  name="accountName" 
                  defaultValue={editingAccount?.account_name || ''}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountType">Account Type *</Label>
                <Select name="accountType" defaultValue={editingAccount?.account_type || ''} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowAddForm(false);
                setEditingAccount(null);
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAccount ? 'Update Account' : 'Add Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
