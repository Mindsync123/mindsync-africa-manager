
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface AddCustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded: () => void;
}

export const AddCustomerForm = ({ open, onOpenChange, onCustomerAdded }: AddCustomerFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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
        .from('customers')
        .insert({
          business_id: businessProfile.id,
          name: formData.get('name')?.toString() || '',
          email: formData.get('email')?.toString() || '',
          phone: formData.get('phone')?.toString() || '',
          address: formData.get('address')?.toString() || '',
          balance: 0
        });

      if (error) throw error;

      toast({
        title: "Customer Added",
        description: "Customer has been successfully added."
      });

      onCustomerAdded();
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
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Create a new customer profile for your business.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
