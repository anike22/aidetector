import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import RouteIndexing from '@/components/common/RouteIndexing';
import RouteMeta from '@/components/common/RouteMeta';
import { LeadCaptureModal } from '@/components/lead-capture/LeadCaptureModal';
import { VisitorTracker } from '@/components/lead-capture/VisitorTracker';
import { NotificationBell } from '@/components/lifecycle/NotificationBell';
import { ProductTourManager } from '@/components/lifecycle/ProductTour';
import { SuccessCelebrationManager } from '@/components/lifecycle/SuccessCelebration';
import { SmartAssistant } from '@/components/personalization/SmartAssistant';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { DirectoryCompareProvider } from '@/context/DirectoryCompareContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AutomationProvider } from '@/contexts/AutomationContext';
import { CustomerDataPlatformProvider } from '@/contexts/CustomerDataPlatformContext';
import { LeadCaptureProvider } from '@/contexts/LeadCaptureContext';
import { LifecycleProvider, useLifecycle } from '@/contexts/LifecycleContext';
import { PersonalizationProvider } from '@/contexts/PersonalizationContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { routes } from './routes';

function LifecycleUI() {
  const { celebrations, clearCelebration } = useLifecycle();
  return (
    <>
      <SuccessCelebrationManager celebrations={celebrations} onDismiss={clearCelebration} />
      <ProductTourManager />
    </>
  );
}

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <LeadCaptureProvider>
          <CustomerDataPlatformProvider>
            <LifecycleProvider>
              <AutomationProvider>
                <PersonalizationProvider>
                  <TeamProvider>
                    <DirectoryCompareProvider>
                      <LifecycleUI />
                      <IntersectObserver />
                      <VisitorTracker />
                      <SmartAssistant />
                      <div className="flex flex-col min-h-screen">
                        <main className="flex-grow">
                          <Routes>
                            {routes.map((route, index) => (
                              <Route
                                key={index}
                                path={route.path}
                                element={
                                  <>
                                    <RouteMeta name={route.name} />
                                    {route.errorElement ? (
                                    <RouteErrorBoundary fallback={route.errorElement}>
                                      {route.element}
                                    </RouteErrorBoundary>
                                  ) : (
                                    route.element
                                    )}
                                  </>
                                }
                              />
                            ))}
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </main>
                      </div>
                      <RouteIndexing />
                      <LeadCaptureModal />
                    </DirectoryCompareProvider>
                  </TeamProvider>
                  <Toaster />
                </PersonalizationProvider>
              </AutomationProvider>
            </LifecycleProvider>
          </CustomerDataPlatformProvider>
        </LeadCaptureProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
