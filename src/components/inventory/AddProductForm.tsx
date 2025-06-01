
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AddProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
}

interface Category {
  id: string;
  name: string;
}

export const AddProductForm = ({ open, onOpenChange, onProductAdded }: AddProductFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('business_id', businessProfile.id);

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
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
        .from('products')
        .insert({
          business_id: businessProfile.id,
          name: formData.get('name')?.toString() || '',
          sku: formData.get('sku')?.toString() || '',
          unit_price: Number(formData.get('unitPrice')) || 0,
          stock_quantity: Number(formData.get('stockQuantity')) || 0,
          reorder_level: Number(formData.get('reorderLevel')) || 0,
          category_id: selectedCategory || null
        });

      if (error) throw error;

      toast({
        title: "Product Added",
        description: "Product has been successfully added to inventory."
      });

      onProductAdded();
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
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" placeholder="Stock Keeping Unit" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitPrice">Unit Price (₦) *</Label>
              <Input id="unitPrice" name="unitPrice" type="number" step="0.01" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stockQuantity">Stock Quantity *</Label>
              <Input id="stockQuantity" name="stockQuantity" type="number" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" placeholder="Minimum stock level" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
