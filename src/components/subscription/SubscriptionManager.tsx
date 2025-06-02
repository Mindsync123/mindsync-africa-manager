
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionInfo {
  is_trial: boolean;
  trial_days_left: number;
  is_active: boolean;
  next_payment_due: string;
  plan_name: string;
}

export const SubscriptionManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionInfo();
    }
  }, [user]);

  const fetchSubscriptionInfo = async () => {
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('*, subscriptions(*), plans(*)')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) return;

      // Calculate trial status
      const createdAt = new Date(businessProfile.created_at);
      const now = new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const trialDaysLeft = Math.max(0, 7 - daysSinceCreation);
      const isInTrial = trialDaysLeft > 0;

      // Check if subscription is active
      const activeSubscription = businessProfile.subscriptions?.find((sub: any) => sub.payment_status === 'active');

      const subscriptionData: SubscriptionInfo = {
        is_trial: isInTrial && !activeSubscription,
        trial_days_left: trialDaysLeft,
        is_active: !!activeSubscription,
        next_payment_due: activeSubscription?.next_payment_due || '',
        plan_name: businessProfile.plans?.name || 'Professional'
      };

      setSubscriptionInfo(subscriptionData);
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

  const activateSubscription = async () => {
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) throw new Error('Business profile not found');

      // This would integrate with Paystack in a real implementation
      // For now, we'll simulate activation
      const nextPaymentDate = new Date();
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      const { error } = await supabase
        .from('subscriptions')
        .insert({
          business_id: businessProfile.id,
          user_id: user?.id,
          plan_id: businessProfile.plan_id,
          payment_status: 'active',
          next_payment_due: nextPaymentDate.toISOString(),
          paystack_subscription_code: `sub_${Date.now()}`
        });

      if (error) throw error;

      toast({
        title: "Subscription Activated",
        description: "Your subscription has been successfully activated!"
      });

      fetchSubscriptionInfo();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  if (loading) return <div>Loading subscription information...</div>;

  if (!subscriptionInfo) return null;

  const trialProgress = ((7 - subscriptionInfo.trial_days_left) / 7) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription Management</h2>
        <p className="text-gray-600">Manage your Mindsync account subscription</p>
      </div>

      {/* Subscription Status */}
      <Card className={`border-2 ${
        subscriptionInfo.is_active ? 'border-green-200 bg-green-50' : 
        subscriptionInfo.is_trial ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="h-6 w-6 mr-2 text-yellow-500" />
              Mindsync Professional Plan
            </div>
            <Badge variant={
              subscriptionInfo.is_active ? "default" : 
              subscriptionInfo.is_trial ? "secondary" : "destructive"
            }>
              {subscriptionInfo.is_active ? "Active" : 
               subscriptionInfo.is_trial ? "Trial" : "Expired"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Complete accounting and inventory management for Nigerian businesses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionInfo.is_trial ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                  <span className="font-medium">Trial Period</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  {subscriptionInfo.trial_days_left} days left
                </span>
              </div>
              <Progress value={trialProgress} className="w-full" />
              <p className="text-sm text-gray-600">
                Your 7-day free trial {subscriptionInfo.trial_days_left > 0 ? 'expires' : 'has expired'}. 
                Activate your subscription to continue using all features.
              </p>
            </div>
          ) : subscriptionInfo.is_active ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  <span className="font-medium">Active Subscription</span>
                </div>
                <span className="text-2xl font-bold text-green-600">₦20,000/month</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Next payment due: {new Date(subscriptionInfo.next_payment_due).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
                <span className="font-medium text-red-600">Trial Expired</span>
              </div>
              <p className="text-sm text-gray-600">
                Your free trial has ended. Activate your subscription to continue using Mindsync.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Plan Features</CardTitle>
          <CardDescription>Everything you need to manage your business finances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Unlimited Customers & Products</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Chart of Accounts Management</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Banking & Cash Tracking</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Advanced Reports (PDF/Excel)</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Multi-language Support</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Team Collaboration (5 Users)</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Priority Customer Support</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Mobile Access</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {!subscriptionInfo.is_active && (
          <Button size="lg" onClick={activateSubscription} className="bg-green-600 hover:bg-green-700">
            <Crown className="h-5 w-5 mr-2" />
            Activate Subscription - ₦20,000/month
          </Button>
        )}
        {subscriptionInfo.is_active && (
          <Button variant="outline" size="lg">
            Manage Subscription
          </Button>
        )}
      </div>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Simple, Transparent Pricing</CardTitle>
          <CardDescription className="text-center">
            One plan with everything you need to grow your business
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <div>
              <span className="text-4xl font-bold">₦20,000</span>
              <span className="text-xl text-gray-500">/month</span>
            </div>
            <p className="text-gray-600">
              Includes all features, unlimited usage, and priority support
            </p>
            <p className="text-sm text-green-600 font-medium">
              7-day free trial • No setup fees • Cancel anytime
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
