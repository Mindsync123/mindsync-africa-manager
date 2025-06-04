
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChartAccount {
  id: string;
  account_name: string;
  account_type: string;
}

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  accountType: 'Income' | 'Expenses';
  placeholder?: string;
  required?: boolean;
}

export const CategorySelect = ({ 
  value, 
  onValueChange, 
  accountType, 
  placeholder = "Select category",
  required = false 
}: CategorySelectProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

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
        .eq('account_type', accountType)
        .order('account_name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) throw new Error('Business profile not found');

      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert({
          business_id: businessProfile.id,
          account_name: newCategoryName.trim(),
          account_type: accountType
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Category Added",
        description: `New ${accountType.toLowerCase()} category "${newCategoryName}" has been created.`
      });

      // Add to local state and select it
      setAccounts(prev => [...prev, data]);
      onValueChange(data.id);
      setShowAddDialog(false);
      setNewCategoryName('');
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
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange} required={required}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.account_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowAddDialog(true)}
          title={`Add new ${accountType.toLowerCase()} category`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New {accountType} Category</DialogTitle>
            <DialogDescription>
              Create a new {accountType.toLowerCase()} category for your chart of accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setNewCategoryName('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={loading || !newCategoryName.trim()}>
              {loading ? 'Adding...' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
