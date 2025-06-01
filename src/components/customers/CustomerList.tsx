
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddCustomerForm } from './AddCustomerForm';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  created_at: string;
}

export const CustomerList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

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
        .select('*')
        .eq('business_id', businessProfile.id)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
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

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: "Customer Deleted",
        description: "Customer has been successfully deleted."
      });

      fetchCustomers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = customers.reduce((sum, customer) => sum + Number(customer.balance || 0), 0);
  const activeCustomers = customers.filter(c => Number(c.balance || 0) > 0);

  if (loading) return <div>Loading customers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCustomers.length}</div>
            <p className="text-xs text-muted-foreground">With outstanding balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
            <Badge variant="outline">₦</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding customer balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <CardDescription>
                      Customer since {new Date(customer.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteCustomer(customer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customer.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{customer.address}</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Outstanding Balance:</span>
                    <Badge variant={Number(customer.balance || 0) > 0 ? "default" : "secondary"}>
                      ₦{Number(customer.balance || 0).toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-4">Add your first customer to get started.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      )}

      <AddCustomerForm 
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onCustomerAdded={fetchCustomers}
      />
    </div>
  );
};
