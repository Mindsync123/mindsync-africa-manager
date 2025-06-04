
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddProductForm } from './AddProductForm';
import { Plus, Search, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  purchase_cost: number;
  stock_quantity: number;
  reorder_level: number;
  category_name?: string;
  barcode?: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

export const ProductList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCategories();
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
          category:product_categories(name)
        `)
        .eq('business_id', businessProfile.id)
        .order('name');

      if (error) throw error;

      const transformedData = (data || []).map(product => ({
        ...product,
        category_name: product.category?.name || 'Uncategorized',
        stock_quantity: product.stock_quantity || 0,
        purchase_cost: product.purchase_cost || 0
      }));

      setProducts(transformedData);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

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
        .eq('business_id', businessProfile.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDelete = async (productId: string) => {
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
      console.error('Error deleting product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || product.category_name === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate inventory metrics
  const totalStockValue = products.reduce((sum, product) => {
    return sum + (Number(product.stock_quantity) * Number(product.purchase_cost));
  }, 0);

  const lowStockProducts = products.filter(product => 
    Number(product.stock_quantity) <= Number(product.reorder_level)
  ).length;

  const outOfStockProducts = products.filter(product => 
    Number(product.stock_quantity) === 0
  ).length;

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Product Inventory</h2>
          <p className="text-gray-600">Manage your product catalog and stock levels</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₦{totalStockValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            {filteredProducts.length} product(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Purchase Cost</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Stock Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.barcode && (
                        <div className="text-sm text-gray-500">{product.barcode}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.sku || '-'}</TableCell>
                  <TableCell>{product.category_name}</TableCell>
                  <TableCell>₦{Number(product.purchase_cost).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(product.unit_price).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{product.stock_quantity}</span>
                      {product.stock_quantity <= product.reorder_level && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    ₦{(Number(product.stock_quantity) * Number(product.purchase_cost)).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {product.stock_quantity === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : product.stock_quantity <= product.reorder_level ? (
                      <Badge variant="secondary">Low Stock</Badge>
                    ) : (
                      <Badge variant="default">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddProductForm 
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onProductAdded={fetchProducts}
      />
    </div>
  );
};
