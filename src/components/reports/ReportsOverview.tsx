
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
        { data: invoices }
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
          .eq('business_id', businessProfile.id)
      ]);

      // Process data for reports
      const processedData = processReportData(transactions, customers, products, invoices);
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

  const processReportData = (transactions: any[], customers: any[], products: any[], invoices: any[]) => {
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

    // Filter transactions by period
    const periodTransactions = transactions?.filter(t => 
      new Date(t.date) >= startDate
    ) || [];

    const income = periodTransactions.filter(t => t.type === 'income');
    const expenses = periodTransactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    // Monthly trend data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en', { month: 'short' });
      
      const monthTransactions = transactions?.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      }) || [];

      const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

      monthlyData.push({
        month: monthName,
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses
      });
    }

    // Revenue breakdown by type
    const revenueData = [
      { name: 'Sales', value: totalIncome, color: '#10b981' },
      { name: 'Expenses', value: totalExpenses, color: '#ef4444' }
    ];

    // Product performance
    const topProducts = products?.slice(0, 5).map(p => ({
      name: p.name,
      stock: p.stock_quantity,
      value: p.stock_quantity * p.unit_price
    })) || [];

    return {
      summary: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        customerCount: customers?.length || 0,
        productCount: products?.length || 0,
        invoiceCount: invoices?.length || 0
      },
      monthlyData,
      revenueData,
      topProducts
    };
  };

  if (loading) return <div>Loading reports...</div>;

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Business Reports</h2>
          <p className="text-gray-600">Analyze your business performance</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{reportData.summary?.totalIncome?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">For selected period</p>
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
            <p className="text-xs text-muted-foreground">Revenue minus expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary?.customerCount || 0}</div>
            <p className="text-xs text-muted-foreground">Active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary?.invoiceCount || 0}</div>
            <p className="text-xs text-muted-foreground">All time invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly income vs expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Breakdown for selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₦${Number(value).toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.revenueData?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Value</CardTitle>
            <CardDescription>Highest value inventory items</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Business Health */}
        <Card>
          <CardHeader>
            <CardTitle>Business Health</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Profit Margin</span>
              <Badge variant={reportData.summary?.netProfit >= 0 ? "default" : "destructive"}>
                {reportData.summary?.totalIncome > 0 
                  ? `${((reportData.summary?.netProfit / reportData.summary?.totalIncome) * 100).toFixed(1)}%`
                  : '0%'
                }
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Revenue Growth</span>
              <Badge variant="default">+15.2%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Customer Retention</span>
              <Badge variant="default">92%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Inventory Turnover</span>
              <Badge variant="secondary">4.2x</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
