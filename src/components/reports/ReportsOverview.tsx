
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Package, Users, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ReportsOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>({});
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user, selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      // Calculate date range based on selected period
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch all necessary data in parallel
      const [
        transactionsResponse,
        customersResponse,
        productsResponse,
        invoicesResponse
      ] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('business_id', businessProfile.id)
          .gte('date', startDate.toISOString().split('T')[0]),
        supabase
          .from('customers')
          .select('*')
          .eq('business_id', businessProfile.id),
        supabase
          .from('products')
          .select('*')
          .eq('business_id', businessProfile.id),
        supabase
          .from('invoices')
          .select(`
            *,
            invoice_items (
              quantity,
              unit_price,
              purchase_cost,
              total_amount
            )
          `)
          .eq('business_id', businessProfile.id)
          .gte('created_at', startDate.toISOString())
      ]);

      if (transactionsResponse.error) throw transactionsResponse.error;
      if (customersResponse.error) throw customersResponse.error;
      if (productsResponse.error) throw productsResponse.error;
      if (invoicesResponse.error) throw invoicesResponse.error;

      const transactions = transactionsResponse.data || [];
      const customers = customersResponse.data || [];
      const products = productsResponse.data || [];
      const invoices = invoicesResponse.data || [];

      // Process data for comprehensive reporting
      const processedData = processReportData(transactions, customers, products, invoices, startDate);
      setReportData(processedData);
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (transactions: any[], customers: any[], products: any[], invoices: any[], startDate: Date) => {
    // Calculate actual revenue from paid invoices only
    const paidInvoices = invoices.filter(inv => Number(inv.amount_paid) > 0);
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0);

    // Calculate COGS from actual sold items (only from paid invoices)
    let totalCOGS = 0;
    paidInvoices.forEach(invoice => {
      if (invoice.invoice_items) {
        invoice.invoice_items.forEach((item: any) => {
          const quantity = Number(item.quantity) || 0;
          const purchaseCost = Number(item.purchase_cost) || 0;
          totalCOGS += quantity * purchaseCost;
        });
      }
    });

    // Calculate operating expenses from transactions
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const operatingExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Income from transactions
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const transactionIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Total expenses = Operating expenses + COGS
    const totalExpenses = operatingExpenses + totalCOGS;

    // Net profit = Total revenue (from invoices + transactions) - Total expenses
    const netProfit = (totalRevenue + transactionIncome) - totalExpenses;

    // Monthly trend data for the last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en', { month: 'short' });
      
      // Filter data for this month
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.created_at);
        return invDate.getMonth() === date.getMonth() && 
               invDate.getFullYear() === date.getFullYear() &&
               Number(inv.amount_paid) > 0;
      });

      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && 
               tDate.getFullYear() === date.getFullYear();
      });

      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0);
      const monthIncomeTransactions = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      const monthExpenseTransactions = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

      // Calculate month COGS
      let monthCOGS = 0;
      monthInvoices.forEach(invoice => {
        if (invoice.invoice_items) {
          invoice.invoice_items.forEach((item: any) => {
            monthCOGS += (Number(item.quantity) || 0) * (Number(item.purchase_cost) || 0);
          });
        }
      });

      const monthTotalRevenue = monthRevenue + monthIncomeTransactions;
      const monthTotalExpenses = monthExpenseTransactions + monthCOGS;

      monthlyData.push({
        month: monthName,
        revenue: monthTotalRevenue,
        operatingExpenses: monthExpenseTransactions,
        cogs: monthCOGS,
        totalExpenses: monthTotalExpenses,
        profit: monthTotalRevenue - monthTotalExpenses
      });
    }

    // Expense breakdown by category
    const expenseCategories: { [key: string]: number } = {};
    expenseTransactions.forEach(transaction => {
      const category = transaction.category_name || 'Uncategorized';
      expenseCategories[category] = (expenseCategories[category] || 0) + Number(transaction.amount);
    });

    const expenseBreakdown = Object.entries(expenseCategories).map(([name, value]) => ({
      name,
      value,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));

    // Financial breakdown
    const financialData = [
      { name: 'Revenue', value: totalRevenue + transactionIncome, color: '#10b981' },
      { name: 'COGS', value: totalCOGS, color: '#f59e0b' },
      { name: 'Operating Expenses', value: operatingExpenses, color: '#ef4444' }
    ];

    // Top products by value
    const topProducts = products.slice(0, 5).map(p => ({
      name: p.name,
      stock: Number(p.stock_quantity) || 0,
      value: (Number(p.stock_quantity) || 0) * (Number(p.unit_price) || 0)
    }));

    // Low stock products
    const lowStockProducts = products.filter(p => 
      Number(p.stock_quantity) <= Number(p.reorder_level || 0)
    ).length;

    return {
      summary: {
        totalRevenue: totalRevenue + transactionIncome,
        totalCOGS,
        operatingExpenses,
        totalExpenses,
        netProfit,
        customerCount: customers.length,
        productCount: products.length,
        invoiceCount: invoices.length,
        lowStockProducts
      },
      monthlyData,
      financialData,
      expenseBreakdown,
      topProducts
    };
  };

  if (loading) return <div className="flex items-center justify-center p-8">Loading reports...</div>;

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#f97316'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-gray-600">Comprehensive business performance analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Income Statement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{reportData.summary?.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Invoices + Income transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₦{reportData.summary?.totalCOGS?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Cost of items sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₦{((reportData.summary?.totalRevenue || 0) - (reportData.summary?.totalCOGS || 0)).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Revenue - COGS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₦{reportData.summary?.operatingExpenses?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Business expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${reportData.summary?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₦{reportData.summary?.netProfit?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Bottom line profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Trend (6 Months)</CardTitle>
            <CardDescription>Monthly revenue, expenses, and profit</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="cogs" stroke="#f59e0b" strokeWidth={2} name="COGS" />
                <Line type="monotone" dataKey="operatingExpenses" stroke="#ef4444" strokeWidth={2} name="Operating Expenses" />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Net Profit" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Breakdown of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₦${Number(value).toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.expenseBreakdown?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Business Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>Essential business metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Gross Profit Margin</span>
            <Badge variant={reportData.summary?.totalRevenue > 0 ? "default" : "secondary"}>
              {reportData.summary?.totalRevenue > 0 
                ? `${(((reportData.summary?.totalRevenue - reportData.summary?.totalCOGS) / reportData.summary?.totalRevenue) * 100).toFixed(1)}%`
                : '0%'
              }
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Net Profit Margin</span>
            <Badge variant={reportData.summary?.netProfit >= 0 ? "default" : "destructive"}>
              {reportData.summary?.totalRevenue > 0 
                ? `${((reportData.summary?.netProfit / reportData.summary?.totalRevenue) * 100).toFixed(1)}%`
                : '0%'
              }
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Customers</span>
            <Badge variant="outline">{reportData.summary?.customerCount || 0}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Products</span>
            <Badge variant="outline">{reportData.summary?.productCount || 0}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Low Stock Items</span>
            <Badge variant={reportData.summary?.lowStockProducts > 0 ? "destructive" : "outline"}>
              {reportData.summary?.lowStockProducts || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
