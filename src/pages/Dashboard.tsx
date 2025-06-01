
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users, 
  AlertTriangle,
  Plus,
  FileText,
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddCustomerForm } from '@/components/customers/AddCustomerForm';
import { AddProductForm } from '@/components/inventory/AddProductForm';
import { CreateInvoiceForm } from '@/components/invoices/CreateInvoiceForm';
import { AddTransactionForm } from '@/components/accounting/AddTransactionForm';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    stockValue: 0,
    monthlyProfit: 0,
    customerCount: 0,
    productCount: 0,
    lowStockItems: 0
  });

  // Form states
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBusinessProfile();
      fetchDashboardStats();
    }
  }, [user]);

  const fetchBusinessProfile = async () => {
    const { data } = await supabase
      .from('business_profiles')
      .select('*, plans(*)')
      .eq('user_id', user?.id)
      .single();
    
    setBusinessProfile(data);
  };

  const fetchDashboardStats = async () => {
    if (!user) return;

    // Get business profile first
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    // Fetch various stats
    const [
      { data: transactions },
      { data: customers },
      { data: products }
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select('type, amount')
        .eq('business_id', profile.id),
      supabase
        .from('customers')
        .select('id')
        .eq('business_id', profile.id),
      supabase
        .from('products')
        .select('stock_quantity, unit_price, reorder_level')
        .eq('business_id', profile.id)
    ]);

    // Calculate stats
    const revenue = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const stockValue = products?.reduce((sum, p) => sum + (Number(p.stock_quantity) * Number(p.unit_price)), 0) || 0;
    const lowStock = products?.filter(p => Number(p.stock_quantity) <= Number(p.reorder_level)).length || 0;

    setStats({
      totalRevenue: revenue,
      totalExpenses: expenses,
      stockValue,
      monthlyProfit: revenue - expenses,
      customerCount: customers?.length || 0,
      productCount: products?.length || 0,
      lowStockItems: lowStock
    });
  };

  const refreshStats = () => {
    fetchDashboardStats();
  };

  if (!businessProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">{businessProfile.business_name}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="px-3 py-1">
            {businessProfile.plans?.name?.toUpperCase()} Plan
          </Badge>
          <Button onClick={() => setShowCreateInvoice(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.monthlyProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Revenue minus expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.stockValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.productCount} items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customerCount}</div>
            <p className="text-xs text-muted-foreground">Active customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.lowStockItems > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-orange-800">Low Stock Alert</p>
                  <p className="text-sm text-orange-600">{stats.lowStockItems} items need restocking</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/dashboard/inventory')}
                >
                  View
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-800">Business Growing</p>
                <p className="text-sm text-blue-600">Your revenue is up this month!</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard/reports')}
              >
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowCreateInvoice(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowAddTransaction(true)}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Record Transaction
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowAddProduct(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowAddCustomer(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Forms */}
      <AddCustomerForm 
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onCustomerAdded={refreshStats}
      />
      
      <AddProductForm 
        open={showAddProduct}
        onOpenChange={setShowAddProduct}
        onProductAdded={refreshStats}
      />
      
      <CreateInvoiceForm 
        open={showCreateInvoice}
        onOpenChange={setShowCreateInvoice}
        onInvoiceCreated={refreshStats}
      />
      
      <AddTransactionForm 
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        onTransactionAdded={refreshStats}
      />
    </div>
  );
};
