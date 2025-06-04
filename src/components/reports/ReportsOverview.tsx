
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
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      // Fetch comprehensive business data
      const [
        { data: transactions },
        { data: customers },
        { data: products },
        { data: invoices },
        { data: invoiceItems }
      ] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('business_id', businessProfile.id),
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
          .select('*')
          .eq('business_id', businessProfile.id),
        supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', `ANY(${JSON.stringify((await supabase.from('invoices').select('id').eq('business_id', businessProfile.id)).data?.map(i => i.id) || [])})`)
      ]);

      // Process data for reports
      const processedData = processReportData(transactions, customers, products, invoices, invoiceItems);
      setReportData(processedData);
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

  const processReportData = (transactions: any[], customers: any[], products: any[], invoices: any[], invoiceItems: any[]) => {
    const now = new Date();
    let startDate = new Date();
    
    // Calculate date range based on selected period
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

    // Calculate actual revenue from paid invoices
    const periodInvoices = invoices?.filter(inv => 
      new Date(inv.created_at) >= startDate && Number(inv.amount_paid) > 0
    ) || [];

    const totalRevenue = periodInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0);

    // Calculate COGS from actual sold items
    const paidInvoiceIds = periodInvoices.map(inv => inv.id);
    const soldItems = invoiceItems?.filter(item => 
      paidInvoiceIds.includes(item.invoice_id)
    ) || [];

    const totalCOGS = soldItems.reduce((sum, item) => 
      sum + (Number(item.quantity) * Number(item.purchase_cost || 0)), 0
    );

    // Calculate operating expenses
    const periodTransactions = transactions?.filter(t => 
      new Date(t.date) >= startDate
    ) || [];

    const operatingExpenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = operatingExpenses + totalCOGS;

    // Monthly trend data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en', { month: 'short' });
      
      const monthInvoices = invoices?.filter(inv => {
        const invDate = new Date(inv.created_at);
        return invDate.getMonth() === date.getMonth() && 
               invDate.getFullYear() === date.getFullYear() &&
               Number(inv.amount_paid) > 0;
      }) || [];

      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0);

      const monthTransactions = transactions?.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && 
               tDate.getFullYear() === date.getFullYear() &&
               t.type === 'expense';
      }) || [];

      const monthExpenses = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

      // Calculate month COGS
      const monthInvoiceIds = monthInvoices.map(inv => inv.id);
      const monthSoldItems = invoiceItems?.filter(item => 
        monthInvoiceIds.includes(item.invoice_id)
      ) || [];

      const monthCOGS = monthSoldItems.reduce((sum, item) => 
        sum + (Number(item.quantity) * Number(item.purchase_cost || 0)), 0
      );

      const monthTotalExpenses = monthExpenses + monthCOGS;

      monthlyData.push({
        month: monthName,
        revenue: monthRevenue,
        operatingExpenses: monthExpenses,
        cogs: monthCOGS,
        totalExpenses: monthTotalExpenses,
        profit: monthRevenue - monthTotalExpenses
      });
    }

    // Financial breakdown
    const financialData = [
      { name: 'Revenue', value: totalRevenue, color: '#10b981' },
      { name: 'COGS', value: totalCOGS, color: '#f59e0b' },
      { name: 'Operating Expenses', value: operatingExpenses, color: '#ef4444' }
    ];

    // Product performance
    const topProducts = products?.slice(0, 5).map(p => ({
      name: p.name,
      stock: p.stock_quantity,
      value: p.stock_quantity * p.unit_price
    })) || [];

    return {
      summary: {
        totalRevenue,
        totalCOGS,
        operatingExpenses,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        customerCount: customers?.length || 0,
        productCount: products?.length || 0,
        invoiceCount: invoices?.length || 0
      },
      monthlyData,
      financialData,
      topProducts
    };
  };

  if (loading) return <div>Loading reports...</div>;

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-gray-600">Analyze your business performance with accurate accounting</p>
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
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{reportData.summary?.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Cash received</p>
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
            <p className="text-xs text-muted-foreground">Bottom line</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Trend</CardTitle>
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

        {/* Financial Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Breakdown</CardTitle>
            <CardDescription>Revenue vs costs breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.financialData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₦${Number(value).toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.financialData?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
        </CardContent>
      </Card>
    </div>
  );
};
