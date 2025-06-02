
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('*, subscriptions(*)')
        .eq('user_id', user?.id)
        .single();

      if (!businessProfile) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check if there's an active subscription
      const activeSubscription = businessProfile.subscriptions?.find((sub: any) => sub.payment_status === 'active');
      
      if (activeSubscription) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Calculate trial status
      const createdAt = new Date(businessProfile.created_at);
      const now = new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const trialDaysRemaining = Math.max(0, 7 - daysSinceCreation);
      
      setTrialDaysLeft(trialDaysRemaining);
      setHasAccess(trialDaysRemaining > 0);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Trial Expired</CardTitle>
            <CardDescription className="text-red-600">
              Your 7-day free trial has ended. Activate your subscription to continue using Mindsync.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Get unlimited access to all features with our Professional plan
              </p>
              <div className="space-y-2">
                <div className="text-2xl font-bold">₦20,000/month</div>
                <Badge variant="secondary">All features included</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/dashboard/settings?tab=subscription')}
              >
                <Crown className="h-4 w-4 mr-2" />
                Activate Subscription
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show trial warning if less than 3 days left
  if (trialDaysLeft > 0 && trialDaysLeft <= 3) {
    return (
      <div className="min-h-screen">
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                Trial expires in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}
              </span>
            </div>
            <Button 
              size="sm" 
              onClick={() => navigate('/dashboard/settings?tab=subscription')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};
