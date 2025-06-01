
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthPage } from "@/components/auth/AuthPage";
import { BusinessSetup } from "@/components/onboarding/BusinessSetup";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dashboard } from "@/pages/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/setup" element={
                <AuthGuard>
                  <BusinessSetup />
                </AuthGuard>
              } />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <DashboardLayout />
                </AuthGuard>
              }>
                <Route index element={<Dashboard />} />
                <Route path="accounting" element={
                  <LazyComponent>
                    <AccountingPage />
                  </LazyComponent>
                } />
                <Route path="inventory" element={
                  <LazyComponent>
                    <InventoryPage />
                  </LazyComponent>
                } />
                <Route path="customers" element={
                  <LazyComponent>
                    <CustomersPage />
                  </LazyComponent>
                } />
                <Route path="invoices" element={
                  <LazyComponent>
                    <InvoicesPage />
                  </LazyComponent>
                } />
                <Route path="reports" element={
                  <LazyComponent>
                    <ReportsPage />
                  </LazyComponent>
                } />
                <Route path="settings" element={
                  <LazyComponent>
                    <SettingsPage />
                  </LazyComponent>
                } />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Lazy loading wrapper component
const LazyComponent = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
    {children}
  </React.Suspense>
);

// Import the page components
import { AccountingPage } from './pages/AccountingPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomersPage } from './pages/CustomersPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import React from 'react';

export default App;
