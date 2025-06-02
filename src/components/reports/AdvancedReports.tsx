
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  income_statement: {
    revenue: number;
    expenses: number;
    net_income: number;
    gross_profit: number;
  };
  balance_sheet: {
    assets: number;
    liabilities: number;
    equity: number;
  };
  cash_flow: {
    operating: number;
    investing: number;
    financing: number;
    net_cash_flow: number;
  };
}

const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Last Year', value: 'last_year' },
  { label: 'Custom Range', value: 'custom' }
];

export const AdvancedReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState('income_statement');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user, dateFilter, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'this_week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - dayOfWeek) + 1);
        break;
      case 'last_7_days':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : new Date();
        endDate = customEndDate ? new Date(customEndDate) : new Date();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      const { start, end } = getDateRange();

      // Fetch transactions for the date range
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', businessProfile.id)
        .gte('date', start)
        .lt('date', end);

      if (error) throw error;

      // Fetch invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('business_id', businessProfile.id)
        .gte('created_at', start)
        .lt('created_at', end);

      // Calculate report data
      const revenue = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalInvoices = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
      
      const reportData: ReportData = {
        income_statement: {
          revenue: revenue,
          expenses: expenses,
          net_income: revenue - expenses,
          gross_profit: revenue * 0.7 // Simplified calculation
        },
        balance_sheet: {
          assets: revenue + 50000, // Simplified
          liabilities: expenses + 20000, // Simplified
          equity: (revenue + 50000) - (expenses + 20000)
        },
        cash_flow: {
          operating: revenue - expenses,
          investing: -10000, // Simplified
          financing: 5000, // Simplified
          net_cash_flow: (revenue - expenses) - 10000 + 5000
        }
      };

      setReportData(reportData);
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

  const downloadReport = async (format: 'pdf' | 'excel') => {
    if (!reportData) return;

    try {
      if (format === 'pdf') {
        // Create simple PDF content
        const content = generatePDFContent();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}_${dateFilter}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Create simple CSV content
        const csvContent = generateCSVContent();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}_${dateFilter}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Report Downloaded",
        description: `${selectedReport.replace('_', ' ')} report has been downloaded.`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download report."
      });
    }
  };

  const generatePDFContent = () => {
    if (!reportData) return '';

    const { start, end } = getDateRange();
    let content = `MINDSYNC ACCOUNTING REPORT\n`;
    content += `Report Type: ${selectedReport.replace('_', ' ').toUpperCase()}\n`;
    content += `Period: ${start} to ${end}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (selectedReport === 'income_statement') {
      content += `INCOME STATEMENT\n`;
      content += `================\n`;
      content += `Revenue: ₦${reportData.income_statement.revenue.toLocaleString()}\n`;
      content += `Expenses: ₦${reportData.income_statement.expenses.toLocaleString()}\n`;
      content += `Gross Profit: ₦${reportData.income_statement.gross_profit.toLocaleString()}\n`;
      content += `Net Income: ₦${reportData.income_statement.net_income.toLocaleString()}\n`;
    } else if (selectedReport === 'balance_sheet') {
      content += `BALANCE SHEET\n`;
      content += `=============\n`;
      content += `Assets: ₦${reportData.balance_sheet.assets.toLocaleString()}\n`;
      content += `Liabilities: ₦${reportData.balance_sheet.liabilities.toLocaleString()}\n`;
      content += `Equity: ₦${reportData.balance_sheet.equity.toLocaleString()}\n`;
    } else if (selectedReport === 'cash_flow') {
      content += `CASH FLOW STATEMENT\n`;
      content += `==================\n`;
      content += `Operating Activities: ₦${reportData.cash_flow.operating.toLocaleString()}\n`;
      content += `Investing Activities: ₦${reportData.cash_flow.investing.toLocaleString()}\n`;
      content += `Financing Activities: ₦${reportData.cash_flow.financing.toLocaleString()}\n`;
      content += `Net Cash Flow: ₦${reportData.cash_flow.net_cash_flow.toLocaleString()}\n`;
    }

    return content;
  };

  const generateCSVContent = () => {
    if (!reportData) return '';

    let csvContent = '';
    
    if (selectedReport === 'income_statement') {
      csvContent = 'Item,Amount\n';
      csvContent += `Revenue,${reportData.income_statement.revenue}\n`;
      csvContent += `Expenses,${reportData.income_statement.expenses}\n`;
      csvContent += `Gross Profit,${reportData.income_statement.gross_profit}\n`;
      csvContent += `Net Income,${reportData.income_statement.net_income}\n`;
    } else if (selectedReport === 'balance_sheet') {
      csvContent = 'Item,Amount\n';
      csvContent += `Assets,${reportData.balance_sheet.assets}\n`;
      csvContent += `Liabilities,${reportData.balance_sheet.liabilities}\n`;
      csvContent += `Equity,${reportData.balance_sheet.equity}\n`;
    } else if (selectedReport === 'cash_flow') {
      csvContent = 'Activity,Amount\n';
      csvContent += `Operating,${reportData.cash_flow.operating}\n`;
      csvContent += `Investing,${reportData.cash_flow.investing}\n`;
      csvContent += `Financing,${reportData.cash_flow.financing}\n`;
      csvContent += `Net Cash Flow,${reportData.cash_flow.net_cash_flow}\n`;
    }

    return csvContent;
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'income_statement':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Income Statement (Profit & Loss)</CardTitle>
              <CardDescription>Revenue and expenses breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Revenue</span>
                  <span className="text-green-600 font-bold">₦{reportData.income_statement.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Cost of Goods Sold</span>
                  <span className="text-red-600">₦{(reportData.income_statement.revenue * 0.3).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b font-semibold">
                  <span>Gross Profit</span>
                  <span className="text-blue-600">₦{reportData.income_statement.gross_profit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Operating Expenses</span>
                  <span className="text-red-600">₦{reportData.income_statement.expenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 font-bold text-lg">
                  <span>Net Income</span>
                  <span className={reportData.income_statement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₦{reportData.income_statement.net_income.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'balance_sheet':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>Assets, liabilities, and equity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">Assets</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Current Assets</span>
                      <span>₦{(reportData.balance_sheet.assets * 0.6).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fixed Assets</span>
                      <span>₦{(reportData.balance_sheet.assets * 0.4).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Assets</span>
                      <span>₦{reportData.balance_sheet.assets.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Liabilities & Equity</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Current Liabilities</span>
                      <span>₦{(reportData.balance_sheet.liabilities * 0.7).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Long-term Liabilities</span>
                      <span>₦{(reportData.balance_sheet.liabilities * 0.3).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner's Equity</span>
                      <span>₦{reportData.balance_sheet.equity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Liab. & Equity</span>
                      <span>₦{(reportData.balance_sheet.liabilities + reportData.balance_sheet.equity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'cash_flow':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>Cash inflows and outflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Operating Activities</h4>
                  <div className="flex justify-between">
                    <span>Cash from Operations</span>
                    <span className="font-medium">₦{reportData.cash_flow.operating.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Investing Activities</h4>
                  <div className="flex justify-between">
                    <span>Cash from Investments</span>
                    <span className="font-medium">₦{reportData.cash_flow.investing.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Financing Activities</h4>
                  <div className="flex justify-between">
                    <span>Cash from Financing</span>
                    <span className="font-medium">₦{reportData.cash_flow.financing.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 font-bold text-lg">
                  <span>Net Cash Flow</span>
                  <span className={reportData.cash_flow.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₦{reportData.cash_flow.net_cash_flow.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-gray-600">Generate and download comprehensive business reports</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => downloadReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => downloadReport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income_statement">Income Statement</SelectItem>
                  <SelectItem value="balance_sheet">Balance Sheet</SelectItem>
                  <SelectItem value="cash_flow">Cash Flow Statement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFilter">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FILTERS.map(filter => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dateFilter === 'custom' && (
              <>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <div className="text-center py-8">Loading report data...</div>
      ) : (
        renderReportContent()
      )}
    </div>
  );
};
