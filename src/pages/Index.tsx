
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Calculator, 
  Package, 
  Smartphone, 
  Zap, 
  Shield,
  ArrowRight,
  Check
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Calculator,
      title: 'Smart Accounting',
      description: 'Complete bookkeeping with Nigerian tax compliance (VAT/NON-VAT)'
    },
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track stock, manage suppliers, and get low-stock alerts'
    },
    {
      icon: Smartphone,
      title: 'WhatsApp Integration',
      description: 'Send receipts and get business updates via WhatsApp'
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Smart expense categorization and business predictions'
    }
  ];

  const plans = [
    {
      name: 'Basic',
      price: '₦10,000',
      period: '/month',
      description: 'Perfect for accounting-focused businesses',
      features: [
        'Complete accounting system',
        'Invoice & receipt generation',
        'Basic reports (P&L, Cash Flow)',
        'Customer & vendor management',
        'WhatsApp receipts'
      ],
      popular: false
    },
    {
      name: 'Standard',
      price: '₦20,000',
      period: '/month',
      description: 'Best for retail and product-based businesses',
      features: [
        'Everything in Basic',
        'Full inventory management',
        'Stock tracking & alerts',
        'Purchase order management',
        'Multi-location support',
        'Advanced reporting'
      ],
      popular: true
    },
    {
      name: 'Premium',
      price: '₦35,000',
      period: '/month',
      description: 'Complete business management solution',
      features: [
        'Everything in Standard',
        'AI-powered insights',
        'WhatsApp automation',
        'Custom integrations',
        'Priority support',
        'Advanced analytics'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mindsync Manager</h1>
                <p className="text-sm text-gray-600">Account & Inventory Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            🇳🇬 Built for Nigerian & African SMEs
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Complete Business Management
            <span className="text-primary"> for African SMEs</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your accounting, inventory, and customer management with our 
            all-in-one platform designed specifically for Nigerian businesses.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything Your Business Needs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From accounting to inventory management, all optimized for the African market
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your business size and needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-4">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  <div className="pt-6">
                    <Link to="/auth">
                      <Button 
                        className="w-full" 
                        variant={plan.popular ? "default" : "outline"}
                      >
                        Start Free Trial
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/80 max-w-2xl mx-auto">
            Join thousands of African SMEs already using Mindsync Manager to streamline their operations
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-primary">
              Start Your Free Trial Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary rounded-lg p-2">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Mindsync Manager</h3>
                  <p className="text-sm text-gray-400">Business Management Solutions</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering African SMEs with world-class business management tools 
                designed for the local market.
              </p>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-400">Enterprise-grade security</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Accounting</li>
                <li>Inventory</li>
                <li>Reports</li>
                <li>WhatsApp Integration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>System Status</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Mindsync Manager. All rights reserved. Built for African businesses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
