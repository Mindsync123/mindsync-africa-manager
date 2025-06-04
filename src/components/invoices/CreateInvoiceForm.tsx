
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateInvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated: () => void;
}

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  unit_price: number;
  stock_quantity: number;
  purchase_cost: number;
}

interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  purchaseCost: number;
}

export const CreateInvoiceForm = ({ open, onOpenChange, onInvoiceCreated }: CreateInvoiceFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchProducts();
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }
  }, [open]);

  const fetchCustomers = async () => {
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('business_id', businessProfile.id);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      const { data, error } = await supabase
        .from('products')
        .select('id, name, unit_price, stock_quantity, purchase_cost')
        .eq('business_id', businessProfile.id)
        .gt('stock_quantity', 0); // Only show products with stock

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    }
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, {
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      purchaseCost: 0
    }]);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].productName = product.name;
        updatedItems[index].unitPrice = product.unit_price;
        updatedItems[index].purchaseCost = product.purchase_cost || 0;
      }
    }
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setInvoiceItems(updatedItems);
  };

  const getTotalAmount = () => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0);
  };

  const validateStock = () => {
    for (const item of invoiceItems) {
      const product = products.find(p => p.id === item.productId);
      if (product && item.quantity > product.stock_quantity) {
        toast({
          variant: "destructive",
          title: "Insufficient Stock",
          description: `Not enough stock for ${product.name}. Available: ${product.stock_quantity}, Required: ${item.quantity}`
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateStock()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) throw new Error('Business profile not found');

      const invoiceNumber = `INV-${Date.now()}`;
      const totalAmount = getTotalAmount();

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          business_id: businessProfile.id,
          customer_id: selectedCustomer || null,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          due_date: dueDate,
          status: 'unpaid'
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItemsData = invoiceItems.map(item => ({
        invoice_id: invoice.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_amount: item.total,
        purchase_cost: item.purchaseCost
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItemsData);

      if (itemsError) throw itemsError;

      // Update stock quantities
      for (const item of invoiceItems) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await supabase
            .from('products')
            .update({ 
              stock_quantity: product.stock_quantity - item.quantity 
            })
            .eq('id', item.productId);

          // Record stock movement
          await supabase
            .from('stock_movements')
            .insert({
              product_id: item.productId,
              type: 'out',
              quantity: item.quantity,
              reference_id: invoice.id,
              notes: `Sale - Invoice ${invoiceNumber}`
            });
        }
      }

      // Record income transaction
      await supabase
        .from('transactions')
        .insert({
          business_id: businessProfile.id,
          type: 'income',
          amount: totalAmount,
          date: new Date().toISOString().split('T')[0],
          description: `Sales Invoice ${invoiceNumber}`,
          reference_number: invoiceNumber
        });

      toast({
        title: "Invoice Created",
        description: `Invoice ${invoiceNumber} has been successfully created.`
      });

      onInvoiceCreated();
      onOpenChange(false);
      setInvoiceItems([]);
      setSelectedCustomer('');
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

  const getAvailableProducts = (currentProductId?: string) => {
    return products.filter(product => {
      // Show the currently selected product even if it's already used
      if (product.id === currentProductId) return true;
      // Don't show products that are already in the invoice
      return !invoiceItems.some(item => item.productId === product.id);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Create a new sales invoice for your customer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer">Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate" 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Invoice Items</Label>
                <Button type="button" onClick={addInvoiceItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              {invoiceItems.map((item, index) => {
                const availableProducts = getAvailableProducts(item.productId);
                const selectedProduct = products.find(p => p.id === item.productId);
                
                return (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                    <div className="col-span-4">
                      <Label>Product</Label>
                      <Select 
                        value={item.productId} 
                        onValueChange={(value) => updateInvoiceItem(index, 'productId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} (Stock: {product.stock_quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Quantity</Label>
                      <Input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(index, 'quantity', Number(e.target.value))}
                        min="1"
                        max={selectedProduct?.stock_quantity || 999}
                      />
                      {selectedProduct && item.quantity > selectedProduct.stock_quantity && (
                        <p className="text-xs text-red-500 mt-1">
                          Exceeds available stock ({selectedProduct.stock_quantity})
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label>Unit Price</Label>
                      <Input 
                        type="number" 
                        value={item.unitPrice}
                        onChange={(e) => updateInvoiceItem(index, 'unitPrice', Number(e.target.value))}
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input 
                        type="number" 
                        value={item.total}
                        readOnly
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeInvoiceItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-right">
              <div className="text-lg font-bold">
                Total Amount: ₦{getTotalAmount().toLocaleString()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || invoiceItems.length === 0}>
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
