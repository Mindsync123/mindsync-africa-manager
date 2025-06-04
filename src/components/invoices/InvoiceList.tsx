
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, DollarSign, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateInvoiceForm } from './CreateInvoiceForm';
import { InvoiceActions } from './InvoiceActions';
import { PartialPaymentDialog } from './PartialPaymentDialog';

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  amount_paid?: number;
  status: 'paid' | 'unpaid' | 'part_paid';
  due_date: string;
  created_at: string;
  customers?: { name: string; phone?: string | null };
}

export const InvoiceList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers(name, phone)
        `)
        .eq('business_id', businessProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
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

  const updateInvoiceStatus = async (invoiceId: string, newStatus: 'paid' | 'unpaid' | 'part_paid') => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) return;

      if (newStatus === 'part_paid') {
        setSelectedInvoiceForPayment(invoice);
        return;
      }

      const updateData: any = { status: newStatus };
      if (newStatus === 'paid') {
        updateData.amount_paid = invoice.total_amount;
      }

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Invoice Updated",
        description: "Invoice status has been updated successfully."
      });

      fetchInvoices();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const paidAmount = invoices.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'part_paid': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'paid' && new Date(dueDate) < new Date();
  };

  if (loading) return <div>Loading invoices...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Invoices</h2>
          <p className="text-gray-600">Manage your sales invoices and payments</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{invoices.length} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{paidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(i => i.status === 'paid').length} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₦{pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(i => i.status !== 'paid').length} pending invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="part_paid">Partially Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                    <CardDescription className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {invoice.customers?.name || 'No Customer'}
                    </CardDescription>
                  </div>
                </div>
                <InvoiceActions 
                  invoice={invoice}
                  onInvoiceUpdated={fetchInvoices}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Amount:</span>
                  <span className="font-bold text-lg">₦{Number(invoice.total_amount).toLocaleString()}</span>
                </div>
                
                {Number(invoice.amount_paid) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Paid:</span>
                    <span className="font-bold text-green-600">₦{(Number(invoice.amount_paid) || 0).toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status:</span>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {isOverdue(invoice.due_date, invoice.status) && (
                      <Badge variant="destructive">OVERDUE</Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Due Date:</span>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="text-sm">{new Date(invoice.created_at).toLocaleDateString()}</span>
                </div>

                {invoice.status !== 'paid' && (
                  <div className="pt-3 border-t space-y-2">
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                    >
                      Mark as Paid
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm"
                      onClick={() => updateInvoiceStatus(invoice.id, 'part_paid')}
                    >
                      Record Partial Payment
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-4">Create your first invoice to get started.</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateInvoiceForm 
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onInvoiceCreated={fetchInvoices}
      />

      {selectedInvoiceForPayment && (
        <PartialPaymentDialog 
          open={!!selectedInvoiceForPayment}
          onOpenChange={(open) => !open && setSelectedInvoiceForPayment(null)}
          invoice={selectedInvoiceForPayment}
          onPaymentUpdated={fetchInvoices}
        />
      )}
    </div>
  );
};
