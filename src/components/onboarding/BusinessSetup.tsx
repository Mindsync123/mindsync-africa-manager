
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2 } from 'lucide-react';

export const BusinessSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    phone: '',
    businessEmail: '',
    industry: '',
    taxStatus: '',
    planId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Get the selected plan
      const { data: plans } = await supabase
        .from('plans')
        .select('id')
        .eq('name', formData.planId)
        .single();

      if (!plans) throw new Error('Plan not found');

      // Create business profile
      const { error: profileError } = await supabase
        .from('business_profiles')
        .insert({
          user_id: user.id,
          business_name: formData.businessName,
          phone: formData.phone,
          business_email: formData.businessEmail,
          industry: formData.industry,
          tax_status: formData.taxStatus,
          plan_id: plans.id,
          whatsapp_number: formData.phone
        });

      if (profileError) throw profileError;

      // Create subscription
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          business_id: (await supabase
            .from('business_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single()).data?.id,
          plan_id: plans.id,
          payment_status: 'trial'
        });

      if (subscriptionError) throw subscriptionError;

      toast({
        title: "Business Setup Complete!",
        description: "Welcome to Mindsync Manager. Let's get started!"
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Setup Your Business</CardTitle>
          <CardDescription>Let's get your business profile configured</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Your Business Name"
                  value={formData.businessName}
                  onChange={(e) => updateFormData('businessName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+234 XXX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="business@example.com"
                  value={formData.businessEmail}
                  onChange={(e) => updateFormData('businessEmail', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => updateFormData('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxStatus">Tax Status</Label>
                <Select value={formData.taxStatus} onValueChange={(value) => updateFormData('taxStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tax Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VAT">VAT Registered</SelectItem>
                    <SelectItem value="NON-VAT">Non-VAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Choose Your Plan *</Label>
                <Select value={formData.planId} onValueChange={(value) => updateFormData('planId', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic - ₦10,000/month (Accounting)</SelectItem>
                    <SelectItem value="standard">Standard - ₦20,000/month (Accounting + Inventory)</SelectItem>
                    <SelectItem value="premium">Premium - ₦35,000/month (Full Suite + AI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
