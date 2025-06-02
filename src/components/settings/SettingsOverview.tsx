
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, User, Globe, Users, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';

interface BusinessProfile {
  business_name: string;
  phone: string;
  business_email: string;
  industry: string;
  tax_status: string;
  whatsapp_number: string;
  logo_url: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá' },
  { code: 'ha', name: 'Hausa', native: 'Hausa' },
  { code: 'ig', name: 'Igbo', native: 'Igbo' }
];

export const SettingsOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    if (user) {
      fetchBusinessProfile();
      loadLanguagePreference();
    }
  }, [user]);

  const fetchBusinessProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setBusinessProfile(data);
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

  const loadLanguagePreference = () => {
    const savedLanguage = localStorage.getItem('mindsync_language') || 'en';
    setSelectedLanguage(savedLanguage);
  };

  const handleLanguageChange = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    localStorage.setItem('mindsync_language', languageCode);
    
    // In a real implementation, this would trigger Google Translate API
    toast({
      title: "Language Updated",
      description: `Interface language changed to ${LANGUAGES.find(l => l.code === languageCode)?.native}`
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({
          business_name: formData.get('business_name')?.toString() || '',
          phone: formData.get('phone')?.toString() || '',
          business_email: formData.get('business_email')?.toString() || '',
          industry: formData.get('industry')?.toString() || '',
          tax_status: formData.get('tax_status')?.toString() || '',
          whatsapp_number: formData.get('whatsapp_number')?.toString() || ''
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Business profile has been successfully updated."
      });

      fetchBusinessProfile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-gray-600">Manage your account and business preferences</p>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="business">
            <Building2 className="h-4 w-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="language">
            <Globe className="h-4 w-4 mr-2" />
            Language
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <Crown className="h-4 w-4 mr-2" />
            Subscription
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <CardContent>
              {businessProfile && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business Name *</Label>
                      <Input
                        id="business_name"
                        name="business_name"
                        defaultValue={businessProfile.business_name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={businessProfile.phone}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_email">Business Email</Label>
                      <Input
                        id="business_email"
                        name="business_email"
                        type="email"
                        defaultValue={businessProfile.business_email || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                      <Input
                        id="whatsapp_number"
                        name="whatsapp_number"
                        defaultValue={businessProfile.whatsapp_number || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select name="industry" defaultValue={businessProfile.industry || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="hospitality">Hospitality</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="construction">Construction</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax_status">Tax Status</Label>
                      <Select name="tax_status" defaultValue={businessProfile.tax_status || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tax status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="registered">VAT Registered</SelectItem>
                          <SelectItem value="not_registered">Not VAT Registered</SelectItem>
                          <SelectItem value="exempt">VAT Exempt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full md:w-auto">
                    Update Business Profile
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={user?.email || ''} disabled />
                  <p className="text-sm text-gray-500">
                    Contact support to change your email address
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input value={user?.id || ''} disabled />
                </div>
                <Button variant="outline">Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Language & Localization</CardTitle>
              <CardDescription>Choose your preferred language for the interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Interface Language</Label>
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          {language.native} ({language.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-gray-500">
                  The interface will be translated to your selected language using advanced AI translation.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>Invite team members and manage roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email Address</Label>
                    <Input id="inviteEmail" type="email" placeholder="teammate@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="storekeeper">Storekeeper</SelectItem>
                        <SelectItem value="sales_officer">Sales Officer</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button>Send Invitation</Button>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Current Team Members</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{user?.email}</p>
                        <p className="text-sm text-gray-500">Owner</p>
                      </div>
                      <span className="text-sm text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <SubscriptionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
