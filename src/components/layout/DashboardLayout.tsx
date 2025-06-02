
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, BarChart3, Package, Users, FileText, Calculator, Settings, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Accounting', href: '/dashboard/accounting', icon: Calculator },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-40">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <nav className="h-full flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-blue-600">Mindsync</h2>
                <p className="text-sm text-gray-600">Account & Inventory</p>
              </div>
              
              <div className="flex-1 px-3 py-4">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="p-4 border-t">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-gray-500">Account Owner</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={signOut}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <nav className="flex-1 flex flex-col bg-white border-r border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-blue-600">Mindsync</h2>
              <p className="text-sm text-gray-600">Account & Inventory Manager</p>
            </div>
            
            <div className="flex-1 px-3 py-4">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">Account Owner</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="md:pl-64">
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
};
