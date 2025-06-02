
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { ReportsOverview } from '@/components/reports/ReportsOverview';

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome to your business overview</p>
      </div>

      <DashboardSummary />
      
      <ReportsOverview />
    </div>
  );
};
