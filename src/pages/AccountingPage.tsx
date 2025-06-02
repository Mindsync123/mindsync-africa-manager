
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionList } from '@/components/accounting/TransactionList';
import { ChartOfAccountsManager } from '@/components/accounting/ChartOfAccountsManager';
import { BankingManager } from '@/components/accounting/BankingManager';
import { AdvancedReports } from '@/components/reports/AdvancedReports';

export const AccountingPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accounting</h1>
        <p className="text-gray-600">Comprehensive financial management for your business</p>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="chart">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="banking">Banking & Cash</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <TransactionList />
        </TabsContent>
        
        <TabsContent value="chart" className="space-y-4">
          <ChartOfAccountsManager />
        </TabsContent>
        
        <TabsContent value="banking" className="space-y-4">
          <BankingManager />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <AdvancedReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};
