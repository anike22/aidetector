import MainLayout from '@/components/layouts/MainLayout';
import { ProgressOverview } from '@/components/lifecycle/ProgressOverview';
import { ActivationChecklistWidget } from '@/components/lifecycle/ActivationChecklistWidget';
import { UsageStatsSection } from '@/components/lifecycle/UsageStatsSection';
import { GoalTracker } from '@/components/lifecycle/GoalTracker';
import { MilestonesGrid } from '@/components/lifecycle/MilestonesGrid';
import { JourneyVisualization } from '@/components/lifecycle/JourneyVisualization';
import { NextBestActionCard } from '@/components/lifecycle/NextBestActionCard';

export default function ProgressPage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">My Progress</h1>
          <p className="mt-1 text-muted-foreground">Track your activation, achievements, and product adoption.</p>
        </div>

        <ProgressOverview />
        <NextBestActionCard />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ActivationChecklistWidget />
            <UsageStatsSection />
            <MilestonesGrid />
          </div>
          <div className="space-y-6">
            <GoalTracker />
            <JourneyVisualization />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
