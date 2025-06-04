
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Users, Package, FileText, CreditCard } from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalCustomers: number;
  totalProducts: number;
  totalInvoices: number;
  pendingInvoices: number;
  lowStockProducts: number;
  totalCOGS: number;
}

export const DashboardSummary = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    lowStockProducts: 0,
    totalCOGS: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      // Fetch actual revenue from invoices (amount_paid only)
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, total_amount, amount_paid, status')
        .eq('business_id', businessProfile.id);

      const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);
      const totalInvoices = invoices?.length || 0;
      const pendingInvoices = (invoices || []).filter(inv => inv.status === 'unpaid' || inv.status === 'part_paid').length;

      // Calculate COGS from actual invoice items for paid/partially paid invoices
      const paidInvoiceIds = (invoices || []).filter(inv => inv.status === 'paid' || Number(inv.amount_paid) > 0).map(inv => inv.id);
      
      let totalCOGS = 0;
      if (paidInvoiceIds.length > 0) {
        const { data: invoiceItems } = await supabase
          .from('invoice_items')
          .select('quantity, purchase_cost')
          .in('invoice_id', paidInvoiceIds);

        totalCOGS = (invoiceItems || []).reduce((sum, item) => 
          sum + (Number(item.quantity) * Number(item.purchase_cost || 0)), 0);
      }

      // Fetch actual expenses from transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('business_id', businessProfile.id);

      const operatingExpenses = (transactions || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = operatingExpenses + totalCOGS;

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessProfile.id);

      // Fetch products stats
      const { data: products } = await supabase
        .from('products')
        .select('stock_quantity, reorder_level')
        .eq('business_id', businessProfile.id);

      const totalProducts = products?.length || 0;
      const lowStockProducts = (products || []).filter(p => 
        Number(p.stock_quantity) <= Number(p.reorder_level || 0)
      ).length;

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        totalCustomers: customersCount || 0,
        totalProducts,
        totalInvoices,
        pendingInvoices,
        lowStockProducts,
        totalCOGS
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">₦{stats.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">From actual payments received</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">₦{stats.totalExpenses.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Including COGS: ₦{stats.totalCOGS.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₦{stats.netProfit.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Revenue - Total Expenses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          <p className="text-xs text-muted-foreground">Active customers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts}</div>
          <p className="text-xs text-muted-foreground">In inventory</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          <p className="text-xs text-muted-foreground">{stats.pendingInvoices} pending</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
          <Package className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</div>
          <p className="text-xs text-muted-foreground">Products need restock</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.pendingInvoices}</div>
          <p className="text-xs text-muted-foreground">Unpaid/partial invoices</p>
        </CardContent>
      </Card>
    </div>
  );
};
