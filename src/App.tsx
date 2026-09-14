import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LeadCaptureProvider } from '@/contexts/LeadCaptureContext';
import { CustomerDataPlatformProvider } from '@/contexts/CustomerDataPlatformContext';
import { LifecycleProvider, useLifecycle } from '@/contexts/LifecycleContext';
import { AutomationProvider } from '@/contexts/AutomationContext';
import { PersonalizationProvider } from '@/contexts/PersonalizationContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { LeadCaptureModal } from '@/components/lead-capture/LeadCaptureModal';
import { VisitorTracker } from '@/components/lead-capture/VisitorTracker';
import { SuccessCelebrationManager } from '@/components/lifecycle/SuccessCelebration';
import { NotificationBell } from '@/components/lifecycle/NotificationBell';
import { ProductTourManager } from '@/components/lifecycle/ProductTour';
import { SmartAssistant } from '@/components/personalization/SmartAssistant';

import { routes } from './routes';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';

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
                              route.errorElement ? (
                                <RouteErrorBoundary fallback={route.errorElement}>
                                  {route.element}
                                </RouteErrorBoundary>
                              ) : (
                                route.element
                              )
                            }
                          />
                        ))}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                  </div>
                  <LeadCaptureModal />
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
