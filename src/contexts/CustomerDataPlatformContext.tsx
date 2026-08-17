import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { CustomerProfile, CDPEventType, CustomerDevice } from '@/types/cdp';
import {
  getCurrentCustomerProfile,
  syncDeviceInfo,
  trackCDPEvent,
  getCustomerDevices,
  getPrivacyConsents,
  setPrivacyConsent,
  requestDataDeletion,
  exportCustomerData,
  refreshCustomerInsights,
} from '@/lib/cdpApi';
import { mergeVisitorToUser } from '@/lib/leadApi';

interface CustomerDataPlatformContextType {
  customerProfile: CustomerProfile | null;
  loading: boolean;
  isTrackingEnabled: boolean;
  isMarketingEnabled: boolean;
  trackEvent: (event: { event_type: CDPEventType; page?: string; metadata?: Record<string, unknown> }) => void;
  trackToolUsage: (tool: string, metadata?: Record<string, unknown>) => void;
  trackCTAClick: (ctaId: string, metadata?: Record<string, unknown>) => void;
  refreshProfile: () => Promise<void>;
  setTrackingConsent: (granted: boolean) => Promise<void>;
  setMarketingConsent: (granted: boolean) => Promise<void>;
  requestDeletion: () => Promise<void>;
  exportData: () => Promise<Record<string, unknown>>;
}

const CustomerDataPlatformContext = createContext<CustomerDataPlatformContextType | undefined>(undefined);

export function CustomerDataPlatformProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<CustomerDevice[]>([]);
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getCurrentCustomerProfile();
      setCustomerProfile(profile);
      if (profile) {
        const [deviceList, consentList] = await Promise.all([
          getCustomerDevices(profile.id),
          getPrivacyConsents(profile.id),
        ]);
        setDevices(deviceList);
        const consentMap: Record<string, boolean> = {};
        consentList.forEach((c) => {
          consentMap[c.consent_type] = c.granted;
        });
        setConsents(consentMap);
      }
    } catch (err) {
      console.error('[CDP] refresh profile failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile, user?.id]);

  useEffect(() => {
    if (!user) return;
    const already = sessionStorage.getItem('aicx_cdp_merged');
    if (already) return;
    sessionStorage.setItem('aicx_cdp_merged', '1');
    void mergeVisitorToUser(user.id)
      .then(() => refreshProfile())
      .then(() => refreshCustomerInsights());
  }, [user, refreshProfile]);

  useEffect(() => {
    void syncDeviceInfo();
  }, [location.pathname]);

  const trackEvent = useCallback(
    (event: { event_type: CDPEventType; page?: string; metadata?: Record<string, unknown> }) => {
      if (customerProfile?.gdpr_opt_out_tracking) return;
      void trackCDPEvent({
        event_type: event.event_type,
        page: event.page ?? window.location.pathname,
        metadata: event.metadata ?? {},
      });
    },
    [customerProfile?.gdpr_opt_out_tracking]
  );

  const trackToolUsage = useCallback(
    (tool: string, metadata?: Record<string, unknown>) => {
      trackEvent({
        event_type: 'tool_used',
        metadata: { tool, ...metadata },
      });
    },
    [trackEvent]
  );

  const trackCTAClick = useCallback(
    (ctaId: string, metadata?: Record<string, unknown>) => {
      trackEvent({
        event_type: 'cta_click',
        metadata: { cta_id: ctaId, ...metadata },
      });
    },
    [trackEvent]
  );

  const setTrackingConsent = useCallback(
    async (granted: boolean) => {
      if (!customerProfile) return;
      await setPrivacyConsent(customerProfile.id, 'tracking', granted);
      await refreshProfile();
    },
    [customerProfile, refreshProfile]
  );

  const setMarketingConsent = useCallback(
    async (granted: boolean) => {
      if (!customerProfile) return;
      await setPrivacyConsent(customerProfile.id, 'marketing', granted);
      await refreshProfile();
    },
    [customerProfile, refreshProfile]
  );

  const requestDeletion = useCallback(async () => {
    if (!customerProfile) return;
    await requestDataDeletion(customerProfile.id);
  }, [customerProfile]);

  const exportData = useCallback(async () => {
    if (!customerProfile) return {};
    return exportCustomerData(customerProfile.id);
  }, [customerProfile]);

  const isTrackingEnabled = !customerProfile?.gdpr_opt_out_tracking;
  const isMarketingEnabled = !customerProfile?.gdpr_opt_out_marketing;

  return (
    <CustomerDataPlatformContext.Provider
      value={{
        customerProfile,
        loading,
        isTrackingEnabled,
        isMarketingEnabled,
        trackEvent,
        trackToolUsage,
        trackCTAClick,
        refreshProfile,
        setTrackingConsent,
        setMarketingConsent,
        requestDeletion,
        exportData,
      }}
    >
      {children}
    </CustomerDataPlatformContext.Provider>
  );
}

export function useCustomerDataPlatform(): CustomerDataPlatformContextType {
  const ctx = useContext(CustomerDataPlatformContext);
  if (!ctx) throw new Error('useCustomerDataPlatform must be used within CustomerDataPlatformProvider');
  return ctx;
}
