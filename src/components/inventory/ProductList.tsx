
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Package, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddProductForm } from './AddProductForm';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  unit_price: number;
  reorder_level: number;
  category_id: string;
  product_categories?: { name: string };
}

export const ProductList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

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
        .select(`
          *,
          product_categories(name)
        `)
        .eq('business_id', businessProfile.id)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
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

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product Deleted",
        description: "Product has been successfully deleted."
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.reorder_level);
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.unit_price), 0);

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-gray-600">Manage your inventory items</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <Badge variant="outline">₦</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalStockValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total inventory value</p>
          </CardContent>
        </Card>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              {lowStockProducts.length} products are running low on stock and need restocking.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>SKU: {product.sku || 'N/A'}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Stock:</span>
                  <div className="flex items-center">
                    <span className="font-medium">{product.stock_quantity}</span>
                    {product.stock_quantity <= product.reorder_level && (
                      <AlertTriangle className="h-4 w-4 text-orange-500 ml-1" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Price:</span>
                  <span className="font-medium">₦{product.unit_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Category:</span>
                  <Badge variant="outline">
                    {product.product_categories?.name || 'Uncategorized'}
                  </Badge>
                </div>
                {product.stock_quantity <= product.reorder_level && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Low Stock
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first product.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      )}

      <AddProductForm 
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onProductAdded={fetchProducts}
      />
    </div>
  );
};
